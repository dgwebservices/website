import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

test("publishes exactly eight valid, mutually linked services", async () => {
  const { services, getService } = await vite.ssrLoadModule("/content/services.ts");
  assert.equal(services.length, 8);
  assert.equal(new Set(services.map((service) => service.slug)).size, 8);
  for (const service of services) {
    assert.match(service.number, /^0[1-8]$/);
    assert.ok(service.h1.length > 12);
    assert.ok(service.metaDescription.length > 70);
    assert.ok(service.capabilities.length >= 8);
    assert.ok(service.relatedServiceSlugs.length >= 3);
    assert.ok(service.relatedServiceSlugs.every((slug) => getService(slug)));
    assert.ok(service.faq.length >= 3);
  }
});

test("contact schema normalizes valid data and rejects unknown keys", async () => {
  const { contactSchema } = await vite.ssrLoadModule("/lib/contact-schema.ts");
  const base = { name: "  Test Persoon  ", organisation: "", email: "TEST@EXAMPLE.COM", phone: "", projectType: "website", primaryGoal: "meer-aanvragen", message: "Dit is een veilige testaanvraag zonder echte persoonsgegevens.", privacyAccepted: true, website: "", startedAt: Date.now() - 5000, idempotencyKey: crypto.randomUUID() };
  const parsed = contactSchema.parse(base);
  assert.equal(parsed.name, "Test Persoon");
  assert.equal(parsed.email, "test@example.com");
  assert.equal(contactSchema.safeParse({ ...base, unexpected: "field" }).success, false);
  assert.equal(contactSchema.safeParse({ ...base, message: "te kort" }).success, false);
  assert.equal(contactSchema.safeParse({ ...base, privacyAccepted: false }).success, false);
});

test("official logo masters retain their exact hashes", async () => {
  const expected = new Map([
    ["DG-Webservices-Combined-Light-Mode-8192-1.svg", "7bf0719807c29d44a26ce4cee76fb0d37957c0f972d90c891e99e39ae3cb0766"],
    ["DG-Webservices-Combined-Dark-Mode-8192.svg", "7206731cb11e1736e03d13bce6f3d72e2988c36ec10fbd0b1ba32a8cfecf63f3"],
    ["DG-Webservices-Icon-Light-Mode-8192.svg", "c6ea07a4ba0d1e9f42962199843a8af81349647b22a175eaf73554af9cadbc7e"],
    ["DG-Webservices-Icon-Dark-Mode-8192.svg", "e105e9a1705b941af7f98db3b02aa806e1753de342eb3b201c3ce87ffa0367d9"],
  ]);
  for (const [file, digest] of expected) {
    const bytes = await readFile(path.join(root, "public/brand", file));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), digest, file);
  }
});

test("generated brand derivatives are current and correctly sized", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, "docs/brand-derivatives.json"), "utf8"));
  const dimensions = Object.fromEntries(manifest.map((item) => [item.path, [item.width, item.height]]));
  assert.deepEqual(dimensions["public/social/dg-webservices.png"], [1200, 630]);
  assert.deepEqual(dimensions["public/icons/maskable-512.png"], [512, 512]);
  assert.deepEqual(dimensions["public/icons/apple-touch-icon.png"], [180, 180]);
  for (const item of manifest) {
    const bytes = await readFile(path.join(root, item.path));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), item.sha256, item.path);
  }
});
