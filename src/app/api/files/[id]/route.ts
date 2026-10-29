import { NextRequest, NextResponse } from "next/server";
import { db, configured } from "@/lib/supabase/server";
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    return NextResponse.json({ error: "Entre novamente." }, { status: 401 });
  const { id } = await params;
  const { data: org } = await client
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!org)
    return NextResponse.json(
      { error: "Espaço não encontrado." },
      { status: 404 },
    );
  const { data: version } = await client
    .from("document_versions")
    .select("file_path")
    .eq("organization_id", org.id)
    .eq("id", id)
    .maybeSingle();
  if (!version || !version.file_path.startsWith(`${org.id}/pdfs/`))
    return NextResponse.json(
      { error: "Arquivo não encontrado." },
      { status: 404 },
    );
  const { data, error } = await client.storage
    .from("clinical-private")
    .download(version.file_path);
  if (error)
    return NextResponse.json(
      { error: "Não foi possível baixar o arquivo." },
      { status: 502 },
    );
  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="documento.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
