import { AuthForm } from "@/components/auth-form";
export default function Password() {
  return (
    <main className="center">
      <section className="card narrow">
        <h1>Definir nova senha</h1>
        <AuthForm reset />
      </section>
    </main>
  );
}
