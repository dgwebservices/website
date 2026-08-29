import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "DG Webservices — Brand system",
  description:
    "Het visuele en verbale merksysteem van DG Webservices: logo, kleur, typografie, fotografie en tone of voice.",
};

const colors = [
  { name: "Deep Navy", hex: "#071426", color: "#071426" },
  { name: "Cobalt Blue", hex: "#2563EB", color: "#2563EB" },
  { name: "Cool Slate", hex: "#64748B", color: "#64748B" },
  { name: "Ice White", hex: "#F5F8FC", color: "#F5F8FC" },
];

const imagery = [
  {
    src: "/assets/hero-digital-studio.png",
    title: "Product als hoofdrolspeler",
    text: "Tastbare apparatuur, heldere interfaces en gecontroleerd kobaltblauw licht.",
  },
  {
    src: "/assets/sports-platforms.png",
    title: "Geworteld in de praktijk",
    text: "Echte context en herkenbare omgevingen; nooit steriel of onpersoonlijk.",
  },
  {
    src: "/assets/connected-business.png",
    title: "Systemen in samenhang",
    text: "Beeld laat zien dat voorkant, beheer en processen één geheel vormen.",
  },
];

export default function BrandPage() {
  return (
    <main className="brand-page">
      <section className="brand-guide-hero">
        <header className="brand-guide-header">
          <Link href="/" className="brand" aria-label="DG Webservices home">
            <img src="/brand/dg-mark-reversed.svg" alt="" width="67" height="36" />
            <span>DG <strong>Webservices</strong></span>
          </Link>
          <Link href="/" className="brand-back">
            <ArrowLeft size={15} />
            <span>Terug naar prototype</span>
          </Link>
        </header>

        <div className="container brand-guide-intro">
          <div>
            <p className="eyebrow eyebrow-light"><span />Brand system · 01</p>
            <h1>Helder.<br /><span>Krachtig.</span><br />Verbonden.</h1>
            <p>
              Het nieuwe DG Webservices voelt technisch zonder afstandelijk te
              worden. Diep marineblauw geeft rust en betrouwbaarheid; kobalt
              brengt energie, beweging en digitale scherpte.
            </p>
          </div>
          <div className="brand-hero-mark">
            <img src="/brand/dg-mark-reversed.svg" alt="DG Webservices monogram" />
          </div>
        </div>
      </section>

      <section className="brand-guide-section">
        <div className="container">
          <div className="brand-guide-heading">
            <h2>Een herkenbaar teken.<br />Op ieder formaat.</h2>
            <p>
              Het geometrische DG-monogram grijpt letterlijk in elkaar. De
              letters delen vorm en ruimte, net zoals ontwerp en development in
              het werk van DG Webservices één systeem vormen.
            </p>
          </div>
          <div className="logo-showcase">
            <div className="logo-panel">
              <img className="lockup" src="/brand/dg-lockup.svg" alt="Volledig DG Webservices logo" />
              <div className="asset-actions">
                <a href="/brand/dg-lockup.svg" download>
                  <Download size={13} /> SVG lock-up
                </a>
              </div>
            </div>
            <div className="logo-panel dark">
              <img className="mark" src="/brand/dg-mark-reversed.svg" alt="DG beeldmerk op donkerblauw" />
              <div className="asset-actions">
                <a href="/brand/dg-mark.svg" download>
                  <Download size={13} /> SVG mark
                </a>
                <a href="/brand/dg-mark-mono.svg" download>
                  <Download size={13} /> Mono
                </a>
                <a href="/brand/dg-mark-reversed.svg" download>
                  <Download size={13} /> Reversed
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-guide-section">
        <div className="container">
          <div className="brand-guide-heading">
            <h2>Rust in de basis.<br />Energie in het accent.</h2>
            <p>
              Deep Navy is het fundament. Cobalt Blue wordt doelgericht ingezet
              voor acties, status en focus. Cool Slate draagt ondersteunende
              tekst; Ice White houdt lange pagina’s licht en ruim.
            </p>
          </div>
          <div className="palette-grid">
            {colors.map((item) => (
              <article className="color-card" key={item.hex}>
                <div
                  className="color-swatch"
                  style={{
                    background: item.color,
                    borderBottom: item.hex === "#F5F8FC" ? "1px solid #DDE5EF" : undefined,
                  }}
                />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.hex}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-guide-section">
        <div className="container">
          <div className="brand-guide-heading">
            <h2>Technisch precies.<br />Menselijk leesbaar.</h2>
            <p>
              Space Grotesk geeft headlines een uitgesproken, digitale
              signatuur. Manrope houdt navigatie, uitleg en interfaces compact
              en prettig leesbaar op ieder scherm.
            </p>
          </div>
          <div className="type-grid">
            <article className="type-card display">
              <span>Display · Space Grotesk</span>
              <h3>Aa 01</h3>
              <p>Voor sterke koppen, statements en productnamen. Compact, geometrisch en zelfverzekerd.</p>
            </article>
            <article className="type-card body">
              <span>Interface · Manrope</span>
              <h3>Aa 01</h3>
              <p>Voor bodycopy, navigatie, labels en digitale interfaces. Neutraal waar het moet, karaktervol waar het kan.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="brand-guide-section">
        <div className="container">
          <div className="brand-guide-heading">
            <h2>Beeld dat laat voelen<br />wat er wordt gebouwd.</h2>
            <p>
              De beeldtaal is premium, geloofwaardig en functioneel. Producten
              staan in een echte context, materialen blijven tastbaar en
              kobaltblauw verbindt de serie zonder alles blauw te maken.
            </p>
          </div>
          <div className="imagery-grid">
            {imagery.map((item) => (
              <article className="imagery-card" key={item.src}>
                <img src={item.src} alt={item.title} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-guide-section">
        <div className="container">
          <div className="brand-guide-heading">
            <h2>Een stem zonder ruis.</h2>
            <p>
              DG Webservices schrijft kalm, concreet en ondernemend. Geen grote
              beloften zonder bewijs, geen techniek om indruk te maken en geen
              ingewikkelde taal wanneer het ook helder kan.
            </p>
          </div>
          <div className="voice-grid">
            <article className="voice-card">
              <span>01 · Helder</span>
              <h3>Complexe techniek. Helder in gebruik.</h3>
              <p>Korte zinnen, één boodschap per alinea en altijd vanuit de gebruiker geschreven.</p>
            </article>
            <article className="voice-card">
              <span>02 · Concreet</span>
              <h3>Laat zien wat het product mogelijk maakt.</h3>
              <p>Processen, rollen en functies zijn sterker bewijs dan algemene superlatieven.</p>
            </article>
            <article className="voice-card">
              <span>03 · Betrokken</span>
              <h3>Een partner die naast de organisatie staat.</h3>
              <p>Direct, persoonlijk en praktisch; met ruimte om samen de beste richting te vinden.</p>
            </article>
          </div>
        </div>
      </section>

      <footer className="brand-guide-footer">
        <div className="container">
          <p>DG Webservices · Brand system 01 · 2026</p>
          <div className="brand-footer-actions">
            <a href="/downloads/DG_Webservices_Brand_Assets.zip" download>
              Download merkpakket <Download size={15} />
            </a>
            <Link href="/">
              Bekijk het prototype <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
