"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  CircleDot,
  Layers3,
  Menu,
  MonitorPlay,
  PanelsTopLeft,
  PlugZap,
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

type Project = {
  id: string;
  title: string;
  category: "Platforms" | "Websites" | "Portals";
  label: string;
  status: string;
  summary: string;
  challenge: string;
  solution: string;
  capabilities: string[];
  accent: string;
  preview: "screens" | "tournament" | "drive" | "kit" | "fitness" | "beauty" | "service" | "gift";
};

const projects: Project[] = [
  {
    id: "veyocast",
    title: "VeyoCast",
    category: "Platforms",
    label: "Narrowcasting SaaS",
    status: "Eigen product · in ontwikkeling",
    summary:
      "Een centraal platform waarmee sportverenigingen schermen, sponsors, live wedstrijddata en clubcontent vanuit één studio aansturen.",
    challenge:
      "Clubcommunicatie staat vaak verspreid over losse schermen, bestanden en handmatige updates.",
    solution:
      "Een schaalbare studio met schermgroepen, planning, live databronnen en slimme publicatieregels.",
    capabilities: ["Multi-tenant", "Screen groups", "Live data", "Sponsorregels", "Publisher"],
    accent: "#2563EB",
    preview: "screens",
  },
  {
    id: "haaglanden",
    title: "Haaglanden Toernooi",
    category: "Platforms",
    label: "Tournament operations",
    status: "Platformprototype",
    summary:
      "Een wedstrijdzakenplatform voor toernooileiding, clubs, teammanagers, scheidsrechters en supporters.",
    challenge:
      "Loting, wedstrijdplanning, spelerslijsten en communicatie vragen tijdens een toernooi om één betrouwbare waarheid.",
    solution:
      "Een rolgestuurde PWA waarin operatie en publieke beleving direct op elkaar aansluiten.",
    capabilities: ["Live loting", "Brackets", "Matchcentre", "Scheidsplanning", "PWA"],
    accent: "#10B981",
    preview: "tournament",
  },
  {
    id: "nxtdrive",
    title: "NXTDRIVE",
    category: "Platforms",
    label: "Rijschoolplatform",
    status: "SaaS-product",
    summary:
      "Een complete digitale omgeving voor intake, leerlingen, instructeurs, planning en dagelijkse operatie.",
    challenge:
      "Leads, lesplanning, voortgang en communicatie lopen bij rijscholen snel door elkaar.",
    solution:
      "Eén productervaring met een slimme intake, backoffice en rolgerichte cockpits.",
    capabilities: ["Intakeflow", "Planning", "Leerlingportaal", "Instructeurcockpit", "Backoffice"],
    accent: "#F59E0B",
    preview: "drive",
  },
  {
    id: "club-kit",
    title: "Club Kit Portal",
    category: "Portals",
    label: "Leden- & uitgifteportaal",
    status: "Maatwerkportaal",
    summary:
      "Een gestroomlijnde kledingflow van maatkeuze en betaling tot QR-uitgifte en nalevering.",
    challenge:
      "Honderden leden, verschillende maten, deelpakketten en betalingen zijn foutgevoelig in losse lijsten.",
    solution:
      "Een ouderportaal, backoffice en uitgiftescherm die dezelfde actuele status delen.",
    capabilities: ["OTP toegang", "iDEAL", "QR-uitgifte", "Voorraadstatus", "E-mailflows"],
    accent: "#3B82F6",
    preview: "kit",
  },
  {
    id: "absolutely-fit",
    title: "Absolutely Fit",
    category: "Websites",
    label: "Fitness experience",
    status: "Premium prototype",
    summary:
      "Een energieke merkervaring met een begeleide eerste-bezoekwizard, ledenportaal en visuele roosterbackoffice.",
    challenge:
      "Een fitnesswebsite moet tegelijk inspireren, duidelijk uitleggen en nieuwe bezoekers zonder frictie laten starten.",
    solution:
      "Een mobile-first ervaring waarin merk, keuzehulp, planning en beheer één geheel vormen.",
    capabilities: ["Bezoekwizard", "Lesrooster", "Ledenportaal", "Drag & drop", "Motion"],
    accent: "#EF4444",
    preview: "fitness",
  },
  {
    id: "beauty-by-sam",
    title: "PMU & Beauty by Sam",
    category: "Websites",
    label: "Booking experience",
    status: "Conversieconcept",
    summary:
      "Een hoogwaardige salonwebsite waarin behandeling, vertrouwen en direct boeken logisch samenkomen.",
    challenge:
      "Bezoekers willen eerst zekerheid over een behandeling en daarna zonder omwegen een geschikt moment kiezen.",
    solution:
      "Een treatment finder en geïntegreerde boekingsroute rondom de bestaande salonplanning.",
    capabilities: ["Treatment finder", "Salonized", "Aanbetaling", "Giftcards", "Reviews"],
    accent: "#D977A8",
    preview: "beauty",
  },
  {
    id: "les-riooltechniek",
    title: "Les Riooltechniek",
    category: "Websites",
    label: "Servicewebsite",
    status: "Premium prototype",
    summary:
      "Een lokale servicewebsite die vakmanschap, spoedhulp en duidelijke dienstverlening direct voelbaar maakt.",
    challenge:
      "Bij acute problemen moet een bezoeker binnen enkele seconden vertrouwen krijgen en de juiste actie vinden.",
    solution:
      "Sterke lokale positionering, echte projectbeelden en snelle routes naar dienst, regio en contact.",
    capabilities: ["Lokale SEO", "Dienststructuur", "Spoedflow", "Projectwerk", "Responsive"],
    accent: "#F97316",
    preview: "service",
  },
  {
    id: "fetti",
    title: "Fetti",
    category: "Platforms",
    label: "Group gifting",
    status: "Productconcept",
    summary:
      "Een vrolijke, social-first giftingervaring voor cadeaupotten, bijdragen, reveals en gezamenlijke momenten.",
    challenge:
      "Samen een cadeau regelen voelt vaak administratief terwijl het moment juist persoonlijk en feestelijk is.",
    solution:
      "Een soepele betaal- en revealflow die de organisatie eenvoudig houdt en de beleving centraal zet.",
    capabilities: ["Cadeaupotten", "Payments", "Reveal templates", "Sharing", "Dashboard"],
    accent: "#8B5CF6",
    preview: "gift",
  },
];

