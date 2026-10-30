"use client";
import { useActionState, useState } from "react";
import { saveBranding } from "@/app/actions";
import { Feedback } from "./forms";
import { DocumentPreview } from "./document-preview";
import { FileActions } from "./file-actions";
import type { VisualTemplate } from "@/lib/visual-library";
import type { Snapshot, Branding } from "@/lib/types";
export function BrandingForm({
  snapshot: s,
  library,
}: {
  snapshot: Snapshot;
  library: VisualTemplate[];
}) {
  const [state, action, pending] = useActionState(saveBranding, {});
  const [preview, setPreview] = useState(s);
  const [logoError, setLogoError] = useState("");
  const b = preview.branding;
  function change<K extends keyof Branding>(key: K, value: Branding[K]) {
    setPreview((p) => ({ ...p, branding: { ...p.branding, [key]: value } }));
  }
  const example: Snapshot = {
    ...preview,
    blank: false,
    patient: null,
    document: {
      id: "",
      patient_id: null,
      type: "receituario",
      title: "Prescrição · exemplo de composição",
      content:
        "Este espaço recebe o conteúdo escrito e revisado por você.\n\nA composição preserva a leitura, as margens e o espaço para assinatura.",
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
  };
  return (
    <div className="stack">
      <form action={action} className="stack">
        <section className="card visual-gallery-section">
          <div className="section-heading">
            <h2>Modelos visuais</h2>
            <a href="/modelos">Modelos de texto →</a>
          </div>
          <p className="muted">
            Escolha a composição da folha. As miniaturas são PDFs reais com
            dados fictícios. Os modelos de texto guardam o conteúdo que você
            costuma escrever.
          </p>
          <input type="hidden" name="template" value={b.template} />
          <div className="visual-gallery">
            {library.map((design) => (
              <article
                key={design.id}
                className={`visual-model ${b.template === design.id ? "selected" : ""}`}
              >
                <img
                  src={design.thumbnail}
                  alt={`Folha completa do modelo ${design.name}`}
                  width="300"
                  height="424"
                  loading="lazy"
                />
                <h3>{design.name}</h3>
                <p>{design.description}</p>
                <DocumentPreview
                  snapshot={{
                    ...example,
                    branding: { ...b, template: design.id },
                  }}
                  fictitious
                />
                <button
                  type="button"
                  className={
                    b.template === design.id ? "button" : "button secondary"
                  }
                  aria-pressed={b.template === design.id}
                  onClick={() => {
                    change("template", design.id);
                    if (design.id === "classico") change("font", "classica");
                  }}
                >
                  {b.template === design.id
                    ? "Modelo selecionado ✓"
                    : "Usar este modelo"}
                </button>
              </article>
            ))}
          </div>
          <p>
            Após escolher, salve o modelo padrão abaixo. A escolha será usada
            nos próximos documentos. PDFs anteriores permanecem preservados.
          </p>
        </section>
        <div className="branding-grid">
          <section className="card stack">
            <h2>Logo e cores</h2>
            <label>
              Logotipo da clínica
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const input = e.currentTarget,
                    file = input.files?.[0];
                  if (!file) return;
                  setLogoError("");
                  if (file.size > 2 * 1024 * 1024) {
                    input.setCustomValidity("Envie uma imagem de até 2 MB.");
                    setLogoError("Envie uma imagem de até 2 MB.");
                    return;
                  }
                  input.setCustomValidity("");
                  try {
                    const bitmap = await createImageBitmap(file);
                    bitmap.close();
                    const reader = new FileReader();
                    reader.onload = () =>
                      setPreview((p) => ({
                        ...p,
                        logoData: String(reader.result),
                      }));
                    reader.readAsDataURL(file);
                  } catch {
                    input.setCustomValidity(
                      "Escolha uma imagem PNG, JPEG ou WebP válida.",
                    );
                    setLogoError("Não foi possível ler a imagem.");
                  }
                }}
              />
            </label>
            <small>
              PNG, JPEG ou WebP, até 2 MB. Logo centralizada, com proporção
              preservada.
            </small>
            {logoError && (
              <p role="alert" className="notice error">
                {logoError}
              </p>
            )}
            <label className="check">
              <input
                type="checkbox"
                name="remove_logo"
                onChange={(e) =>
                  setPreview((p) => ({
                    ...p,
                    logoData: e.target.checked ? null : s.logoData,
                  }))
                }
              />
              Remover logotipo ao salvar
            </label>
            <label>
              Tamanho da logo: {b.logo_width} pt
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
                  value={b.primary_color}
                  onChange={(e) => change("primary_color", e.target.value)}
                />
              </label>
              <label>
                Cor dos detalhes
                <input
                  name="secondary_color"
                  type="color"
                  value={b.secondary_color}
                  onChange={(e) => change("secondary_color", e.target.value)}
                />
              </label>
            </div>
          </section>
          <section className="card stack">
            <h2>Papel e rodapé</h2>
            <div className="form-grid">
              <label>
                Papel
                <select
                  name="paper"
                  value={b.paper}
                  onChange={(e) =>
                    change("paper", e.target.value as Branding["paper"])
                  }
                >
                  <option>A4</option>
                  <option>A5</option>
                </select>
              </label>
              <label>
                Tipografia
                <select
                  name="font"
                  value={b.font}
                  onChange={(e) =>
                    change("font", e.target.value as Branding["font"])
                  }
                >
                  <option value="classica">Clássica · com serifa</option>
                  <option value="moderna">Moderna · sem serifa</option>
                </select>
              </label>
            </div>
            <label>
              Frase opcional no rodapé
              <input
                name="phrase"
                maxLength={180}
                value={b.phrase}
                onChange={(e) => change("phrase", e.target.value)}
                placeholder="Deixe vazio para ocultar"
              />
            </label>
            <label className="check">
              <input
                name="show_address"
                type="checkbox"
                checked={b.show_address}
                onChange={(e) => change("show_address", e.target.checked)}
              />
              Mostrar endereço
            </label>
            <label className="check">
              <input
                name="show_contact"
                type="checkbox"
                checked={b.show_contact}
                onChange={(e) => change("show_contact", e.target.checked)}
              />
              Mostrar contatos
            </label>
            <label className="check">
              <input
                name="ruled"
                type="checkbox"
                checked={b.ruled}
                onChange={(e) => change("ruled", e.target.checked)}
              />
              Pautas no receituário em branco
            </label>
            <p className="muted">
              Nome, registro, especialidade, endereço e contatos vêm do{" "}
              <a href="/perfil">perfil profissional</a>.
            </p>
            <p className="muted">
              Fundo branco em todos os modelos para economizar tinta. Confira
              suas cores também em preto e branco na impressão.
            </p>
            <DocumentPreview snapshot={example} fictitious />
          </section>
        </div>
        <Feedback state={state} />
        <button className="button" disabled={pending}>
          {pending
            ? "Salvando identidade…"
            : "Salvar modelo padrão e identidade"}
        </button>
      </form>
      <section className="card" id="papel">
        <h2>Receituário em branco para impressão</h2>
        <p>
          Salve a identidade antes de gerar. O arquivo contém apenas dados fixos
          e campos vazios.
        </p>
        <FileActions key={JSON.stringify(s.branding)} blank />
        <p className="muted">
          A4 (210 × 297 mm) ou A5 (148 × 210 mm). Sem sangria ou marcas de
          corte. Confirme os requisitos de produção com sua gráfica.
        </p>
      </section>
    </div>
  );
}
