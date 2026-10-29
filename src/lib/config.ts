export const APP = {
  name: "Receituário",
  description: "Seu cuidado, bem documentado.",
  timezone: "America/Manaus",
};
export const TYPES = {
  receituario: "Receituário",
  exames: "Solicitação de exames",
  orientacoes: "Orientações de cuidados",
} as const;
export type DocType = keyof typeof TYPES;
export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP.timezone }).format(
    new Date(),
  );
}
export function brDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.split("-").reverse().join("/")
    : new Intl.DateTimeFormat("pt-BR", {
        timeZone: APP.timezone,
        dateStyle: "short",
      }).format(new Date(value));
}
