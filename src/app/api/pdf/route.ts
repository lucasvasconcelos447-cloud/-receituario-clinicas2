import { sameOrigin } from "@/lib/request-origin";
import { NextRequest, NextResponse } from "next/server";
import { db, configured } from "@/lib/supabase/server";
import { snapshot } from "@/lib/snapshot";
import { generationErrors } from "@/lib/validation";
import { randomUUID } from "node:crypto";
import { generatePdf } from "@/lib/pdf/document";
import { z } from "zod";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Origem da requisição não permitida." },
      { status: 403 },
    );
  if (!configured())
    return NextResponse.json(
      { error: "Ambiente não configurado." },
      { status: 503 },
    );
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Entre novamente para gerar o PDF." },
      { status: 401 },
    );
  const body = z
    .object({
      blank: z.boolean().default(false),
      documentId: z.uuid().optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!body.success || (!body.data.blank && !body.data.documentId))
    return NextResponse.json({ error: "Documento inválido." }, { status: 400 });
  try {
    const s = await snapshot(
      body.data.blank ? undefined : body.data.documentId,
    );
    const errors = generationErrors(s);
    if (errors.length)
      return NextResponse.json(
        { error: `Complete antes de gerar: ${errors.join("; ")}.` },
        { status: 422 },
      );
    const bytes = await generatePdf(s);
    let versionId = "";
    let updatedAt = "";
    if (!body.data.blank) {
      const file_path = `${s.organization.id}/pdfs/${randomUUID()}.pdf`;
      const { error: upload } = await client.storage
        .from("clinical-private")
        .upload(file_path, bytes, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (upload) throw upload;
      const { data, error } = await client.rpc("finalize_document_version", {
        p_document_id: s.document!.id,
        p_expected_updated_at: s.document!.updated_at,
        p_snapshot: s,
        p_file_path: file_path,
      });
      if (error)
        return NextResponse.json(
          {
            error:
              "O documento mudou durante a geração ou não pôde ser registrado. Reabra e tente novamente; nenhum PDF foi confirmado no histórico.",
          },
          { status: 409 },
        );
      versionId = data;
      const { data: latest } = await client
        .from("documents")
        .select("updated_at")
        .eq("id", s.document!.id)
        .single();
      updatedAt = latest?.updated_at || "";
    }
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${body.data.blank ? "receituario-em-branco" : "documento"}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Version-Id": versionId,
        "X-Document-Updated-At": updatedAt,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível gerar o PDF. Confira a sessão, a conexão e os dados profissionais.",
      },
      { status: 500 },
    );
  }
}
