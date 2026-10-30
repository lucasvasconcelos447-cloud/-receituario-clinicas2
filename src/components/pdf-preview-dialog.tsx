"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Snapshot } from "@/lib/types";
export default function PdfPreviewDialog({
  snapshot,
  fictitious,
  onClose,
}: {
  snapshot: Snapshot;
  fictitious: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(280);
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(true);
  useEffect(() => {
    dialog.current?.showModal();
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(120, entry.contentRect.width - 24)),
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    let loading:
      | ReturnType<typeof import("pdfjs-dist").getDocument>
      | undefined;
    (async () => {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: abort.signal,
        body: JSON.stringify({
          branding: snapshot.branding,
          document: snapshot.document,
          blank: snapshot.blank,
          logoData: snapshot.logoData,
          fictitious,
        }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).error || "Falha ao carregar a prévia.",
        );
      const bytes = new Uint8Array(await response.arrayBuffer());
      const renderer = await import("pdfjs-dist/legacy/build/pdf.mjs");
      if (abort.signal.aborted) return;
      renderer.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
      loading = renderer.getDocument({ data: bytes });
      const loaded = await loading.promise;
      if (!abort.signal.aborted) setPdf(loaded);
    })().catch((e) => {
      if (!abort.signal.aborted) {
        setError(e instanceof Error ? e.message : "Prévia indisponível.");
        setRendering(false);
      }
    });
    return () => {
      abort.abort();
      void loading?.destroy();
    };
  }, [snapshot, fictitious]);
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let cancelled = false;
    let task:
      | ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>
      | undefined;
    setRendering(true);
    (async () => {
      const sheet = await pdf.getPage(page);
      if (cancelled || !canvas.current) return;
      const original = sheet.getViewport({ scale: 1 });
      const scale = (width / original.width) * zoom;
      const viewport = sheet.getViewport({ scale });
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const c = canvas.current;
      c.width = Math.ceil(viewport.width * ratio);
      c.height = Math.ceil(viewport.height * ratio);
      c.style.width = `${viewport.width}px`;
      c.style.height = `${viewport.height}px`;
      task = sheet.render({
        canvas: c,
        canvasContext: c.getContext("2d")!,
        viewport,
        transform: [ratio, 0, 0, ratio, 0, 0],
      });
      await task.promise;
      if (!cancelled) setRendering(false);
    })().catch((e) => {
      if (!cancelled) {
        setError(
          "Não foi possível exibir esta página. Tente abrir a prévia novamente.",
        );
        setRendering(false);
      }
    });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, page, width, zoom]);
  return (
    <dialog
      ref={dialog}
      className="pdf-dialog"
      onCancel={onClose}
      aria-labelledby="pdf-preview-title"
    >
      <div className="pdf-dialog-header">
        <div>
          <h2 id="pdf-preview-title">
            Prévia do PDF · {snapshot.branding.paper}
          </h2>
          <small>
            {fictitious ? "Paciente fictício. " : ""}Prévia sem salvar ou gerar
            uma versão.
          </small>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={onClose}
          aria-label="Fechar prévia"
        >
          Fechar
        </button>
      </div>
      <div className="pdf-toolbar">
        <button
          type="button"
          className="button secondary"
          disabled={!pdf || page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ← Anterior
        </button>
        <span aria-live="polite">
          {pdf ? `${page} / ${pdf.numPages}` : "Carregando…"}
        </span>
        <button
          type="button"
          className="button secondary"
          disabled={!pdf || page === pdf.numPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima →
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => setZoom((z) => (z === 1 ? 1.7 : 1))}
        >
          {zoom === 1 ? "Ampliar" : "Ajustar à tela"}
        </button>
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <div
        className="pdf-canvas-container"
        ref={container}
        aria-busy={rendering}
      >
        {rendering && !error && (
          <p role="status" className="pdf-loading">
            Preparando página…
          </p>
        )}
        <canvas
          ref={canvas}
          aria-label={`Página ${page} do documento. Use o PDF gerado para leitura com tecnologia assistiva.`}
        />
      </div>
    </dialog>
  );
}
