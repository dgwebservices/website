import type { ContactInput } from "./contact-schema";

export const CONTACT_BODY_LIMIT = 16_384;
export const MINIMUM_FILL_TIME_MS = 2_000;
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1_000;
export const SECURITY_RETENTION_MS = 24 * 60 * 60 * 1_000;

export function allowedOrigin(request: Request, canonicalOrigin: string) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const requestUrl = new URL(request.url);
    const canonical = new URL(canonicalOrigin);
    if (parsed.origin === canonical.origin && parsed.protocol === "https:") return true;
    if (parsed.origin === requestUrl.origin && parsed.protocol === "https:") return true;
    return parsed.hostname === "localhost" && requestUrl.hostname === "localhost" && canonical.hostname !== "localhost";
  } catch {
    return false;
  }
}

export function isFastSubmission(startedAt: number, now = Date.now()) {
  return now - startedAt < MINIMUM_FILL_TIME_MS || startedAt > now;
}

export function publicContactPayload(input: ContactInput, requestId: string) {
  return {
    requestId,
    name: input.name,
    organisation: input.organisation || undefined,
    email: input.email,
    phone: input.phone || undefined,
    projectType: input.projectType,
    primaryGoal: input.primaryGoal,
    message: input.message,
  };
}

export async function hashValue(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
