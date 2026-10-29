import test from "node:test";
import assert from "node:assert/strict";
import {
  documentSchema,
  patientSchema,
  generationErrors,
} from "../src/lib/validation";
import { brDate } from "../src/lib/config";
import { fixture } from "./fixture";
import fs from "node:fs";
test("Brazilian date-only values do not shift day", () =>
  assert.equal(brDate("2026-10-29"), "29/10/2026"));
test("reject malformed and impossible document dates", () => {
  const s = fixture();
  assert.equal(
    documentSchema.safeParse({ ...s.document, issue_date: "2026-02-31" })
      .success,
    false,
  );
});
test("draft permits incomplete content but PDF does not", () => {
  const s = fixture();
  s.document!.content = "";
  assert.ok(documentSchema.safeParse(s.document).success);
  assert.ok(generationErrors(s).includes("Conteúdo do documento"));
});
test("medication mode requires patient, protocol and professional fields", () => {
  const s = fixture();
  s.document!.medication_mode = true;
  s.document!.clinical_reviewed = false;
  s.patient!.birth_date = null;
  assert.ok(generationErrors(s).length >= 3);
});
test("blank validates fixed professional fields without accessing patient", () => {
  const s = fixture();
  s.blank = true;
  s.document = null;
  s.patient = null;
  assert.deepEqual(generationErrors(s), []);
});
test("uploads and patient inputs have bounded fields", () => {
  assert.equal(
    patientSchema.safeParse({ ...fixture().patient, name: "x".repeat(251) })
      .success,
    false,
  );
});
test("service worker only caches explicit public resources", () => {
  const sw = fs.readFileSync("public/sw.js", "utf8");
  assert.ok(!sw.includes("cache.put"));
  assert.ok(!sw.includes("c.put"));
  assert.ok(sw.includes("if(PUBLIC.includes(url.pathname))"));
  assert.ok(!sw.includes("supabase"));
});
import { sameOrigin } from "../src/lib/request-origin";
test("PDF origin validates real host and port, rejects malformed and cross-origin requests", () => {
  const req = (origin: string, host = "127.0.0.1:3020") => ({
    headers: new Headers({ origin, host }),
  });
  assert.equal(sameOrigin(req("http://127.0.0.1:3020")), true);
  assert.equal(sameOrigin(req("http://127.0.0.1:3000")), false);
  assert.equal(sameOrigin(req("https://example.invalid")), false);
  assert.equal(sameOrigin(req("null")), false);
  assert.equal(sameOrigin(req("not-a-url")), false);
});
