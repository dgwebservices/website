# QA-rapport productie

Datum: 4 september 2026  
Geteste release: de uiteindelijke productiebranch; de exacte revisie staat in de Git- en deploymenthistorie.

## Geautomatiseerde controles

| Controle | Resultaat |
|---|---|
| Vinext/Cloudflare Worker-build | geslaagd |
| Next.js/VPS-productiebouw | geslaagd met alleen productie-afhankelijkheden |
| TypeScript en ESLint | geslaagd |
| Integratie- en contracttests | 10/10 geslaagd |
| Playwright functionele scenario's | 6/6 geslaagd |
| Viewports | 320, 360, 390, 768, 1024, 1280, 1440 en 1920px gecontroleerd |
| Visuele bewijsset | 45 screenshots over 9 templates en 5 breedtes |
| Axe WCAG 2 A/AA, 2.1 A/AA en 2.2 AA | geen ernstige of kritieke bevindingen op 9 representatieve templates |
| JavaScript uitgeschakeld | kerncontent en navigatie beschikbaar |
| Productie-afhankelijkheden | `npm audit --omit=dev`: 0 bekende kwetsbaarheden |

De volledige ontwikkelboom bevat vier bekende moderate meldingen in de alleen lokaal gebruikte `drizzle-kit`-toolchain. Deze packages worden niet in de VPS-productie-installatie opgenomen. Er zijn geen high of critical meldingen.

## Lighthouse mobiel op productie

| Template | Performance | Accessibility | Best Practices | SEO bij indexering |
|---|---:|---:|---:|---:|
| Home | 99 | 100 | 100 | 100 |
| Dienstenhub | 100 | 100 | 100 | 100 |
| Dienst — webapplicaties | 100 | 100 | 100 | 100 |
| Contact | 100 | 100 | 100 | 100 |

De publieke productiecontrole rapporteert tijdelijk SEO 66–69 omdat de release bewust `X-Robots-Tag: noindex` en `robots.txt: Disallow: /` voert. Dezelfde productiebuild is met indexering ingeschakeld gecontroleerd en haalt SEO 100 op alle vier templates. Indexering blijft uit tot de eigenaar de launch blockers accepteert.

## Productie-smoketest

- Home, dienstenhub, twee dienstpagina's, contact en brand geven HTTP 200.
- Een onbekende route geeft een echte HTTP 404.
- De legacy beheer-URL geeft één permanente HTTP 308 naar de canonieke route.
- CSP, HSTS, nosniff, referrer- en permissions-policy zijn actief.
- Canonicals, unieke titels, één H1 per contentroute, JSON-LD, favicon, manifest en social image zijn aanwezig.
- Het contactendpoint accepteert de canonieke origin achter de reverse proxy en faalt zonder opslag-/deliveryconfiguratie veilig met HTTP 503 en `Cache-Control: no-store`.

## Open vóór publieke lancering

De eigenaarbesluiten en operationele configuratie in `LAUNCH_BLOCKERS.md` blijven van toepassing. Met name contactopslag en server-side aflevering moeten worden ingericht en end-to-end getest voordat het formulier aanvragen kan aannemen. Publieke indexering mag pas daarna worden ingeschakeld.
