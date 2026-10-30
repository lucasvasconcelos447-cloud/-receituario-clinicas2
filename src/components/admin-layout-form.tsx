"use client";
import { useActionState } from "react";
import { saveLibraryLayout } from "@/app/administracao/actions";
import { DESIGNS } from "@/lib/document-designs";
import type { VisualTemplate } from "@/lib/visual-library";
export function AdminLayoutForm({
  initial,
  available,
}: {
  initial?: VisualTemplate;
  available?: string[];
}) {
  const [state, action, pending] = useActionState(saveLibraryLayout, {});
  return (
    <form action={action} className="card stack admin-layout-form">
      <h3>{initial ? initial.name : "Cadastrar layout implementado"}</h3>
      {initial ? (
        <>
          <input type="hidden" name="id" value={initial.id} />
          <img
            src={initial.thumbnail}
            alt={`Miniatura de ${initial.name}`}
            width="140"
            height="198"
          />
        </>
      ) : (
        <label>
          Layout implementado
          <select name="id" required>
            {DESIGNS.filter((d) => available?.includes(d.id)).map((d) => (
              <option value={d.id} key={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Nome na biblioteca
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={initial?.name}
        />
      </label>
      <label>
        Descrição
        <input
          name="description"
          maxLength={250}
          defaultValue={initial?.description || ""}
        />
      </label>
      <label>
        Ordem de exibição
        <input
          name="sort_order"
          type="number"
          min="0"
          max="10000"
          defaultValue={initial?.sort_order ?? 40}
        />
      </label>
      <label>
        Miniatura do layout real
        <input
          name="thumbnail"
          type="file"
          accept="image/png,image/jpeg,image/webp"
        />
      </label>
      <small>
        Envie a imagem da folha real, até 2 MB. Uma referência visual precisa
        ser adaptada e implementada antes de ser disponibilizada.
      </small>
      {initial && (
        <label className="check">
          <input type="checkbox" name="reset_thumbnail" />
          Usar a miniatura original do PDF
        </label>
      )}
      <label className="check">
        <input
          type="checkbox"
          name="published"
          defaultChecked={initial?.published ?? false}
        />
        Publicado na biblioteca dos profissionais
      </label>
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
      <button className="button" disabled={pending}>
        {pending ? "Salvando…" : initial ? "Salvar modelo" : "Cadastrar modelo"}
      </button>
    </form>
  );
}
