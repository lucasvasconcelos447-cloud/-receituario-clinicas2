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
export function PdfDocument({ snapshot: s }: { snapshot: Snapshot }) {
  const {
    organization: o,
    professional: p,
    branding: b,
    document: d,
    patient,
  } = s;
  const a5 = b.paper === "A5";
  const margin = a5 ? 30 : 44;
  const family = b.font === "classica" ? "NotoSerif" : "NotoSans";
  const headerHeight = a5 ? 150 : 165;
  const pageWidth = a5 ? 419.53 : 595.28;
  const pageHeight = a5 ? 595.28 : 841.89;
  const med = Boolean(d?.medication_mode);
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
          paddingBottom: 100,
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
            borderBottomWidth: b.template === "classico" ? 2 : 1,
            borderBottomColor: b.primary_color,
            paddingBottom: 10,
            alignItems: b.template === "classico" ? "center" : "flex-start",
          }}
        >
          {s.logoData && (
            <Image
              src={s.logoData}
              style={{
                width: Math.min(b.logo_width, a5 ? 95 : 130),
                height: 42,
                objectFit: "contain",
                marginBottom: 4,
              }}
            />
          )}
          <Text
            style={{
              color: b.primary_color,
              fontSize: a5 ? 13 : 17,
              fontWeight: 700,
            }}
          >
            {o.name}
          </Text>
          {b.phrase && (
            <Text style={{ fontSize: 7.5, color: "#58635f" }}>{b.phrase}</Text>
          )}
          <Text style={{ fontSize: 8, marginTop: 4 }}>
            {p.name} · {p.category} · {p.council} {p.registration}/{p.state}
          </Text>
          {!s.blank && (
            <Text style={{ fontSize: 7, marginTop: 4 }}>
              Paciente: {patient?.name} · Emissão:{" "}
              {d ? brDate(d.issue_date) : ""}
            </Text>
          )}
        </View>
        {b.template === "floral" && (
          <Svg
            fixed
            width={40}
            height={65}
            style={{ position: "absolute", top: 30, right: margin }}
            viewBox="0 0 40 65"
          >
            <Path
              d="M20 60 Q5 35 25 5 M17 44 Q0 42 6 29 Q19 30 17 44 M18 29 Q36 28 32 16 Q19 18 18 29 M22 15 Q8 11 14 2 Q25 4 22 15"
              stroke={b.secondary_color}
              strokeWidth={1.1}
              fill="none"
            />
          </Svg>
        )}
        <View
          fixed
          style={{
            position: "absolute",
            top: pageHeight - 72,
            left: margin,
            width: pageWidth - 2 * margin,
            height: 50,
            borderTopWidth: 1,
            borderTopColor: b.secondary_color,
            paddingTop: 7,
            fontSize: 6.5,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {b.show_address && (
            <Text>
              {[o.address, o.city, o.state].filter(Boolean).join(" · ")}
            </Text>
          )}
          {b.show_contact && (
            <Text>{[o.phone, o.email].filter(Boolean).join(" · ")}</Text>
          )}
        </View>
        <Text
          style={{
            fontSize: a5 ? 15 : 19,
            color: b.primary_color,
            fontWeight: 700,
            marginBottom: 15,
          }}
        >
          {d ? TYPES[d.type] : "Receituário"}
        </Text>
        <View style={{ marginBottom: 15, fontSize: a5 ? 8 : 9 }} wrap={false}>
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
          <View style={{ height: a5 ? 125 : 370 }}>
            {b.ruled &&
              Array.from({ length: a5 ? 5 : 15 }, (_, i) => (
                <View
                  key={i}
                  style={{
                    height: 24,
                    borderBottomWidth: 0.4,
                    borderBottomColor: "#d7d9d5",
                  }}
                />
              ))}
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
  const rendered = await renderToBuffer(
    <PdfDocument snapshot={safeSnapshot} />,
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
