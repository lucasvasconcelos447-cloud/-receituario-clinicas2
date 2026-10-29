"use client";
import { useEffect, useState } from "react";
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function PwaProvider() {
  const [offline, setOffline] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
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
    const restore = (e: PageTransitionEvent) => {
      if (e.persisted) location.reload();
    };
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("pageshow", restore);
    };
  }, []);
  return (
    <>
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
              waiting.postMessage("SKIP_WAITING");
              navigator.serviceWorker.addEventListener(
                "controllerchange",
                () => location.reload(),
                { once: true },
              );
            }}
          >
            Atualizar aplicativo
          </button>
        </div>
      )}
    </>
  );
}
export function InstallButton() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState("");
  useEffect(() => {
    setInstalled(
      matchMedia("(display-mode: standalone)").matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    );
    const capture = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  return (
    <div>
      <button
        className="button secondary"
        disabled={installed}
        onClick={async () => {
          if (prompt) {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            if (choice.outcome === "accepted") setInstalled(true);
            setPrompt(null);
          } else
            setHelp(
              /iPad|iPhone|iPod/.test(navigator.userAgent)
                ? "No Safari, toque em Compartilhar → Adicionar à Tela de Início. Em outros navegadores, procure essa opção no menu ou abra no Safari."
                : "Abra o menu do navegador e procure “Instalar aplicativo” ou “Adicionar à tela inicial”. A opção depende do navegador e de uma conexão HTTPS.",
            );
        }}
      >
        {installed ? "Aplicativo instalado" : "Instalar aplicativo"}
      </button>
      {help && <p role="status">{help}</p>}
      <p className="muted">
        A instalação facilita o acesso. Pacientes e documentos precisam de
        conexão.
      </p>
    </div>
  );
}
