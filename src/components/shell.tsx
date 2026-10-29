import {
  FileHeart,
  House,
  Files,
  Users,
  BookOpen,
  Palette,
  UserRound,
  Settings,
  Plus,
  LogOut,
} from "lucide-react";
import { APP } from "@/lib/config";
import { signout } from "@/app/auth-actions";
const links = [
  ["/", "Início", House],
  ["/documentos", "Documentos", Files],
  ["/pacientes", "Pacientes", Users],
  ["/modelos", "Modelos de texto", BookOpen],
  ["/personalizar", "Personalizar documentos", Palette],
  ["/perfil", "Perfil profissional", UserRound],
  ["/configuracoes", "Configurações e instalação", Settings],
] as const;
export function Shell({
  children,
  name,
  active,
}: {
  children: React.ReactNode;
  name: string;
  active?: string;
}) {
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a href="/" className="brand">
          <span className="brand-icon">
            <FileHeart size={23} />
          </span>
          {APP.name}
        </a>
        <div className="clinic">
          <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{name}</strong>
            <small>Meu espaço profissional</small>
          </div>
        </div>
        <a className="button" href="/novo">
          <Plus size={18} />
          Novo documento
        </a>
        <nav aria-label="Principal">
          {links.map(([url, label, Icon]) => (
            <a
              key={url}
              href={url}
              aria-current={active === url ? "page" : undefined}
            >
              <Icon size={19} />
              {label}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="pill">Seu cuidado, bem documentado</span>
          <form action={signout}>
            <button>
              <LogOut size={17} />
              Sair da conta
            </button>
          </form>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <span>Seu espaço de documentos</span>
          <div>
            <span className="status-dot" />
            Acesso individual{" "}
            <span className="avatar small">{name.slice(0, 1)}</span>
          </div>
        </header>
        <details className="mobile-menu">
          <summary>☰ Menu · {APP.name}</summary>
          <nav>
            {links.map(([url, label]) => (
              <a key={url} href={url}>
                {label}
              </a>
            ))}
            <form action={signout}>
              <button>Sair da conta</button>
            </form>
          </nav>
        </details>
        <main className="content">{children}</main>
        <footer className="app-footer">
          {APP.name} · Conteúdo clínico sob responsabilidade da profissional.
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Navegação móvel">
        <a href="/">Início</a>
        <a href="/novo">＋ Novo</a>
        <a href="/documentos">Documentos</a>
        <a href="/pacientes">Pacientes</a>
      </nav>
    </div>
  );
}
