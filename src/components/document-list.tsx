import type { ClinicalDocument } from "@/lib/types";
import { TYPES, brDate } from "@/lib/config";
export function DocumentList({
  documents,
  patients = {},
}: {
  documents: ClinicalDocument[];
  patients?: Record<string, string>;
}) {
  return documents.length ? (
    <div className="document-list">
      {documents.map((d) => (
        <a key={d.id} className="document-row" href={`/documentos/${d.id}`}>
          <div className="doc-icon">≡</div>
          <div>
            <strong>{d.title}</strong>
            <small>
              {patients[d.patient_id || ""] || TYPES[d.type]} · Emissão{" "}
              {brDate(d.issue_date)}
            </small>
            <small>
              Criado {brDate(d.created_at)} · Atualizado {brDate(d.updated_at)}
            </small>
          </div>
          <span className={`badge ${d.status === "generated" ? "green" : ""}`}>
            {d.status === "generated" ? "PDF gerado" : "Rascunho"}
          </span>
          <span>↗</span>
        </a>
      ))}
    </div>
  ) : (
    <div className="empty">
      <h3>Uma nova história começa aqui.</h3>
      <p>Seus documentos salvos aparecerão neste espaço.</p>
      <a className="button secondary" href="/novo">
        Criar primeiro documento
      </a>
    </div>
  );
}
