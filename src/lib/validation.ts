import { z } from "zod";
import type { Snapshot } from "./types";
const text = (max = 250) => z.string().trim().max(max, "Texto muito longo.");
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((s) => {
    const d = new Date(`${s}T12:00:00Z`);
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Data inválida.");
export const patientSchema = z.object({
  name: text().min(2, "Informe o nome completo."),
  birth_date: z
    .union([date, z.literal(""), z.null()])
    .transform((v) => v || null),
  phone: text(40),
  identifier: text(80),
  address: text(500),
  sex: text(40),
});
export const documentSchema = z.object({
  visual_template: z
    .enum([
      "minimalista",
      "classico",
      "floral",
      "botanico",
      "geometrico",
      "institucional",
    ])
    .nullable()
    .optional(),
  patient_id: z
    .union([z.uuid(), z.literal(""), z.null()])
    .transform((v) => v || null),
  type: z.enum(["receituario", "exames", "orientacoes"]),
  title: text(150).min(2, "Informe um título."),
  content: text(40000),
  issue_date: date,
  protocol: text(500),
  protocol_year: text(4).refine(
    (v) => v === "" || /^\d{4}$/.test(v),
    "Informe o ano com quatro dígitos.",
  ),
  protocol_institution: text(500),
  justification: text(4000),
  medication_mode: z.boolean(),
  clinical_reviewed: z.boolean(),
});
export const organizationSchema = z.object({
  name: text().min(2),
  legal_name: text(),
  cnpj: text(30),
  phone: text(40),
  email: z.union([z.email(), z.literal("")]),
  address: text(500),
  city: text(),
  state: text(2),
});
export const professionalSchema = z.object({
  name: text(),
  category: text(),
  council: text(30),
  registration: text(40),
  state: text(2),
  specialty: text(),
  identifier: text(80),
});
export const brandingSchema = z.object({
  primary_color: z.string().regex(/^#[0-9a-f]{6}$/i),
  secondary_color: z.string().regex(/^#[0-9a-f]{6}$/i),
  template: z.enum([
    "minimalista",
    "classico",
    "floral",
    "botanico",
    "geometrico",
    "institucional",
  ]),
  paper: z.enum(["A4", "A5"]),
  font: z.enum(["classica", "moderna"]),
  logo_width: z.coerce.number().int().min(35).max(130),
  ruled: z.boolean(),
  phrase: text(180),
  show_address: z.boolean(),
  show_contact: z.boolean(),
});
export const templateSchema = z.object({
  name: text().min(2),
  type: z.enum(["receituario", "exames", "orientacoes"]),
  content: text(40000).min(1),
});
export function generationErrors(s: Snapshot) {
  const errors: string[] = [];
  const { organization: o, professional: p, document: d, patient } = s;
  if (!o.name) errors.push("Nome do estabelecimento");
  if (!p.name || !p.category || !p.council || !p.registration || !p.state)
    errors.push("Nome, categoria, conselho, registro e UF da profissional");
  if (!s.blank) {
    if (!patient) errors.push("Paciente");
    if (!d?.clinical_reviewed)
      errors.push("Confirmação da revisão profissional");
    if (!d?.content.trim()) errors.push("Conteúdo do documento");
    if (d?.medication_mode) {
      if (d.type !== "receituario")
        errors.push("Prescrição disponível apenas no receituário simples");
      if (!o.cnpj || !o.address || !o.phone || !o.email || !o.city || !o.state)
        errors.push("CNPJ, endereço, cidade, UF e contatos do estabelecimento");
      if (!d.protocol || !d.protocol_year || !d.protocol_institution)
        errors.push("Protocolo, ano e instituição que o aprovou");
      if (!patient?.birth_date || !patient?.address || !patient?.sex)
        errors.push("Data de nascimento, sexo e endereço do paciente");
      if (!p.identifier) errors.push("CPF da profissional");
    }
  }
  return errors;
}
