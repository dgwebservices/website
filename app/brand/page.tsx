import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/site/BrandLogo";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({ title: "Logo en huisstijl | DG Webservices", description: "De officiële DG Webservices-logo's en richtlijnen voor juist gebruik.", path: "/brand", noindex: true });

const masters = [
  { title: "Combined · lichte achtergrond", file: "DG-Webservices-Combined-Light-Mode-8192-1.svg", kind: "combined", surface: "light", panel: "light" },
  { title: "Combined · donkere achtergrond", file: "DG-Webservices-Combined-Dark-Mode-8192.svg", kind: "combined", surface: "dark", panel: "dark" },
  { title: "Icon · lichte achtergrond", file: "DG-Webservices-Icon-Light-Mode-8192.svg", kind: "icon", surface: "light", panel: "light" },
  { title: "Icon · donkere achtergrond", file: "DG-Webservices-Icon-Dark-Mode-8192.svg", kind: "icon", surface: "dark", panel: "dark" },
] as const;

export default function BrandPage() {
  return <main id="main-content" className="brand-page">
    <section className="page-hero section-dark"><div className="container"><Breadcrumbs items={[{ label: "Logo & huisstijl", href: "/brand" }]} /><span className="eyebrow eyebrow-light">Merkbestanden</span><h1>Vier bestanden.<br />Eén vast merk.</h1><p className="page-lead">Gebruik altijd het officiële bestand dat past bij de achtergrond. Vorm, kleur, verhouding en de ruimte tussen D en G blijven ongewijzigd.</p><div className="button-row"><a className="button button-primary" href="/downloads/DG_Webservices_Brand_Assets.zip" download>Download de complete set</a><Link className="button button-dark" href="/">Terug naar de website</Link></div></div></section>
    <section className="section"><div className="container"><div className="section-heading"><span className="eyebrow">Officiële SVG-masters</span><h2>De juiste variant per ondergrond.</h2><p>De benaming light of dark verwijst naar de achtergrond waarvoor het bestand bedoeld is.</p></div><div className="brand-assets">{masters.map((item) => <article key={item.file} className={`brand-asset brand-asset-${item.panel}`}><div><BrandLogo kind={item.kind} surface={item.surface} decorative /></div><footer><h2>{item.title}</h2><a href={`/brand/${item.file}`} download>Download SVG <span aria-hidden="true">↓</span></a></footer></article>)}</div></div></section>
    <section className="section section-ice"><div className="container"><div className="section-heading"><span className="eyebrow">Gebruik</span><h2>Rust en herkenbaarheid bewaren.</h2></div><div className="brand-rules"><article><span>01</span><h3>Kies op contrast</h3><p>Light Mode hoort op een lichte of ice achtergrond. Dark Mode hoort op een donkere navy achtergrond.</p></article><article><span>02</span><h3>Laat ruimte</h3><p>Plaats tekst en andere elementen niet direct tegen het logo. Kies bij twijfel voor meer vrije ruimte.</p></article><article><span>03</span><h3>Vorm blijft vast</h3><p>Niet vervormen, recoloren, uitsnijden, animeren per letter of van een effect voorzien.</p></article><article><span>04</span><h3>Gebruik de master</h3><p>De vier SVG-bestanden zijn de enige officiële bron. Favicon en platformicons zijn traceerbare afgeleiden.</p></article></div></div></section>
  </main>;
}
