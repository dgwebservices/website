import type { Metadata } from "next";
import Link from "next/link";
import { ContactCallout } from "@/components/site/PageHero";
import { ProcessSteps } from "@/components/site/ProcessSteps";
import { ProjectStarter } from "@/components/site/ProjectStarter.client";
import { ResponsiveImage } from "@/components/site/ResponsiveImage";
import { ServiceGrid } from "@/components/site/ServiceGrid";
import { StructuredData } from "@/components/site/StructuredData";
import { services } from "@/content/services";
import { siteConfig } from "@/content/site";
import { absoluteUrl, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Websites en webapplicaties in Den Haag | DG Webservices",
  description: "DG Webservices ontwerpt en bouwt websites, webapplicaties, portalen en digitale processen voor organisaties in Den Haag en daarbuiten.",
  path: "/",
});

const situations = [
  { title: "Informatie staat op te veel plekken", href: "/diensten/koppelingen", service: "Koppelingen en backoffice" },
  { title: "Aanvragen kosten onnodig veel handwerk", href: "/diensten/slimme-flows", service: "Slimme flows" },
  { title: "De website past niet meer bij de organisatie", href: "/diensten/websites", service: "Websites" },
  { title: "Gebruikers missen een eigen omgeving", href: "/diensten/portalen", service: "Portalen" },
];

