import { context } from "@/lib/context";
import { Shell } from "@/components/shell";
import { PatientForm } from "@/components/forms";
import { brDate } from "@/lib/config";
export default async function Patients({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { client, organization } = await context();
  const { q = "" } = await searchParams;
  let query = client
    .from("patients")
    .select("*")
    .eq("organization_id", organization.id)
    .order("name");
  if (q)
    query = query.ilike("name", `%${q.replace(/[%_]/g, "").slice(0, 150)}%`);
  const { data: patients, error } = await query.limit(100);
  if (error) throw error;
  return (
    <Shell name={organization.name} active="/pacientes">
      <span className="eyebrow">CADA PESSOA, UM CUIDADO</span>
      <h1>Pacientes</h1>
      <p className="lead">Os dados essenciais, sempre à mão.</p>
      <div className="two-column">
        <section className="card">
          <h2>Seus pacientes</h2>
          <form className="search" action="/pacientes">
            <label>
              Buscar pelo nome
              <input name="q" defaultValue={q} placeholder="Digite um nome" />
            </label>
            <button className="button secondary">Buscar</button>
          </form>
          <div className="list">
            {patients?.length ? (
              patients.map((p) => (
                <a className="list-row" href={`/pacientes/${p.id}`} key={p.id}>
                  <span className="avatar">{p.name.slice(0, 1)}</span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.birth_date
                        ? brDate(p.birth_date)
                        : "Nascimento não informado"}
                    </small>
                  </span>
                  <span>→</span>
                </a>
              ))
            ) : (
              <div className="empty">
                {q
                  ? "Nenhum paciente encontrado."
                  : "Seus pacientes aparecerão aqui. Cadastre o primeiro ao lado."}
              </div>
            )}
          </div>
          <p className="muted">Até 100 resultados por busca.</p>
        </section>
        <section className="card">
          <h2>Cadastrar paciente</h2>
          <PatientForm />
        </section>
      </div>
    </Shell>
  );
}
