import { context } from "@/lib/context";
import { Shell } from "@/components/shell";
import { DocumentList } from "@/components/document-list";
import { TYPES } from "@/lib/config";
export default async function Documents({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const { client, organization } = await context();
  const filters = await searchParams;
  let query = client
    .from("documents")
    .select("*")
    .eq("organization_id", organization.id)
    .order("updated_at", { ascending: false });
  if (filters.type && filters.type in TYPES)
    query = query.eq("type", filters.type);
  if (["draft", "generated"].includes(filters.status || ""))
    query = query.eq("status", filters.status!);
  const [{ data: documents, error }, { data: patients }] = await Promise.all([
    query.limit(100),
    client
      .from("patients")
      .select("id,name")
      .eq("organization_id", organization.id),
  ]);
  if (error) throw error;
  return (
    <Shell name={organization.name} active="/documentos">
      <div className="heading-row">
        <div>
          <span className="eyebrow">TUDO NO SEU ESPAÇO</span>
          <h1>Documentos</h1>
          <p className="lead">
            Retome um rascunho ou encontre um PDF já gerado.
          </p>
        </div>
        <a className="button" href="/novo">
          ＋ Novo documento
        </a>
      </div>
      <section className="card">
        <form className="filter-row">
          <label>
            Tipo
            <select name="type" defaultValue={filters.type || ""}>
              <option value="">Todos os tipos</option>
              {Object.entries(TYPES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select name="status" defaultValue={filters.status || ""}>
              <option value="">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="generated">PDF gerado</option>
            </select>
          </label>
          <button className="button secondary">Filtrar</button>
        </form>
        <DocumentList
          documents={documents || []}
          patients={Object.fromEntries(
            (patients || []).map((p) => [p.id, p.name]),
          )}
        />
        <p className="muted">
          Até 100 documentos mais recentes por filtro. Versões anteriores ficam
          dentro de cada documento.
        </p>
      </section>
    </Shell>
  );
}
