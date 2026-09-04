import type { Metadata } from "next";
import { ContactForm } from "@/components/site/ContactForm.client";
import { PageHero } from "@/components/site/PageHero";
import { Faq } from "@/components/site/Faq";
import { siteConfig } from "@/content/site";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({ title: "Contact over je digitale project | DG Webservices", description: "Bespreek je website, webapplicatie, portaal of digitaal proces met DG Webservices in Den Haag. Vertel kort wat je wilt bereiken.", path: "/contact" });

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ project?: string; goal?: string }> }) {
  const params = await searchParams;
  return <main id="main-content">
    <PageHero eyebrow="Contact" title="Vertel wat je wilt bereiken." lead="Deel de huidige situatie, je belangrijkste doel en wat er beter moet werken. Een volledig uitgewerkt plan is niet nodig." />
    <section className="section"><div className="container contact-layout"><div className="contact-aside"><span className="eyebrow">Begin bij de vraag</span><h2>Wat helpt om goed te starten?</h2><ul className="check-list"><li>Wie probeert welke taak uit te voeren?</li><li>Waar loopt het nu vast of kost het onnodig werk?</li><li>Welke uitkomst zou voor de organisatie merkbaar beter zijn?</li><li>Welke systemen, inhoud of beslissingen zijn afhankelijk?</li></ul><div className="direct-contact"><span>Rechtstreeks e-mailen</span><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a><small>{siteConfig.locationLabel}</small></div></div><ContactForm initialProject={params.project} initialGoal={params.goal} /></div></section>
    <section id="privacy-uitleg" className="section section-ice privacy-note"><div className="container"><span className="eyebrow">Verwerkingstoelichting bij dit formulier</span><h2>Alleen wat nodig is voor je aanvraag.</h2><p>Naam, contactgegevens en toelichting worden uitsluitend gebruikt om de aanvraag te beoordelen en contact op te nemen. De website plaatst geen niet-noodzakelijke trackingcookies en stuurt formulierinhoud niet naar analysetools. Een inzending geldt pas als ontvangen nadat de server de aflevering heeft bevestigd. Verstuur geen bijzondere of onnodig gevoelige persoonsgegevens.</p></div></section>
    <Faq items={[{ question: "Moet mijn vraag al volledig zijn uitgewerkt?", answer: "Nee. Een duidelijke beschrijving van de huidige situatie en gewenste verandering is voldoende voor een eerste verkenning." }, { question: "Kan ik ook een bestaande omgeving laten verbeteren?", answer: "Ja. Beschrijf wat goed werkt en waar het vastloopt; dan kan gericht worden bekeken wat behouden, gekoppeld of vernieuwd moet worden." }, { question: "Kan ik rechtstreeks e-mailen?", answer: `Ja, via ${siteConfig.email}. Zet geen onnodig gevoelige gegevens in je bericht.` }]} />
  </main>;
}
