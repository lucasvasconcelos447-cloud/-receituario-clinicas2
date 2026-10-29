"use client";
import { useEffect, useState } from "react";
export function FileActions({
  blank = false,
  documentId,
  versionId,
  onGenerated,
}: {
  blank?: boolean;
  documentId?: string;
  versionId?: string;
  onGenerated?: (updated_at: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [generatedVersion, setGeneratedVersion] = useState(versionId);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  async function load() {
    if (file) return { file, url };
    const response = await fetch(
      versionId ? `/api/files/${versionId}` : "/api/pdf",
      {
        method: versionId ? "GET" : "POST",
        headers: versionId ? {} : { "Content-Type": "application/json" },
        body: versionId ? undefined : JSON.stringify({ blank, documentId }),
        cache: "no-store",
      },
    );
    if (!response.ok) {
      const body = await response
        .json()
        .catch(() => ({ error: "Não foi possível gerar o PDF." }));
      throw new Error(body.error);
    }
    const updatedAt = response.headers.get("X-Document-Updated-At");
    if (updatedAt) onGenerated?.(updatedAt);
    const blob = await response.blob();
    const f = new File(
      [blob],
      blank ? "receituario-em-branco.pdf" : "documento.pdf",
      { type: "application/pdf" },
    );
    const u = URL.createObjectURL(f);
    setFile(f);
    setUrl(u);
    setGeneratedVersion(response.headers.get("X-Version-Id") || versionId);
    return { file: f, url: u };
  }
  async function run(mode: "download" | "share" | "print") {
    const printWindow =
      mode === "print" ? window.open("about:blank", "_blank") : null;
    if (printWindow) printWindow.opener = null;
    setBusy(true);
    setError("");
    try {
      const value = await load();
      if (mode === "share" && navigator.canShare?.({ files: [value.file] })) {
        await navigator.share({ files: [value.file], title: "Documento" });
        return;
      }
      if (mode === "print") {
        const win = printWindow;
        if (!win)
          throw new Error(
            "Permita abrir a prévia ou baixe o arquivo para imprimir.",
          );
        win.location.href = value.url;
        return;
      }
      const a = document.createElement("a");
      a.href = value.url;
      a.download = value.file.name;
      a.click();
      if (mode === "share")
        setError(
          "Compartilhamento de arquivos indisponível neste navegador. O download foi iniciado.",
        );
    } catch (e) {
      printWindow?.close();
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setError(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "O arquivo está pronto. Toque novamente em Compartilhar ou use Baixar PDF."
            : e instanceof Error
              ? e.message
              : "Falha de conexão. Tente novamente.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <div className="action-row">
        <button
          className="button"
          disabled={busy}
          onClick={() => run("download")}
        >
          {busy
            ? "Preparando PDF…"
            : versionId
              ? "Baixar esta versão"
              : file
                ? "Baixar PDF novamente"
                : blank
                  ? "Gerar papel em branco"
                  : "Gerar PDF e baixar"}
        </button>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => run("print")}
        >
          Abrir para imprimir
        </button>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => run("share")}
        >
          Compartilhar arquivo
        </button>
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {file && (
        <p className="notice">
          PDF pronto, sem assinatura eletrônica.{" "}
          {generatedVersion && (
            <a href={`/documentos/${documentId || ""}`}>
              Consultar histórico de versões
            </a>
          )}
        </p>
      )}
      <p className="muted">
        Para assinatura externa: baixe o PDF, envie ao{" "}
        <a
          href="https://assinador.iti.br/"
          target="_blank"
          rel="noopener noreferrer"
        >
          assinador oficial gov.br ↗
        </a>{" "}
        e baixe o resultado. Suas credenciais são informadas apenas no serviço
        oficial.
      </p>
    </div>
  );
}
