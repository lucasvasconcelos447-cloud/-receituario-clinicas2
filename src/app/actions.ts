"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { context, session } from "@/lib/context";
import {
  patientSchema,
  documentSchema,
  organizationSchema,
  professionalSchema,
  brandingSchema,
  templateSchema,
} from "@/lib/validation";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
export type Result = {
  error?: string;
  success?: string;
  id?: string;
  updated_at?: string;
};
function values(form: FormData) {
  return Object.fromEntries(form.entries());
}
function fail(error: unknown): Result {
  return {
    error:
      error instanceof Error && error.message.startsWith("VALIDAÇÃO:")
        ? error.message.slice(10)
        : "Não foi possível salvar. Confira a conexão e os dados e tente novamente.",
  };
}
export async function createOrganization(
  _: Result,
  form: FormData,
): Promise<Result> {
  const { client, user } = await session();
  const name = String(form.get("name") || "").trim();
  if (name.length < 2 || name.length > 250)
    return { error: "Informe um nome entre 2 e 250 caracteres." };
  const { error } = await client
    .from("organizations")
    .insert({ name, owner_id: user.id });
  if (error) return fail(error);
  redirect("/perfil");
}
export async function savePatient(_: Result, form: FormData): Promise<Result> {
  try {
    const { client, organization } = await context();
    const parsed = patientSchema.safeParse(values(form));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const id = String(form.get("id") || "");
    const query = id
      ? client
          .from("patients")
          .update(parsed.data)
          .eq("id", id)
          .eq("organization_id", organization.id)
      : client
          .from("patients")
          .insert({ ...parsed.data, organization_id: organization.id });
    const { data, error } = await query.select("id").single();
    if (error) throw error;
    revalidatePath("/pacientes");
    return { success: "Paciente salvo.", id: data.id };
  } catch (e) {
    return fail(e);
  }
}
export async function saveTemplate(_: Result, form: FormData): Promise<Result> {
  try {
    const { client, organization } = await context();
    const parsed = templateSchema.safeParse(values(form));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const id = String(form.get("id") || "");
    const query = id
      ? client
          .from("text_templates")
          .update(parsed.data)
          .eq("id", id)
          .eq("organization_id", organization.id)
      : client
          .from("text_templates")
          .insert({ ...parsed.data, organization_id: organization.id });
    const { error } = await query.select("id").single();
    if (error) throw error;
    revalidatePath("/modelos");
    return { success: "Modelo salvo." };
  } catch (e) {
    return fail(e);
  }
}
export async function removeTemplate(id: string): Promise<Result> {
  const { client, organization } = await context();
  const { error } = await client
    .from("text_templates")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization.id);
  if (error) return fail(error);
  revalidatePath("/modelos");
  return { success: "Modelo excluído." };
}
export async function saveProfile(_: Result, form: FormData): Promise<Result> {
  try {
    const { client, organization } = await context();
    const obj = values(form);
    const org = organizationSchema.safeParse(
      Object.fromEntries(
        Object.entries(obj)
          .filter(([key]) => key.startsWith("org_"))
          .map(([key, v]) => [key.slice(4), v]),
      ),
    );
    const pro = professionalSchema.safeParse(
      Object.fromEntries(
        Object.entries(obj)
          .filter(([key]) => key.startsWith("pro_"))
          .map(([key, v]) => [key.slice(4), v]),
      ),
    );
    if (!org.success || !pro.success)
      return {
        error: "Confira os campos: nomes, e-mail válido e UF com duas letras.",
      };
    const { error: a } = await client
      .from("organizations")
      .update(org.data)
      .eq("id", organization.id);
    if (a) throw a;
    const { error: b } = await client
      .from("professional_profiles")
      .update(pro.data)
      .eq("organization_id", organization.id);
    if (b)
      return {
        error:
          "Estabelecimento salvo; não foi possível salvar os dados profissionais. Tente novamente.",
      };
    revalidatePath("/", "layout");
    return { success: "Dados profissionais salvos." };
  } catch (e) {
    return fail(e);
  }
}
export async function saveBranding(_: Result, form: FormData): Promise<Result> {
  try {
    const { client, organization } = await context();
    const parsed = brandingSchema.safeParse({
      ...values(form),
      ruled: form.get("ruled") === "on",
      show_address: form.get("show_address") === "on",
      show_contact: form.get("show_contact") === "on",
    });
    if (!parsed.success)
      return { error: "Confira cores, modelo, papel e tamanho da logo." };
    let logo_path: string | null | undefined = undefined;
    if (form.get("remove_logo") === "on") logo_path = null;
    const file = form.get("logo");
    if (file instanceof File && file.size) {
      if (file.size > 2 * 1024 * 1024)
        return { error: "O logotipo deve ter até 2 MB." };
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
        return { error: "Envie PNG, JPEG ou WebP. SVG não é aceito." };
      const bytes = Buffer.from(await file.arrayBuffer());
      const meta = await sharp(bytes, {
        limitInputPixels: 16000000,
      }).metadata();
      if (!["png", "jpeg", "webp"].includes(meta.format || ""))
        return { error: "Conteúdo da imagem inválido." };
      const safe = await sharp(bytes, { limitInputPixels: 16000000 })
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
      if (safe.length > 2 * 1024 * 1024)
        return {
          error:
            "A imagem ficou muito grande após o processamento. Reduza a resolução ou envie um logotipo com fundo simples.",
        };
      logo_path = `${organization.id}/logos/${randomUUID()}.png`;
      const { error } = await client.storage
        .from("clinical-private")
        .upload(logo_path, safe, { contentType: "image/png", upsert: false });
      if (error) throw error;
    }
    const { error } = await client
      .from("document_branding")
      .update({
        ...parsed.data,
        ...(logo_path !== undefined ? { logo_path } : {}),
        bleed_mm: 0,
        crop_marks: false,
      })
      .eq("organization_id", organization.id);
    if (error) throw error;
    revalidatePath("/personalizar");
    return {
      success: "Identidade salva. PDFs anteriores permanecem preservados.",
    };
  } catch (e) {
    return fail(e);
  }
}
export async function saveDocument(
  input: unknown,
  id?: string,
  expected?: string,
): Promise<Result> {
  try {
    const { client, organization } = await context();
    const parsed = documentSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    if (id && !expected)
      return { error: "Reabra o documento antes de salvar." };
    let query = id
      ? client
          .from("documents")
          .update({ ...parsed.data, status: "draft" })
          .eq("id", id)
          .eq("organization_id", organization.id)
          .eq("updated_at", expected!)
      : client
          .from("documents")
          .insert({ ...parsed.data, organization_id: organization.id });
    const { data, error } = await query.select("id,updated_at").maybeSingle();
    if (error) throw error;
    if (!data)
      return {
        error:
          "Este documento mudou em outra aba. Reabra antes de editar para evitar sobrescrever alterações.",
      };
    revalidatePath("/documentos");
    revalidatePath("/");
    return {
      success: "Rascunho salvo no servidor.",
      id: data.id,
      updated_at: data.updated_at,
    };
  } catch (e) {
    return fail(e);
  }
}
