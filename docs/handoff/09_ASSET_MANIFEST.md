# 09 — Assetmanifest

Alle paden zijn relatief aan de root van dit overdrachtspakket. SHA-256 is de integriteitsbron voor de vier logo-masters.

## 1. Officiële SVG-masters

| Bestand | ViewBox | Bytes | Paden | Gebruik | SHA-256 |
|---|---:|---:|---:|---|---|
| `assets/logos/DG-Webservices-Combined-Light-Mode-8192-1.svg` | 2191×548 | 9.263 | 3 | combined logo op lichte/ice achtergrond | `7bf0719807c29d44a26ce4cee76fb0d37957c0f972d90c891e99e39ae3cb0766` |
| `assets/logos/DG-Webservices-Combined-Dark-Mode-8192.svg` | 2191×548 | 10.099 | 3 | combined logo op donkere/navy achtergrond | `7206731cb11e1736e03d13bce6f3d72e2988c36ec10fbd0b1ba32a8cfecf63f3` |
| `assets/logos/DG-Webservices-Icon-Light-Mode-8192.svg` | 1095×1095 | 2.563 | 2 | DG-icon op lichte/ice achtergrond | `c6ea07a4ba0d1e9f42962199843a8af81349647b22a175eaf73554af9cadbc7e` |
| `assets/logos/DG-Webservices-Icon-Dark-Mode-8192.svg` | 3000×3000 | 9.697 | 2 | DG-icon op donkere/navy achtergrond | `e105e9a1705b941af7f98db3b02aa806e1753de342eb3b201c3ce87ffa0367d9` |

Gecontroleerde kenmerken:

- byte-voor-byte gelijk aan de door de gebruiker aangeleverde bestanden;
- transparante achtergrond;
- uitsluitend vectorpaden;
- geen live tekst, rasterembed, extern font, script of externe reference;
- officiële negatieve ruimte tussen D en G aanwezig;
- verschillende ingebedde blauwtinten zijn bewust en mogen niet automatisch worden geharmoniseerd.

### Gebruik

- Light Mode in de bestandsnaam betekent: bedoeld op een lichte achtergrond.
- Dark Mode betekent: bedoeld op een donkere achtergrond.
- Combined Light bevat een witte divider; gebruik bij voorkeur Ice `#F5F8FC` wanneer die zichtbaar moet zijn.
- Gebruik combined in header/footer/documentcontext; icon voor compact merkaccent, favicon en afgeleide platformicons.
- Wijzig masters nooit. Productiealiases, minificatie, favicon, rasterexports en social cards zijn alleen afgeleiden.
- De tekst `8192` in de bestandsnaam is geen intrinsieke pixelmaat. SVG is resolutie-onafhankelijk.
- Er is geen afzonderlijk officieel woordmark-masterbestand. Knip het combined logo niet zelf uiteen en presenteer geen afgeleide als officiële master zonder merkgoedkeuring.

### Integriteitstest

Voeg een CI-test toe die de vier hashes exact vergelijkt. Bij afwijking faalt de build met een duidelijke melding; normaliseer of “repareer” het bestand niet automatisch.

## 2. Fotografie — originelen

Alle bronnen zijn RGB, zonder transparantie, met verhouding 8:5.

| Bestand | Dimensies | Bytes | Rol | SHA-256 |
|---|---:|---:|---|---|
| `assets/photography/original/hero-digital-studio.png` | 1584×990 | 1.632.050 | hero/LCP-kandidaat | `0b65070888a97a40a607d479babeb90ccc7e2bf66c15535e251a12791517ac31` |
| `assets/photography/original/sports-platforms.png` | 1584×990 | 1.982.403 | voorbeeld planning, sportcontext en schermcommunicatie | `3a66730c22caee9b32b978f7bef3900aab77be269382212c92db57176b7c0494` |
| `assets/photography/original/connected-business.png` | 1584×990 | 1.501.370 | voorbeeld verbonden organisatie/omgevingen | `ac61d27455ce96417ebb48561f216f0bf1288c55459f84c21cf3d09fb045d1fa` |

