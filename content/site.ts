export const SITE_ORIGIN = "https://www.dgwebservices.nl";

export const siteConfig = {
  name: "DG Webservices",
  origin: SITE_ORIGIN,
  locale: "nl-NL",
  email: "hello@dgwebservices.com",
  locationLabel: "Den Haag, Nederland",
  socialProfiles: [] as string[],
} as const;

export const primaryNavigation = [
  { href: "/diensten", label: "Diensten" },
  { href: "/mogelijkheden", label: "Mogelijkheden" },
  { href: "/werkwijze", label: "Werkwijze" },
  { href: "/over", label: "Over" },
] as const;

export const processSteps = [
  {
    number: "01",
    title: "Scherpstellen",
    summary: "We brengen doelen, gebruikers, randvoorwaarden en beslissingen samen in een heldere projectbasis.",
    output: "Een gedeelde richting, afbakening en prioriteiten.",
  },
  {
    number: "02",
    title: "Ervaarbaar maken",
    summary: "Structuur, inhoud en interactie worden tastbaar voordat kostbare bouwkeuzes vaststaan.",
    output: "Een werkbaar prototype met concrete feedbackpunten.",
  },
  {
    number: "03",
    title: "Bouwen",
    summary: "De gekozen oplossing wordt zorgvuldig gerealiseerd, gekoppeld, gevuld en gecontroleerd.",
    output: "Een geteste oplossing die klaar is voor dagelijks gebruik.",
  },
  {
    number: "04",
    title: "Verder brengen",
    summary: "Na oplevering blijven onderhoud, inzichten en nieuwe wensen onderdeel van een overzichtelijke koers.",
    output: "Gericht beheer en een onderbouwde volgende stap.",
  },
] as const;
