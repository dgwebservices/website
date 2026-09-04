# Deployment en rollback

## Productie

Een push naar de beschermde branch `production` start `.github/workflows/deploy-production.yml`. De runner controleert zijn eigen identiteit en workspace, bouwt de exacte commit en voert daarna een publieke HTTP-smoketest uit op `https://www.dgwebservices.nl/`.

Voor contactaflevering zijn vier server-side secrets nodig: `CONTACT_DELIVERY_ENDPOINT`, `CONTACT_DELIVERY_TOKEN`, `CONTACT_TO_EMAIL` en `CONTACT_FROM_EMAIL`. Zonder complete configuratie faalt het formulier veilig met een 503-state en blijft de directe e-maillink beschikbaar.

Publieke indexering staat standaard uit. Pas na eigenaaracceptatie mag `ALLOW_INDEXING` op `true` worden gezet en als runtimewaarde worden doorgegeven.

## Controle na deployment

Controleer home, dienstenhub, minimaal twee dienstpagina's, contact, een onbekende route, `robots.txt`, `sitemap.xml`, favicon en social preview. Controleer daarna de responseheaders en één veilige formulierinzending in de doelmailbox of het doelsysteem.

## Rollback

Maak een normale revertcommit van de problematische productiecommit en push die naar `production`. Dezelfde deploymentflow publiceert dan opnieuw een volledig traceerbare versie. Gebruik geen force-push of destructieve reset. Bij een uitsluitend operationeel probleem kan de laatst bekende goede commit opnieuw via de normale workflow worden gedeployed.
