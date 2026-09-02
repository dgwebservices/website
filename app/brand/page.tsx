import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Download, X } from "lucide-react";
import styles from "./brand.module.css";

export const metadata: Metadata = {
  title: "DG Webservices — Logo system",
  description:
    "Het complete vectorlogo-systeem van DG Webservices: beeldmerk, woordmerk, lock-ups, iconen en gebruiksregels.",
};

const markVariants = [
  {
    title: "Primary gradient",
    file: "dg-mark.svg",
    src: "/brand/dg-mark.svg",
    className: styles.lightPanel,
  },
  {
    title: "Flat colour",
    file: "dg-mark-flat.svg",
    src: "/brand/dg-mark-flat.svg",
    className: styles.lightPanel,
  },
  {
    title: "Reversed",
    file: "dg-mark-reversed.svg",
    src: "/brand/dg-mark-reversed.svg",
    className: styles.darkPanel,
  },
  {
    title: "Monochrome",
    file: "dg-mark-mono.svg",
    src: "/brand/dg-mark-mono.svg",
    className: styles.monoPanel,
  },
];

const wordmarkVariants = [
  {
    title: "Primair",
    file: "dg-wordmark.svg",
    src: "/brand/dg-wordmark.svg",
    className: styles.wordmarkLight,
  },
  {
    title: "Op donker",
    file: "dg-wordmark-reversed.svg",
    src: "/brand/dg-wordmark-reversed.svg",
    className: styles.wordmarkDark,
  },
  {
    title: "Monochroom",
    file: "dg-wordmark-mono.svg",
    src: "/brand/dg-wordmark-mono.svg",
    className: styles.wordmarkMono,
  },
];

const iconVariants = [
  { title: "Deep Navy", file: "dg-icon-navy.svg", src: "/brand/dg-icon-navy.svg" },
  { title: "Cobalt Blue", file: "dg-icon-blue.svg", src: "/brand/dg-icon-blue.svg" },
  { title: "Ice White", file: "dg-icon-light.svg", src: "/brand/dg-icon-light.svg" },
];

function DownloadLink({ file, children }: { file: string; children: React.ReactNode }) {
  return (
    <a href={`/brand/${file}`} download>
      <Download size={15} /> {children}
    </a>
  );
}

