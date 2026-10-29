import { session } from "@/lib/context";
import { OrganizationForm } from "@/components/forms";
import { redirect } from "next/navigation";
export default async function Setup() {
  const { client, user } = await session();
  const { data } = await client
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (data) redirect("/");
  return (
    <main className="center">
      <section className="card narrow">
        <span className="eyebrow">PRIMEIRO PASSO</span>
        <h1>Um espaço para seu cuidado.</h1>
        <p>
          Comece pelo nome. Depois você configura a identidade e os dados
          profissionais.
        </p>
        <OrganizationForm />
      </section>
    </main>
  );
}
