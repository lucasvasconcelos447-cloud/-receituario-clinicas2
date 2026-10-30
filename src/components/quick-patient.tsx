"use client";
import { useState } from "react";
import { savePatient } from "@/app/actions";
import type { Patient } from "@/lib/types";
export function QuickPatient({
  onSaved,
  onClose,
}: {
  onSaved: (patient: Patient) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="quick-patient stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const result = await savePatient({}, new FormData(e.currentTarget));
          if (result.error || !result.patient) {
            setError(result.error || "Paciente não confirmado.");
            return;
          }
          onSaved(result.patient);
        } catch {
          setError(
            "Não foi possível confirmar o cadastro. Confira sua conexão e tente novamente.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>Novo paciente</h3>
      <label>
        Nome completo
        <input
          name="name"
          required
          minLength={2}
          maxLength={250}
          autoComplete="off"
          autoFocus
        />
      </label>
      <div className="form-grid">
        <label>
          Nascimento
          <input name="birth_date" type="date" />
        </label>
        <label>
          Telefone
          <input name="phone" type="tel" maxLength={40} />
        </label>
      </div>
      <details>
        <summary>Mais dados do paciente</summary>
        <div className="stack">
          <label>
            Identificação
            <input name="identifier" maxLength={80} />
          </label>
          <label>
            Endereço
            <input name="address" maxLength={500} />
          </label>
          <label>
            Sexo
            <input name="sex" maxLength={40} />
          </label>
        </div>
      </details>
      <p className="muted">
        Nascimento, endereço e sexo também serão exigidos ao emitir uma
        prescrição de medicamentos por enfermagem.
      </p>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <div className="action-row">
        <button type="submit" className="button" disabled={busy}>
          {busy ? "Cadastrando…" : "Cadastrar e selecionar"}
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={onClose}
          disabled={busy}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
