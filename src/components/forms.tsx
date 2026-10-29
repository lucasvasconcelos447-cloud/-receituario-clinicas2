"use client";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  savePatient,
  saveTemplate,
  saveProfile,
  createOrganization,
  removeTemplate,
  type Result,
} from "@/app/actions";
import { TYPES } from "@/lib/config";
import type { Patient, Organization, Professional } from "@/lib/types";
export function Feedback({ state }: { state: Result }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="notice error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="notice">
          {state.success}
        </p>
      )}
    </>
  );
}
export function Field({
  label,
  name,
  value = "",
  type = "text",
  required = false,
  maxLength = 250,
}: {
  label: string;
  name: string;
  value?: string | null;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        defaultValue={value || ""}
        type={type}
        required={required}
        maxLength={maxLength}
      />
    </label>
  );
}
export function OrganizationForm() {
  const [state, action, pending] = useActionState(createOrganization, {});
  return (
    <form action={action} className="stack">
      <Field
        label="Nome da clínica ou nome profissional"
        name="name"
        required
      />
      <Feedback state={state} />
      <button className="button" disabled={pending}>
        {pending ? "Criando…" : "Criar meu espaço"}
      </button>
      <p className="muted">
        Os demais dados podem ser preenchidos depois, antes de gerar um PDF.
      </p>
    </form>
  );
}
export function PatientForm({ patient }: { patient?: Patient }) {
  const [state, action, pending] = useActionState(savePatient, {});
  return (
    <form action={action} className="stack">
      <input name="id" type="hidden" value={patient?.id || ""} />
      <Field label="Nome completo" name="name" value={patient?.name} required />
      <div className="form-grid">
        <Field
          label="Data de nascimento"
          name="birth_date"
          type="date"
          value={patient?.birth_date}
        />
        <Field
          label="Telefone (opcional)"
          name="phone"
          value={patient?.phone}
          maxLength={40}
        />
        <Field
          label="Identificador adicional (quando necessário)"
          name="identifier"
          value={patient?.identifier}
          maxLength={80}
        />
        <Field
          label="Sexo (para prescrição de medicamentos)"
          name="sex"
          value={patient?.sex}
          maxLength={40}
        />
      </div>
      <Field
        label="Endereço completo (para prescrição de medicamentos)"
        name="address"
        value={patient?.address}
        maxLength={500}
      />
      <Feedback state={state} />
      <button className="button" disabled={pending}>
        {pending ? "Salvando…" : "Salvar paciente"}
      </button>
      {state.id && (
        <a href={`/pacientes/${state.id}`}>Abrir cadastro e documentos →</a>
      )}
    </form>
  );
}
export function TemplateForm({
  template,
}: {
  template?: { id: string; name: string; type: string; content: string };
}) {
  const [state, action, pending] = useActionState(saveTemplate, {});
  return (
    <form action={action} className="stack">
      <input type="hidden" name="id" value={template?.id || ""} />
      <Field
        label="Nome do modelo"
        name="name"
        value={template?.name}
        required
      />
      <label>
        Tipo de documento
        <select name="type" defaultValue={template?.type || "orientacoes"}>
          {Object.entries(TYPES).map(([key, label]) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Seu texto
        <textarea
          name="content"
          defaultValue={template?.content}
          required
          rows={7}
          maxLength={40000}
        />
      </label>
      <Feedback state={state} />
      <button className="button" disabled={pending}>
        {pending ? "Salvando…" : "Salvar modelo"}
      </button>
    </form>
  );
}
export function DeleteTemplate({ id }: { id: string }) {
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <>
      <button
        className="danger"
        onClick={async () => {
          if (
            !confirm(
              "Excluir este modelo de texto? Documentos já criados serão preservados.",
            )
          )
            return;
          const result = await removeTemplate(id);
          if (result.error) setError(result.error);
          else router.refresh();
        }}
      >
        Excluir modelo
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
export function ProfileForm({
  organization: o,
  professional: p,
}: {
  organization: Organization;
  professional: Professional;
}) {
  const [state, action, pending] = useActionState(saveProfile, {});
  return (
    <form action={action} className="stack">
      <section className="card">
        <h2>Seu estabelecimento</h2>
        <p className="muted">
          Informações fixas que podem acompanhar os documentos.
        </p>
        <div className="form-grid">
          <Field
            label="Nome de exibição"
            name="org_name"
            value={o.name}
            required
          />
          <Field
            label="Nome empresarial (se aplicável)"
            name="org_legal_name"
            value={o.legal_name}
          />
          <Field
            label="CNPJ (se aplicável)"
            name="org_cnpj"
            value={o.cnpj}
            maxLength={30}
          />
          <Field
            label="Telefone comercial"
            name="org_phone"
            value={o.phone}
            maxLength={40}
          />
          <Field
            label="E-mail comercial"
            name="org_email"
            value={o.email}
            type="email"
          />
          <Field
            label="Endereço"
            name="org_address"
            value={o.address}
            maxLength={500}
          />
          <Field label="Cidade" name="org_city" value={o.city} />
          <Field label="UF" name="org_state" value={o.state} maxLength={2} />
        </div>
      </section>
      <section className="card">
        <h2>Identificação profissional</h2>
        <p className="muted">
          Cadastro declaratório. Não corresponde a uma verificação de
          habilitação.
        </p>
        <div className="form-grid">
          <Field label="Nome completo" name="pro_name" value={p.name} />
          <Field
            label="Categoria e inscrição (ex.: Enfermeira · ENF)"
            name="pro_category"
            value={p.category}
          />
          <Field
            label="Conselho"
            name="pro_council"
            value={p.council}
            maxLength={30}
          />
          <Field
            label="Número de registro"
            name="pro_registration"
            value={p.registration}
            maxLength={40}
          />
          <Field
            label="UF do registro"
            name="pro_state"
            value={p.state}
            maxLength={2}
          />
          <Field
            label="Especialidade (opcional)"
            name="pro_specialty"
            value={p.specialty}
          />
          <Field
            label="CPF (necessário para prescrição de enfermagem)"
            name="pro_identifier"
            value={p.identifier}
            maxLength={80}
          />
        </div>
      </section>
      <Feedback state={state} />
      <button className="button" disabled={pending}>
        {pending ? "Salvando…" : "Salvar dados profissionais"}
      </button>
      <a href="/personalizar">Personalizar meus documentos →</a>
    </form>
  );
}
