# DG Webservices — rebrandingprototype

Dit pakket bevat het volledige, responsieve prototype van de nieuwe DG Webservices-positionering. Het prototype is bedoeld als visueel en inhoudelijk keuringsmodel voordat de definitieve productieversie wordt uitgewerkt.

## Merkfundament

- Positionering: digitale productstudio uit Den Haag.
- Hoofdbelofte: websites, portalen en webapplicaties die organisaties echt vooruithelpen.
- Kernwaarden: helder, betrokken, precies en ondernemend.
- Basiskleuren: Deep Navy #071426, Cobalt Blue #2563EB, Cool Slate #64748B en Ice White #F5F8FC.
- Displayfont: Space Grotesk.
- Interface- en bodyfont: Manrope.
- Beeldtaal: premium productfotografie, echte gebruikscontext, tastbare materialen en terughoudend kobaltblauw licht.

## Routes

- / — volledig homepage- en dienstenprototype.
- /brand — complete presentatie van beeldmerk, woordmerk, lock-ups, iconen en gebruiksregels.

## Werkende onderdelen

- Responsieve desktop-, tablet- en mobiele layout.
- Sticky navigatie en toegankelijk mobiel menu.
- Acht herkenbare diensten in een heldere dienstenarchitectuur.
- Dienstdetails in toegankelijke dialoogvensters.
- Functionele presentaties voor sport, schermcommunicatie en verbonden processen.
- Interactieve projectstarter die een ingevulde e-mail opent.
- Direct downloadbare SVG-logovarianten.
- Bewegende interfaceaccenten met ondersteuning voor prefers-reduced-motion.

## Diensteninhoud

Het prototype gebruikt uitsluitend functionele dienstnamen en voorbeelden. Er
worden geen klant-, product- of technologiemerken als portfolio-item genoemd.
De inhoud beschrijft websites, webapplicaties, portalen, backoffice, koppelingen,
slimme flows, schermcommunicatie en beheer.

## Merkmiddelen

De map `public/brand` bevat een volledig zelfstandig vectorsysteem:

- primaire, vlakke, reversed, monochrome en witte beeldmerken;
- primaire, reversed en monochrome woordmerken als outlines;
- horizontale en gestapelde lock-ups;
- drie afgeronde iconvarianten;
- gebruiksrichtlijnen in `public/brand/README.md`.

Alle bestanden bestaan uit schaalbare vectorpaden en bevatten geen live tekst,
ingesloten rasterafbeeldingen of externe lettertype-afhankelijkheden. Het pakket
kan opnieuw worden opgebouwd met `node scripts/build-logo-system.mjs`.

De map public/assets bevat de drie finale fotografie-assets.

## Technische basis

- Next.js/Vinext
- React en TypeScript
- Tailwind-basis met uitgebreide eigen CSS
- Radix/Shadcn dialoogcomponent
- Lucide-iconen

Lokaal starten:

~~~bash
npm ci
npm run dev
~~~

Productiecontrole:

~~~bash
npm run lint
npm run build
~~~

## Nog bevestigen vóór publieke productie

1. Definitief contactadres, KvK-, btw- en privacygegevens.
2. Definitieve domeinnaam en e-mailafhandeling.
3. Contactformulier of relatiebeheerkoppeling wanneer meer dan de huidige e-mailstarter gewenst is.
4. Metadata, structured data, sitemap en definitieve privacy-/cookie-inrichting.
