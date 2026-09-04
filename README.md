# DG Webservices productiewebsite

De Nederlandstalige DG Webservices-site is gebouwd als server-first Next.js/Vinext-applicatie voor Cloudflare Workers. De site bevat de homepage, dienstenhub, acht dienstpagina's, mogelijkheden, werkwijze, over, contact, bedankroute, merkdownloads en eigen foutpagina's.

## Lokaal werken

Vereist Node.js 22.13 of nieuwer.

```bash
npm ci
npm run dev
```

Gebruik `.env.example` als overzicht van runtimevariabelen. Secrets worden nooit in de repository opgeslagen.

## Kwaliteitscontroles

```bash
npm run lint
npx tsc --noEmit
npm run build
node --test tests/*.test.mjs
```

`npm run assets:generate` maakt de traceerbare favicon-, PWA- en socialafgeleiden opnieuw vanuit de ongewijzigde officiële SVG-masters.

## Publicatie

De bestaande productieflow wordt gestart door een push naar `production`. Zie `docs/DEPLOYMENT.md` voor smoke-test en rollback. Publieke indexering blijft uit totdat de punten in `LAUNCH_BLOCKERS.md` door de eigenaar zijn bevestigd.
