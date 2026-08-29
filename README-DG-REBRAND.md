# DG Webservices — rebrandingprototype

Dit pakket bevat het volledige, responsieve prototype van de nieuwe DG Webservices-positionering. Het prototype is bedoeld als visueel en inhoudelijk keuringsmodel voordat de definitieve productieversie wordt uitgewerkt.

## Merkfundament

- Positionering: digitale productstudio uit Den Haag.
- Hoofdbelofte: websites, platforms en software die organisaties echt vooruithelpen.
- Kernwaarden: helder, betrokken, precies en ondernemend.
- Basiskleuren: Deep Navy #071426, Cobalt Blue #2563EB, Cool Slate #64748B en Ice White #F5F8FC.
- Displayfont: Space Grotesk.
- Interface- en bodyfont: Manrope.
- Beeldtaal: premium productfotografie, echte gebruikscontext, tastbare materialen en terughoudend kobaltblauw licht.

## Routes

- / — volledig homepage- en portfolioprototype.
- /brand — logo-, kleur-, typografie-, beeld- en tone-of-voicepresentatie.

## Werkende onderdelen

- Responsieve desktop-, tablet- en mobiele layout.
- Sticky navigatie en toegankelijk mobiel menu.
- Projectfilters voor platforms, websites en portals.
- Projectdetails in toegankelijke dialoogvensters.
- Uitgelichte sport-/wedstrijdzakenpresentatie.
- Interactieve projectstarter die een ingevulde e-mail opent.
- Direct downloadbare SVG-logovarianten.
- Bewegende interfaceaccenten met ondersteuning voor prefers-reduced-motion.

## Portfolio-inhoud

Het prototype laat projecten en productrichtingen zien rond VeyoCast, het Haaglanden Toernooiplatform, NXTDRIVE, Club Kit Portal, Absolutely Fit, PMU & Beauty by Sam, Les Riooltechniek en Fetti. De teksten gebruiken geen onbevestigde prestatiecijfers of testimonials. Productstatussen moeten vóór publieke livegang nog één keer worden bevestigd.

## Merkmiddelen

De map public/brand bevat:

- dg-mark.svg — primaire kleurvariant voor lichte achtergronden.
- dg-mark-reversed.svg — variant voor donkere achtergronden.
- dg-mark-mono.svg — monochrome variant.
- dg-lockup.svg — horizontale lock-up voor lichte achtergronden.
- dg-lockup-reversed.svg — horizontale lock-up voor donkere achtergronden.
- favicon.svg — compact app-/browsericoon.

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
2. Welke projecten publiek bij naam mogen worden getoond.
3. Statusaanduidingen per project en eventuele live links.
4. Definitieve domeinnaam en e-mailafhandeling.
5. Contactformulier of CRM-koppeling wanneer meer dan de huidige e-mailstarter gewenst is.
6. Metadata, structured data, sitemap en definitieve privacy-/cookie-inrichting.
