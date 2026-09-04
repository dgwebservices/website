import type { Metadata } from "next";
import Link from "next/link";
import { ContactCallout, PageHero } from "@/components/site/PageHero";
import { ResponsiveImage } from "@/components/site/ResponsiveImage";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({ title: "Wat digitaal mogelijk is | DG Webservices", description: "Ontdek hoe websites, portalen, koppelingen, dashboards, formulieren en digitale processen samen een heldere oplossing kunnen vormen.", path: "/mogelijkheden" });

const groups = [
  { number: "01", title: "Toegang en rollen", items: ["Accounts en activatie", "Rollen en rechten", "Persoonlijke inhoud"], links: ["portalen", "webapplicaties"] },
  { number: "02", title: "Intake en formulieren", items: ["Gerichte vragen", "Conditionele stappen", "Validatie en bevestiging"], links: ["slimme-flows", "websites"] },
  { number: "03", title: "Workflow en status", items: ["Werkvoorraad", "Taken en toewijzing", "Status en meldingen"], links: ["backoffice", "webapplicaties"] },
  { number: "04", title: "Data en koppelingen", items: ["Import en export", "Synchronisatie", "Datakwaliteit en herstel"], links: ["koppelingen", "beheer-en-groei"] },
  { number: "05", title: "Documenten en communicatie", items: ["Documentbeheer", "Berichten", "Centrale publicatie"], links: ["portalen", "schermcommunicatie"] },
  { number: "06", title: "Planning en reservering", items: ["Beschikbaarheid", "Tijdsloten", "Betaling waar passend"], links: ["slimme-flows", "webapplicaties"] },
  { number: "07", title: "Beheer en inzicht", items: ["Rapportage", "Monitoring", "Publicatie en releases"], links: ["backoffice", "beheer-en-groei"] },
];

export default function PossibilitiesPage() {
  return <main id="main-content">
    <PageHero eyebrow="Mogelijkheden" title="Wat kan er digitaal slimmer?" lead="Begin bij een taak, gebruiker of knelpunt. De passende combinatie van voorkant, proces, beheer en gegevens volgt daarna." primary={{ href: "/contact", label: "Leg je vraag voor" }} secondary={{ href: "/diensten", label: "Bekijk de diensten" }} />
    <section className="section"><div className="container"><div className="section-heading"><span className="eyebrow">Functiematrix</span><h2>Van concrete taak naar passende richting.</h2><p>Deze mogelijkheden zijn voorbeelden. Welke onderdelen echt nodig zijn, wordt pas duidelijk rond de dagelijkse praktijk.</p></div><div className="possibility-grid">{groups.map((group) => <article key={group.number}><span>{group.number}</span><h2>{group.title}</h2><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul><div>{group.links.map((slug) => <Link key={slug} href={`/diensten/${slug}`}>{slug.replaceAll("-", " ")} <span aria-hidden="true">→</span></Link>)}</div></article>)}</div></div></section>
    <section className="section section-ice"><div className="container editorial-grid"><div className="editorial-image"><ResponsiveImage name="sports-platforms" alt="Digitale wedstrijdinformatie en schermcommunicatie in een sportomgeving" /><span className="image-label">Functionele voorbeeldoplossing</span></div><div className="editorial-copy"><span className="eyebrow">Van planning naar publicatie</span><h2>Informatie op het juiste scherm.</h2><p>Een planning kan verschillende gebruikersomgevingen, statussen en schermen voeden. De bron, frequentie en fallback blijven zichtbaar onderdeel van het ontwerp.</p><ul><li>Planning en rollen</li><li>Periodieke of actuele gegevens</li><li>Preview per schermverhouding</li><li>Publicatiestatus en herstel</li></ul><Link className="text-link" href="/diensten/schermcommunicatie">Bekijk schermcommunicatie <span aria-hidden="true">→</span></Link></div></div></section>
    <section className="section"><div className="container editorial-grid editorial-reverse"><div className="editorial-image"><ResponsiveImage name="connected-business" alt="Portaal, backoffice en mobiele omgeving als één verbonden systeem" /><span className="image-label">Functionele voorbeeldoplossing</span></div><div className="editorial-copy"><span className="eyebrow">Van losse stap naar één flow</span><h2>Gebruiker en beheer in dezelfde lijn.</h2><p>Een aanvraag komt binnen, wordt beoordeeld, krijgt een status en wordt teruggekoppeld. Elk deel kan klein starten en later worden verbonden.</p><ul><li>Heldere intake</li><li>Backoffice en werkvoorraad</li><li>Portaal en status</li><li>Koppelingen met bestaande bronnen</li></ul><Link className="text-link" href="/diensten/webapplicaties">Bekijk webapplicaties <span aria-hidden="true">→</span></Link></div></div></section>
    <section className="section section-dark"><div className="container"><div className="section-heading"><span className="eyebrow eyebrow-light">Eén flow</span><h2>Website → aanvraag → backoffice → portaal → communicatie.</h2><p>De beste start is niet altijd de volledige keten. We kiezen het onderdeel dat nu de meeste helderheid brengt en bewaken hoe het later kan aansluiten.</p></div><div className="flow-bar"><span>Publieke ingang</span><span>Gerichte intake</span><span>Dagelijks beheer</span><span>Persoonlijke status</span><span>Actuele communicatie</span></div></div></section>
    <ContactCallout title="Welke taak wil je eenvoudiger maken?" text="Beschrijf wat een gebruiker of medewerker nu probeert te doen. Dat is genoeg voor een gerichte eerste verkenning." label="Leg je vraag voor" />
  </main>;
}
