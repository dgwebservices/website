export type ServiceSlug =
  | "websites"
  | "webapplicaties"
  | "portalen"
  | "backoffice"
  | "koppelingen"
  | "slimme-flows"
  | "schermcommunicatie"
  | "beheer-en-groei";

export type Service = {
  slug: ServiceSlug;
  number: string;
  navigationLabel: string;
  cardTitle: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  lead: string;
  primaryCta: string;
  problemSignals: string[];
  outcomes: string[];
  capabilities: string[];
  deliverables: string[];
  attentionPoints: string[];
  relatedServiceSlugs: ServiceSlug[];
  faq: Array<{ question: string; answer: string }>;
  tone: "blue" | "navy" | "ice" | "white";
  lastReviewed: string;
};

export const services: Service[] = [
  {
    slug: "websites",
    number: "01",
    navigationLabel: "Websites",
    cardTitle: "Websites die richting geven",
    seoTitle: "Website laten maken in Den Haag | DG Webservices",
    metaDescription: "Van structuur en ontwerp tot bouw en beheer: laat een duidelijke, toegankelijke website maken die past bij je organisatie en doelen.",
    h1: "Een website die helder werkt.",
    lead: "Voor een nieuwe positionering, een verouderde website of een aanbod dat een duidelijker verhaal verdient.",
    primaryCta: "Bespreek je website",
    problemSignals: ["De navigatie helpt bezoekers niet snel genoeg verder.", "Inhoud is versnipperd of lastig actueel te houden.", "Uitstraling en dagelijkse praktijk lopen niet meer gelijk.", "Snelheid, toegankelijkheid of vindbaarheid vraagt aandacht."],
    outcomes: ["Een logische route van vraag naar actie.", "Een herkenbare, responsieve visuele lijn.", "Herbruikbare paginaopbouw voor groeiende content.", "Een beheersbare basis voor meten en verbeteren."],
    capabilities: ["Informatiearchitectuur", "Responsive ontwerp", "Contentbeheer", "Aanvraagflows", "Meertaligheid waar nodig", "Structured data", "Redirects en migratie", "Prestatiebewaking"],
    deliverables: ["Afgesproken paginatemplates en componenten", "Contentstructuur en redactionele formats", "Ingevulde content binnen de vastgelegde scope", "Test-, overdrachts- en beheerinformatie"],
    attentionPoints: ["Toegankelijk vanaf de eerste ontwerpkeuze", "Privacyvriendelijke formulieren en meting", "Vaste mediamaten en kleine clientbelasting", "Migratie zonder onnodig verlies van bestaande waarde"],
    relatedServiceSlugs: ["slimme-flows", "koppelingen", "beheer-en-groei"],
    faq: [
      { question: "Moet een bestaande website helemaal opnieuw?", answer: "Niet automatisch. We onderzoeken eerst welke inhoud, routes en techniek nog waarde hebben en vernieuwen gericht waar dat beter werkt." },
      { question: "Kan bestaande content worden meegenomen?", answer: "Ja, binnen een afgesproken migratiescope. Vooraf bepalen we wat blijft, wordt herschreven, samengevoegd of omgeleid." },
      { question: "Is meertaligheid mogelijk?", answer: "Ja, wanneer taalbeheer, vertaling en URL-structuur onderdeel zijn van de projectafspraken." },
    ],
    tone: "blue",
    lastReviewed: "2026-09-03",
  },
  {
    slug: "webapplicaties",
    number: "02",
    navigationLabel: "Webapplicaties",
    cardTitle: "Software rond je proces",
    seoTitle: "Webapplicaties op maat | DG Webservices",
    metaDescription: "Laat een webapplicatie maken rond je processen, gebruikers en gegevens, van eerste opzet tot een beheersbare oplossing die kan meegroeien.",
    h1: "Webapplicaties rond jouw manier van werken.",
    lead: "Maatwerk voor processen waarin standaardmiddelen te veel omwegen, fouten of overdracht veroorzaken.",
    primaryCta: "Bespreek je webapplicatie",
    problemSignals: ["Een kernproces leeft in losse bestanden en inboxen.", "Gebruikers missen passende rollen, statussen of overzichten.", "Uitzonderingen zijn niet goed te verwerken in standaardsoftware.", "Een kleine kernversie moet later gecontroleerd kunnen uitbreiden."],
    outcomes: ["Dagelijkse taken op één rustige werkplek.", "Duidelijke rechten, statussen en vervolgstappen.", "Informatie vindbaar op het moment dat die nodig is.", "Een gefaseerde oplossing met beheersbare uitbreidingen."],
    capabilities: ["Accounts en rollen", "Werkstromen", "Dashboards", "Zoeken en filteren", "Documenten", "Meldingen", "Exports", "Auditgeschiedenis"],
    deliverables: ["Kernprototype en rollenmatrix", "Nu/later-afbakening", "Geteste gebruikersflows", "Technische en functionele overdracht"],
    attentionPoints: ["Minimale gegevensverwerking", "Veilige rechten per taak", "Lege, fout- en herstelsituaties", "Mobiel gebruik waar de praktijk dat vraagt"],
    relatedServiceSlugs: ["portalen", "backoffice", "koppelingen"],
    faq: [
      { question: "Wanneer is maatwerk logisch?", answer: "Wanneer een belangrijk proces structureel niet past in bestaande middelen en de waarde van een gerichte oplossing opweegt tegen bouw en beheer." },
      { question: "Kan de oplossing klein beginnen?", answer: "Ja. We leggen een bruikbare kern vast en maken latere uitbreidingen zichtbaar zonder ze te vroeg mee te bouwen." },
      { question: "Hoe worden rollen en rechten bepaald?", answer: "Per gebruikerstaak bepalen we welke informatie en acties nodig zijn. Die keuzes worden zichtbaar getest in het prototype." },
    ],
    tone: "navy",
    lastReviewed: "2026-09-03",
  },
  {
    slug: "portalen",
    number: "03",
    navigationLabel: "Portalen",
    cardTitle: "Alles op één plek",
    seoTitle: "Portalen voor klanten, leden en teams | DG Webservices",
    metaDescription: "Een helder portaal voor klanten, leden, medewerkers of partners, met passende toegang, actuele informatie en overzichtelijke processen.",
    h1: "Eén heldere ingang voor je doelgroep.",
    lead: "Een veilige selfservice-omgeving voor informatie, taken, documenten en voortgang die nu over te veel kanalen verspreid zijn.",
    primaryCta: "Bespreek je portaal",
    problemSignals: ["Gebruikers zoeken informatie in e-mail en losse documenten.", "De status van aanvragen is niet zelfstandig te volgen.", "Persoonlijke informatie vraagt een passende toegang.", "Medewerkers beantwoorden vaak dezelfde praktische vragen."],
    outcomes: ["Eén herkenbare ingang per gebruiker.", "Actuele taken, documenten en status bij elkaar.", "Minder onnodige overdracht tussen kanalen.", "Een beheerkant die aansluit op de gebruikerskant."],
    capabilities: ["Accountactivatie", "Profielen", "Persoonlijke inhoud", "Statusvolging", "Documenten", "Berichten", "Voorkeuren", "Betaling waar passend"],
    deliverables: ["Volledige activatie- en herstelflow", "Persoonlijk dashboard en detailstates", "Beheerflow en rechtenmodel", "Privacy- en bewaarafspraken binnen scope"],
    attentionPoints: ["Sessies en accountherstel", "Gegevensminimalisatie", "Toegankelijke selfservice", "Heldere uitzonderingen bij ontbrekende rechten of documenten"],
    relatedServiceSlugs: ["webapplicaties", "backoffice", "slimme-flows"],
    faq: [
      { question: "Voor wie kan een portaal bedoeld zijn?", answer: "Bijvoorbeeld voor klanten, leden, deelnemers, medewerkers of samenwerkingspartners. De taken van die doelgroep bepalen de inrichting." },
      { question: "Hoort er altijd een backoffice bij?", answer: "Er is meestal een vorm van beheer nodig. Hoe uitgebreid die wordt, hangt af van de dagelijkse handelingen en bestaande systemen." },
      { question: "Kunnen documenten en betalingen onderdeel zijn?", answer: "Dat kan wanneer beveiliging, bewaarbeleid en de volledige gebruikersflow vooraf goed zijn afgebakend." },
    ],
    tone: "ice",
    lastReviewed: "2026-09-03",
  },
  {
    slug: "backoffice",
    number: "04",
    navigationLabel: "Backoffice",
    cardTitle: "Rust achter de schermen",
    seoTitle: "Backoffice en beheersystemen | DG Webservices",
    metaDescription: "Breng beheer, gegevens en dagelijkse handelingen samen in een backoffice die overzicht geeft en werk eenvoudiger organiseert.",
    h1: "Meer overzicht achter de schermen.",
    lead: "Voor teams die hun werkvoorraad, gegevens, planning en uitzonderingen in één duidelijke beheeromgeving willen organiseren.",
    primaryCta: "Breng je proces in kaart",
    problemSignals: ["Werkvoorraad en prioriteit zijn niet centraal zichtbaar.", "Zoeken, filteren of overdragen kost te veel tijd.", "Statuswijzigingen en notities zijn lastig te volgen.", "Rapportage ontstaat pas na veel handmatig samenvoegen."],
    outcomes: ["Een bruikbaar startdashboard voor de dag.", "Centrale records met duidelijke vervolgstappen.", "Controleerbare wijzigingen en verantwoordelijkheden.", "Rapportage vanuit dezelfde operationele basis."],
    capabilities: ["Werkvoorraad", "Records en detailpagina's", "Zoeken en filters", "Planning", "Bulkacties", "Rollen en rechten", "Mutatiehistorie", "Rapportage en export"],
    deliverables: ["Uitgewerkt dagelijks kernproces", "Schermen voor lege en uitzonderingssituaties", "Status- en rechtenmodel", "Geteste beheerflows"],
    attentionPoints: ["Bevestiging en herstel bij bulkacties", "Conflicterende wijzigingen", "Beperkte rechten zichtbaar uitleggen", "Exports zonder gevoelige bijvangst"],
    relatedServiceSlugs: ["webapplicaties", "portalen", "koppelingen"],
    faq: [
      { question: "Is een dashboard genoeg?", answer: "Een dashboard helpt pas als de vervolgstappen erachter kloppen. Daarom werken we minimaal één dagelijks proces volledig uit." },
      { question: "Kunnen verschillende rollen anders werken?", answer: "Ja. Taken, zichtbaarheid en acties kunnen per rol verschillen, mits het rechtenmodel helder en beheersbaar blijft." },
      { question: "Kan informatie worden geëxporteerd?", answer: "Dat kan. We bepalen welke velden nodig zijn, wie mag exporteren en hoe gevoelige gegevens worden beperkt." },
    ],
    tone: "white",
    lastReviewed: "2026-09-03",
  },
  {
    slug: "koppelingen",
    number: "05",
    navigationLabel: "Koppelingen",
    cardTitle: "Gegevens die samenwerken",
    seoTitle: "Systemen en gegevens slim koppelen | DG Webservices",
    metaDescription: "Verbind systemen en gegevens zodat informatie op de juiste plek staat en handmatig overnemen zoveel mogelijk verdwijnt.",
    h1: "Laat systemen en gegevens samenwerken.",
    lead: "Voor organisaties die dubbel invoeren, losse exports en handmatige controles willen vervangen door een beheersbare gegevensstroom.",
    primaryCta: "Breng je gegevensstroom in kaart",
    problemSignals: ["Dezelfde informatie wordt op meerdere plekken bijgehouden.", "Imports en exports vragen telkens handmatige controle.", "Fouten worden pas laat in een proces zichtbaar.", "Een externe bron verandert zonder duidelijk herstelpad."],
    outcomes: ["Heldere bron-, bestemming- en eigenaarsafspraken.", "Gevalideerde veldmapping en datakwaliteit.", "Zichtbare verwerking, fouten en herstelacties.", "Onderhoud rond veranderende afhankelijkheden."],
    capabilities: ["Eenmalige import", "Periodieke synchronisatie", "Veldmapping", "Duplicaatcontrole", "Validatie", "Retries", "Monitoring", "Handmatige controle"],
    deliverables: ["Gegevensstroomdiagram", "Veldmapping en validatieregels", "Succes- en foutscenario's", "Beheer- en monitoringafspraken"],
    attentionPoints: ["Eigenaarschap per gegevensveld", "Beveiligde overdracht", "Begrensde retries", "Feitelijke updatefrequentie"],
    relatedServiceSlugs: ["webapplicaties", "backoffice", "beheer-en-groei"],
    faq: [
      { question: "Moet een koppeling altijd direct bijwerken?", answer: "Nee. De passende frequentie hangt af van het proces. Soms is periodiek bijwerken betrouwbaarder en beter controleerbaar." },
      { question: "Wat gebeurt er bij een fout?", answer: "We maken validatie, logging, opnieuw proberen en handmatige controle onderdeel van de flow, afgestemd op de gevolgen van de fout." },
      { question: "Kunnen bestaande exports als startpunt dienen?", answer: "Vaak wel. We gebruiken ze om velden, kwaliteit en uitzonderingen te begrijpen voordat een structurele uitwisseling wordt ingericht." },
    ],
    tone: "navy",
    lastReviewed: "2026-09-03",
  },
  {
    slug: "slimme-flows",
    number: "06",
    navigationLabel: "Slimme flows",
    cardTitle: "Van klik tot bevestiging",
    seoTitle: "Digitale processen en slimme flows | DG Webservices",
    metaDescription: "Maak terugkerende stappen eenvoudiger met digitale flows voor aanvragen, controles, meldingen, opvolging en interne afhandeling.",
    h1: "Van terugkerende stappen naar een heldere flow.",
    lead: "Aanvragen, inschrijven, reserveren, controleren en bevestigen zonder onnodige vragen of terugkerend overtypen.",
    primaryCta: "Breng je flow in kaart",
    problemSignals: ["Een formulier vraagt meer dan voor de taak nodig is.", "Aanvragen stranden tussen ontvangst en opvolging.", "Uitzonderingen veroorzaken veel los herstelwerk.", "De aanvrager weet niet wat de volgende stap is."],
    outcomes: ["Eén duidelijke primaire taak.", "Vragen en vervolgstappen op het juiste moment.", "Een controleerbare overdracht naar beheer.", "Heldere bevestiging en opvolging."],
    capabilities: ["Intake", "Conditionele vragen", "Voortgang", "Validatie", "Beschikbaarheid", "Samenvatting", "Herinneringen", "Statuswijziging"],
    deliverables: ["Volledige mobiele en desktopflow", "Succes-, fout- en afbreekpaden", "Beheerstatussen en opvolging", "Meetpunten zonder persoonsgegevens"],
    attentionPoints: ["Minimale noodzakelijke velden", "Hervatten en dubbele inzending", "Toegankelijke foutmeldingen", "Betaling alleen met volledige fout- en annuleringsflow"],
    relatedServiceSlugs: ["websites", "portalen", "backoffice"],
    faq: [
      { question: "Wat maakt een flow slim?", answer: "Niet extra techniek, maar de juiste vraag en vervolgstap op het juiste moment, inclusief duidelijke uitzonderingen." },
      { question: "Kan een bestaande formulierflow worden verbeterd?", answer: "Ja. We onderzoeken uitval, onduidelijke vragen, overdracht en opvolging en veranderen alleen wat de taak aantoonbaar duidelijker maakt." },
      { question: "Kunnen betalingen onderdeel zijn?", answer: "Dat kan wanneer annulering, mislukking, bevestiging en beheer net zo zorgvuldig zijn uitgewerkt als het betaalmoment zelf." },
    ],
    tone: "blue",
    lastReviewed: "2026-09-03",
  },
  {
    slug: "schermcommunicatie",
    number: "07",
    navigationLabel: "Schermcommunicatie",
    cardTitle: "Actueel op ieder scherm",
    seoTitle: "Schermcommunicatie en digitale displays | DG Webservices",
    metaDescription: "Presenteer actuele informatie duidelijk op schermen voor bezoekers, medewerkers of locaties, met centraal beheer en passende inhoud.",
    h1: "Informatie die op het juiste moment zichtbaar is.",
    lead: "Centrale content, planning en publicatie voor schermen in ontvangst, sport, horeca, evenementen of interne communicatie.",
    primaryCta: "Bespreek je schermcommunicatie",
    problemSignals: ["Inhoud verschilt onbedoeld per locatie of scherm.", "Publiceren vraagt fysieke of terugkerende handelingen.", "Planning, vervaldatum en prioriteit zijn niet zichtbaar.", "Storingen worden pas gemeld wanneer iemand het scherm ziet."],
    outcomes: ["Eén centrale bibliotheek en publicatieflow.", "Passende weergave per schermgroep en verhouding.", "Geplande en automatisch vervallende content.", "Inzicht in publicatie- en apparaatstatus."],
    capabilities: ["Sjablonen", "Schermgroepen", "Staand en liggend", "Preview", "Planning", "Prioriteitscontent", "Periodieke data", "Foutmonitoring"],
    deliverables: ["Preview op relevante verhoudingen", "Flow van concept naar publicatie", "Rollen en goedkeuring", "Status- en herstelweergaven"],
    attentionPoints: ["Leesafstand en contrast", "Feitelijke updatefrequentie", "Offline en geen-contentstate", "Publicatiefouten zichtbaar herstellen"],
    relatedServiceSlugs: ["koppelingen", "backoffice", "beheer-en-groei"],
    faq: [
      { question: "Kan inhoud voor meerdere schermen centraal worden beheerd?", answer: "Ja. Schermgroepen, planning en sjablonen kunnen zorgen dat de juiste inhoud gericht wordt gepubliceerd." },
      { question: "Werkt dezelfde content staand en liggend?", answer: "Niet vanzelf. We ontwerpen per relevante verhouding en controleren leesafstand, uitsnede en informatiehiërarchie." },
      { question: "Kan externe informatie worden getoond?", answer: "Dat kan via een passende gegevensstroom, met duidelijke updatefrequentie en een fallback wanneer de bron niet beschikbaar is." },
    ],
    tone: "ice",
    lastReviewed: "2026-09-03",
  },
  {
    slug: "beheer-en-groei",
    number: "08",
    navigationLabel: "Beheer en groei",
    cardTitle: "Verder na de lancering",
    seoTitle: "Websitebeheer en digitale groei | DG Webservices",
    metaDescription: "Plan onderhoud, updates, verbeteringen en verdere ontwikkeling van je website, portaal of webapplicatie.",
    h1: "Blijven verbeteren na de oplevering.",
    lead: "Continuïteit, onderhoud en gerichte doorontwikkeling voor digitale omgevingen die niet stilstaan na hun eerste lancering.",
    primaryCta: "Bespreek beheer en groei",
    problemSignals: ["Updates en kleine verbeteringen blijven liggen.", "Eigenaarschap bij incidenten of wijzigingen is onduidelijk.", "Nieuwe wensen concurreren met noodzakelijk onderhoud.", "Inzichten leiden niet vanzelf tot een volgende prioriteit."],
    outcomes: ["Duidelijk onderscheid tussen onderhoud en uitbreiding.", "Planbare updates en beveiligingsonderhoud.", "Een zichtbare roadmap en releasecyclus.", "Documentatie die met de oplossing meegaat."],
    capabilities: ["Monitoring", "Updates", "Back-upcontrole", "Contentwijzigingen", "Performancecontrole", "Roadmap", "Releases", "Evaluatie"],
    deliverables: ["Afgesproken beheer- en wijzigingsproces", "Onderhoudsrapportage", "Geprioriteerde verbeterlijst", "Release- en overdrachtsinformatie"],
    attentionPoints: ["Serviceniveau alleen na afspraak", "Prioriteit en escalatie", "Controleerbaar herstelproces", "Externe afhankelijkheden expliciet houden"],
    relatedServiceSlugs: ["websites", "webapplicaties", "koppelingen"],
    faq: [
      { question: "Wat is het verschil tussen beheer en doorontwikkeling?", answer: "Beheer houdt de bestaande oplossing gezond en bruikbaar. Doorontwikkeling voegt doelgericht nieuwe of gewijzigde functionaliteit toe." },
      { question: "Zijn vaste serviceniveaus inbegrepen?", answer: "Alleen wanneer die expliciet zijn afgesproken. Prioriteit, beschikbaarheid en escalatie worden passend bij de omgeving vastgelegd." },
      { question: "Kan beheer ook bij een bestaande omgeving starten?", answer: "Dat kan na een technische en inhoudelijke nulmeting, zodat risico's, achterstallig werk en verantwoordelijkheden eerst duidelijk zijn." },
    ],
    tone: "white",
    lastReviewed: "2026-09-03",
  },
];

export const serviceBySlug = new Map(services.map((service) => [service.slug, service]));

export function getService(slug: string) {
  return serviceBySlug.get(slug as ServiceSlug);
}
