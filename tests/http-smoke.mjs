import assert from "node:assert/strict";
const base = process.env.TEST_APP_URL || "http://127.0.0.1:3010";
for (const route of [
  "/",
  "/pacientes",
  "/documentos",
  "/perfil",
  "/novo",
  "/personalizar",
]) {
  const r = await fetch(base + route, { redirect: "manual" });
  if (r.status === 307) {
    assert.equal(r.headers.get("location"), "/entrar", route);
  } else {
    assert.equal(r.status, 200);
    const html = await r.text();
    assert.ok(
      html.includes("NEXT_REDIRECT") && html.includes("/entrar"),
      route + " deve redirecionar sem renderizar dados",
    );
    assert.ok(!html.includes("Documentos recentes"));
  }
  console.log(route, "sem sessão → entrar");
}
const login = await fetch(base + "/entrar");
assert.equal(login.status, 200);
assert.ok((await login.text()).includes("Entrar no meu espaço"));
const manifest = await (await fetch(base + "/manifest.webmanifest")).json();
assert.equal(manifest.display, "standalone");
assert.ok(manifest.icons.some((i) => i.purpose === "maskable"));
const file = await fetch(
  base + "/api/files/00000000-0000-4000-8000-000000000000",
);
assert.equal(file.status, 401);
const foreign = await fetch(base + "/api/pdf", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: "https://example.invalid",
  },
  body: "{}",
});
assert.equal(foreign.status, 403);
const pdf = await fetch(base + "/api/pdf", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: base },
  body: "{}",
});
assert.equal(pdf.status, 401);
assert.match(login.headers.get("cache-control"), /no-store/);
console.log(
  "Entrada, manifest, rotas protegidas, APIs sem sessão, origem externa e no-store: OK",
);