De originelen zijn bronmateriaal en wegen samen circa 4,9MiB. Stuur ze niet standaard naar de browser.

### Start-altteksten

| Beeld | Inhoudelijke alttekst | Wanneer leeg |
|---|---|---|
| hero | Digitale interfaces op desktop, laptop, tablet en telefoon | wanneer omliggende hero-copy de functie volledig dekt en het beeld alleen sfeer is |
| sports | Digitale wedstrijdinformatie en schermcommunicatie in een sportomgeving | wanneer het puur redactionele sfeer naast volledige tekst is |
| connected | Portaal, backoffice en mobiele omgeving als één verbonden systeem | wanneer het uitsluitend een abstract decoratief voorbeeld is |

Alttekst wordt definitief op basis van paginacontext gekozen, niet alleen bestandsnaam.

## 3. Geoptimaliseerde fotografie

Afgeleid van de bovenstaande PNG's. AVIF-kwaliteit 56 en WebP-kwaliteit 84; visuele vergelijking blijft verplicht.

### Hero

| Bestand | Dimensies | Bytes | SHA-256 |
|---|---:|---:|---|
| `hero-digital-studio-640.avif` | 640×400 | 12.872 | `79cb698008ae92f3cf819359a926aeeb1800712e7223bbf0e7f98eff830c927f` |
| `hero-digital-studio-640.webp` | 640×400 | 23.288 | `fb7a93e662d0380dcd8531ce2781cb84415713347b37386857e27fb45aa0a050` |
| `hero-digital-studio-960.avif` | 960×600 | 21.755 | `4d0a2ae4561d12d51e8a0c246026d203b6970446046e6ffc462cef0c699eb3f4` |
| `hero-digital-studio-960.webp` | 960×600 | 42.346 | `301709179258e6cdbf4741a764f748a03f02251d40c96935be6cd694f7c3e56b` |
| `hero-digital-studio-1584.avif` | 1584×990 | 40.320 | `ee7e47e8c2d3b5ee988f0d400db74529cea0165242bf955cf7777aab7c5ff96f` |
| `hero-digital-studio-1584.webp` | 1584×990 | 83.492 | `2c61de7ec000597e066f80495d0019a418a33feaac611c3e5f1530137ba371b8` |

### Sports

| Bestand | Dimensies | Bytes | SHA-256 |
|---|---:|---:|---|
| `sports-platforms-640.avif` | 640×400 | 18.194 | `0acd18e70337ebedf4e6ff64ebafa54dfc75ba1cc7fb8db6d0de78f4b4a50df0` |
| `sports-platforms-640.webp` | 640×400 | 30.388 | `c0d0b92f1faa4ced8eb754cae41bb5b49c9291a203173066e49706fdf9f3d421` |
| `sports-platforms-960.avif` | 960×600 | 32.622 | `8d470fb689ac35680f204f969496146684ad9a32baf030658a9523d73b206098` |
| `sports-platforms-960.webp` | 960×600 | 56.816 | `b46ee7c5267cf20c4ddd9d57706bbc992b24f204a61f1773e14503ae216669f9` |
| `sports-platforms-1584.avif` | 1584×990 | 63.579 | `625bbf1bcfbc08e5386a5f0b578589ec0bcf09d4824cd7634ee67b47bd26f4be` |
| `sports-platforms-1584.webp` | 1584×990 | 122.958 | `ec5b2f91cb115aca9b9d0b8558d7fd8fe373981509b77f796cc83d8899d744fd` |

### Connected business

| Bestand | Dimensies | Bytes | SHA-256 |
|---|---:|---:|---|
| `connected-business-640.avif` | 640×400 | 10.514 | `0b47ec7d7dac8ea4129decfc745d97cc22e5e0b817a276fbf32fcdd5c041e5bd` |
| `connected-business-640.webp` | 640×400 | 20.376 | `01fce7d83ee359b4f921d03187c6813844f6a895a1b5d5dbbb646f6913406348` |
| `connected-business-960.avif` | 960×600 | 16.121 | `3956e1c933c734fb18b72718c7b7b3394dd844827f6cb5c2355f0fc68b24904a` |
| `connected-business-960.webp` | 960×600 | 32.510 | `86339d3631bcf21cbbb8b99c2aede5d5c499282a6e58f1ab6ab91a6e0621f3ee` |
| `connected-business-1584.avif` | 1584×990 | 25.970 | `9289505e49846193a5fe0beb62e8c45cb25eb1a62c8830cad07fa81953db5052` |
| `connected-business-1584.webp` | 1584×990 | 58.506 | `8611b2ddd7647b55f10087b148712041463eb42f5b2fcdce46f5c0193d214846` |

