import type { Metadata } from "next";
import Link from "next/link";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({ title: "Bedankt voor je bericht | DG Webservices", description: "Je bericht is ontvangen door DG Webservices.", path: "/bedankt", noindex: true });

export default function ThanksPage() {
  return <main id="main-content"><section className="utility-hero section-dark"><div className="container utility-card"><span className="eyebrow eyebrow-light">Ontvangen</span><h1>Bedankt voor je bericht.</h1><p>Je aanvraag is ontvangen. Dit is een ontvangstbevestiging en nog geen aanname van een opdracht.</p><div className="button-row"><Link className="button button-primary" href="/diensten">Bekijk de diensten</Link><Link className="button button-dark" href="/werkwijze">Zo werken we</Link><Link className="text-link-light" href="/">Terug naar home</Link></div></div></section></main>;
}
