import "server-only";
import { context } from "./context";
import type {
  Snapshot,
  Branding,
  Professional,
  Patient,
  ClinicalDocument,
} from "./types";
export async function snapshot(documentId?: string): Promise<Snapshot> {
  const { client, organization } = await context();
  const [{ data: professional, error: pe }, { data: branding, error: be }] =
    await Promise.all([
      client
        .from("professional_profiles")
        .select("*")
        .eq("organization_id", organization.id)
        .single(),
      client
        .from("document_branding")
        .select("*")
        .eq("organization_id", organization.id)
        .single(),
    ]);
  if (pe || be) throw new Error("Não foi possível carregar a identidade.");
  let document: ClinicalDocument | null = null;
  let patient: Patient | null = null;
  if (documentId) {
    const { data, error } = await client
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("organization_id", organization.id)
      .single();
    if (error) throw new Error("Documento não encontrado.");
    document = data;
    const { data: person, error: personError } = await client
      .from("patients")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("id", document!.patient_id)
      .single();
    if (personError) throw new Error("Selecione um paciente válido.");
    patient = person;
  }
  let logoData: string | null = null;
  if (branding.logo_path) {
    if (!branding.logo_path.startsWith(`${organization.id}/logos/`))
      throw new Error("Logotipo inválido.");
    const { data, error } = await client.storage
      .from("clinical-private")
      .download(branding.logo_path);
    if (error) throw new Error("Não foi possível carregar o logotipo.");
    logoData = `data:image/png;base64,${Buffer.from(await data.arrayBuffer()).toString("base64")}`;
  }
  return {
    organization,
    professional: professional as Professional,
    branding: branding as Branding,
    document,
    patient,
    logoData,
    blank: !documentId,
  };
}
