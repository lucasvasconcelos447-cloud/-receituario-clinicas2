import { context } from "@/lib/context";
import { snapshot } from "@/lib/snapshot";
import { Shell } from "@/components/shell";
import { visualLibrary } from "@/lib/visual-library";
import { BrandingForm } from "@/components/branding-form";
export default async function Branding() {
  const { organization } = await context();
  const [base, library] = await Promise.all([snapshot(), visualLibrary()]);
  return (
    <Shell name={organization.name} active="/personalizar">
      <span className="eyebrow">A IDENTIDADE DO SEU CUIDADO</span>
      <h1>Modelos visuais e identidade</h1>
      <p className="lead">
        Escolha um layout e salve o padrão dos próximos documentos.
      </p>
      <BrandingForm snapshot={base} library={library} />
    </Shell>
  );
}
