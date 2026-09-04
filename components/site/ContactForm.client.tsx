"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { primaryGoalLabels, primaryGoals, projectTypeLabels, projectTypes } from "@/lib/contact-schema";
import { siteConfig } from "@/content/site";

type FormErrors = Record<string, string[]>;

export function ContactForm({ initialProject, initialGoal }: { initialProject?: string; initialGoal?: string }) {
  const startedAt = useRef(0);
  const idempotencyKey = useRef("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const validProject = projectTypes.includes(initialProject as (typeof projectTypes)[number]) ? initialProject : "nog-niet-zeker";
  const validGoal = primaryGoals.includes(initialGoal as (typeof primaryGoals)[number]) ? initialGoal : "anders";
  useEffect(() => {
    startedAt.current = Date.now();
    idempotencyKey.current = crypto.randomUUID();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    setErrors({});
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const payload = { ...data, privacyAccepted: data.privacyAccepted === "true", startedAt: startedAt.current, idempotencyKey: idempotencyKey.current };
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as { message?: string; errors?: FormErrors };
      if (response.ok) {
        window.location.assign("/bedankt");
        return;
      }
      setErrors(body.errors ?? {});
      setMessage(body.message ?? "Je aanvraag kon niet worden verstuurd. Probeer het later opnieuw.");
      setStatus("error");
      requestAnimationFrame(() => summaryRef.current?.focus());
    } catch {
      setMessage("Er is geen verbinding. Je invoer is bewaard; probeer het opnieuw zodra je online bent.");
      setStatus("error");
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  }

  const fieldError = (name: string) => errors[name]?.[0];
  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      {status === "error" && <div ref={summaryRef} tabIndex={-1} className="form-summary" role="alert"><h2>Controleer je aanvraag</h2><p>{message}</p>{Object.entries(errors).length > 0 && <ul>{Object.entries(errors).map(([field, fieldErrors]) => <li key={field}><a href={`#${field}`}>{fieldErrors[0]}</a></li>)}</ul>}<p>Je kunt ook rechtstreeks mailen naar <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.</p></div>}
      <div className="form-grid">
        <div className="field"><label htmlFor="name">Naam <span aria-hidden="true">*</span></label><input id="name" name="name" autoComplete="name" required maxLength={100} aria-invalid={Boolean(fieldError("name"))} aria-describedby={fieldError("name") ? "name-error" : undefined} />{fieldError("name") && <p id="name-error" className="field-error">{fieldError("name")}</p>}</div>
        <div className="field"><label htmlFor="organisation">Organisatie <span>optioneel</span></label><input id="organisation" name="organisation" autoComplete="organization" maxLength={120} /></div>
        <div className="field"><label htmlFor="email">E-mailadres <span aria-hidden="true">*</span></label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(fieldError("email"))} aria-describedby={fieldError("email") ? "email-error" : undefined} />{fieldError("email") && <p id="email-error" className="field-error">{fieldError("email")}</p>}</div>
        <div className="field"><label htmlFor="phone">Telefoon <span>optioneel</span></label><input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} /></div>
        <div className="field"><label htmlFor="projectType">Type vraag <span aria-hidden="true">*</span></label><select id="projectType" name="projectType" required defaultValue={validProject}>{projectTypes.map((option) => <option key={option} value={option}>{projectTypeLabels[option]}</option>)}</select></div>
        <div className="field"><label htmlFor="primaryGoal">Belangrijkste doel <span aria-hidden="true">*</span></label><select id="primaryGoal" name="primaryGoal" required defaultValue={validGoal}>{primaryGoals.map((option) => <option key={option} value={option}>{primaryGoalLabels[option]}</option>)}</select></div>
      </div>
      <div className="field"><label htmlFor="message">Wat wil je bereiken? <span aria-hidden="true">*</span></label><textarea id="message" name="message" rows={7} required minLength={20} maxLength={4000} aria-invalid={Boolean(fieldError("message"))} aria-describedby={fieldError("message") ? "message-error" : "message-help"} /><p id="message-help" className="field-help">Beschrijf de huidige situatie, gewenste uitkomst en belangrijke randvoorwaarden.</p>{fieldError("message") && <p id="message-error" className="field-error">{fieldError("message")}</p>}</div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <label className="privacy-check"><input type="checkbox" name="privacyAccepted" value="true" required /> <span>Ik begrijp dat mijn gegevens worden gebruikt om deze aanvraag te beoordelen en contact met mij op te nemen. <a href="#privacy-uitleg">Lees de verwerkingstoelichting</a>.</span></label>
      <button className="button button-primary" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Aanvraag versturen…" : "Verstuur je aanvraag"}</button>
      <p className="form-status" aria-live="polite">{status === "submitting" ? "Je aanvraag wordt veilig verwerkt." : ""}</p>
    </form>
  );
}
