"use server";
import { db, configured } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
export type AuthState = { error?: string; success?: string };
export async function authenticate(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  if (!configured())
    return {
      error: "Configure a conexão Supabase no servidor para acessar sua conta.",
    };
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const mode = String(form.get("mode"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && mode !== "update")
    return { error: "Informe um e-mail válido." };
  const client = await db();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (await headers()).get("origin") ||
    "http://localhost:3000";
  if (mode === "recover") {
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/nova-senha`,
    });
    return error
      ? {
          error:
            "Não foi possível solicitar a recuperação. Tente novamente mais tarde.",
        }
      : {
          success:
            "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.",
        };
  }
  if (password.length < 10)
    return { error: "Use uma senha com pelo menos 10 caracteres." };
  if (mode === "signup") {
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error)
      return {
        error:
          "Não foi possível criar a conta. Confira os dados ou tente recuperar a senha.",
      };
    return {
      success:
        "Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre.",
    };
  }
  if (mode === "update") {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user)
      return { error: "Link expirado. Solicite uma nova recuperação." };
    const { error } = await client.auth.updateUser({ password });
    if (error) return { error: "Não foi possível atualizar a senha." };
    await client.auth.signOut();
    redirect("/entrar?message=senha");
  }
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error)
    return {
      error: "E-mail ou senha incorretos, ou confirmação de e-mail pendente.",
    };
  redirect("/");
}
export async function signout() {
  const client = await db();
  await client.auth.signOut();
  redirect("/entrar");
}