Alle afgeleiden staan onder `assets/photography/optimized/`.

### Responsief gebruik

Richtlijn voor `<picture>` wanneer geen framework-imagecomponent wordt gebruikt:

```html
<picture>
  <source type="image/avif" srcset="...-640.avif 640w, ...-960.avif 960w, ...-1584.avif 1584w">
  <source type="image/webp" srcset="...-640.webp 640w, ...-960.webp 960w, ...-1584.webp 1584w">
  <img src="...original.png" width="1584" height="990" sizes="(max-width: 980px) calc(100vw - 32px), 735px" alt="">
</picture>
```

Pas `sizes` aan op gemeten layout. Hero eager/high priority; sports en connected lazy. Genereer 480/768/1280 alleen wanneer browserselectie of layoutmeting dit rechtvaardigt.

## 4. Referentiebeelden

| Bestand | Werkelijke indeling | Dimensies | Bytes | Gebruik | SHA-256 |
|---|---|---:|---:|---|---|
| `assets/references/brand-concept-board.jpg` | JPEG | 1536×1536 | 255.134 | historische rebranding-/mock-upreferentie | `dd473ce4225ed09aba4c725ac95caf399061e6b873152f503200d846787288d3` |
| `assets/references/original-dg-monogram-reference.png` | PNG | 168×113 | 20.522 | kleine oorspronkelijke visuele referentie | `164a8a3ebc5e70c56faba867e01df226e516630d44e6e51634767d6935cca700` |

Niet in productie gebruiken. De conceptboard bevat oudere typografie/voorbeelden en is ondergeschikt aan current source, docs en officiële SVG's. De kleine PNG is te laag van resolutie om als logo te gebruiken.

## 5. Source-snapshot

| Bestand | Bytes | Commit | SHA-256 |
|---|---:|---|---|
| `source/DG_Webservices_Current_Prototype_Source.zip` | 5.389.319 | `2633ec9911882325695dadff3cbb763f1b332170` | `aa4e97b48ca6cc7aacce66c1d7d7bdc6cfea8aaa3b073718ae00a28af73fd5ac` |

Dit is een Git-archive zonder `.git`-geschiedenis. Pak uit in een nieuwe map of pas de specificatie op de aangewezen repository toe. De archivecomment bevat de commit-ID.

## 6. Nog te genereren productieafgeleiden

- Open Graph/social image 1200×630 per hoofdtemplate.
- Apple touch icon 180×180.
- PWA `any` icon 192×192 en 512×512.
- PWA `maskable` icon 192×192 en 512×512 met vaste, dekkende brandachtergrond.
- Klassieke `favicon.ico` fallback.
- Eventuele PNG-logoexports alleen als platform dit vereist.

Regels:

- Iedere afgeleide heeft bronmaster, exportinstelling en hash in het productierepo.
- Geen afgeleide wordt “officiële master” genoemd.
- Social cards gebruiken korte echte tekst en safe area.
- Geen zelfstandig woordmerk genereren door het combined bestand te knippen zonder expliciete goedkeuring.

## 7. Bestandsnaam- en cachebeleid

- Masters behouden hun originele naam en hash.
- Productiealiases mogen leesbaarder zijn, maar verwijzen naar een traceerbare kopie.
- Geoptimaliseerde foto-URL's zijn stabiel en beschrijvend.
- Fingerprinted buildassets lang/immutable cachen.
- Verwijder dubbele merk-ZIP's; bied één canonieke downloadset.
- Verwijder ongebruikte standaardassets pas na import-/referentiecontrole.

