import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/request-origin";
import { snapshot } from "@/lib/snapshot";
import { brandingSchema, documentSchema } from "@/lib/validation";
import { generatePdf } from "@/lib/pdf/document";
import { z } from "zod";
import sharp from "sharp";
export const runtime = "nodejs";
export const maxDuration = 60;
// No storage or version writes. Incomplete drafts may be previewed, never finalized.
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Origem não permitida." },
      { status: 403 },
    );
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Entre novamente para visualizar." },
      { status: 401 },
    );
  try {
    const raw = await req.text();
    if (raw.length > 3 * 1024 * 1024)
      return NextResponse.json(
        { error: "Prévia muito grande." },
        { status: 413 },
      );
    const parsed = z
      .object({
        branding: brandingSchema,
        document: documentSchema.nullable(),
        blank: z.boolean(),
        fictitious: z.boolean().default(false),
        logoData: z
          .union([
            z
              .string()
              .max(2800000)
              .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/),
            z.null(),
          ])
          .optional(),
      })
      .safeParse(JSON.parse(raw));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Confira os campos da prévia." },
        { status: 400 },
      );
    const body = parsed.data;
    const s = await snapshot();
    s.branding = { ...s.branding, ...body.branding };
    s.blank = body.blank;
    if (body.logoData !== undefined) {
      s.logoData = body.logoData
        ? `data:image/png;base64,${(
            await sharp(Buffer.from(body.logoData.split(",")[1], "base64"), {
              limitInputPixels: 16000000,
            })
              .rotate()
              .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
              .png()
              .toBuffer()
          ).toString("base64")}`
        : null;
    }
    if (!s.blank && body.document) {
      s.document = {
        ...body.document,
        id: "",
        created_at: "",
        updated_at: "",
        status: "draft",
      };
      if (body.fictitious)
        s.patient = {
          id: "",
          name: "Paciente Exemplo · fictício",
          birth_date: null,
          phone: "",
          identifier: "",
          address: "",
          sex: "",
        };
      else if (body.document.patient_id) {
        const { data, error } = await client
          .from("patients")
          .select("*")
          .eq("organization_id", s.organization.id)
          .eq("id", body.document.patient_id)
          .single();
        if (error)
          return NextResponse.json(
            { error: "Paciente não encontrado." },
            { status: 404 },
          );
        s.patient = data;
      }
    }
    return new NextResponse(new Uint8Array(await generatePdf(s)), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível preparar a prévia. Confira a conexão e o logotipo.",
      },
      { status: 500 },
    );
  }
}
