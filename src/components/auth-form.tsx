"use client";
import { useActionState, useState } from "react";
import { authenticate } from "@/app/auth-actions";
export function AuthForm({ reset = false }: { reset?: boolean }) {
  const [mode, setMode] = useState(reset ? "update" : "login");
  const [state, action, pending] = useActionState(authenticate, {});
  return (
    <>
      <form action={action} className="stack">
        <input type="hidden" name="mode" value={mode} />
        {mode !== "update" && (
          <label>
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@clinica.com.br"
              required
            />
          </label>
        )}
        {mode !== "recover" && (
          <label>
            {reset ? "Nova senha" : "Senha"}
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={10}
              required
              placeholder="Pelo menos 10 caracteres"
            />
          </label>
        )}
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
          {pending
            ? "Aguarde…"
            : mode === "signup"
              ? "Criar minha conta"
              : mode === "recover"
                ? "Enviar instruções"
                : mode === "update"
                  ? "Salvar nova senha"
                  : "Entrar no meu espaço"}{" "}
          <span>→</span>
        </button>
      </form>
      {!reset && (
        <div className="auth-links">
          <button
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          >
            {mode === "signup" ? "Já tenho uma conta" : "Criar uma conta"}
          </button>
          <button
            onClick={() => setMode(mode === "recover" ? "login" : "recover")}
          >
            {mode === "recover" ? "Voltar para entrar" : "Esqueci minha senha"}
          </button>
        </div>
      )}
    </>
  );
}
