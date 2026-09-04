import type { Metadata } from "next";
import Link from "next/link";
import { ContactCallout, PageHero } from "@/components/site/PageHero";
import { ServiceChooser } from "@/components/site/ServiceChooser.client";
import { ServiceGrid } from "@/components/site/ServiceGrid";
import { Faq } from "@/components/site/Faq";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({ title: "Digitale diensten voor organisaties | DG Webservices", description: "Bekijk diensten voor websites, webapplicaties, portalen, backoffice, koppelingen, slimme flows, schermcommunicatie en doorlopend beheer.", path: "/diensten" });

const combinations = [
  { title: "Website + slimme flow", text: "Een heldere ingang die doorloopt naar een gerichte aanvraag en passende opvolging.", links: ["websites", "slimme-flows"] },
  { title: "Portaal + backoffice", text: "Selfservice voor de gebruiker, overzicht en actie voor de organisatie.", links: ["portalen", "backoffice"] },
  { title: "Koppelingen + beheer", text: "Gegevens die blijven stromen, met monitoring en onderhoud rond afhankelijkheden.", links: ["koppelingen", "beheer-en-groei"] },
  { title: "Schermen + centrale content", text: "Gerichte publicatie op locaties, gevoed vanuit één beheersbare bron.", links: ["schermcommunicatie", "koppelingen"] },
];

export default function ServicesPage() {
  return <main id="main-content">
    <PageHero eyebrow="Diensten" title="Digitale diensten, helder georganiseerd." lead="De acht diensten kunnen los starten en samen één digitale omgeving vormen. Begin bij je vraagstuk; de technische vorm volgt daarna." primary={{ href: "/contact", label: "Bespreek welke dienst past" }} secondary={{ href: "/mogelijkheden", label: "Start bij een mogelijkheid" }} />
    <section className="section section-ice"><div className="container chooser-layout"><div><span className="eyebrow">Keuzehulp</span><h2>Waar loop je nu tegenaan?</h2><p>Een probleem past vaak bij meer dan één dienst. Gebruik de keuzehulp om de eerste samenhang te zien.</p></div><ServiceChooser /></div></section>
    <section className="section"><div className="container"><div className="section-heading row-heading"><div><span className="eyebrow">Alle diensten</span><h2>Kies een werkbare ingang.</h2></div><p>Iedere route beschrijft situaties, mogelijkheden, oplevering en aandachtspunten zelfstandig.</p></div><ServiceGrid compact /></div></section>
    <section className="section section-dark"><div className="container"><div className="section-heading"><span className="eyebrow eyebrow-light">Vaak in samenhang</span><h2>Diensten die elkaar versterken.</h2></div><div className="combination-grid">{combinations.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.text}</p><div>{item.links.map((slug) => <Link key={slug} href={`/diensten/${slug}`}>Bekijk {slug.replaceAll("-", " ")} <span aria-hidden="true">→</span></Link>)}</div></article>)}</div></div></section>
    <section className="section flow-diagram"><div className="container"><div className="section-heading"><span className="eyebrow">Samenhang</span><h2>Voorkant, proces, beheer en data.</h2><p>Een prettige voorkant blijft geloofwaardig wanneer de verwerking erachter even helder is.</p></div><div className="layer-grid"><article><span>01</span><h3>Voorkant</h3><p>Website, portaal of scherm waar een gebruiker informatie vindt en een taak uitvoert.</p></article><article><span>02</span><h3>Proces</h3><p>Validatie, status, routing en terugkoppeling rond die taak.</p></article><article><span>03</span><h3>Beheer</h3><p>Werkvoorraad, gegevens, uitzonderingen en eigenaarschap.</p></article><article><span>04</span><h3>Data</h3><p>Bronnen en koppelingen die informatie betrouwbaar beschikbaar maken.</p></article></div></div></section>
    <Faq items={[{ question: "Moet ik vooraf al weten welke dienst ik nodig heb?", answer: "Nee. Begin bij de situatie, gebruiker en gewenste uitkomst. De passende diensten worden tijdens het scherpstellen duidelijk." }, { question: "Kunnen meerdere diensten in één project samenkomen?", answer: "Ja. We bewaken één kernvraag en faseren onderdelen zodat de oplossing begrijpelijk en beheersbaar blijft." }, { question: "Kan een bestaand onderdeel behouden blijven?", answer: "Zeker. We onderzoeken eerst wat goed werkt en koppelen of vernieuwen alleen waar dat een duidelijke reden heeft." }]} />
    <ContactCallout title="Welke route past bij jouw vraag?" text="Leg de huidige situatie kort voor. We brengen de passende dienst of combinatie samen in beeld." label="Bespreek welke dienst past" />
  </main>;
}
