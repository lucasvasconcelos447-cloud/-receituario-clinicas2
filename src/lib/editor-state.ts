import type { ClinicalDocument } from "./types";
export function draftKey(doc: ClinicalDocument) {
  const { id, status, updated_at, created_at, ...editable } = doc;
  void id;
  void status;
  void updated_at;
  void created_at;
  return JSON.stringify(editable);
}
