import fs from "node:fs/promises";
import sharp from "sharp";
import { generatePdf } from "../src/lib/pdf/document";
import { DESIGNS } from "../src/lib/document-designs";
import { fixture } from "../tests/fixture";
await fs.mkdir("work/gallery-qa", { recursive: true });
const variants = [
  "short",
  "long",
  "blank",
  "wide",
  "portrait",
  "square",
  "sparse",
] as const;
for (const design of DESIGNS)
  for (const paper of ["A4", "A5"] as const)
    for (const variant of variants) {
      const s = fixture();
      s.branding.template = design.id;
      s.branding.paper = paper;
      s.branding.font = ["classico", "floral"].includes(design.id)
        ? "classica"
        : "moderna";
      s.organization.name = "Clínica Exemplo";
      s.professional.name = "Profissional Exemplo";
      s.patient!.name = "Paciente Exemplo · fictício";
      s.document!.title = "Conteúdo escrito pela profissional";
      s.document!.type =
        variant === "wide"
          ? "exames"
          : variant === "portrait"
            ? "orientacoes"
            : "receituario";
      s.document!.content =
        "Este espaço recebe o conteúdo escrito e revisado por você.\n\nUm documento com leitura clara, margens confortáveis e sua identidade em cada detalhe.";
      if (variant === "blank") s.blank = true;
      if (variant === "long")
        s.document!.content = Array.from(
          { length: 90 },
          (_, i) =>
            `${i + 1}. Texto fictício de teste com acentuação: saúde, atenção, João. Verificação da paginação e preservação das margens do documento. Nenhuma recomendação clínica é sugerida.`,
        ).join("\n");
      if (
        variant === "wide" ||
        variant === "portrait" ||
        variant === "square"
      ) {
        const [w, h] =
          variant === "wide"
            ? [1200, 200]
            : variant === "square"
              ? [600, 600]
              : [200, 1000];
        const png = await sharp({
          create: { width: w, height: h, channels: 4, background: "#285c4d" },
        })
          .png()
          .toBuffer();
        s.logoData = `data:image/png;base64,${png.toString("base64")}`;
        s.branding.logo_width = 130;
        s.branding.phrase = "";
      }
      if (variant === "sparse") {
        s.branding.phrase = "";
        s.branding.show_address = false;
        s.branding.show_contact = false;
        s.branding.primary_color = "#ffffff";
        s.organization.cnpj = "";
        s.logoData = null;
      }
      const filename = `${design.id}-${paper}-${variant}.pdf`;
      await fs.writeFile(`work/gallery-qa/${filename}`, await generatePdf(s));
      console.log(filename);
    }
