import { context } from "@/lib/context";
import { Shell } from "@/components/shell";
import { DocumentList } from "@/components/document-list";
import {
  FileText,
  ClipboardList,
  HeartHandshake,
  ArrowUpRight,
  Palette,
  Printer,
  Users,
} from "lucide-react";
export default async function Home() {
  const { client, organization } = await context();
  const [
    { data: documents, error },
    { data: patients },
    { count: total },
    { count: drafts },
    { count: patientCount },
    { data: professional },
  ] = await Promise.all([
    client
      .from("documents")
      .select("*")
      .eq("organization_id", organization.id)
      .order("updated_at", { ascending: false })
      .limit(5),
    client
      .from("patients")
      .select("id,name")
      .eq("organization_id", organization.id),
    client
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id),
    client
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("status", "draft"),
    client
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization.id),
    client
      .from("professional_profiles")
      .select("name,registration")
      .eq("organization_id", organization.id)
      .single(),
  ]);
  if (error) throw error;
  const firstName = professional?.name?.split(" ")[0];
  return (
    <Shell name={organization.name} active="/">
      <div className="heading-row">
        <div>
          <span className="eyebrow">SEU DIA, COM MAIS LEVEZA</span>
          <h1>
            {firstName ? `Olá, ${firstName}.` : "Bem-vinda ao seu espaço."}{" "}
            <span className="greeting">✳</span>
          </h1>
          <p className="lead">Vamos transformar seu cuidado em palavras?</p>
        </div>
        <a className="button" href="/novo">
          ＋ Novo documento
        </a>
      </div>
      {!professional?.registration && (
        <div className="onboarding">
          <div>
            <strong>Seu espaço está pronto para começar.</strong>
            <p>
              Complete o perfil e escolha a identidade antes de gerar seu
              primeiro PDF.
            </p>
          </div>
          <a href="/perfil">Configurar meu perfil →</a>
        </div>
      )}
      <section className="hero">
        <div>
          <span className="eyebrow">DA SUA ROTINA PARA O PAPEL</span>
          <h2>
            Mais cuidado.
            <br />
            Menos papelada.
          </h2>
          <p>
            Crie documentos com a sua identidade.
            <br />
            Salve, gere um PDF e siga com o que importa.
          </p>
          <a href="/novo" className="button">
            Criar um documento <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="hero-paper" aria-hidden="true">
          <div className="paper-emblem">✳</div>
          <small>{organization.name}</small>
          <h3>Receituário</h3>
          <div className="paper-lines">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="paper-sign" />
          <small>Seu cuidado, sua identidade.</small>
          <span className="paper-stamp">Feito por você</span>
        </div>
      </section>
      <div className="stats">
        <div>
          <span className="stat-icon">
            <FileText />
          </span>
          <div>
            <strong>{total || 0}</strong>
            <small>Documentos criados</small>
          </div>
        </div>
        <div>
          <span className="stat-icon gold">
            <ClipboardList />
          </span>
          <div>
            <strong>{drafts || 0}</strong>
            <small>Rascunhos para retomar</small>
          </div>
        </div>
        <div>
          <span className="stat-icon lilac">
            <Users />
          </span>
          <div>
            <strong>{patientCount || 0}</strong>
            <small>Pacientes cadastrados</small>
          </div>
        </div>
      </div>
      <section className="section">
        <div className="section-heading">
          <h2>O que vamos criar hoje?</h2>
          <span>Um começo simples para cada necessidade</span>
        </div>
        <div className="type-grid">
          {[
            [
              "receituario",
              "Receituário",
              "Seu texto, com a identidade da clínica.",
              FileText,
            ],
            [
              "exames",
              "Solicitação de exames",
              "Organize os exames que você definir.",
              ClipboardList,
            ],
            [
              "orientacoes",
              "Orientações de cuidados",
              "Deixe cada próximo passo por escrito.",
              HeartHandshake,
            ],
          ].map(([type, title, desc, Icon]) => {
            const I = Icon as typeof FileText;
            return (
              <a
                className="type-card"
                href={`/novo?type=${type}`}
                key={String(type)}
              >
                <span className="type-symbol">
                  <I size={25} />
                </span>
                <h3>{String(title)}</h3>
                <p>{String(desc)}</p>
                <span className="text-link">
                  Começar <ArrowUpRight size={17} />
                </span>
              </a>
            );
          })}
        </div>
      </section>
      <div className="dashboard-bottom">
        <section className="card recent">
          <div className="section-heading">
            <h2>Documentos recentes</h2>
            <a href="/documentos">Ver todos →</a>
          </div>
          <DocumentList
            documents={documents || []}
            patients={Object.fromEntries(
              (patients || []).map((p) => [p.id, p.name]),
            )}
          />
        </section>
        <section className="card identity-tip">
          <span className="type-symbol">
            <Palette size={25} />
          </span>
          <h2>Com a sua identidade.</h2>
          <p>
            Seu logotipo, suas cores e um documento que tem a cara da sua
            clínica.
          </p>
          <a href="/personalizar">Personalizar documentos →</a>
          <hr />
          <Printer size={22} />
          <h3>Vai produzir um bloco?</h3>
          <p>Gere papel timbrado em branco, em A4 ou A5.</p>
          <a href="/personalizar#papel">Preparar para impressão →</a>
        </section>
      </div>
    </Shell>
  );
}
