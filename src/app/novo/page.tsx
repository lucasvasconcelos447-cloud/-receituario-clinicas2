import { context } from "@/lib/context";
import { snapshot } from "@/lib/snapshot";
import { Shell } from "@/components/shell";
import { DocumentEditor } from "@/components/document-editor";
import { TYPES, type DocType } from "@/lib/config";
export default async function NewDocument({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    patient?: string;
    duplicate?: string;
  }>;
}) {
  const { client, organization } = await context();
  const query = await searchParams;
  const [base, { data: patients, error: pe }, { data: templates, error: te }] =
    await Promise.all([
      snapshot(),
      client
        .from("patients")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name"),
      client
        .from("text_templates")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name"),
    ]);
  if (pe || te) throw pe || te;
  let initial;
  if (query.duplicate) {
    const { data } = await client
      .from("documents")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("id", query.duplicate)
      .single();
    if (data)
      initial = {
        ...data,
        id: "",
        status: "draft",
        clinical_reviewed: false,
        updated_at: "",
        created_at: "",
      };
  }
  return (
    <Shell name={organization.name}>
      <a href="/documentos">← Documentos</a>
      <h1>Novo documento</h1>
      <p className="lead">Um passo de cada vez, do texto ao PDF.</p>
      <DocumentEditor
        base={base}
        patients={patients || []}
        templates={templates || []}
        initial={initial}
        patientId={query.patient}
        type={
          query.type && query.type in TYPES
            ? (query.type as DocType)
            : "receituario"
        }
      />
    </Shell>
  );
}
