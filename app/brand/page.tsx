import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Download, X } from "lucide-react";
import styles from "./brand.module.css";

export const metadata: Metadata = {
  title: "DG Webservices — officiële SVG-logo’s",
  description:
    "De vier officiële SVG-logo’s van DG Webservices voor lichte en donkere achtergronden.",
};

const files = {
  combinedLight: "DG-Webservices-Combined-Light-Mode-8192-1.svg",
  combinedDark: "DG-Webservices-Combined-Dark-Mode-8192.svg",
  iconLight: "DG-Webservices-Icon-Light-Mode-8192.svg",
  iconDark: "DG-Webservices-Icon-Dark-Mode-8192.svg",
} as const;

function DownloadLink({ file, children }: { file: string; children: ReactNode }) {
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
          <img src={`/brand/${files.combinedDark}`} alt="DG Webservices" />
        </Link>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Terug naar prototype
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={`${styles.shell} ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}><span /> Officieel logosysteem · 01</p>
            <h1>Vier bestanden.<br /><em>Eén vast merk.</em></h1>
            <p>
              De aangeleverde SVG-bestanden zijn de masterbestanden van DG
              Webservices. Vorm, onderlinge afstand en kleuren blijven exact
              behouden; alleen de contrastvariant wisselt per achtergrond.
            </p>
            <div className={styles.heroActions}>
              <a href="/downloads/DG_Webservices_Logo_System.zip" download>
                Download de vier SVG’s <Download size={17} />
              </a>
              <a href="#combined">Bekijk de toepassingen <ArrowUpRight size={17} /></a>
            </div>
          </div>
          <div className={styles.heroLogo}>
            <div className={styles.heroLogoGrid} aria-hidden="true" />
            <img src={`/brand/${files.iconLight}`} alt="DG Webservices beeldmerk" />
            <span>Officieel master artwork · transparant SVG</span>
          </div>
        </div>
      </section>

      <nav className={styles.subnav} aria-label="Logo-onderdelen">
        <div className={styles.shell}>
          <a href="#combined">Gecombineerd</a>
          <a href="#icons">Beeldmerk</a>
          <a href="#usage">Gebruik</a>
        </div>
      </nav>

      <section id="combined" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.index}>01 / GECOMBINEERD LOGO</p>
              <h2>De complete handtekening.</h2>
            </div>
            <p>
              Het beeldmerk, de scheidingslijn en het woordmerk staan in één
              vaste compositie. Gebruik Light Mode op lichte ondergronden en
              Dark Mode op navy, zwart of andere donkere vlakken.
            </p>
          </div>

          <div className={styles.lockupGrid}>
            <article className={styles.lockupLight}>
              <span>Light Mode / lichte achtergrond</span>
              <img
                src={`/brand/${files.combinedLight}`}
                alt="DG Webservices gecombineerd logo voor lichte achtergronden"
              />
              <div>
                <DownloadLink file={files.combinedLight}>Download Light Mode SVG</DownloadLink>
              </div>
            </article>
            <article className={styles.lockupDark}>
              <span>Dark Mode / donkere achtergrond</span>
              <img
                src={`/brand/${files.combinedDark}`}
                alt="DG Webservices gecombineerd logo voor donkere achtergronden"
              />
              <div>
                <DownloadLink file={files.combinedDark}>Download Dark Mode SVG</DownloadLink>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="icons" className={`${styles.section} ${styles.iceSection}`}>
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.index}>02 / BEELDMERK</p>
              <h2>Het losse DG-icoon.</h2>
            </div>
            <p>
              Voor profielbeelden, app-iconen, favicons en compacte plekken.
              Beide bestanden hebben een transparante, vierkante canvas met
              ruime veilige marge en behouden de officiële ruimte tussen D en G.
            </p>
          </div>

          <div className={styles.markGrid}>
            <article className={styles.lightPanel}>
              <span>Light Mode / navy + cobalt</span>
              <img
                src={`/brand/${files.iconLight}`}
                alt="DG Webservices beeldmerk voor lichte achtergronden"
              />
              <DownloadLink file={files.iconLight}>Download Light Mode SVG</DownloadLink>
            </article>
            <article className={styles.darkPanel}>
              <span>Dark Mode / wit + cobalt</span>
              <img
                src={`/brand/${files.iconDark}`}
                alt="DG Webservices beeldmerk voor donkere achtergronden"
              />
              <DownloadLink file={files.iconDark}>Download Dark Mode SVG</DownloadLink>
            </article>
          </div>
        </div>
      </section>

      <section id="usage" className={`${styles.section} ${styles.usageSection}`}>
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.index}>03 / GEBRUIK</p>
              <h2>Altijd de juiste variant.</h2>
            </div>
            <p>
              De bestanden zijn onbeperkt schaalbaar en hebben geen achtergrond,
              live tekst of externe lettertypen. Plaats ze zonder wijzigingen en
              geef het logo voldoende vrije ruimte.
            </p>
          </div>

          <div className={styles.usageGrid}>
            <article className={styles.clearspaceCard}>
              <span>Minimale vrije ruimte</span>
              <div className={styles.clearspaceVisual}>
                <i className={styles.measureTop}>X</i>
                <i className={styles.measureLeft}>X</i>
                <img src={`/brand/${files.iconLight}`} alt="Vrije ruimte rondom het DG-beeldmerk" />
              </div>
              <p>Houd rondom het artwork minimaal één verticale D-stam vrij.</p>
            </article>
            <article className={styles.sizeCard}>
              <span>Aanbevolen toepassingen</span>
              <div>
                <figure>
                  <img src={`/brand/${files.combinedLight}`} alt="" />
                  <figcaption>Header en documenten</figcaption>
                </figure>
                <figure>
                  <img src={`/brand/${files.iconLight}`} alt="" />
                  <figcaption>Profiel en app</figcaption>
                </figure>
                <figure>
                  <img src={`/brand/${files.iconLight}`} alt="" />
                  <figcaption>Favicon</figcaption>
                </figure>
              </div>
            </article>
          </div>

          <div className={styles.rulesGrid}>
            <article>
              <Check size={18} />
              <h3>Contrast kiezen</h3>
              <p>Light Mode hoort op lichte vlakken; Dark Mode hoort op donkere vlakken.</p>
            </article>
            <article className={styles.dontCard}>
              <X size={18} />
              <h3>Niet aanpassen</h3>
              <p>Verander de vorm, kleuren, verhoudingen of ruimte tussen de D en G niet.</p>
            </article>
            <article className={styles.dontCard}>
              <X size={18} />
              <h3>Geen achtergrond toevoegen</h3>
              <p>Laat de transparante SVG-canvas intact en plaats het logo op het bedoelde vlak.</p>
            </article>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <img src={`/brand/${files.combinedDark}`} alt="DG Webservices" />
          <p>Vier officiële SVG-masterbestanden voor iedere digitale toepassing.</p>
          <a href="/downloads/DG_Webservices_Logo_System.zip" download>
            Download SVG-set <Download size={16} />
          </a>
        </div>
      </footer>
    </main>
  );
}
