import { z } from "zod";

export const projectTypes = ["website", "webapplicatie", "portaal", "backoffice", "koppeling", "slimme-flow", "schermcommunicatie", "beheer-en-groei", "nog-niet-zeker"] as const;
export const primaryGoals = ["meer-aanvragen", "minder-handwerk", "meer-overzicht", "betere-zelfservice", "systemen-verbinden", "nieuwe-dienst", "vernieuwen", "anders"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Vul je naam in.").max(100, "Gebruik maximaal 100 tekens."),
  organisation: z.string().trim().max(120, "Gebruik maximaal 120 tekens.").optional().default(""),
  email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in.").max(254),
  phone: z.string().trim().max(40, "Gebruik maximaal 40 tekens.").optional().default(""),
  projectType: z.enum(projectTypes, { message: "Kies een type vraag." }),
  primaryGoal: z.enum(primaryGoals, { message: "Kies je belangrijkste doel." }),
  message: z.string().trim().min(20, "Vertel in minimaal 20 tekens wat je wilt bereiken.").max(4000, "Gebruik maximaal 4.000 tekens."),
  privacyAccepted: z.literal(true, { errorMap: () => ({ message: "Bevestig dat je de privacytoelichting hebt gelezen." }) }),
  website: z.string().max(0).optional().default(""),
  startedAt: z.number().int().positive(),
  idempotencyKey: z.string().uuid(),
}).strict();

export type ContactInput = z.infer<typeof contactSchema>;

export const projectTypeLabels: Record<(typeof projectTypes)[number], string> = {
  website: "Website",
  webapplicatie: "Webapplicatie",
  portaal: "Portaal",
  backoffice: "Backoffice",
  koppeling: "Koppeling",
  "slimme-flow": "Slimme flow",
  schermcommunicatie: "Schermcommunicatie",
  "beheer-en-groei": "Beheer en groei",
  "nog-niet-zeker": "Nog niet zeker",
};

export const primaryGoalLabels: Record<(typeof primaryGoals)[number], string> = {
  "meer-aanvragen": "Meer of betere aanvragen",
  "minder-handwerk": "Minder handmatig werk",
  "meer-overzicht": "Meer overzicht",
  "betere-zelfservice": "Betere selfservice",
  "systemen-verbinden": "Systemen verbinden",
  "nieuwe-dienst": "Een nieuwe digitale dienst",
  vernieuwen: "Vernieuwen wat bestaat",
  anders: "Anders",
};

export function projectTypeForService(slug: string) {
  const mapped = slug === "websites" ? "website" : slug === "koppelingen" ? "koppeling" : slug === "slimme-flows" ? "slimme-flow" : slug;
  return projectTypes.includes(mapped as (typeof projectTypes)[number]) ? mapped : "nog-niet-zeker";
}