export default function BrandPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.headerBrand} aria-label="DG Webservices home">
          <img src="/brand/dg-wordmark-reversed.svg" alt="DG Webservices" />
        </Link>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Terug naar prototype
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={`${styles.shell} ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}><span /> DG logo system · 01</p>
            <h1>Eén teken.<br /><em>Elke toepassing.</em></h1>
            <p>
              Het aangeleverde DG-monogram is opnieuw opgebouwd als een zuiver
              vectorsysteem. De vorm blijft herkenbaar; de lijnen, verhoudingen
              en kleurverlopen zijn nu consistent op ieder formaat.
            </p>
            <div className={styles.heroActions}>
              <a href="/downloads/DG_Webservices_Logo_System.zip" download>
                Download compleet logopakket <Download size={17} />
              </a>
              <a href="#lockups">Bekijk alle varianten <ArrowUpRight size={17} /></a>
            </div>
          </div>
          <div className={styles.heroLogo}>
            <div className={styles.heroLogoGrid} aria-hidden="true" />
            <img src="/brand/dg-mark.svg" alt="DG Webservices beeldmerk" />
            <span>Master artwork · SVG paths</span>
          </div>
        </div>
      </section>

      <nav className={styles.subnav} aria-label="Logo-onderdelen">
        <div className={styles.shell}>
          <a href="#lockups">Lock-ups</a>
          <a href="#mark">Beeldmerk</a>
          <a href="#wordmark">Woordmerk</a>
          <a href="#icons">Iconen</a>
          <a href="#usage">Gebruik</a>
        </div>
      </nav>

      <section id="lockups" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.index}>01 / LOCK-UPS</p>
              <h2>De complete handtekening.</h2>
            </div>
            <p>
              De horizontale combinatie is de standaard voor websites,
              documenten en communicatie. De gestapelde versie werkt beter
              wanneer de beschikbare ruimte compacter of vierkanter is.
            </p>
          </div>

          <div className={styles.lockupGrid}>
            <article className={styles.lockupLight}>
              <span>Primary / light background</span>
              <img src="/brand/dg-lockup.svg" alt="Primair horizontaal DG Webservices logo" />
              <div>
                <DownloadLink file="dg-lockup.svg">Primary SVG</DownloadLink>
                <DownloadLink file="dg-lockup-mono.svg">Mono SVG</DownloadLink>
              </div>
            </article>
            <article className={styles.lockupDark}>
              <span>Reversed / dark background</span>
              <img src="/brand/dg-lockup-reversed.svg" alt="DG Webservices logo voor donkere achtergronden" />
              <div>
                <DownloadLink file="dg-lockup-reversed.svg">Reversed SVG</DownloadLink>
              </div>
            </article>
          </div>

          <div className={styles.stackedGrid}>
            <article>
              <img src="/brand/dg-lockup-stacked.svg" alt="Gestapeld DG Webservices logo" />
              <DownloadLink file="dg-lockup-stacked.svg">Stacked SVG</DownloadLink>
            </article>
            <article>
              <img src="/brand/dg-lockup-stacked-reversed.svg" alt="Gestapeld DG Webservices logo op donker" />
              <DownloadLink file="dg-lockup-stacked-reversed.svg">Stacked reversed SVG</DownloadLink>
            </article>
          </div>
        </div>
      </section>

      <section id="mark" className={`${styles.section} ${styles.iceSection}`}>
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.index}>02 / BEELDMERK</p>
              <h2>Het DG-monogram.</h2>
            </div>
            <p>
              Twee vormen grijpen in elkaar zonder hun eigen karakter te
              verliezen. De open D en ronde G blijven ook op klein formaat
              direct herkenbaar.
            </p>
          </div>
          <div className={styles.markGrid}>
            {markVariants.map((variant) => (
              <article className={variant.className} key={variant.file}>
                <span>{variant.title}</span>
                <img src={variant.src} alt={`${variant.title} DG-beeldmerk`} />
                <DownloadLink file={variant.file}>{variant.file}</DownloadLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="wordmark" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.index}>03 / WOORDMERK</p>
              <h2>De naam als vast artwork.</h2>
            </div>
            <p>
              Iedere letter is een vectorpad. Daardoor blijft het woordmerk
              overal identiek en is er geen extern lettertype nodig om het
              correct weer te geven of te laten drukken.
            </p>
          </div>
          <div className={styles.wordmarkList}>
            {wordmarkVariants.map((variant) => (
              <article className={variant.className} key={variant.file}>
                <span>{variant.title}</span>
                <img src={variant.src} alt={`${variant.title} DG Webservices woordmerk`} />
                <DownloadLink file={variant.file}>Download SVG</DownloadLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="icons" className={`${styles.section} ${styles.darkSection}`}>
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.index}>04 / ICONEN</p>
              <h2>Compact en herkenbaar.</h2>
            </div>
            <p>
              Voor app-iconen, profielafbeeldingen en kleine digitale
              toepassingen staat het monogram in een vaste afgeronde tegel.
            </p>
          </div>
          <div className={styles.iconGrid}>
            {iconVariants.map((variant) => (
              <article key={variant.file}>
                <img src={variant.src} alt={`${variant.title} DG-app-icoon`} />
                <div>
                  <strong>{variant.title}</strong>
                  <DownloadLink file={variant.file}>SVG downloaden</DownloadLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="usage" className={`${styles.section} ${styles.usageSection}`}>
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.index}>05 / GEBRUIK</p>
              <h2>Rust rondom het merk.</h2>
            </div>
            <p>
              Voldoende vrije ruimte en de juiste variant zorgen dat het logo
              zelfverzekerd blijft, van favicon tot grootformaat drukwerk.
            </p>
          </div>

          <div className={styles.usageGrid}>
            <article className={styles.clearspaceCard}>
              <span>Minimale vrije ruimte</span>
              <div className={styles.clearspaceVisual}>
                <i className={styles.measureTop}>X</i>
                <i className={styles.measureLeft}>X</i>
                <img src="/brand/dg-mark.svg" alt="Vrije ruimte rondom het DG-beeldmerk" />
              </div>
              <p>Houd rondom het logo minimaal één verticale D-stam vrij.</p>
            </article>
            <article className={styles.sizeCard}>
              <span>Minimale formaten</span>
              <div>
                <figure><img src="/brand/dg-lockup.svg" alt="" /><figcaption>180 px digitaal</figcaption></figure>
                <figure><img src="/brand/dg-mark.svg" alt="" /><figcaption>48 px digitaal</figcaption></figure>
                <figure><img src="/brand/dg-icon-navy.svg" alt="" /><figcaption>16–32 px digitaal</figcaption></figure>
              </div>
            </article>
          </div>

          <div className={styles.rulesGrid}>
            <article>
              <Check size={18} />
              <h3>Wel doen</h3>
              <p>Gebruik de meegeleverde compositie en kies de variant met voldoende contrast.</p>
            </article>
            <article className={styles.dontCard}>
              <X size={18} />
              <h3>Niet vervormen</h3>
              <p>Verander de verhoudingen, onderlinge afstand of plaatsing van de onderdelen niet.</p>
            </article>
            <article className={styles.dontCard}>
              <X size={18} />
              <h3>Geen eigen kleuren</h3>
              <p>Gebruik alleen primary, reversed, flat, wit of monochroom uit het pakket.</p>
            </article>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <img src="/brand/dg-lockup-reversed.svg" alt="DG Webservices" />
          <p>Beeldmerk, woordmerk en iconen als zelfstandig vectorartwork.</p>
          <a href="/downloads/DG_Webservices_Logo_System.zip" download>
            Download logopakket <Download size={16} />
          </a>
        </div>
      </footer>
    </main>
  );
}
