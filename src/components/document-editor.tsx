"use client";
import { useEffect, useRef, useState } from "react";
import { saveDocument } from "@/app/actions";
import { DocumentPreview } from "./document-preview";
import { FileActions } from "./file-actions";
import { TYPES, type DocType, today } from "@/lib/config";
import type { Snapshot, Patient, ClinicalDocument } from "@/lib/types";
export function DocumentEditor({
  base,
  patients,
  templates,
  initial,
  patientId,
  type = "receituario",
}: {
  base: Snapshot;
  patients: Patient[];
  templates: { id: string; name: string; type: string; content: string }[];
  initial?: ClinicalDocument;
  patientId?: string;
  type?: DocType;
}) {
  const [doc, setDoc] = useState<ClinicalDocument>(
    initial || {
      id: "",
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
  const [step, setStep] = useState(0);
  const [savedRevision, setSavedRevision] = useState(0);
  const [dirty, setDirty] = useState(!initial?.id);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const revision = useRef(0);
  const snapshot = {
    ...base,
    document: doc,
    patient: patients.find((p) => p.id === doc.patient_id) || null,
    blank: false,
  };
  function change<K extends keyof ClinicalDocument>(
    key: K,
    value: ClinicalDocument[K],
  ) {
    revision.current++;
    setDirty(true);
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
  async function save() {
    setBusy(true);
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
      setBusy(false);
    }
    if (result.error) {
      setError(result.error);
      return;
    }
    setDoc((d) => ({ ...d, id: result.id!, updated_at: result.updated_at! }));
    if (revision.current === savedRevision) {
      setDirty(false);
      setSavedRevision((v) => v + 1);
      setMessage("Rascunho salvo no servidor.");
    } else setMessage("Há novas alterações não salvas.");
    if (!doc.id) history.replaceState(null, "", `/documentos/${result.id}`);
  }
  return (
    <>
      <div className="editor-top">
        <div className="steps">
          {["Tipo", "Paciente", "Conteúdo", "Revisão"].map((s, i) => (
            <button
              className={step === i ? "current" : ""}
              onClick={() => setStep(i)}
              key={s}
            >
              <span>{i + 1}</span>
              {s}
            </button>
          ))}
        </div>
        <span className="save-state" role="status">
          {busy
            ? "Salvando…"
            : dirty
              ? "● Alterações não salvas"
              : message || "Rascunho carregado"}
        </span>
      </div>
      <div className="editor-grid">
        <section className="card editor-fields">
          {step === 0 && (
            <>
              <span className="eyebrow">01 · COMECE POR AQUI</span>
              <h2>Qual documento você precisa?</h2>
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
          {step === 1 && (
            <>
              <span className="eyebrow">02 · PARA QUEM É O CUIDADO?</span>
              <h2>Selecione o paciente</h2>
              <label>
                Paciente
                <select
                  value={doc.patient_id || ""}
                  onChange={(e) => change("patient_id", e.target.value || null)}
                >
                  <option value="">Selecione</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <a href="/pacientes" target="_blank" rel="noopener">
                Cadastrar ou editar paciente em outra aba ↗
              </a>
              <p className="muted">
                Depois de cadastrar, salve este rascunho e reabra para atualizar
                a lista.
              </p>
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
          {step === 2 && (
            <>
              <span className="eyebrow">03 · SUAS PALAVRAS</span>
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
                {doc.content.length.toLocaleString("pt-BR")} / 40.000 caracteres
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
                Confira paciente, data, texto e dados profissionais. O PDF final
                terá paginação automática.
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
              {dirty ? (
                <p>Salve as alterações para habilitar a geração.</p>
              ) : (
                doc.id && (
                  <FileActions
                    key={savedRevision}
                    documentId={doc.id}
                    onGenerated={(updated_at) =>
                      setDoc((d) => ({ ...d, updated_at, status: "generated" }))
                    }
                  />
                )
              )}
            </>
          )}
          {error && (
            <p role="alert" className="notice error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="muted">
              {message}
            </p>
          )}
          <div className="editor-controls">
            <button className="button secondary" disabled={busy} onClick={save}>
              {busy ? "Salvando…" : "Salvar rascunho"}
            </button>
            {step < 3 && (
              <button className="button" onClick={() => setStep(step + 1)}>
                Continuar →
              </button>
            )}
          </div>
        </section>
        <section className="preview-panel">
          <div className="section-heading">
            <h2>Prévia do documento</h2>
            <span className="badge">{base.branding.paper}</span>
          </div>
          <p className="muted">
            Prévia contínua. Confira as páginas no PDF antes de imprimir.
          </p>
          <DocumentPreview snapshot={snapshot} />
        </section>
      </div>
    </>
  );
}
