import { context } from "@/lib/context";
import { Shell } from "@/components/shell";
import { ProfileForm } from "@/components/forms";
export default async function Profile() {
  const { client, organization } = await context();
  const { data, error } = await client
    .from("professional_profiles")
    .select("*")
    .eq("organization_id", organization.id)
    .single();
  if (error) throw error;
  return (
    <Shell name={organization.name} active="/perfil">
      <span className="eyebrow">SEU ESPAÇO</span>
      <h1>Perfil profissional</h1>
      <p className="lead">
        Uma vez preenchido, pronto para acompanhar seus documentos.
      </p>
      <ProfileForm organization={organization} professional={data} />
    </Shell>
  );
}
