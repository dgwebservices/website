"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  CircleDot,
  Layers3,
  LayoutDashboard,
  Menu,
  Monitor,
  MousePointerClick,
  PanelsTopLeft,
  PlugZap,
  RefreshCw,
  Smartphone,
  Workflow,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import styles from "./home.module.css";

type Service = {
  id: string;
  number: string;
  label: string;
  title: string;
  summary: string;
  useful: string;
  tags: string[];
  icon: typeof PanelsTopLeft;
  tone: "blue" | "navy" | "ice" | "white";
};

const services: Service[] = [
  {
    id: "websites",
    number: "01",
    label: "Websites",
    title: "Websites die richting geven",
    summary:
      "Een onderscheidende website waarin uitstraling, inhoud en gebruiksgemak één geheel vormen.",
    useful:
      "Voor een nieuwe positionering, een verouderde website of een gerichte campagne die echt moet presteren.",
    tags: ["Responsive ontwerp", "Contentbeheer", "Vindbaarheid", "Performance"],
    icon: PanelsTopLeft,
    tone: "blue",
  },
  {
    id: "platforms",
    number: "02",
    label: "Webapplicaties",
    title: "Software op maat van je proces",
    summary:
      "Eén digitale omgeving rond jouw gebruikers, dagelijkse werk en concrete doelen.",
    useful:
      "Wanneer standaardsoftware niet goed aansluit of handmatig werk ongemerkt blijft groeien.",
    tags: ["Gebruikersaccounts", "Rollen en rechten", "Dashboards", "Werkstromen"],
    icon: Layers3,
    tone: "navy",
  },
  {
    id: "portalen",
    number: "03",
    label: "Portalen",
    title: "Alles voor klanten en leden op één plek",
    summary:
      "Een veilige, prettige omgeving voor gegevens, aanvragen, documenten, betalingen en contact.",
    useful:
      "Wanneer informatie nu verspreid staat over e-mail, losse bestanden en verschillende systemen.",
    tags: ["Veilig inloggen", "Profielen", "Documenten", "Betalingen"],
    icon: Smartphone,
    tone: "ice",
  },
  {
    id: "backoffice",
    number: "04",
    label: "Backoffice",
    title: "Rust en overzicht achter de schermen",
    summary:
      "Een heldere beheeromgeving voor gegevens, planning, aanvragen, statussen en dagelijkse acties.",
    useful:
      "Wanneer beheer foutgevoelig, tijdrovend of lastig overdraagbaar is geworden.",
    tags: ["Databeheer", "Planning", "Statusflows", "Rapportages"],
    icon: LayoutDashboard,
    tone: "white",
  },
  {
    id: "koppelingen",
    number: "05",
    label: "Koppelingen",
    title: "Systemen die vanzelf samenwerken",
    summary:
      "Informatie komt automatisch op de juiste plek, zonder dubbel invoeren of losse tussenstappen.",
    useful:
      "Wanneer dezelfde gegevens op meerdere plekken worden ingevoerd, gecontroleerd of bijgehouden.",
    tags: ["Datakoppelingen", "Automatisering", "Import en export", "E-mailflows"],
    icon: PlugZap,
    tone: "ice",
  },
  {
    id: "conversie",
    number: "06",
    label: "Slimme flows",
    title: "Van eerste klik tot bevestiging",
    summary:
      "Begeleide stappen voor reserveren, inschrijven, aanvragen en betalen zonder onnodige drempels.",
    useful:
      "Wanneer bezoekers afhaken of medewerkers iedere aanvraag handmatig moeten opvolgen.",
    tags: ["Slimme formulieren", "Stappenplannen", "Beschikbaarheid", "Bevestigingen"],
    icon: MousePointerClick,
    tone: "white",
  },
  {
    id: "schermen",
    number: "07",
    label: "Schermcommunicatie",
    title: "De juiste content op ieder scherm",
    summary:
      "Centraal beheer voor schermen op locaties, met planning, groepen en actuele informatie.",
    useful:
      "Voor sportlocaties, ontvangstruimtes, horeca, evenementen en interne communicatie.",
    tags: ["Centraal beheer", "Schermgroepen", "Tijdschema’s", "Live informatie"],
    icon: Monitor,
    tone: "navy",
  },
  {
    id: "beheer",
    number: "08",
    label: "Beheer en groei",
    title: "Blijven verbeteren na de lancering",
    summary:
      "Zorgvuldig beheer en gerichte doorontwikkeling houden je digitale product actueel en betrouwbaar.",
    useful:
      "Wanneer continuïteit belangrijk is en het product stap voor stap moet blijven meegroeien.",
    tags: ["Monitoring", "Back-ups", "Updates", "Ondersteuning"],
    icon: RefreshCw,
    tone: "blue",
  },
];