export default function Home() {
  return (
    <main id="main-content">
      <StructuredData data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", "@id": `${siteConfig.origin}/#organization`, name: siteConfig.name, url: absoluteUrl("/"), logo: { "@type": "ImageObject", url: absoluteUrl("/brand/DG-Webservices-Icon-Light-Mode-8192.svg") }, description: "Digitale diensten vanuit Den Haag voor websites, portalen, webapplicaties en koppelingen." },
          { "@type": "WebSite", "@id": `${siteConfig.origin}/#website`, url: absoluteUrl("/"), name: siteConfig.name, inLanguage: siteConfig.locale, publisher: { "@id": `${siteConfig.origin}/#organization` } },
        ],
      }} />
      <section className="home-hero section-dark">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light">Ontwerp · ontwikkeling · doorontwikkeling</span>
            <h1>Digitaal gemaakt.<br /><span>Helder geregeld.</span></h1>
            <p>Websites, portalen en webapplicaties die prettig werken, processen eenvoudiger maken en klaar zijn om met je organisatie mee te groeien.</p>
            <div className="button-row"><Link className="button button-primary" href="/contact">Bespreek je project <span aria-hidden="true">↗</span></Link><Link className="button button-dark" href="/diensten">Bekijk de diensten <span aria-hidden="true">→</span></Link></div>
            <ul className="microproof"><li>Persoonlijk contact</li><li>Eerst een werkbaar prototype</li><li>Van ontwerp tot beheer</li></ul>
          </div>
          <div className="hero-visual">
            <div className="grid-accent" aria-hidden="true" />
            <ResponsiveImage name="hero-digital-studio" alt="Digitale interfaces op desktop, laptop, tablet en telefoon" priority sizes="(max-width: 980px) calc(100vw - 32px), 620px" />
            <div className="hero-caption"><span>Van idee naar dagelijks gebruik</span><strong>Eén consistente ervaring.</strong></div>
            <div className="hero-note"><small>De hele digitale flow</small><strong>Voorkant en beheer in één lijn</strong></div>
          </div>
        </div>
      </section>

      <section className="capability-band" aria-label="Diensten"><div>{services.map((service) => <span key={service.slug}>{service.navigationLabel}</span>)}</div></section>

      <section className="section situations-section"><div className="container"><div className="section-heading"><span className="eyebrow">Begin bij de praktijk</span><h2>Waar loopt het nu vast?</h2><p>Je hoeft de oplossing nog niet te kennen. Een herkenbare situatie is genoeg om de juiste richting te verkennen.</p></div><div className="situation-grid">{situations.map((item) => <Link key={item.title} href={item.href}><span>{item.service}</span><h3>{item.title}</h3><strong>Bekijk een passende route <span aria-hidden="true">→</span></strong></Link>)}</div></div></section>

      <section className="statement section-blue"><div className="container statement-grid"><span className="index-mark">01 / WAT WE MAKEN</span><div><h2>Mooi aan de voorkant.<br />Slim aan de achterkant.</h2><p>Een eenvoudige digitale ervaring ontstaat niet vanzelf. Daarachter zitten heldere informatie, logische processen, zorgvuldige koppelingen en beheer dat meegroeit.</p><Link className="text-link-light" href="/mogelijkheden">Bekijk wat er mogelijk is <span aria-hidden="true">→</span></Link></div></div></section>

      <section className="section services-section"><div className="container"><div className="section-heading row-heading"><div><span className="eyebrow">Acht heldere richtingen</span><h2>Van website tot werkproces.</h2></div><p>Start met één concrete behoefte of verbind meerdere onderdelen tot één digitale omgeving.</p></div><ServiceGrid /></div></section>

      <section className="section flow-section section-dark"><div className="container"><div className="section-heading row-heading"><div><span className="eyebrow eyebrow-light">Eén verbonden digitale flow</span><h2>Klein beginnen.<br />Gericht uitbreiden.</h2></div><p>Een website kan aanvragen voeden, een backoffice kan het werk organiseren en een portaal kan de voortgang teruggeven. Elk onderdeel blijft begrijpelijk.</p></div><ol className="flow-chain"><li><span>01</span><strong>Website</strong><small>Heldere ingang</small></li><li><span>02</span><strong>Formulier &amp; flow</strong><small>Gerichte intake</small></li><li><span>03</span><strong>Backoffice</strong><small>Overzicht en actie</small></li><li><span>04</span><strong>Portaal</strong><small>Status en selfservice</small></li><li><span>05</span><strong>Communicatie</strong><small>Actuele terugkoppeling</small></li></ol></div></section>

      <section className="section editorial-section"><div className="container editorial-grid"><div className="editorial-image"><ResponsiveImage name="sports-platforms" alt="Digitale wedstrijdinformatie en schermcommunicatie in een sportomgeving" /><span className="image-label">Functionele voorbeeldoplossing</span></div><div className="editorial-copy"><span className="eyebrow">Planning &amp; communicatie</span><h2>De juiste informatie op ieder moment.</h2><p>Planning, rollen, live of periodiek bijgewerkte informatie en schermpublicatie kunnen samen één beheersbare ervaring vormen.</p><ul><li>Wedstrijd- of evenementbeheer</li><li>Rolomgevingen en status</li><li>Informatie voor schermen</li><li>Inschrijven en betalen waar passend</li></ul><Link className="text-link" href="/mogelijkheden">Bekijk deze mogelijkheden <span aria-hidden="true">→</span></Link></div></div></section>

      <section className="section editorial-section section-ice"><div className="container editorial-grid editorial-reverse"><div className="editorial-image"><ResponsiveImage name="connected-business" alt="Portaal, backoffice en mobiele omgeving als één verbonden systeem" /><span className="image-label">Functionele voorbeeldoplossing</span></div><div className="editorial-copy"><span className="eyebrow">Verbonden organisatie</span><h2>De website is vaak pas het begin.</h2><p>Eén bron, duidelijke rollen en heldere statussen verminderen dubbel werk en houden de ervaring voor bezoeker en medewerker in dezelfde lijn.</p><ul><li>Minder dubbel en handmatig werk</li><li>Rollen en statussen die passen bij de taak</li><li>Eén ervaring voor gebruiker en beheerder</li><li>Ruimte voor latere uitbreiding</li></ul><Link className="text-link" href="/diensten/koppelingen">Bekijk hoe koppelingen werken <span aria-hidden="true">→</span></Link></div></div></section>

      <section className="section process-section"><div className="container process-grid"><div className="process-intro"><span className="eyebrow">Onze werkwijze</span><h2>Eerst zien.<br />Dan beslissen.</h2><p>De invulling verschilt per project. De lijn blijft hetzelfde: eerst begrijpen, dan tastbaar maken, zorgvuldig bouwen en gericht verder brengen.</p></div><ProcessSteps /></div></section>

      <section className="section why-section section-dark"><div className="container"><div className="section-heading row-heading"><div><span className="eyebrow eyebrow-light">Waarom DG Webservices</span><h2>Gebouwd alsof we er morgen zelf mee moeten werken.</h2></div><p>Ontwerp, techniek en dagelijks gebruik worden als één geheel bekeken. Dat maakt keuzes beter bespreekbaar en het resultaat makkelijker overdraagbaar.</p></div><div className="principle-grid">{["Direct contact", "Heldere keuzes", "Zichtbare voortgang", "Klaar om door te groeien"].map((item, index) => <article key={item}><span>0{index + 1}</span><h3>{item}</h3></article>)}</div></div></section>

      <section className="section starter-section section-blue"><div className="container"><div className="section-heading row-heading"><div><span className="eyebrow eyebrow-light">Projectstarter</span><h2>Laten we er iets werkbaars van maken.</h2></div><p>Kies een richting en doel. Op de contactpagina kun je alles nog aanpassen en verder toelichten.</p></div><ProjectStarter /></div></section>
      <ContactCallout title="Nog niet precies scherp?" text="Een eerste vraag hoeft niet af te zijn. Begin bij wat er beter moet werken; de oplossing maken we samen concreet." />
    </main>
  );
}
