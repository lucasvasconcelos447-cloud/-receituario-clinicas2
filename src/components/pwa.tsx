"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
const InstallationContext = createContext<{
  prompt: InstallEvent | null;
  installed: boolean;
  clearPrompt: () => void;
}>({ prompt: null, installed: false, clearPrompt: () => {} });
export function PwaProvider({ children }: { children: ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) location.reload();
    };
    update();
    setInstalled(
      matchMedia("(display-mode: standalone)").matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    );
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", done);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("pageshow", restore);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (reg.waiting) setWaiting(reg.waiting);
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            worker?.addEventListener("statechange", () => {
              if (
                worker.state === "installed" &&
                navigator.serviceWorker.controller
              )
                setWaiting(worker);
            });
          });
        })
        .catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", done);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("pageshow", restore);
    };
  }, []);
  return (
    <InstallationContext.Provider
      value={{ prompt, installed, clearPrompt: () => setPrompt(null) }}
    >
      {offline && (
        <div className="connection" role="alert">
          Sem conexão. Não é possível salvar alterações. Mantenha esta página
          aberta.
        </div>
      )}
      {waiting && (
        <div className="connection">
          Atualização disponível. Salve seu trabalho antes de atualizar.{" "}
          <button
            onClick={() => {
              navigator.serviceWorker.addEventListener(
                "controllerchange",
                () => location.reload(),
                { once: true },
              );
              waiting.postMessage("SKIP_WAITING");
            }}
          >
            Atualizar aplicativo
          </button>
        </div>
      )}
      {children}
    </InstallationContext.Provider>
  );
}
export function InstallButton() {
  const { prompt, installed, clearPrompt } = useContext(InstallationContext);
  const [help, setHelp] = useState("");
  const [busy, setBusy] = useState(false);
  if (installed) return null;
  return (
    <div className="install-callout">
      <div>
        <strong>Leve seu espaço com você</strong>
        <p>Acesse direto pela tela inicial do seu celular</p>
      </div>
      <button
        className="button secondary"
        disabled={installed || busy}
        onClick={async () => {
          if (prompt) {
            setBusy(true);
            try {
              await prompt.prompt();
              const choice = await prompt.userChoice;
              setHelp(
                choice.outcome === "accepted"
                  ? "A instalação foi solicitada. Aguarde a confirmação do navegador."
                  : "Você pode instalar depois usando o menu do navegador.",
              );
            } catch {
              setHelp(
                "Abra o menu do navegador e procure Instalar aplicativo ou Adicionar à tela inicial.",
              );
            } finally {
              clearPrompt();
              setBusy(false);
            }
          } else
            setHelp(
              /iPad|iPhone|iPod/.test(navigator.userAgent)
                ? "No Safari, toque em Compartilhar → Adicionar à Tela de Início. Em outros navegadores, procure essa opção no menu ou abra no Safari."
                : "Abra o menu do navegador e procure “Instalar aplicativo” ou “Adicionar à tela inicial”. A opção depende do navegador e de uma conexão HTTPS.",
            );
        }}
      >
        {installed
          ? "Aplicativo instalado"
          : busy
            ? "Abrindo instalação…"
            : "Instalar aplicativo"}
      </button>
      {help && !installed && <p role="status">{help}</p>}
      <small>Pacientes e documentos precisam de conexão.</small>
    </div>
  );
}
