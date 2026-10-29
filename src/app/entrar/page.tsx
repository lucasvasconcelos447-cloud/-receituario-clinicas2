import { AuthForm } from "@/components/auth-form";
import { APP } from "@/lib/config";
import { FileHeart, ShieldCheck, PenLine, Printer } from "lucide-react";
import { configured } from "@/lib/supabase/server";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="auth-page">
      <section className="auth-story">
        <a className="brand" href="/">
          <span className="brand-icon">
            <FileHeart size={25} />
          </span>
          {APP.name}
          <small>PARA PROFISSIONAIS DA SAÚDE</small>
        </a>
        <div className="auth-copy">
          <span className="eyebrow light">MAIS TEMPO PARA CUIDAR</span>
          <h1>
            Seu cuidado merece
            <br />
            uma boa impressão.
          </h1>
          <p>
            Da primeira palavra ao documento final.
            <br />
            Tudo no seu espaço, com a identidade da sua clínica.
          </p>
          <div className="sample-sheet">
            <div className="sample-rule" />
            <span>SEU ESPAÇO DE CUIDADO</span>
            <h3>Orientações de cuidados</h3>
            <i />
            <i />
            <i className="short" />
            <div className="sample-sign" />
            Identificação profissional
          </div>
          <div className="auth-features">
            <span>
              <PenLine size={17} /> Escreva com tranquilidade
            </span>
            <span>
              <Printer size={17} /> Gere e imprima PDFs
            </span>
            <span>
              <ShieldCheck size={17} /> Um espaço para sua clínica
            </span>
          </div>
        </div>
        <small>Feito para acompanhar sua rotina.</small>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">BEM-VINDA AO SEU ESPAÇO</span>
          <h2>Vamos começar?</h2>
          <p className="muted">
            Entre para organizar seus documentos e cuidar dos próximos passos.
          </p>
          {query.error && (
            <p className="notice error">
              O link expirou ou não pôde ser confirmado. Solicite outro e-mail
              de recuperação ou entre novamente.
            </p>
          )}
          {query.message && (
            <p className="notice">Senha atualizada. Entre novamente.</p>
          )}
          {!configured() && (
            <p className="notice">
              Ambiente em preparação. Configure o Supabase para habilitar as
              contas.
            </p>
          )}
          <AuthForm />
          <div className="privacy-note">
            <ShieldCheck size={17} />
            <p>
              Seus documentos pertencem ao seu espaço.
              <br />
              Conteúdo clínico escrito e revisado por você.
            </p>
          </div>
        </div>
        <small>Documentos gerados sem assinatura eletrônica.</small>
      </section>
    </main>
  );
}
