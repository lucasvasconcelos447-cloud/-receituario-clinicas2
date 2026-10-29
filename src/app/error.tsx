"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="center">
      <div className="card">
        <h1>Não foi possível carregar esta página</h1>
        <p>
          Confira a conexão e tente novamente. Nenhum salvamento foi confirmado.
        </p>
        <button className="button" onClick={reset}>
          Tentar novamente
        </button>
        <a href="/">Voltar ao início</a>
      </div>
    </main>
  );
}
