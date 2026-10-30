export const DESIGNS = [
  {
    id: "minimalista",
    name: "Minimalista",
    description: "Branco, respiro e linhas discretas.",
  },
  {
    id: "classico",
    name: "Clássico",
    description: "Serifa elegante e detalhes sóbrios.",
  },
  {
    id: "botanico",
    name: "Botânico",
    description: "Ramos desenhados nos cantos da folha.",
  },
  {
    id: "floral",
    name: "Floral suave",
    description: "Pétalas delicadas e traços leves.",
  },
  {
    id: "geometrico",
    name: "Geométrico",
    description: "Formas sutis, desenho contemporâneo.",
  },
  {
    id: "institucional",
    name: "Institucional",
    description: "Composição objetiva e profissional.",
  },
] as const;
export type DesignId = (typeof DESIGNS)[number]["id"];
// Keep headings readable on white paper, including when a very pale brand color is chosen.
export function documentInk(hex: string) {
  const channels = [1, 3, 5].map(
    (start) => parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  const luminance = channels
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  return 1.05 / (luminance + 0.05) >= 4.5 ? hex : "#303c36";
}
// Original vector drawings. Confined to the outer 22 pt margin, never the text area.
export const ARTWORK = {
  botanico: [
    "M 4 90 Q 20 48 12 4 M 12 26 Q 1 22 3 12 Q 16 13 12 26 M 13 44 Q 28 37 24 24 Q 11 29 13 44 M 10 62 Q 0 54 2 42 Q 16 46 10 62 M 7 76 Q 24 66 23 52 Q 9 57 7 76",
  ],
  floral: [
    "M 5 94 Q 19 62 12 33 M 13 49 Q 1 44 3 35 Q 16 36 13 49 M 12 66 Q 28 61 24 49 Q 12 53 12 66",
    "M 12 30 C -2 32 -3 18 7 19 C 0 7 11 1 15 12 C 24 2 32 13 22 19 C 35 23 25 35 17 28 C 17 40 6 39 12 30 M 13 21 L 16 21",
  ],
  geometrico: [
    "M 3 3 L 23 3 L 23 23 L 3 23 Z M 3 34 L 23 54 L 3 74 Z M 5 85 L 21 85",
  ],
  classico: ["M 5 35 L 5 5 L 25 5 M 9 25 L 9 9 L 21 9"],
  institucional: ["M 4 5 L 4 65 M 10 5 L 10 35"],
  minimalista: [],
} satisfies Record<DesignId, string[]>;
