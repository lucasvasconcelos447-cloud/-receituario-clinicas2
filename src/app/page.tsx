import { context } from "@/lib/context";
import { Shell } from "@/components/shell";
import { DocumentList } from "@/components/document-list";
import { InstallButton } from "@/components/pwa";
import { FileText, ClipboardList, HeartHandshake } from "lucide-react";
export default async function Home() {
  const { client, organization } = await context();
  const [
    { data: documents, error },
    { data: drafts, error: draftError },
    { data: patients },
    { data: professional },
  ] = await Promise.all([
    client
      .from("documents")
      .select("*")
      .eq("organization_id", organization.id)
      .order("updated_at", { ascending: false })
      .limit(6),
    client
      .from("documents")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(3),
    client
      .from("patients")
      .select("id,name")
      .eq("organization_id", organization.id),
    client
      .from("professional_profiles")
      .select("name,registration")
      .eq("organization_id", organization.id)
      .single(),
  ]);
  if (error || draftError) throw error || draftError;
  const patientNames = Object.fromEntries(
    (patients || []).map((p) => [p.id, p.name]),
  );
  const firstName = professional?.name?.split(" ")[0];
  return (
    <Shell name={organization.name} active="/">
      <div className="heading-row">
        <div>
          <span className="eyebrow">SEU ESPAÇO PROFISSIONAL</span>
          <h1>{firstName ? `Olá, ${firstName}.` : "Vamos começar?"}</h1>
          <p className="lead">Seu próximo documento começa aqui.</p>
        </div>
      </div>
      {!professional?.registration && (
        <div className="onboarding">
          <p>
            Complete seus dados profissionais antes de gerar o primeiro PDF.
          </p>
          <a href="/perfil">Completar perfil →</a>
        </div>
      )}
      <section className="document-launch" aria-label="Começar um documento">
        <a className="launch-primary" href="/novo?type=receituario">
          <FileText size={28} />
          <span>
            <strong>Nova prescrição</strong>
            <small>Escolha o paciente, escreva e revise.</small>
          </span>
          <span aria-hidden="true">＋</span>
        </a>
        <div className="launch-other">
          <a className="button secondary" href="/novo?type=exames">
            <ClipboardList size={20} />
            Solicitação de exames
          </a>
          <a className="button secondary" href="/novo?type=orientacoes">
            <HeartHandshake size={20} />
            Orientações
          </a>
        </div>
      </section>
      {!!drafts?.length && (
        <section className="card section">
          <div className="section-heading">
            <h2>Continuar rascunhos</h2>
            <a href="/documentos?status=draft">Ver rascunhos →</a>
          </div>
          <DocumentList documents={drafts} patients={patientNames} />
        </section>
      )}
      <section className="card section">
        <div className="section-heading">
          <h2>Documentos recentes</h2>
          <a href="/documentos">Ver todos →</a>
        </div>
        <DocumentList documents={documents || []} patients={patientNames} />
      </section>
      <div className="home-tools">
        <a href="/personalizar">Escolher modelo visual →</a>
        <a href="/modelos">Meus modelos de texto →</a>
      </div>
      <InstallButton />
    </Shell>
  );
}
