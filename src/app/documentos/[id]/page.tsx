import { context } from "@/lib/context";
import { snapshot } from "@/lib/snapshot";
import { Shell } from "@/components/shell";
import { DocumentEditor } from "@/components/document-editor";
import { FileActions } from "@/components/file-actions";
import { notFound } from "next/navigation";
import { brDate } from "@/lib/config";
export default async function EditDocument({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { client, organization } = await context();
  const [
    { data: doc },
    { data: versions, error: ve },
    base,
    { data: patients, error: pe },
    { data: templates, error: te },
  ] = await Promise.all([
    client
      .from("documents")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("id", id)
      .maybeSingle(),
    client
      .from("document_versions")
      .select("id,version,created_at")
      .eq("organization_id", organization.id)
      .eq("document_id", id)
      .order("version", { ascending: false }),
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
  if (ve || pe || te) throw ve || pe || te;
  if (!doc) notFound();
  return (
    <Shell name={organization.name} active="/documentos">
      <div className="heading-row">
        <div>
          <a href="/documentos">← Documentos</a>
          <h1>{doc.title}</h1>
        </div>
        <a className="button secondary" href={`/novo?duplicate=${id}`}>
          Duplicar como novo rascunho
        </a>
      </div>
      {versions?.length ? (
        <section className="card">
          <h2>Versões preservadas</h2>
          <p className="muted">
            Editar abaixo altera o rascunho. Uma nova geração cria outra versão
            e preserva os arquivos anteriores.
          </p>
          {versions.map((v) => (
            <details key={v.id}>
              <summary>
                Versão {v.version} · {brDate(v.created_at)} · PDF sem assinatura
                eletrônica
              </summary>
              <FileActions versionId={v.id} documentId={id} />
            </details>
          ))}
        </section>
      ) : null}
      <DocumentEditor
        key={doc.id}
        base={base}
        patients={patients || []}
        templates={templates || []}
        initial={doc}
      />
    </Shell>
  );
}
