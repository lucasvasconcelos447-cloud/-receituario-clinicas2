import { notFound } from "next/navigation";
import { session } from "@/lib/context";
import { Shell } from "@/components/shell";
import { AdminLayoutForm } from "@/components/admin-layout-form";
import { DESIGNS } from "@/lib/document-designs";
import type { VisualTemplate } from "@/lib/visual-library";
export default async function Administration({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { client } = await session();
  const { data: admin, error: adminError } =
    await client.rpc("is_library_admin");
  if (adminError || !admin) notFound();
  const last30 = (await searchParams).period !== "all";
  const [{ data: catalog, error }, { data: stats, error: statsError }] =
    await Promise.all([
      client
        .from("visual_templates")
        .select("*")
        .order("sort_order")
        .order("name"),
      client.rpc("library_statistics", { p_last_30_days: last30 }),
    ]);
  if (error || statsError)
    throw new Error("Não foi possível carregar a administração.");
  const layouts = (catalog || []) as VisualTemplate[];
  const counts = new Map<
    string,
    {
      template_id: string;
      documents_count: number;
      professionals_count: number;
    }
  >(
    (stats || []).map(
      (row: {
        template_id: string;
        documents_count: number;
        professionals_count: number;
      }) => [row.template_id, row],
    ),
  );
  const ranking = DESIGNS.map((design) => ({
    ...design,
    ...layouts.find((t) => t.id === design.id),
    ...counts.get(design.id),
  }))
    .filter((d) => layouts.some((t) => t.id === d.id) || d.documents_count)
    .sort(
      (a, b) => Number(b.documents_count || 0) - Number(a.documents_count || 0),
    );
  const available = DESIGNS.filter(
    (d) => !layouts.some((t) => t.id === d.id),
  ).map((d) => d.id);
  return (
    <Shell name="Administração da biblioteca" active="/administracao">
      <span className="eyebrow">ACESSO EXCLUSIVO</span>
      <h1>Biblioteca e utilização</h1>
      <p className="lead">Publique apenas layouts implementados e revisados.</p>
      <section className="card section">
        <div className="section-heading">
          <h2>Modelos mais utilizados</h2>
          <div className="action-row">
            <a
              className={`button ${last30 ? "" : "secondary"}`}
              href="/administracao?period=30"
            >
              Últimos 30 dias
            </a>
            <a
              className={`button ${last30 ? "secondary" : ""}`}
              href="/administracao?period=all"
            >
              Todo o período
            </a>
          </div>
        </div>
        <p className="muted">
          Uma utilização por documento, confirmada no primeiro PDF gerado.
          Prévias, downloads e versões seguintes não contam. Profissionais são
          contados uma vez por modelo no período da primeira emissão. Contas de
          teste são excluídas.
        </p>
        <div className="ranking-list">
          {ranking.map((d, i) => (
            <article className="ranking-row" key={d.id}>
              <span>{i + 1}</span>
              <img
                src={d.thumbnail || `/templates/${d.id}.png`}
                alt=""
                width="55"
                height="78"
              />
              <div>
                <strong>{d.name}</strong>
                <small>
                  {d.published ? "Publicado" : "Desativado ou não cadastrado"}
                </small>
              </div>
              <div>
                <strong>
                  {Number(d.documents_count || 0).toLocaleString("pt-BR")}
                </strong>
                <small>documentos</small>
              </div>
              <div>
                <strong>
                  {Number(d.professionals_count || 0).toLocaleString("pt-BR")}
                </strong>
                <small>profissionais</small>
              </div>
            </article>
          ))}
        </div>
      </section>
      <h2>Administrar modelos</h2>
      <p>
        Desativar remove o modelo das novas escolhas. Os PDFs já emitidos e a
        edição de documentos que já usam o modelo são preservados.
      </p>
      <div className="admin-layouts">
        {layouts.map((layout) => (
          <AdminLayoutForm
            key={`${layout.id}-${layout.updated_at ?? ""}`}
            initial={layout}
          />
        ))}
        {!!available.length && <AdminLayoutForm available={available} />}
      </div>
      <p className="muted">
        Para adicionar um desenho novo, implemente o layout no gerador de PDF,
        gere sua miniatura real e registre o identificador na biblioteca. O
        envio de uma imagem não cria um layout funcional automaticamente.
      </p>
    </Shell>
  );
}
