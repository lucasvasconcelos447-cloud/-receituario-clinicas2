import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  Svg,
  Path,
  renderToBuffer,
} from "@react-pdf/renderer";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Snapshot } from "../types";
import { TYPES, brDate } from "../config";
import { ARTWORK, documentInk } from "../document-designs";
import sharp from "sharp";
Font.register({
  family: "NotoSans",
  fonts: [
    { src: path.join(process.cwd(), "assets/fonts/NotoSans-Regular.ttf") },
    {
      src: path.join(process.cwd(), "assets/fonts/NotoSans-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});
Font.register({
  family: "NotoSerif",
  fonts: [
    { src: path.join(process.cwd(), "assets/fonts/NotoSerif-Regular.ttf") },
    {
      src: path.join(process.cwd(), "assets/fonts/NotoSerif-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});
Font.registerHyphenationCallback((word) =>
  word.length > 28 ? word.match(/.{1,18}/gu) || [word] : [word],
);
export function PdfDocument({
  snapshot: s,
  logoAspect = 1,
}: {
  snapshot: Snapshot;
  logoAspect?: number;
}) {
  const {
    organization: o,
    professional: p,
    branding: b,
    document: d,
    patient,
  } = s;
  const ink = documentInk(b.primary_color);
  const a5 = b.paper === "A5";
  const margin = a5 ? 30 : 44;
  const family = b.font === "classica" ? "NotoSerif" : "NotoSans";
  const pageWidth = a5 ? 419.53 : 595.28;
  const pageHeight = a5 ? 595.28 : 841.89;
  const med = Boolean(d?.medication_mode);
  const textWidth = pageWidth - 2 * margin;
  const headingSize = a5 ? 12 : 16;
  const lines = (text: string, size: number) =>
    Math.max(1, Math.ceil(text.length / (textWidth / (size * 0.65))));
  const professionalLine = [
    p.name,
    p.category,
    `${p.council} ${p.registration}/${p.state}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const patientLine = !s.blank
    ? `Paciente: ${patient?.name || "Selecione um paciente"} · Emissão: ${d ? brDate(d.issue_date) : ""}`
    : "";
  const logoWidth = s.logoData ? Math.min(b.logo_width, 48 * logoAspect) : 0;
  const logoHeight = s.logoData ? Math.min(48, b.logo_width / logoAspect) : 0;
  const headerHeight =
    28 +
    (s.logoData ? logoHeight + 6 : 0) +
    lines(o.name, headingSize) * headingSize * 1.3 +
    8 +
    lines(professionalLine, 7.5) * 10 +
    (patientLine ? 5 + lines(patientLine, 7) * 9.1 : 0) +
    21;
  const footerLines = [
    b.phrase,
    o.cnpj ? `CNPJ: ${o.cnpj}` : "",
    b.show_address
      ? [o.address, o.city, o.state].filter(Boolean).join(" · ")
      : "",
    b.show_contact ? [o.phone, o.email].filter(Boolean).join(" · ") : "",
  ].filter(Boolean);
  const footerHeight =
    footerLines.reduce((sum, text) => sum + lines(text, 6.5) * 9, 0) + 10;
  return (
    <Document
      title={s.blank ? "Receituário em branco" : "Documento profissional"}
      author=""
      subject="Documento sem assinatura eletrônica"
      creator="Receituário"
    >
      <Page
        size={b.paper}
        style={{
          fontFamily: family,
          fontSize: a5 ? 9 : 10.5,
          paddingTop: headerHeight,
          paddingBottom: footerHeight + 52,
          backgroundColor: "#ffffff",
          paddingHorizontal: margin,
          color: "#252d2b",
          lineHeight: 1.55,
        }}
        wrap
      >
        <View
          fixed
          style={{
            position: "absolute",
            top: 25,
            left: margin,
            width: pageWidth - 2 * margin,
            borderBottomColor: b.primary_color,
            paddingBottom: 10,
            alignItems: "center",
            textAlign: "center",
            borderBottomWidth:
              b.template === "institucional"
                ? 3
                : b.template === "classico"
                  ? 1.5
                  : 0.5,
          }}
        >
          {s.logoData && (
            <Image
              src={s.logoData}
              style={{
                width: logoWidth,
                height: logoHeight,
                objectFit: "contain",
                marginBottom: 4,
              }}
            />
          )}
          <Text
            style={{
              color: ink,
              fontSize: headingSize,
              lineHeight: 1.3,
              marginBottom: 4,
              fontWeight: 700,
            }}
          >
            {o.name}
          </Text>
          <Text style={{ fontSize: 7.5, lineHeight: 1.3, marginTop: 4 }}>
            {professionalLine}
          </Text>
          {patientLine && (
            <Text style={{ fontSize: 7, lineHeight: 1.3, marginTop: 4 }}>
              {patientLine}
            </Text>
          )}
        </View>
        {ARTWORK[b.template].map((drawing, i) => (
          <React.Fragment key={i}>
            <Svg
              fixed
              width={22}
              height={82}
              viewBox="0 0 32 100"
              style={{ position: "absolute", top: 12, right: 3 }}
            >
              <Path
                d={drawing}
                stroke={b.secondary_color}
                strokeWidth={0.9}
                fill="none"
              />
            </Svg>
            <Svg
              fixed
              width={22}
              height={82}
              viewBox="0 0 32 100"
              style={{
                position: "absolute",
                bottom: 40,
                left: 3,
                transform: "rotate(180deg)",
              }}
            >
              <Path
                d={drawing}
                stroke={b.secondary_color}
                strokeWidth={0.9}
                fill="none"
              />
            </Svg>
          </React.Fragment>
        ))}
        <View
          fixed
          style={{
            position: "absolute",
            top: pageHeight - footerHeight - 36,
            left: margin,
            width: textWidth,
            borderTopWidth: b.template === "institucional" ? 2 : 0.5,
            borderTopColor: b.secondary_color,
            paddingTop: 7,
            fontSize: 6.5,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {footerLines.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </View>
        <Text
          style={{
            fontSize: a5 ? 15 : 19,
            color: ink,
            fontWeight: 700,
            marginBottom: 15,
            textAlign:
              b.template === "classico" || b.template === "floral"
                ? "center"
                : "left",
            letterSpacing: b.template === "classico" ? 1.4 : 0,
            borderLeftWidth: b.template === "geometrico" ? 3 : 0,
            borderLeftColor: b.secondary_color,
            borderBottomWidth: b.template === "institucional" ? 0.7 : 0,
            borderBottomColor: b.primary_color,
            paddingLeft: b.template === "geometrico" ? 10 : 0,
            paddingBottom: b.template === "institucional" ? 8 : 0,
          }}
        >
          {d ? TYPES[d.type] : "Receituário"}
        </Text>
        <View style={{ marginBottom: 15, fontSize: a5 ? 8 : 9 }}>
          <Text>
            Paciente:{" "}
            {s.blank
              ? "________________________________________________"
              : patient?.name}
          </Text>
          <Text>
            Nascimento:{" "}
            {s.blank
              ? "____/____/______"
              : patient?.birth_date
                ? brDate(patient.birth_date)
                : "Não informado"}{" "}
            Data: {s.blank ? "____/____/______" : d ? brDate(d.issue_date) : ""}
          </Text>
          {!s.blank && patient?.identifier && (
            <Text>Identificação: {patient.identifier}</Text>
          )}
          {med && (
            <>
              <Text>
                Sexo: {patient?.sex} · Endereço: {patient?.address}
              </Text>
              <Text>
                Instituição: {o.legal_name || o.name} · CNPJ: {o.cnpj}
              </Text>
              <Text>
                Protocolo: {d?.protocol} · Ano: {d?.protocol_year}
              </Text>
              <Text>
                Instituição/órgão que aprovou: {d?.protocol_institution}
              </Text>
            </>
          )}
        </View>
        {s.blank ? (
          <View
            style={{
              height: Math.max(
                40,
                pageHeight - headerHeight - footerHeight - 310,
              ),
            }}
          >
            {b.ruled &&
              Array.from(
                {
                  length: Math.max(
                    1,
                    Math.floor(
                      (pageHeight - headerHeight - footerHeight - 310) / 24,
                    ),
                  ),
                },
                (_, i) => (
                  <View
                    key={i}
                    style={{
                      height: 24,
                      borderBottomWidth: 0.4,
                      borderBottomColor: "#d7d9d5",
                    }}
                  />
                ),
              )}
          </View>
        ) : (
          <>
            <Text
              style={{ fontWeight: 700, marginBottom: 10 }}
              minPresenceAhead={30}
            >
              {d?.title}
            </Text>
            {d?.content.split("\n").map((paragraph, i) => (
              <Text key={i} orphans={3} widows={3} style={{ marginBottom: 6 }}>
                {paragraph || " "}
              </Text>
            ))}
            {d?.justification && (
              <Text style={{ marginTop: 12 }}>
                Justificativa / observações: {d.justification}
              </Text>
            )}
          </>
        )}
        <View
          wrap={false}
          style={{ marginTop: 35, alignItems: "center", paddingTop: 15 }}
        >
          <View
            style={{
              width: a5 ? 180 : 240,
              borderTopWidth: 0.6,
              borderTopColor: "#7b8580",
              marginBottom: 7,
            }}
          />
          <Text style={{ fontSize: 9, fontWeight: 700 }}>{p.name}</Text>
          <Text style={{ fontSize: 8 }}>
            {p.category} · {p.council} {p.registration}/{p.state}
          </Text>
          {p.specialty && <Text style={{ fontSize: 7 }}>{p.specialty}</Text>}
          {med && <Text style={{ fontSize: 7 }}>CPF: {p.identifier}</Text>}
          <Text style={{ fontSize: 7, color: "#5e6964" }}>
            Assinatura manual e carimbo
          </Text>
        </View>
      </Page>
    </Document>
  );
}
export async function generatePdf(snapshot: Snapshot) {
  const safeSnapshot = snapshot.blank
    ? { ...snapshot, patient: null, document: null }
    : snapshot;
  let logoAspect = 1;
  if (safeSnapshot.logoData) {
    const metadata = await sharp(
      Buffer.from(safeSnapshot.logoData.split(",")[1], "base64"),
    ).metadata();
    logoAspect = (metadata.width || 1) / (metadata.height || 1);
  }
  const rendered = await renderToBuffer(
    <PdfDocument snapshot={safeSnapshot} logoAspect={logoAspect} />,
  );
  const pdf = await PDFDocument.load(rendered);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  for (const [index, page] of pages.entries()) {
    const label = `Página ${index + 1} de ${pages.length} · Sem assinatura eletrônica`;
    const width = font.widthOfTextAtSize(label, 7);
    page.drawText(label, {
      x: (page.getWidth() - width) / 2,
      y: 22,
      size: 7,
      font,
      color: rgb(0.32, 0.38, 0.34),
    });
  }
  return Buffer.from(await pdf.save());
}
