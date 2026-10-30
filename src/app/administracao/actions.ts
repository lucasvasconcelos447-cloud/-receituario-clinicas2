"use server";
import { db } from "@/lib/supabase/server";
import { z } from "zod";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
export async function saveLibraryLayout(
  _: { error?: string; success?: string },
  form: FormData,
): Promise<{ error?: string; success?: string }> {
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { error: "Acesso restrito à administração." };
  const { data: allowed, error: permissionError } =
    await client.rpc("is_library_admin");
  if (permissionError || !allowed)
    return { error: "Acesso restrito à administração." };
  const parsed = z
    .object({
      id: z.enum([
        "minimalista",
        "classico",
        "floral",
        "botanico",
        "geometrico",
        "institucional",
      ]),
      name: z.string().trim().min(2).max(80),
      description: z.string().trim().max(250),
      sort_order: z.coerce.number().int().min(0).max(10000),
      published: z.boolean(),
    })
    .safeParse({
      ...Object.fromEntries(form),
      published: form.get("published") === "on",
    });
  if (!parsed.success)
    return { error: "Confira nome, descrição e ordem de exibição." };
  try {
    const { data: existing } = await client
      .from("visual_templates")
      .select("thumbnail")
      .eq("id", parsed.data.id)
      .maybeSingle();
    let thumbnail = existing?.thumbnail || `/templates/${parsed.data.id}.png`;
    const file = form.get("thumbnail");
    if (file instanceof File && file.size) {
      if (
        file.size > 2 * 1024 * 1024 ||
        !["image/png", "image/jpeg", "image/webp"].includes(file.type)
      )
        return { error: "Envie uma miniatura PNG, JPEG ou WebP de até 2 MB." };
      const image = await sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 16000000,
      })
        .rotate()
        .resize(320, 460, { fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
      if (image.length > 200000)
        return { error: "Use uma miniatura mais simples, com fundo branco." };
      thumbnail = `data:image/png;base64,${image.toString("base64")}`;
    }
    if (form.get("reset_thumbnail") === "on")
      thumbnail = `/templates/${parsed.data.id}.png`;
    const { error } = await client
      .from("visual_templates")
      .upsert(
        { ...parsed.data, thumbnail, updated_at: new Date().toISOString() },
        { onConflict: "id" },
      );
    if (error) throw error;
    revalidatePath("/administracao");
    revalidatePath("/personalizar");
    revalidatePath("/novo");
    return {
      success: "Biblioteca atualizada. PDFs já emitidos continuam preservados.",
    };
  } catch {
    return {
      error:
        "Não foi possível salvar o modelo. Confira a imagem e tente novamente.",
    };
  }
}
