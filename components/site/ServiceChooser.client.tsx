"use client";

import Link from "next/link";
import { useState } from "react";
import type { ServiceSlug } from "@/content/services";

const choices: Array<{ value: string; label: string; matches: Array<{ slug: ServiceSlug; label: string }> }> = [
  { value: "website", label: "Onze website past niet meer", matches: [{ slug: "websites", label: "Websites" }, { slug: "beheer-en-groei", label: "Beheer en groei" }] },
  { value: "handwerk", label: "We doen te veel handmatig", matches: [{ slug: "slimme-flows", label: "Slimme flows" }, { slug: "backoffice", label: "Backoffice" }] },
  { value: "verspreid", label: "Informatie staat overal", matches: [{ slug: "koppelingen", label: "Koppelingen" }, { slug: "portalen", label: "Portalen" }] },
  { value: "schermen", label: "Informatie op schermen is lastig actueel", matches: [{ slug: "schermcommunicatie", label: "Schermcommunicatie" }, { slug: "koppelingen", label: "Koppelingen" }] },
  { value: "maatwerk", label: "Ons kernproces past niet in bestaande middelen", matches: [{ slug: "webapplicaties", label: "Webapplicaties" }, { slug: "backoffice", label: "Backoffice" }] },
];

export function ServiceChooser() {
  const [selected, setSelected] = useState("");
  const match = choices.find((choice) => choice.value === selected);
  return (
    <div className="chooser">
      <label htmlFor="service-choice">Waar loop je nu tegenaan?</label>
      <select id="service-choice" value={selected} onChange={(event) => setSelected(event.target.value)}>
        <option value="">Kies een herkenbare situatie</option>
        {choices.map((choice) => <option value={choice.value} key={choice.value}>{choice.label}</option>)}
      </select>
      <div className="chooser-result" aria-live="polite">
        {match ? <><p>Deze richtingen kunnen passen:</p><ul>{match.matches.map((item) => <li key={item.slug}><Link href={`/diensten/${item.slug}`}>{item.label} <span aria-hidden="true">→</span></Link></li>)}</ul><button type="button" onClick={() => setSelected("")}>Opnieuw beginnen</button></> : <p>Kies een situatie om twee passende richtingen te vergelijken. Dit is een eerste advies, geen vaste scope.</p>}
      </div>
    </div>
  );
}
