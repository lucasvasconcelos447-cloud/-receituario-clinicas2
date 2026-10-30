"use client";
import { useEffect, useRef, useState } from "react";
import { saveDocument } from "@/app/actions";
import { DocumentPreview } from "./document-preview";
import { QuickPatient } from "./quick-patient";
import { generationErrors } from "@/lib/validation";
import type { VisualTemplate } from "@/lib/visual-library";
import { draftKey } from "@/lib/editor-state";
import { FileActions } from "./file-actions";
import { TYPES, type DocType, today } from "@/lib/config";
import type { Snapshot, Patient, ClinicalDocument } from "@/lib/types";
export function DocumentEditor({
  base,
  library,
  patients,
  templates,
  initial,
  patientId,
  type = "receituario",
}: {
  base: Snapshot;
  library: VisualTemplate[];
  patients: Patient[];
  templates: { id: string; name: string; type: string; content: string }[];
  initial?: ClinicalDocument;
  patientId?: string;
  type?: DocType;
}) {
  const [doc, setDoc] = useState<ClinicalDocument>(
    initial || {
      id: "",
      visual_template: base.branding.template,
      patient_id: patientId || null,
      type,
      title: TYPES[type],
      content: "",
      issue_date: today(),
      protocol: "",
      protocol_year: "",
      protocol_institution: "",
      justification: "",
      medication_mode: false,
      clinical_reviewed: false,
      status: "draft",
      updated_at: "",
      created_at: "",
    },
  );
  const [step, setStep] = useState(1);
  const [patientList, setPatientList] = useState(patients);
  const [quickPatient, setQuickPatient] = useState(false);
  const [savedKey, setSavedKey] = useState(() =>
    initial && !initial.id ? "" : draftKey(doc),
  );
  const dirty = draftKey(doc) !== savedKey;
  const [patientSearch, setPatientSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const revision = useRef(0);
  const snapshot = {
    ...base,
    document: doc,
    branding: {
      ...base.branding,
      template: doc.visual_template || base.branding.template,
    },
    patient: patientList.find((p) => p.id === doc.patient_id) || null,
    blank: false,
  };
  function change<K extends keyof ClinicalDocument>(
    key: K,
    value: ClinicalDocument[K],
  ) {
    if (doc[key] === value) return;
    revision.current++;
    setMessage("Alterações não salvas");
    setDoc((d) => ({
      ...d,
      [key]: value,
      ...(key !== "clinical_reviewed" ? { clinical_reviewed: false } : {}),
    }));
  }
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  async function save(forGeneration = false) {
    if (!forGeneration) setBusy(true);
    setError("");
    const savedRevision = revision.current;
    let result;
    try {
      result = await saveDocument(
        doc,
        doc.id || undefined,
        doc.updated_at || undefined,
      );
    } catch {
      setError(
        "Conexão interrompida. O salvamento não foi confirmado. Mantenha esta página aberta e tente novamente.",
      );
      return;
    } finally {
      if (!forGeneration) setBusy(false);
    }
    if (result.error) {
      setError(result.error);
      return;
    }
    setDoc((d) => ({ ...d, id: result.id!, updated_at: result.updated_at! }));
    if (revision.current === savedRevision) {
      setSavedKey(draftKey(doc));
      setMessage("Rascunho salvo no servidor.");
    } else setMessage("Há novas alterações não salvas.");
    if (!doc.id) history.replaceState(null, "", `/documentos/${result.id}`);
    return revision.current === savedRevision ? result.id : undefined;
  }
  return (
    <>
      <div className="document-start-bar">
        <button
          className={step !== 3 ? "button" : "button secondary"}
          disabled={busy}
          onClick={() => setStep(2)}
        >
          1 · Escrever
        </button>
        <button
          className={step === 3 ? "button" : "button secondary"}
          disabled={busy || quickPatient}
          onClick={() => setStep(3)}
        >
          2 · Revisar e emitir
        </button>
        <DocumentPreview snapshot={snapshot} />
        <span className="save-state" role="status">
          {busy
            ? "Preparando…"
            : dirty
              ? "● Alterações não salvas"
              : doc.id
                ? "Salvo no servidor"
                : "Novo documento"}
        </span>
      </div>
      <div className="editor-grid">
        <section className="card editor-fields">
          <fieldset disabled={busy} className="editor-fieldset">
            {step !== 3 && (
              <>
                <h2>Tipo de documento</h2>
                {Object.entries(TYPES).map(([key, title]) => (
                  <label
                    className={`radio-card ${doc.type === key ? "selected" : ""}`}
                    key={key}
                  >
                    <input
                      type="radio"
                      checked={doc.type === key}
                      onChange={() => {
                        change("type", key as DocType);
                        change("title", title);
                        if (key !== "receituario")
                          change("medication_mode", false);
                      }}
                    />
                    {title}
                  </label>
                ))}
                <p className="muted">
                  O conteúdo será escrito e revisado por você. Sem sugestões
                  automáticas.
                </p>
              </>
            )}
            {step !== 3 && (
              <>
                <h2>Selecione o paciente</h2>
                <label>
                  Paciente
                  <select
                    value={doc.patient_id || ""}
                    onChange={(e) =>
                      change("patient_id", e.target.value || null)
                    }
                  >
                    <option value="">Selecione</option>
                    {patientList
                      .filter(
                        (p) =>
                          p.id === doc.patient_id ||
                          p.name
                            .toLocaleLowerCase("pt-BR")
                            .includes(patientSearch.toLocaleLowerCase("pt-BR")),
                      )
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>
                {quickPatient ? (
                  <QuickPatient
                    onClose={() => setQuickPatient(false)}
                    onSaved={(patient) => {
                      setPatientList((list) => [...list, patient]);
                      change("patient_id", patient.id);
                      setQuickPatient(false);
                      setMessage(
                        "Paciente cadastrado e selecionado. Seu rascunho continua aberto.",
                      );
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setQuickPatient(true)}
                  >
                    + Novo paciente
                  </button>
                )}
                <label>
                  Data de emissão
                  <input
                    type="date"
                    required
                    value={doc.issue_date}
                    onChange={(e) => change("issue_date", e.target.value)}
                  />
                </label>
              </>
            )}
            {step !== 3 && (
              <>
                <h2>Escreva o conteúdo</h2>
                <label>
                  Título
                  <input
                    value={doc.title}
                    maxLength={150}
                    onChange={(e) => change("title", e.target.value)}
                  />
                </label>
                <label>
                  Inserir modelo de texto
                  <select
                    value=""
                    onChange={(e) => {
                      const t = templates.find((t) => t.id === e.target.value);
                      if (
                        t &&
                        (!doc.content ||
                          confirm("Substituir o conteúdo atual pelo modelo?"))
                      )
                        change("content", t.content);
                    }}
                  >
                    <option value="">Escolha um dos seus modelos</option>
                    {templates
                      .filter((t) => t.type === doc.type)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  {doc.type === "exames"
                    ? "Exames definidos por você (um por linha)"
                    : "Conteúdo"}
                  <textarea
                    rows={12}
                    value={doc.content}
                    maxLength={40000}
                    onChange={(e) => change("content", e.target.value)}
                    placeholder="Escreva aqui. Parágrafos e listas em texto simples são preservados."
                  />
                </label>
                <small>
                  {doc.content.length.toLocaleString("pt-BR")} / 40.000
                  caracteres
                </small>
                {doc.type === "exames" && (
                  <label>
                    Justificativa / observações (quando pertinente)
                    <textarea
                      value={doc.justification}
                      rows={3}
                      maxLength={4000}
                      onChange={(e) => change("justification", e.target.value)}
                    />
                  </label>
                )}
                {doc.type === "receituario" && (
                  <>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={doc.medication_mode}
                        onChange={(e) =>
                          change("medication_mode", e.target.checked)
                        }
                      />
                      Prescrição simples de medicamentos por enfermagem
                    </label>
                    {doc.medication_mode && (
                      <>
                        <p className="notice">
                          Somente receituário simples. Não utilizar para
                          medicamentos sujeitos à retenção ou controle especial.
                          Escreva denominação genérica, via e posologia; confira
                          sua habilitação e o protocolo aplicável.
                        </p>
                        <label>
                          Protocolo utilizado
                          <input
                            value={doc.protocol}
                            maxLength={500}
                            onChange={(e) => change("protocol", e.target.value)}
                          />
                        </label>
                        <label>
                          Ano de aprovação/publicação
                          <input
                            value={doc.protocol_year}
                            maxLength={4}
                            inputMode="numeric"
                            onChange={(e) =>
                              change("protocol_year", e.target.value)
                            }
                          />
                        </label>
                        <label>
                          Instituição que aprovou o protocolo
                          <input
                            value={doc.protocol_institution}
                            maxLength={500}
                            onChange={(e) =>
                              change("protocol_institution", e.target.value)
                            }
                          />
                        </label>
                      </>
                    )}
                  </>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <span className="eyebrow">04 · CONFIRA CADA DETALHE</span>
                <h2>Revise antes de gerar</h2>
                <p>
                  Confira paciente, data, texto e dados profissionais. O PDF
                  final terá paginação automática.
                </p>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={doc.clinical_reviewed}
                    onChange={(e) =>
                      change("clinical_reviewed", e.target.checked)
                    }
                  />
                  Revisei o conteúdo e, quando aplicável, denominação genérica,
                  via, posologia, protocolo e os limites da minha atuação.
                </label>
                <p className="notice">
                  O arquivo será gerado sem assinatura eletrônica. Imprima para
                  assinatura manual ou assine externamente.
                </p>
                <div className="review-summary">
                  <p>
                    <strong>Paciente:</strong>{" "}
                    {snapshot.patient?.name || "Não selecionado"}
                  </p>
                  <p>
                    <strong>Documento:</strong> {TYPES[doc.type]} ·{" "}
                    {doc.issue_date}
                  </p>
                  <p>
                    <strong>Modelo visual:</strong>{" "}
                    {library.find((x) => x.id === snapshot.branding.template)
                      ?.name || "Modelo anterior"}{" "}
                    · {base.branding.paper}
                  </p>
                  <p className="review-content">
                    {doc.content || "Conteúdo ainda não preenchido."}
                  </p>
                  {doc.justification && <p>{doc.justification}</p>}
                </div>
                <DocumentPreview snapshot={snapshot} />
                <FileActions
                  key={revision.current}
                  documentId={doc.id || undefined}
                  onBusy={setBusy}
                  beforeGenerate={async () => {
                    const issues = generationErrors(snapshot);
                    if (issues.length)
                      throw new Error(
                        `Complete antes de gerar: ${issues.join("; ")}.`,
                      );
                    return dirty || !doc.id ? await save(true) : doc.id;
                  }}
                  onGenerated={(updated_at) => {
                    setDoc((d) => ({ ...d, updated_at, status: "generated" }));
                    setMessage(
                      "Documento salvo e PDF registrado no histórico.",
                    );
                  }}
                />
              </>
            )}
            {error && (
              <p role="alert" className="notice error">
                {error}
              </p>
            )}
            {message && message !== "Alterações não salvas" && (
              <p role="status" className="muted">
                {message}
              </p>
            )}
            <div className="editor-controls">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => save()}
              >
                {busy ? "Salvando…" : "Salvar rascunho"}
              </button>
              {step < 3 && (
                <button
                  disabled={busy || quickPatient}
                  className="button"
                  onClick={() => setStep(3)}
                >
                  Revisar documento →
                </button>
              )}
            </div>
          </fieldset>
        </section>
        <section className="preview-panel editor-preview-panel">
          <div className="section-heading">
            <h2>Prévia do documento</h2>
            <span className="badge">{base.branding.paper}</span>
          </div>
          <p className="muted">
            Visualize as páginas com o mesmo layout do PDF final. Seu rascunho
            permanece aberto.
          </p>
          <DocumentPreview snapshot={snapshot} />
        </section>
      </div>
    </>
  );
}
