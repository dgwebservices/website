import { ZodError, z } from "zod";
import { SITE_ORIGIN } from "@/content/site";
import { contactSchema } from "@/lib/contact-schema";
import { allowedOrigin, CONTACT_BODY_LIMIT, hashValue, isFastSubmission, publicContactPayload, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, SECURITY_RETENTION_MS } from "@/lib/contact-security";

export const dynamic = "force-dynamic";

type RuntimeEnv = {
  DB?: D1Database;
  APP_ENVIRONMENT?: string;
  CONTACT_DELIVERY_ENDPOINT?: string;
  CONTACT_DELIVERY_TOKEN?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
};

const deliveryConfig = z.object({
  endpoint: z.string().url(),
  token: z.string().min(10),
  to: z.string().email(),
  from: z.string().email(),
});

function json(status: number, body: object, requestId: string) {
  return Response.json({ ...body, requestId }, { status, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}

async function reserveSecurityState(db: D1Database, ip: string, idempotencyKey: string, now: number) {
  const fingerprint = await hashValue(`${new Date(now).toISOString().slice(0, 10)}:${ip}`);
  const keyHash = await hashValue(idempotencyKey);
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  const rate = await db.prepare(`
    INSERT INTO contact_rate_limits (fingerprint, window_started_at, attempts)
    VALUES (?1, ?2, 1)
    ON CONFLICT(fingerprint, window_started_at)
    DO UPDATE SET attempts = attempts + 1
    RETURNING attempts
  `).bind(fingerprint, windowStart).first<{ attempts: number }>();
  if (!rate || rate.attempts > RATE_LIMIT_MAX) return { ok: false as const, reason: "rate" as const, keyHash };

  const reservation = await db.prepare("INSERT OR IGNORE INTO contact_idempotency (key_hash, created_at) VALUES (?1, ?2)").bind(keyHash, now).run();
  if ((reservation.meta?.changes ?? 0) !== 1) return { ok: false as const, reason: "duplicate" as const, keyHash };

  void db.batch([
    db.prepare("DELETE FROM contact_rate_limits WHERE window_started_at < ?1").bind(now - SECURITY_RETENTION_MS),
    db.prepare("DELETE FROM contact_idempotency WHERE created_at < ?1").bind(now - SECURITY_RETENTION_MS),
  ]);
  return { ok: true as const, keyHash };
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const runtime = (globalThis as typeof globalThis & { __DG_RUNTIME_ENV__?: RuntimeEnv }).__DG_RUNTIME_ENV__ ?? {};
  const contentType = request.headers.get("content-type")?.split(";", 1)[0];
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (contentType !== "application/json" || declaredLength > CONTACT_BODY_LIMIT) return json(400, { code: "invalid_request", message: "De aanvraag heeft geen geldige vorm." }, requestId);
  if (!allowedOrigin(request, SITE_ORIGIN)) return json(400, { code: "invalid_origin", message: "De aanvraag kon vanaf deze pagina niet worden geverifieerd." }, requestId);

  let raw: string;
  try {
    raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > CONTACT_BODY_LIMIT) throw new Error("body_limit");
  } catch {
    return json(400, { code: "invalid_request", message: "De aanvraag is te groot of onleesbaar." }, requestId);
  }

  try {
    const input = contactSchema.parse(JSON.parse(raw));
    if (input.website) return json(201, { ok: true, message: "Je aanvraag is ontvangen." }, requestId);
    if (isFastSubmission(input.startedAt)) return json(422, { code: "submission_too_fast", message: "Controleer je invoer en probeer het opnieuw." }, requestId);
    if (!runtime.DB) return json(503, { code: "security_unavailable", message: "Het formulier is tijdelijk niet beschikbaar. Mail je aanvraag rechtstreeks." }, requestId);

    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? "unknown";
    const reservation = await reserveSecurityState(runtime.DB, ip, input.idempotencyKey, Date.now());
    if (!reservation.ok && reservation.reason === "rate") return json(429, { code: "rate_limited", message: "Er zijn meerdere aanvragen verstuurd. Probeer het later opnieuw of stuur rechtstreeks een e-mail." }, requestId);
    if (!reservation.ok) return json(409, { code: "duplicate", message: "Deze aanvraag is al verwerkt. Controleer of je de ontvangstbevestiging hebt gezien." }, requestId);

    const config = deliveryConfig.safeParse({ endpoint: runtime.CONTACT_DELIVERY_ENDPOINT, token: runtime.CONTACT_DELIVERY_TOKEN, to: runtime.CONTACT_TO_EMAIL, from: runtime.CONTACT_FROM_EMAIL });
    if (!config.success) {
      await runtime.DB.prepare("DELETE FROM contact_idempotency WHERE key_hash = ?1").bind(reservation.keyHash).run();
      return json(503, { code: "delivery_unavailable", message: "Het formulier is tijdelijk niet beschikbaar. Mail je aanvraag rechtstreeks." }, requestId);
    }

    const delivered = await fetch(config.data.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${config.data.token}`, "idempotency-key": input.idempotencyKey },
      body: JSON.stringify({ to: config.data.to, from: config.data.from, subject: `Nieuwe projectaanvraag — ${input.projectType}`, data: publicContactPayload(input, requestId) }),
    });
    if (!delivered.ok) {
      await runtime.DB.prepare("DELETE FROM contact_idempotency WHERE key_hash = ?1").bind(reservation.keyHash).run();
      return json(503, { code: "delivery_failed", message: "Je aanvraag kon niet worden afgeleverd. Probeer het later opnieuw of stuur rechtstreeks een e-mail." }, requestId);
    }
    return json(201, { ok: true, message: "Je aanvraag is ontvangen." }, requestId);
  } catch (error) {
    if (error instanceof ZodError) {
      return json(422, { code: "validation_failed", message: "Controleer de gemarkeerde velden.", errors: error.flatten().fieldErrors }, requestId);
    }
    return json(400, { code: "invalid_json", message: "De aanvraag heeft geen geldige vorm." }, requestId);
  }
}

export function GET() {
  const requestId = crypto.randomUUID();
  return json(405, { code: "method_not_allowed", message: "Gebruik het contactformulier om een aanvraag te versturen." }, requestId);
}
