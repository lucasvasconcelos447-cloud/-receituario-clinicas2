import { context } from "@/lib/context";
import { Shell } from "@/components/shell";
import { TemplateForm, DeleteTemplate } from "@/components/forms";
import { TYPES, type DocType } from "@/lib/config";
export default async function Templates() {
  const { client, organization } = await context();
  const { data, error } = await client
    .from("text_templates")
    .select("*")
    .eq("organization_id", organization.id)
    .order("name");
  if (error) throw error;
  return (
    <Shell name={organization.name} active="/modelos">
      <span className="eyebrow">SUAS PALAVRAS, SEMPRE POR PERTO</span>
      <h1>Modelos de texto</h1>
      <p className="lead">
        Guarde seus próprios textos. Revise e adapte a cada paciente.
      </p>
      <div className="two-column">
        <section className="stack">
          {data?.length ? (
            data.map((t) => (
              <details className="card" key={t.id}>
                <summary>
                  <strong>{t.name}</strong>
                  <small>{TYPES[t.type as DocType]}</small>
                </summary>
                <TemplateForm template={t} />
                <DeleteTemplate id={t.id} />
              </details>
            ))
          ) : (
            <div className="card empty">
              Você ainda não criou modelos. Nenhum conteúdo clínico é fornecido
              automaticamente.
            </div>
          )}
        </section>
        <section className="card">
          <h2>Criar um modelo</h2>
          <TemplateForm />
        </section>
      </div>
    </Shell>
  );
}
