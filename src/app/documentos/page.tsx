import { context } from "@/lib/context";
import { Shell } from "@/components/shell";
import { DocumentList } from "@/components/document-list";
import { TYPES } from "@/lib/config";
export default async function Documents({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    status?: string;
    q?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { client, organization } = await context();
  const filters = await searchParams;
  const term = (filters.q || "").trim().slice(0, 100);
  const validDate = (v?: string) =>
    Boolean(
      v &&
        /^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v,
    );
  let matchedIds: string[] | null = null;
  if (term) {
    const { data, error } = await client
      .from("patients")
      .select("id")
      .eq("organization_id", organization.id)
      .ilike("name", `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`);
    if (error) throw error;
    matchedIds = (data || []).map((p) => p.id);
  }
  let query = client
    .from("documents")
    .select("*")
    .eq("organization_id", organization.id)
    .order("updated_at", { ascending: false });
  if (filters.type && filters.type in TYPES)
    query = query.eq("type", filters.type);
  if (["draft", "generated"].includes(filters.status || ""))
    query = query.eq("status", filters.status!);
  if (matchedIds)
    query = query.in(
      "patient_id",
      matchedIds.length ? matchedIds : ["00000000-0000-4000-8000-000000000000"],
    );
  if (validDate(filters.from)) query = query.gte("issue_date", filters.from!);
  if (validDate(filters.to)) query = query.lte("issue_date", filters.to!);
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
          ＋ Nova prescrição
        </a>
      </div>
      <section className="card">
        <form className="filter-row document-filters">
          <label>
            Nome do paciente
            <input
              type="search"
              name="q"
              maxLength={100}
              defaultValue={term}
              placeholder="Buscar paciente"
            />
          </label>
          <label>
            De
            <input
              type="date"
              name="from"
              defaultValue={validDate(filters.from) ? filters.from : ""}
            />
          </label>
          <label>
            Até
            <input
              type="date"
              name="to"
              defaultValue={validDate(filters.to) ? filters.to : ""}
            />
          </label>
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
          <button className="button secondary">Buscar e filtrar</button>
          <a href="/documentos">Limpar filtros</a>
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