const process = [
  {
    number: "01",
    title: "Scherpstellen",
    text: "We brengen doel, gebruikers en prioriteiten terug tot een helder plan.",
  },
  {
    number: "02",
    title: "Ervaarbaar maken",
    text: "Je beoordeelt een realistisch prototype in plaats van alleen losse ideeën.",
  },
  {
    number: "03",
    title: "Bouwen",
    text: "Het gekozen ontwerp wordt snel, responsief en degelijk uitgewerkt.",
  },
  {
    number: "04",
    title: "Verder brengen",
    text: "Na de lancering verbeteren we gericht op basis van gebruik en nieuwe kansen.",
  },
];

const capabilityLine = [
  "Websites",
  "Portalen",
  "Webapplicaties",
  "Backoffice",
  "Koppelingen",
  "Schermcommunicatie",
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [projectType, setProjectType] = useState("Een website");
  const [projectGoal, setProjectGoal] = useState("Meer aanvragen");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const mailSubject = encodeURIComponent("Kennismaking via dgwebservices.com");
  const mailBody = encodeURIComponent(
    `Hoi Danny,\n\nIk wil graag kennismaken over ${projectType.toLowerCase()}.\nMijn belangrijkste doel: ${projectGoal.toLowerCase()}.\n\nDit wil ik verder toelichten:\n`,
  );
  const mailHref = `mailto:hello@dgwebservices.com?subject=${mailSubject}&body=${mailBody}`;
  const closeMenu = () => setMenuOpen(false);

  return (
    <main id="top" className={styles.page}>
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
        <div className={styles.headerInner}>
          <a href="#top" className={styles.logo} aria-label="DG Webservices home" onClick={closeMenu}>
            <img
              src="/brand/DG-Webservices-Combined-Light-Mode-8192-1.svg"
              alt="DG Webservices"
              width="230"
              height="58"
            />
          </a>

          <nav className={styles.desktopNav} aria-label="Hoofdnavigatie">
            <a href="#diensten">Diensten</a>
            <a href="#mogelijkheden">Mogelijkheden</a>
            <a href="#werkwijze">Werkwijze</a>
            <a href="#over">Over</a>
          </nav>

          <a href="#contact" className={styles.headerCta}>
            Start een gesprek <ArrowUpRight size={15} />
          </a>

          <button
            className={styles.menuButton}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Menu sluiten" : "Menu openen"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div id="mobile-navigation" className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`}>
          <nav aria-label="Mobiele navigatie">
            {[
              ["Diensten", "#diensten"],
              ["Mogelijkheden", "#mogelijkheden"],
              ["Werkwijze", "#werkwijze"],
              ["Over", "#over"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={closeMenu}>
                {label} <ArrowUpRight size={18} />
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroBlob} aria-hidden="true" />
        <div className={`${styles.shell} ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>
              <span /> Ontwerp · ontwikkeling · doorontwikkeling
            </p>
            <h1>
              Digitaal gemaakt.
              <span>Helder geregeld.</span>
            </h1>
            <p className={styles.heroLead}>
              Websites, portalen en webapplicaties die prettig werken, processen
              eenvoudiger maken en klaar zijn om met je organisatie mee te groeien.
            </p>
            <div className={styles.heroActions}>
              <a href="#diensten" className={`${styles.button} ${styles.buttonPrimary}`}>
                Bekijk de diensten <ArrowRight size={18} />
              </a>
              <a href="#contact" className={`${styles.button} ${styles.buttonSecondary}`}>
                Bespreek je idee
              </a>
            </div>
            <div className={styles.heroPromise}>
              <span><Check size={14} /> Persoonlijk contact</span>
              <span><Check size={14} /> Van ontwerp tot beheer</span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroPhotoWrap}>
              <img
                src="/assets/hero-digital-studio.png"
                alt="Digitale interfaces op desktop, laptop, tablet en telefoon"
              />
              <div className={styles.photoOverlay} aria-hidden="true" />
              <div className={styles.photoCaption}>
                <span>Van idee naar dagelijks gebruik</span>
                <strong>Eén consistente ervaring.</strong>
              </div>
            </div>
            <div className={styles.blueCard}>
              <Workflow size={23} />
              <p><span>De hele digitale flow</span><b>Voorkant en beheer in één lijn</b></p>
            </div>
            <div className={styles.statusCard}>
              <span><CircleDot size={15} /> Betrouwbaar</span>
              <strong>Ontworpen om verder te groeien.</strong>
            </div>
            <div className={styles.heroMark} aria-hidden="true">
              <img src="/brand/DG-Webservices-Icon-Dark-Mode-8192.svg" alt="" />
            </div>
          </div>
        </div>

        <div className={styles.capabilityStrip} aria-label="Diensten">
          <div>
            {[...capabilityLine, ...capabilityLine].map((item, index) => (
              <span key={`${item}-${index}`}>{item}<i>✦</i></span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.statement}>
        <div className={styles.shell}>
          <p className={styles.sectionIndex}>01 / WAT WE MAKEN</p>
          <div className={styles.statementGrid}>
            <h2>
              Mooi aan de voorkant.
              <span>Slim aan de achterkant.</span>
            </h2>
            <div>
              <p>
                Een sterke digitale oplossing voelt eenvoudig, juist omdat er
                achter de schermen goed over iedere stap is nagedacht.
              </p>
              <a href="#mogelijkheden">Bekijk wat er mogelijk is <ArrowRight size={17} /></a>
            </div>
          </div>
        </div>
      </section>

      <section id="diensten" className={styles.servicesSection}>
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}><span /> Diensten</p>
              <h2>Wat we voor je<br />kunnen bouwen.</h2>
            </div>
            <p>
              Van een sterke website tot een complete digitale werkomgeving.
              Kies een dienst om de mogelijkheden te bekijken.
            </p>
          </div>

          <div className={styles.serviceGrid}>
            {services.map((service, index) => {
              const Icon = service.icon;
              const toneClass = {
                blue: styles.toneBlue,
                navy: styles.toneNavy,
                ice: styles.toneIce,
                white: styles.toneWhite,
              }[service.tone];
              const sizeClass = [styles.service1, styles.service2, styles.service3, styles.service4, styles.service5, styles.service6, styles.service7, styles.service8][index];
              return (
                <article className={`${styles.serviceCard} ${toneClass} ${sizeClass}`} key={service.id}>
                  <button type="button" onClick={() => setSelectedService(service)} aria-label={`Bekijk dienst ${service.label}`}>
                    <div className={styles.serviceTop}>
                      <span>{service.number}</span>
                      <div><Icon size={21} /></div>
                    </div>
                    <p className={styles.serviceLabel}>{service.label}</p>
                    <h3>{service.title}</h3>
                    <p className={styles.serviceSummary}>{service.summary}</p>
                    <div className={styles.serviceBottom}>
                      <span>Bekijk mogelijkheden</span>
                      <i><ArrowUpRight size={17} /></i>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="mogelijkheden" className={styles.possibilitiesSection}>
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}><span /> Mogelijkheden</p>
              <h2>Losse onderdelen.<br />Eén sterke flow.</h2>
            </div>
            <p>
              Iedere gebruiker ziet precies wat nodig is, terwijl informatie en
              acties achter de schermen logisch met elkaar verbonden blijven.
            </p>
          </div>

          <article className={`${styles.feature} ${styles.featureSport}`}>
            <div className={styles.featureImage}>
              <img
                src="/assets/sports-platforms.png"
                alt="Digitale wedstrijdinformatie en schermcommunicatie in een sportomgeving"
              />
              <div className={styles.featureImageShade} aria-hidden="true" />
              <div className={styles.imageTags}>
                <span>Planning</span><span>Live informatie</span><span>Schermen</span>
              </div>
            </div>
            <div className={styles.featureCopy}>
              <p className={styles.featureNumber}>01 / SPORT & EVENEMENTEN</p>
              <h3>Alles rond planning, wedstrijd en locatie in één duidelijke flow.</h3>
              <p>
                Van inschrijving en planning tot uitslagen, meldingen en actuele
                informatie op web, mobiel en gekoppelde schermen.
              </p>
              <ul>
                <li><Check size={15} /> Wedstrijd- en evenementbeheer</li>
                <li><Check size={15} /> Eigen omgevingen per rol</li>
                <li><Check size={15} /> Live standen en communicatie</li>
                <li><Check size={15} /> Inschrijvingen en betalingen</li>
              </ul>
              <a href="#contact">Bespreek een oplossing <ArrowRight size={17} /></a>
            </div>
          </article>

          <article className={`${styles.feature} ${styles.featureConnected}`}>
            <div className={styles.featureCopy}>
              <p className={styles.featureNumber}>02 / VERBONDEN ORGANISATIE</p>
              <h3>De website is vaak pas het begin.</h3>
              <p>
                De echte winst ontstaat wanneer de voorkant, het klantportaal,
                beheer, planning en communicatie dezelfde informatie gebruiken.
              </p>
              <ul>
                <li><Check size={15} /> Minder dubbel en handmatig werk</li>
                <li><Check size={15} /> Duidelijke rollen en statussen</li>
                <li><Check size={15} /> Eén ervaring voor klant en medewerker</li>
                <li><Check size={15} /> Klaar voor toekomstige uitbreiding</li>
              </ul>
              <a href="#contact">Vertel waar het vastloopt <ArrowRight size={17} /></a>
            </div>
            <div className={styles.featureImage}>
              <img
                src="/assets/connected-business.png"
                alt="Portaal, backoffice en mobiele omgeving als één verbonden systeem"
              />
              <div className={styles.featureImageShade} aria-hidden="true" />
              <div className={styles.connectedBadge}>
                <Braces size={18} />
                <span><small>Alles verbonden</small><b>Eén bron. Iedere omgeving actueel.</b></span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="werkwijze" className={styles.processSection}>
        <div className={styles.shell}>
          <div className={styles.processIntro}>
            <p className={styles.kicker}><span /> Werkwijze</p>
            <h2>Eerst zien.<br />Dan beslissen.</h2>
            <p>
              Geen maanden praten voordat er iets te beoordelen is. We maken de
              oplossing vroeg tastbaar en bouwen daarna gericht door.
            </p>
          </div>
          <div className={styles.processList}>
            {process.map((item) => (
              <article key={item.number}>
                <span>{item.number}</span>
                <div><h3>{item.title}</h3><p>{item.text}</p></div>
                <ArrowUpRight size={19} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="over" className={styles.aboutSection}>
        <div className={styles.aboutGlow} aria-hidden="true" />
        <div className={`${styles.shell} ${styles.aboutGrid}`}>
          <div className={styles.aboutMark}>
            <img src="/brand/DG-Webservices-Icon-Dark-Mode-8192.svg" alt="DG Webservices" />
          </div>
          <div className={styles.aboutCopy}>
            <p className={styles.kicker}><span /> Persoonlijk betrokken</p>
            <h2>Gebouwd alsof we er morgen zelf mee moeten werken.</h2>
            <p>
              DG Webservices combineert ontwerp, techniek en praktijkkennis.
              Met korte lijnen, zichtbare voortgang en aandacht voor de mensen
              die de oplossing dagelijks gaan gebruiken.
            </p>
            <div className={styles.aboutPoints}>
              <span><Check size={15} /> Direct contact</span>
              <span><Check size={15} /> Heldere keuzes</span>
              <span><Check size={15} /> Zichtbare voortgang</span>
              <span><Check size={15} /> Klaar om door te groeien</span>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className={styles.contactSection}>
        <div className={styles.contactGridPattern} aria-hidden="true" />
        <div className={`${styles.shell} ${styles.contactGrid}`}>
          <div className={styles.contactCopy}>
            <p className={styles.kicker}><span /> Een idee of proces dat beter kan?</p>
            <h2>Laten we er iets werkbaars van maken.</h2>
            <p>
              Kies kort wat je voor ogen hebt. Je e-mail wordt alvast met de
              juiste context voorbereid; jij voegt alleen de details toe.
            </p>
            <div className={styles.contactProof}>
              <span><Check size={14} /> Persoonlijk contact</span>
              <span><Check size={14} /> Heldere aanpak</span>
              <span><Check size={14} /> Van ontwerp tot beheer</span>
            </div>
          </div>

          <div className={styles.projectStarter}>
            <div className={styles.starterStep}>
              <p><span>01</span>Wat wil je maken?</p>
              <div className={styles.choiceGrid}>
                {["Een website", "Een webapplicatie", "Een portaal", "Een koppeling"].map((choice) => (
                  <button
                    type="button"
                    key={choice}
                    className={projectType === choice ? styles.choiceActive : ""}
                    aria-pressed={projectType === choice}
                    onClick={() => setProjectType(choice)}
                  >
                    {projectType === choice && <Check size={14} />}{choice}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.starterStep}>
              <p><span>02</span>Wat moet het vooral opleveren?</p>
              <div className={styles.choiceGrid}>
                {["Meer aanvragen", "Minder handwerk", "Meer overzicht", "Een nieuwe dienst"].map((choice) => (
                  <button
                    type="button"
                    key={choice}
                    className={projectGoal === choice ? styles.choiceActive : ""}
                    aria-pressed={projectGoal === choice}
                    onClick={() => setProjectGoal(choice)}
                  >
                    {projectGoal === choice && <Check size={14} />}{choice}
                  </button>
                ))}
              </div>
            </div>
            <a className={styles.starterSubmit} href={mailHref}>
              Start het gesprek <ArrowUpRight size={18} />
            </a>
            <p className={styles.starterNote}>Opent je e-mail met deze keuzes ingevuld.</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerTop}`}>
          <a href="#top" className={styles.footerLogo} aria-label="Naar boven">
            <img src="/brand/DG-Webservices-Combined-Dark-Mode-8192.svg" alt="DG Webservices" />
          </a>
          <p>Websites, portalen en webapplicaties.<br />Helder ontworpen. Zorgvuldig gebouwd.</p>
          <nav aria-label="Footernavigatie">
            <a href="#diensten">Diensten</a>
            <a href="#mogelijkheden">Mogelijkheden</a>
            <a href="#werkwijze">Werkwijze</a>
            <Link href="/brand">Merkconcept</Link>
            <a href="mailto:hello@dgwebservices.com">E-mail</a>
          </nav>
        </div>
        <div className={`${styles.shell} ${styles.footerBottom}`}>
          <span>© 2026 DG Webservices</span>
          <span>Den Haag · Nederland</span>
          <a href="mailto:hello@dgwebservices.com">hello@dgwebservices.com</a>
        </div>
      </footer>

      <Dialog open={Boolean(selectedService)} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className={styles.serviceDialog} showCloseButton>
          {selectedService && (
            <>
              <div className={styles.dialogVisual}>
                <span>{selectedService.number}</span>
                <selectedService.icon size={52} />
                <i aria-hidden="true" />
              </div>
              <DialogHeader className={styles.dialogHeader}>
                <p>{selectedService.label}</p>
                <DialogTitle>{selectedService.title}</DialogTitle>
                <DialogDescription>{selectedService.summary}</DialogDescription>
              </DialogHeader>
              <div className={styles.dialogUseful}>
                <span>Wanneer dit van waarde is</span>
                <p>{selectedService.useful}</p>
              </div>
              <div className={styles.dialogTags}>
                {selectedService.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <a href="#contact" className={styles.dialogCta} onClick={() => setSelectedService(null)}>
                Bespreek deze dienst <ArrowRight size={17} />
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
