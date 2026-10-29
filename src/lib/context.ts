import "server-only";
import { redirect } from "next/navigation";
import { db, configured } from "./supabase/server";
export async function session() {
  if (!configured()) redirect("/entrar");
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/entrar");
  return { client, user };
}
export async function context() {
  const { client, user } = await session();
  const { data: organization, error } = await client
    .from("organizations")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar seu espaço.");
  if (!organization) redirect("/configurar");
  return { client, user, organization };
}