const services = [
  {
    number: "01",
    title: "Websites die overtuigen",
    text: "Een onderscheidende merkervaring, razendsnel gebouwd en ingericht rond vertrouwen, vindbaarheid en conversie.",
    icon: PanelsTopLeft,
    tags: ["Strategie", "UX/UI", "Next.js", "SEO"],
  },
  {
    number: "02",
    title: "Platforms die processen dragen",
    text: "SaaS-producten en backoffices die rollen, data en dagelijkse workflows terugbrengen naar één heldere omgeving.",
    icon: Layers3,
    tags: ["SaaS", "Dashboards", "Rollen", "Roadmap"],
  },
  {
    number: "03",
    title: "Portals die mensen verbinden",
    text: "Klant-, leden- en teamomgevingen die op ieder scherm logisch voelen en complexe handelingen eenvoudig maken.",
    icon: Smartphone,
    tags: ["PWA", "Portals", "Onboarding", "Notificaties"],
  },
  {
    number: "04",
    title: "Koppelingen die werk besparen",
    text: "Betalingen, planning, e-mail, CRM en externe databronnen betrouwbaar aan elkaar verbonden.",
    icon: PlugZap,
    tags: ["API", "Webhooks", "Mollie", "Integraties"],
  },
];

const process = [
  {
    step: "01",
    title: "Scherpstellen",
    text: "We brengen doel, gebruiker, kansen en technische grenzen terug tot een besluitbaar plan.",
  },
  {
    step: "02",
    title: "Ervaarbaar maken",
    text: "Je krijgt snel een realistisch prototype. Zo keur je niet alleen een idee, maar de echte ervaring.",
  },
  {
    step: "03",
    title: "Bouwen",
    text: "Het goedgekeurde product wordt degelijk, responsief en schaalbaar uitgewerkt.",
  },
  {
    step: "04",
    title: "Doorontwikkelen",
    text: "Na de eerste werkbare versie groeien we gericht verder op basis van gebruik en prioriteit.",
  },
];

