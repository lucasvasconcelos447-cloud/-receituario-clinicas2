import { context } from "@/lib/context";
import { Shell } from "@/components/shell";
import { PatientForm } from "@/components/forms";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { client, organization } = await context();
  const [{ data: patient }, { data: documents, error }] = await Promise.all([
    client
      .from("patients")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("id", id)
      .maybeSingle(),
    client
      .from("documents")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("patient_id", id)
      .order("updated_at", { ascending: false }),
  ]);
  if (error) throw error;
  if (!patient) notFound();
  return (
    <Shell name={organization.name} active="/pacientes">
      <a href="/pacientes">← Pacientes</a>
      <h1>{patient.name}</h1>
      <div className="two-column">
        <section className="card">
          <h2>Dados cadastrais</h2>
          <PatientForm patient={patient} />
        </section>
        <section className="card">
          <h2>Documentos vinculados</h2>
          <DocumentList documents={documents || []} />
          <a className="button" href={`/novo?patient=${id}`}>
            Novo documento para este paciente
          </a>
        </section>
      </div>
    </Shell>
  );
}
