"use client";
import { useActionState, useState } from "react";
import { saveBranding } from "@/app/actions";
import { Feedback } from "./forms";
import { DocumentPreview } from "./document-preview";
import { FileActions } from "./file-actions";
import type { Snapshot } from "@/lib/types";
export function BrandingForm({ snapshot: s }: { snapshot: Snapshot }) {
  const [state, action, pending] = useActionState(saveBranding, {});
  const [preview, setPreview] = useState(s);
  const b = preview.branding;
  function change(key: string, value: unknown) {
    setPreview((p) => ({ ...p, branding: { ...p.branding, [key]: value } }));
  }
  return (
    <>
      <div className="branding-grid">
        <form
          action={action}
          className="stack"
          onChange={(e) => {
            const el = e.target as HTMLInputElement;
            if (el.name in b && el.type !== "file")
              change(
                el.name,
                el.type === "checkbox"
                  ? el.checked
                  : el.name === "logo_width"
                    ? Number(el.value)
                    : el.value,
              );
          }}
        >
          <section className="card">
            <h2>Identidade visual</h2>
            <label>
              Logotipo da clínica
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 2 * 1024 * 1024) {
                    e.target.setCustomValidity("Envie uma imagem de até 2 MB.");
                    return;
                  }
                  e.target.setCustomValidity("");
                  const reader = new FileReader();
                  reader.onload = () =>
                    setPreview((p) => ({
                      ...p,
                      logoData: String(reader.result),
                    }));
                  reader.readAsDataURL(f);
                  const bitmap = await createImageBitmap(f);
                  if (bitmap.width < 600)
                    alert(
                      "A logo tem menos de 600 pixels de largura. Confira com a gráfica se a resolução é suficiente.",
                    );
                  bitmap.close();
                }}
              />
            </label>
            <p className="muted">
              PNG, JPEG ou WebP, até 2 MB. A proporção será preservada.
            </p>
            <label className="check">
              <input
                type="checkbox"
                name="remove_logo"
                onChange={(e) =>
                  e.target.checked &&
                  setPreview((p) => ({ ...p, logoData: null }))
                }
              />
              Remover logotipo ao salvar
            </label>
            <label>
              Tamanho do logotipo: {b.logo_width} pt
              <input
                name="logo_width"
                type="range"
                min="35"
                max="130"
                value={b.logo_width}
                onChange={(e) => change("logo_width", Number(e.target.value))}
              />
            </label>
            <div className="form-grid">
              <label>
                Cor principal
                <input
                  name="primary_color"
                  type="color"
                  defaultValue={b.primary_color}
                />
              </label>
              <label>
                Cor secundária
                <input
                  name="secondary_color"
                  type="color"
                  defaultValue={b.secondary_color}
                />
              </label>
            </div>
          </section>
          <section className="card">
            <h2>Composição do documento</h2>
            <label>
              Modelo visual
              <select name="template" defaultValue={b.template}>
                <option value="minimalista">
                  Minimalista · linhas discretas
                </option>
                <option value="classico">Clássico · composição elegante</option>
                <option value="floral">Floral suave · ramos originais</option>
              </select>
            </label>
            <div className="form-grid">
              <label>
                Papel
                <select name="paper" defaultValue={b.paper}>
                  <option>A4</option>
                  <option>A5</option>
                </select>
              </label>
              <label>
                Tipografia
                <select name="font" defaultValue={b.font}>
                  <option value="classica">Clássica · com serifa</option>
                  <option value="moderna">Moderna · sem serifa</option>
                </select>
              </label>
            </div>
            <label>
              Frase institucional (deixe vazia para ocultar)
              <input name="phrase" maxLength={180} defaultValue={b.phrase} />
            </label>
            <label className="check">
              <input
                name="show_address"
                type="checkbox"
                defaultChecked={b.show_address}
              />
              Mostrar endereço no rodapé
            </label>
            <label className="check">
              <input
                name="show_contact"
                type="checkbox"
                defaultChecked={b.show_contact}
              />
              Mostrar contatos no rodapé
            </label>
            <label className="check">
              <input name="ruled" type="checkbox" defaultChecked={b.ruled} />
              Pautas no receituário em branco
            </label>
          </section>
          <Feedback state={state} />
          <button className="button" disabled={pending}>
            {pending ? "Salvando identidade…" : "Salvar identidade"}
          </button>
        </form>
        <section className="preview-panel">
          <div className="section-heading">
            <h2>Seu documento, do seu jeito</h2>
            <span className="badge">Prévia ilustrativa</span>
          </div>
          <p className="muted">
            Role ou amplie no aparelho. A paginação final é conferida no PDF.
          </p>
          <DocumentPreview
            snapshot={{
              ...preview,
              blank: false,
              patient: {
                id: "fiction",
                name: "Paciente Exemplo · fictício",
                birth_date: "1990-01-15",
                phone: "",
                identifier: "",
                address: "Endereço fictício",
                sex: "",
              },
              document: {
                id: "fiction",
                patient_id: "fiction",
                type: "orientacoes",
                title: "Orientações · exemplo fictício",
                content:
                  "Este espaço receberá o conteúdo escrito e revisado por você.\n\nNenhuma orientação clínica é sugerida pelo sistema.",
                issue_date: "2026-10-29",
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
            }}
            fictitious
          />
        </section>
      </div>
      <section className="card" id="papel">
        <h2>Receituário em branco para impressão</h2>
        <p>
          Salve a identidade acima antes de gerar. O arquivo contém apenas dados
          fixos e campos vazios, sem dados de pacientes.
        </p>
        <FileActions key={JSON.stringify(s.branding)} blank />
        <p className="muted">
          A4 (210 × 297 mm) ou A5 (148 × 210 mm). Sem sangria ou marcas de corte
          nesta versão. Não é PDF/X ou CMYK. Confirme os requisitos de produção
          com sua gráfica.
        </p>
      </section>
    </>
  );
}
