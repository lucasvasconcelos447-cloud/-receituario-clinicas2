import type { Snapshot } from "@/lib/types";
import { TYPES, brDate } from "@/lib/config";
export function DocumentPreview({
  snapshot: s,
  fictitious = false,
}: {
  snapshot: Snapshot;
  fictitious?: boolean;
}) {
  const {
    organization: o,
    professional: p,
    branding: b,
    patient,
    document: d,
  } = s;
  return (
    <div className="preview-scroller">
      <article
        className={`document-preview ${b.template} ${b.paper}`}
        style={
          {
            "--document-primary": b.primary_color,
            "--document-secondary": b.secondary_color,
            fontFamily:
              b.font === "classica" ? "Georgia,serif" : "Arial,sans-serif",
          } as React.CSSProperties
        }
      >
        {fictitious && (
          <div className="fiction-tag">PRÉVIA · DADOS FICTÍCIOS</div>
        )}
        <header>
          {s.logoData && (
            <img
              alt="Logotipo do estabelecimento"
              src={s.logoData}
              style={{
                width: b.logo_width,
                maxHeight: 90,
                objectFit: "contain",
              }}
            />
          )}
          <h2>{o.name}</h2>
          {b.phrase && <p>{b.phrase}</p>}
          <div className="document-line" />
        </header>
        <h3>{d ? TYPES[d.type] : "Receituário"}</h3>
        <div className="document-patient">
          <p>
            <strong>Paciente:</strong>{" "}
            {s.blank
              ? "________________________________________________"
              : patient?.name || "Selecione um paciente"}
          </p>
          <p>
            {s.blank
              ? "Nascimento: ____/____/______"
              : patient?.birth_date
                ? `Nascimento: ${brDate(patient.birth_date)}`
                : ""}{" "}
            <span>
              Data:{" "}
              {s.blank ? "____/____/______" : d ? brDate(d.issue_date) : ""}
            </span>
          </p>
          {!s.blank && patient?.identifier && (
            <p>Identificação: {patient.identifier}</p>
          )}
          {!s.blank && d?.medication_mode && (
            <>
              <p>
                Sexo: {patient?.sex} · Endereço: {patient?.address}
              </p>
              <p>
                Instituição: {o.legal_name || o.name} · CNPJ: {o.cnpj}
              </p>
              <p>
                Protocolo: {d.protocol}/{d.protocol_year} · Aprovado por:{" "}
                {d.protocol_institution}
              </p>
            </>
          )}
        </div>
        <div className={`document-body ${s.blank && b.ruled ? "ruled" : ""}`}>
          {!s.blank && (
            <>
              <h4>{d?.title}</h4>
              <p>{d?.content || "Seu conteúdo aparecerá aqui."}</p>
              {d?.justification && (
                <p>Justificativa / observações: {d.justification}</p>
              )}
            </>
          )}
        </div>
        <div className="document-signature">
          <div />
          <strong>{p.name || "Nome da profissional"}</strong>
          <small>
            {p.category} · {p.council} {p.registration} / {p.state}
          </small>
          {d?.medication_mode && <small>CPF: {p.identifier}</small>}
          <small>Assinatura manual e carimbo</small>
        </div>
        <footer>
          {b.show_address && (
            <p>{[o.address, o.city, o.state].filter(Boolean).join(" · ")}</p>
          )}
          {b.show_contact && (
            <p>{[o.phone, o.email].filter(Boolean).join(" · ")}</p>
          )}
        </footer>
      </article>
    </div>
  );
}
