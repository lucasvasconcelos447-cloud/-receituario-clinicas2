import fs from "node:fs/promises";
import { generatePdf } from "../src/lib/pdf/document";
import { fixture } from "../tests/fixture";
await fs.mkdir("work/pdf-qa", { recursive: true });
for (const paper of ["A4", "A5"] as const) {
  for (const mode of ["short", "long", "blank"] as const) {
    const s = fixture();
    s.branding.paper = paper;
    if (mode === "long")
      s.document!.content = Array.from(
        { length: 100 },
        (_, i) =>
          `${i + 1}. Texto fictício para verificar paginação, acentuação e preservação de margens. A profissional escreve e revisa todo o conteúdo. Nenhuma recomendação clínica é gerada.`,
      ).join("\n");
    if (mode === "blank") {
      s.blank = true;
      // Deliberately retain fictitious patient data: export must discard it.
    }
    await fs.writeFile(
      `work/pdf-qa/${paper}-${mode}.pdf`,
      await generatePdf(s),
    );
  }
}
console.log("6 PDFs de teste gerados com dados fictícios.");
