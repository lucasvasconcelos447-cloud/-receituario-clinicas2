import { context } from "@/lib/context";
import { snapshot } from "@/lib/snapshot";
import { Shell } from "@/components/shell";
import { BrandingForm } from "@/components/branding-form";
export default async function Branding() {
  const { organization } = await context();
  const base = await snapshot();
  return (
    <Shell name={organization.name} active="/personalizar">
      <span className="eyebrow">A IDENTIDADE DO SEU CUIDADO</span>
      <h1>Personalizar documentos</h1>
      <p className="lead">
        Escolha cada detalhe. Sua identidade fica no papel.
      </p>
      <BrandingForm snapshot={base} />
    </Shell>
  );
}