function ProductPreview({ project }: { project: Project }) {
  const rows =
    project.preview === "tournament"
      ? ["TAVV — Duindorp", "Rijnsburg — DSV 2", "Finale — 16:30"]
      : project.preview === "screens"
        ? ["Clubhuis", "Bestuurskamer", "LED buiten"]
        : project.preview === "drive"
          ? ["Intake compleet", "Volgende les", "Voortgang"]
          : project.preview === "kit"
            ? ["Te halen", "Deellevering", "Afgerond"]
            : ["Nieuwe aanvraag", "Planning", "Bevestigd"];

  return (
    <div className="project-preview" style={{ "--project-accent": project.accent } as React.CSSProperties}>
      <div className="preview-glow" />
      <div className="preview-window">
        <div className="preview-topbar">
          <span />
          <span />
          <span />
          <div className="preview-title">{project.title}</div>
        </div>
        <div className="preview-layout">
          <aside>
            <div className="preview-logo"><CircleDot size={15} /></div>
            <i />
            <i />
            <i />
          </aside>
          <div className="preview-content">
            <div className="preview-kpis">
              <b />
              <b />
              <b />
            </div>
            <div className="preview-list">
              {rows.map((row, index) => (
                <div key={row}>
                  <span className="preview-index">0{index + 1}</span>
                  <strong>{row}</strong>
                  <em>{index === 0 ? "Live" : "Open"}</em>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="preview-mobile">
        <div className="mobile-notch" />
        <div className="mobile-chip" />
        <strong>{project.title.slice(0, 12)}</strong>
        <div className="mobile-chart">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="mobile-action" />
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Alles");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [projectType, setProjectType] = useState("Een website");
  const [projectGoal, setProjectGoal] = useState("Meer aanvragen");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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

  const filteredProjects = useMemo(
    () =>
      activeFilter === "Alles"
        ? projects
        : projects.filter((project) => project.category === activeFilter),
    [activeFilter],
  );

  const mailSubject = encodeURIComponent("Projectidee via dgwebservices.com");
  const mailBody = encodeURIComponent(
    "Hoi Danny,\n\nIk wil graag kennismaken over " +
      projectType.toLowerCase() +
      ".\nMijn belangrijkste doel: " +
      projectGoal.toLowerCase() +
      ".\n\nDit wil ik verder toelichten:\n",
  );
  const mailHref = "mailto:hello@dgwebservices.com?subject=" + mailSubject + "&body=" + mailBody;

  const closeMenu = () => setMenuOpen(false);

  return (
    <main id="top">
      <header className={scrolled ? "site-header is-scrolled" : "site-header"}>
        <div className="header-inner">
          <a href="#top" className="brand" aria-label="DG Webservices home" onClick={closeMenu}>
            <img src="/brand/dg-mark.svg" alt="" width="67" height="36" />
            <span>DG <strong>Webservices</strong></span>
          </a>

          <nav className="desktop-nav" aria-label="Hoofdnavigatie">
            <a href="#expertise">Expertise</a>
            <a href="#werk">Werk</a>
            <a href="#werkwijze">Werkwijze</a>
            <a href="#over">Over DG</a>
          </nav>

          <a href="#contact" className="header-cta">
            Bespreek jouw idee <ArrowUpRight size={16} />
          </a>

          <button
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Menu sluiten" : "Menu openen"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        <div id="mobile-navigation" className={menuOpen ? "mobile-nav is-open" : "mobile-nav"}>
          <nav aria-label="Mobiele navigatie">
            {[
              ["Expertise", "#expertise"],
              ["Werk", "#werk"],
              ["Werkwijze", "#werkwijze"],
              ["Over DG", "#over"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={closeMenu}>
                {label} <ArrowUpRight size={18} />
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="hero section-dark">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orb hero-orb-one" aria-hidden="true" />
        <div className="hero-orb hero-orb-two" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow eyebrow-light">
              <span />
              Digital product studio · Den Haag
            </p>
            <h1>
              Van idee naar digitaal product dat <em>écht werkt.</em>
            </h1>
            <p className="hero-lead">
              DG Webservices ontwerpt en bouwt websites, platforms en software
              die niet alleen mooi ogen, maar jouw organisatie aantoonbaar
              slimmer laten werken.
            </p>
            <div className="hero-actions">
              <a href="#werk" className="button button-primary">
                Bekijk geselecteerd werk <ArrowRight size={18} />
              </a>
              <a href="#contact" className="button button-ghost">
                Bespreek jouw idee
              </a>
            </div>
            <div className="hero-proof">
              <div className="proof-mark">
                <img src="/brand/dg-mark.svg" alt="" width="54" height="28" />
              </div>
              <p>
                <strong>Eén partner.</strong>
                <span>Van strategie en prototype tot bouw en doorontwikkeling.</span>
              </p>
            </div>
          </div>

          <div className="hero-stage" aria-label="Voorbeeld van een digitaal productecosysteem">
            <div className="stage-aura" aria-hidden="true" />
            <div className="stage-browser">
              <div className="stage-bar">
                <div><i /><i /><i /></div>
                <span>product.dgw</span>
                <b>Live</b>
              </div>
              <div className="stage-content">
                <aside>
                  <div className="stage-mark"><img src="/brand/dg-mark.svg" alt="" /></div>
                  <i className="active" />
                  <i />
                  <i />
                  <i />
                </aside>
                <div className="stage-main">
                  <div className="stage-welcome">
                    <span>Vandaag</span>
                    <strong>Alles onder controle.</strong>
                  </div>
                  <div className="stage-metrics">
                    <article>
                      <span>Actieve flows</span>
                      <strong>24</strong>
                      <b>+3</b>
                    </article>
                    <article>
                      <span>Publicaties</span>
                      <strong>128</strong>
                      <b>Live</b>
                    </article>
                    <article>
                      <span>Integraties</span>
                      <strong>08</strong>
                      <b>Stabiel</b>
                    </article>
                  </div>
                  <div className="stage-graph">
                    <div className="graph-heading"><span>Productactiviteit</span><b>Deze week</b></div>
                    <svg viewBox="0 0 520 155" role="img" aria-label="Stijgende activiteitsgrafiek">
                      <defs>
                        <linearGradient id="graphFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#2563EB" stopOpacity=".36" />
                          <stop offset="1" stopColor="#2563EB" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 126 C42 124 47 104 88 109 S145 92 181 95 S229 42 266 68 S320 93 355 51 S417 48 447 27 S488 20 520 7 V155 H0 Z" fill="url(#graphFill)" />
                      <path d="M0 126 C42 124 47 104 88 109 S145 92 181 95 S229 42 266 68 S320 93 355 51 S417 48 447 27 S488 20 520 7" fill="none" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="stage-phone">
              <div className="phone-top" />
              <span>Vandaag</span>
              <strong>Goedemiddag.</strong>
              <div className="phone-card">
                <i><MonitorPlay size={18} /></i>
                <p><b>Publicatie klaar</b><small>Alle schermen bijgewerkt</small></p>
              </div>
              <div className="phone-bars"><i /><i /><i /><i /><i /></div>
              <button type="button">Open studio</button>
            </div>
            <div className="floating-badge floating-badge-one">
              <Check size={16} />
              <p><b>Flow actief</b><span>Alles gekoppeld</span></p>
            </div>
            <div className="floating-badge floating-badge-two">
              <Braces size={17} />
              <p><b>API status</b><span>Operationeel</span></p>
            </div>
          </div>
        </div>
        <div className="hero-marquee" aria-label="Expertises">
          <div>
            {["Websites", "SaaS platforms", "Klantportalen", "PWA’s", "API koppelingen", "Backoffices"].map((item) => (
              <span key={item}>{item}<i>•</i></span>
            ))}
            {["Websites", "SaaS platforms", "Klantportalen", "PWA’s", "API koppelingen", "Backoffices"].map((item) => (
              <span key={item + "-copy"} aria-hidden="true">{item}<i>•</i></span>
            ))}
          </div>
        </div>
      </section>

      <section id="expertise" className="section services-section">
        <div className="container">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow"><span />Wat ik bouw</p>
              <h2>Digitale slagkracht,<br />van buiten én van binnen.</h2>
            </div>
            <p>
              Een sterke voorkant trekt aandacht. Een slim systeem erachter
              bespaart tijd. DG Webservices brengt die twee werelden samen in
              één product dat klopt.
            </p>
          </div>
          <div className="services-list">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article className="service-row" key={service.number}>
                  <span className="service-number">{service.number}</span>
                  <div className="service-icon"><Icon /></div>
                  <div className="service-copy">
                    <h3>{service.title}</h3>
                    <p>{service.text}</p>
                  </div>
                  <div className="service-tags">
                    {service.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <ArrowUpRight className="service-arrow" />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="werk" className="section work-section">
        <div className="container">
          <div className="section-heading work-heading">
            <div>
              <p className="eyebrow eyebrow-light"><span />Geselecteerd werk</p>
              <h2>Producten met een<br />eigen reden om te bestaan.</h2>
            </div>
            <p>
              Geen losse schermen om het mooi. Iedere oplossing begint bij een
              echt proces, een duidelijke gebruiker en een concreet doel.
            </p>
          </div>

          <div className="work-toolbar">
            <div className="filters" aria-label="Filter projecten">
              {["Alles", "Platforms", "Websites", "Portals"].map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={activeFilter === filter ? "active" : ""}
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <span>{filteredProjects.length.toString().padStart(2, "0")} projecten</span>
          </div>

          <div className="projects-grid">
            {filteredProjects.map((project, index) => (
              <article className={index % 3 === 0 ? "project-card project-card-wide" : "project-card"} key={project.id}>
                <button type="button" onClick={() => setSelectedProject(project)} aria-label={"Bekijk case " + project.title}>
                  <ProductPreview project={project} />
                  <div className="project-meta">
                    <div>
                      <p>{project.label}</p>
                      <h3>{project.title}</h3>
                    </div>
                    <span><ArrowUpRight /></span>
                  </div>
                  <p className="project-summary">{project.summary}</p>
                  <div className="project-status"><i style={{ background: project.accent }} />{project.status}</div>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section system-section">
        <div className="container system-grid">
          <div className="system-copy">
            <p className="eyebrow"><span />Eén samenhangend systeem</p>
            <h2>De website is vaak pas het begin.</h2>
            <p>
              De echte winst ontstaat wanneer de voorkant, backoffice,
              betalingen, planning en communicatie dezelfde taal spreken.
              Daarom ontwerp ik altijd met het complete proces in gedachten.
            </p>
            <ul>
              {[
                "Minder handmatig overtypen en losse lijstjes",
                "Duidelijke rollen, statussen en verantwoordelijkheden",
                "Een consistente ervaring voor klant én beheerder",
                "Een technische basis die kan doorgroeien",
              ].map((item) => (
                <li key={item}><Check size={17} />{item}</li>
              ))}
            </ul>
            <a href="#contact" className="text-link">Vertel waar het nu vastloopt <ArrowRight size={17} /></a>
          </div>
          <div className="system-visual" aria-label="Schema van gekoppelde digitale onderdelen">
            <div className="system-core">
              <img src="/brand/dg-mark.svg" alt="" />
              <span>Product core</span>
            </div>
            {[
              ["Website", PanelsTopLeft],
              ["Backoffice", Workflow],
              ["Mobiel", Smartphone],
              ["Integraties", PlugZap],
            ].map(([label, Icon], index) => {
              const SystemIcon = Icon as typeof PanelsTopLeft;
              return (
                <div className={"system-node node-" + (index + 1)} key={label as string}>
                  <SystemIcon />
                  <span>{label as string}</span>
                </div>
              );
            })}
            <svg className="system-lines" viewBox="0 0 620 500" aria-hidden="true">
              <path d="M310 250 C220 250 210 105 104 105" />
              <path d="M310 250 C402 250 412 105 516 105" />
              <path d="M310 250 C220 250 210 395 104 395" />
              <path d="M310 250 C402 250 412 395 516 395" />
            </svg>
          </div>
        </div>
      </section>

      <section id="werkwijze" className="section process-section">
        <div className="container">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow"><span />Werkwijze</p>
              <h2>Strak georganiseerd.<br />Ruimte om te ontdekken.</h2>
            </div>
            <p>
              Geen maanden praten voordat je iets ziet. We maken ideeën snel
              tastbaar, nemen gerichte beslissingen en bouwen daarna met focus
              door.
            </p>
          </div>
          <div className="process-grid">
            {process.map((item, index) => (
              <article key={item.step}>
                <div className="process-top">
                  <span>{item.step}</span>
                  {index < process.length - 1 && <i />}
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="over" className="section about-section">
        <div className="container about-grid">
          <div className="about-statement">
            <p>“</p>
            <h2>Ik bouw alsof ik straks zelf met het product moet werken.</h2>
          </div>
          <div className="about-copy">
            <p className="eyebrow eyebrow-light"><span />Persoonlijk betrokken</p>
            <h3>Korte lijnen, eigenaarschap en een scherpe blik op wat beter kan.</h3>
            <p>
              DG Webservices combineert ontwerp, techniek en praktijkkennis.
              Niet vanuit een ivoren toren, maar dicht op de organisatie en de
              mensen die het product dagelijks gaan gebruiken.
            </p>
            <div className="about-points">
              <span><Check />Direct contact</span>
              <span><Check />Heldere keuzes</span>
              <span><Check />Zichtbare voortgang</span>
              <span><Check />Gebouwd om verder te groeien</span>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="section contact-section">
        <div className="contact-orb" aria-hidden="true" />
        <div className="container contact-grid">
          <div className="contact-copy">
            <p className="eyebrow eyebrow-light"><span />Klaar voor de volgende stap?</p>
            <h2>Laat zien waar je naartoe wilt. Dan maken we het concreet.</h2>
            <p>
              Kies kort wat je voor ogen hebt. Je e-mail wordt alvast met de
              juiste context voorbereid; jij voegt alleen nog de details toe.
            </p>
            <div className="contact-location">
              <span>DG</span>
              <p><b>DG Webservices</b><small>Den Haag · werkt door heel Nederland</small></p>
            </div>
          </div>
          <div className="project-starter">
            <div className="starter-step">
              <p><span>01</span>Wat wil je maken?</p>
              <div className="choice-grid">
                {["Een website", "Een platform", "Een portal", "Een koppeling"].map((choice) => (
                  <button
                    type="button"
                    key={choice}
                    className={projectType === choice ? "active" : ""}
                    aria-pressed={projectType === choice}
                    onClick={() => setProjectType(choice)}
                  >
                    {projectType === choice && <Check size={15} />}{choice}
                  </button>
                ))}
              </div>
            </div>
            <div className="starter-step">
              <p><span>02</span>Wat moet het vooral opleveren?</p>
              <div className="choice-grid">
                {["Meer aanvragen", "Minder handwerk", "Meer overzicht", "Een nieuw product"].map((choice) => (
                  <button
                    type="button"
                    key={choice}
                    className={projectGoal === choice ? "active" : ""}
                    aria-pressed={projectGoal === choice}
                    onClick={() => setProjectGoal(choice)}
                  >
                    {projectGoal === choice && <Check size={15} />}{choice}
                  </button>
                ))}
              </div>
            </div>
            <a className="starter-submit" href={mailHref}>
              Start het gesprek <ArrowUpRight size={18} />
            </a>
            <p className="starter-note">Opent jouw e-mail met deze keuzes alvast ingevuld.</p>
          </div>
        </div>
      </section>

      <footer>
        <div className="container footer-top">
          <a href="#top" className="brand footer-brand" aria-label="Naar boven">
            <img src="/brand/dg-mark.svg" alt="" width="72" height="39" />
            <span>DG <strong>Webservices</strong></span>
          </a>
          <p>Websites. Platforms. Software.<br />Gebouwd om vooruit te bewegen.</p>
          <nav aria-label="Footernavigatie">
            <a href="#expertise">Expertise</a>
            <a href="#werk">Werk</a>
            <a href="#werkwijze">Werkwijze</a>
            <a href="mailto:hello@dgwebservices.com">E-mail</a>
          </nav>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 DG Webservices</span>
          <span>Den Haag, Nederland</span>
          <a href="mailto:hello@dgwebservices.com">hello@dgwebservices.com</a>
        </div>
      </footer>

      <Dialog open={Boolean(selectedProject)} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="case-dialog" showCloseButton>
          {selectedProject && (
            <>
              <ProductPreview project={selectedProject} />
              <DialogHeader>
                <div className="dialog-label">{selectedProject.label}<i style={{ background: selectedProject.accent }} /></div>
                <DialogTitle>{selectedProject.title}</DialogTitle>
                <DialogDescription>{selectedProject.summary}</DialogDescription>
              </DialogHeader>
              <div className="dialog-columns">
                <div>
                  <span>De uitdaging</span>
                  <p>{selectedProject.challenge}</p>
                </div>
                <div>
                  <span>De richting</span>
                  <p>{selectedProject.solution}</p>
                </div>
              </div>
              <div className="dialog-capabilities">
                {selectedProject.capabilities.map((capability) => <span key={capability}>{capability}</span>)}
              </div>
              <a href="#contact" className="dialog-cta" onClick={() => setSelectedProject(null)}>
                Bespreek een vergelijkbaar idee <ArrowRight size={17} />
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
