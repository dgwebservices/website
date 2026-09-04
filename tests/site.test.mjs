import assert from "node:assert/strict";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const executionContext = { waitUntil() {}, passThroughOnException() {} };
const runtime = { ASSETS: { fetch: async () => new Response("Niet gevonden", { status: 404 }) }, APP_ENVIRONMENT: "development", ALLOW_INDEXING: "false" };

async function request(path, init) {
  return worker.fetch(new Request(new URL(path, "https://www.dgwebservices.nl"), init), runtime, executionContext);
}

const indexableRoutes = ["/", "/diensten", "/diensten/websites", "/diensten/webapplicaties", "/diensten/portalen", "/diensten/backoffice", "/diensten/koppelingen", "/diensten/slimme-flows", "/diensten/schermcommunicatie", "/diensten/beheer-en-groei", "/mogelijkheden", "/werkwijze", "/over", "/contact"];

test("all phase-one content routes render unique server HTML", async () => {
  const titles = new Set();
  for (const route of indexableRoutes) {
    const response = await request(route, { headers: { accept: "text/html" } });
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i, route);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive", route);
    const html = await response.text();
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title, `${route} title`);
    assert.equal(titles.has(title), false, `duplicate title: ${title}`);
    titles.add(title);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${route} H1`);
    const canonical = new URL(route, "https://www.dgwebservices.nl").toString();
    const canonicalHref = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/)?.[1];
    assert.ok(canonicalHref, `${route} canonical`);
    assert.equal(new URL(canonicalHref).toString(), canonical, `${route} canonical target`);
    assert.doesNotMatch(html, /\[LAUNCH_BLOCKER|lorem ipsum|kunstmatige intelligentie/i, route);
  }
});

test("utility routes are noindex and unknown routes are true 404s", async () => {
  for (const route of ["/brand", "/bedankt"]) {
    const response = await request(route, { headers: { accept: "text/html" } });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i);
  }
  const missing = await request("/bestaat-niet", { headers: { accept: "text/html" } });
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /Deze pagina is niet gevonden/);
});

test("legacy service URL redirects permanently in one step", async () => {
  const response = await request("/diensten/beheer-en-doorontwikkeling", { redirect: "manual" });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://www.dgwebservices.nl/diensten/beheer-en-groei");
});

test("security headers are set on rendered responses", async () => {
  const response = await request("/");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/);
});

test("robots and sitemap keep the unapproved launch out of the index", async () => {
  const robots = await request("/robots.txt");
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Disallow:\s*\//);
  const sitemap = await request("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  assert.doesNotMatch(await sitemap.text(), /<url>/);
});

test("contact endpoint validates shape, origin, timing and missing delivery safely", async () => {
  const wrongType = await request("/api/contact", { method: "POST", headers: { origin: "https://www.dgwebservices.nl", "content-type": "text/plain" }, body: "{}" });
  assert.equal(wrongType.status, 400);

  const base = { name: "Test Persoon", organisation: "", email: "test@example.com", phone: "", projectType: "website", primaryGoal: "meer-aanvragen", message: "Dit is een veilige testaanvraag zonder echte persoonsgegevens.", privacyAccepted: true, website: "", startedAt: Date.now() - 5000, idempotencyKey: crypto.randomUUID() };
  const invalidOrigin = await request("/api/contact", { method: "POST", headers: { origin: "https://voorbeeld.invalid", "content-type": "application/json" }, body: JSON.stringify(base) });
  assert.equal(invalidOrigin.status, 400);

  const invalid = await request("/api/contact", { method: "POST", headers: { origin: "https://www.dgwebservices.nl", "content-type": "application/json" }, body: JSON.stringify({ ...base, message: "te kort" }) });
  assert.equal(invalid.status, 422);

  const unavailable = await request("/api/contact", { method: "POST", headers: { origin: "https://www.dgwebservices.nl", "content-type": "application/json" }, body: JSON.stringify(base) });
  assert.equal(unavailable.status, 503);
  assert.match((await unavailable.json()).message, /tijdelijk niet beschikbaar/i);
  assert.equal(unavailable.headers.get("cache-control"), "no-store");
});
