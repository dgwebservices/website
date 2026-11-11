# Backoffice: runtime, CI en vrijgave

## Doel en huidige vrijgavegrens

Het bevestigde productiedoel is `https://dgwebservices.nl/admin` in de bestaande website op branch `production`. De marketingwebsite op `/` houdt haar bestaande routes en deploycontract. De oorspronkelijke v8-interface wordt als eigen document op `/admin` geleverd; assets staan onder `/admin/`, API-routes onder `/admin/api/`. Er staat geen onbeveiligde `public/admin/index.html` naast de beveiligde pagina.

Deze bronwijziging bereidt een release voor. Een push naar `production` activeert de bestaande deploymentworkflow. Publiceer of activeer daarom pas na expliciete releasegoedkeuring van de eigenaar en functionele én technische stagingacceptatie. Een groene lokale test of alleen een bereikbaar loginformulier geldt niet als die acceptatie.

De workflow gebruikt GitHub-environment `production`. De alleen-lezen controle op 11 november 2026 gaf voor branch `production` echter `protected: false` en voor het environment geen protection rules of deployment branch policy. Verplichte reviewers, branchbescherming en vereiste CI zijn dus nog een open vrijgavevoorwaarde. Deze bronwijziging verandert die instellingen niet. Het toevoegen van `environment: production` maakt op zichzelf geen verplichte reviewer aan. Handmatige workflowruns van een andere branch worden door de deployjob overgeslagen.

## Precies vier native Variables

De vier bestaande **Variables** in GitHub-environment `production` worden rechtstreeks gemapt. Er worden geen extra Variables, alternatieve naamvarianten of GitHub Secrets voor deze basisroute aangemaakt.

| Variable en runtimekey | Bevestigde productieconfiguratie |
| --- | --- |
| `DGWEB_APP_ORIGIN` | `https://dgwebservices.nl/admin` |
| `DGWEB_DATA_MODE` | `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://prjvxusiqzadpaitcqxr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | De bestaande publishable key; alleen aanwezigheid en vorm controleren, waarde niet opnemen in logs of broncode. |

Het project is het bevestigde Supabase-project `dgwebservices-website` onder account `Duindorpdoet`, referentie `prjvxusiqzadpaitcqxr`. De publishable key verleent geen backofficebevoegdheid. De server verifieert de gebruiker, sessie, MFA en actuele membership; de database beperkt iedere handeling tot de toegestane scope. Er wordt geen `service_role`- of secret key gebruikt voor de basisroute.

De bestaande vier website-runtimekeys blijven ongewijzigd: `NEXT_PUBLIC_SITE_URL`, `APP_ENVIRONMENT`, `ALLOW_INDEXING` en `APP_REVISION`. De whitelist `DG_RUNTIME_ENV_KEYS` bevat deze vier plus de vier backofficekeys. Marketing houdt `NEXT_PUBLIC_SITE_URL=https://www.dgwebservices.nl`; het backofficedoel is afzonderlijk bevestigd op het domein zonder `www`. `ALLOW_INDEXING` blijft `false` tot een afzonderlijk launchbesluit.

De workflow controleert het bevestigde doel en de vorm van de publishable key vóór hij de deployhelper aanroept. Hij print geen geconfigureerde waarden. `.env.example` bevat alleen de publieke doelgegevens en een lege keypositie.

## Bestaand hostcontract behouden

De productiejob blijft op de bestaande specifieke runner met gebruiker `dgwebservices` en de bestaande runnernaam/workspacecontrole. Checkout en hostdeploy gebruiken exact `github.sha`. De uitvoer blijft uitsluitend de bestaande opdracht aan `/usr/local/bin/dg-site-deploy`; deze wijziging vervangt geen hosthelper, service, symlink, proxy of runnerregistratie.

De hosthelper is vooraf alleen gelezen. Het bevestigde gedrag is dat hij `runtime.env` opnieuw opbouwt uit `DG_RUNTIME_ENV_KEYS` en een backup/rollbackpad heeft. Een weggelaten key blijft dus niet vanzelf behouden. Vergelijk vóór vrijgave de vier GitHub-waarden met de goedgekeurde root-only hostconfiguratie en registreer een nieuwe configuratie-ID bij een wijziging. Een wijziging in GitHub Variables verandert de draaiende hostconfiguratie pas wanneer de vrijgegeven deployhelper die release en configuratie samen activeert.

Bestaande contactaflevering en andere projecten houden hun eigen contract. Voeg hun secrets niet aan deze publieke basisroute toe en verander hun hostconfiguratie niet als onderdeel van de backofficerelease. 20i, Mollie, IMAP/SMTP en andere providercredentials vereisen een afzonderlijk bevestigd servicecontract en geheime runtimelevering.

## CI zonder productietoegang

`.github/workflows/backoffice-ci.yml` draait bij pull requests naar `production` en pushes naar `codex/dg-backoffice-admin`. Beide jobs gebruiken GitHub-hosted `ubuntu-24.04`, read-only repositoryrechten, checkout van de exacte bedoelde broncommit (`github.event.pull_request.head.sha || github.sha`) en Node `24.19.0` (bevestigd in de [officiële release-index](https://nodejs.org/dist/index.json)). Checkout, `APP_REVISION` en de git-verificatie gebruiken dezelfde volledige SHA. De logs benoemen de geteste bron-SHA en de GitHub-event-SHA afzonderlijk; een synthetische PR-mergecommit wordt niet als geteste bron gepresenteerd. De bestaande productiejob blijft exact de vrijgegeven `github.sha` bouwen.

De bronjob gebruikt de bestaande lockfile en installer, lint, TypeScript-controle, de bestaande dubbele Vinext/Next.js-build, websitecontracten en `npm run test:backoffice`. De testconfiguratie is een publieke loopbackfixture. Er worden geen productie-Variables of Secrets aan deze jobs gekoppeld en ze draaien niet op een VPS-runner.

De tweede job gebruikt alleen een tijdelijke lokale PostgreSQL-service en `psql`. Het expliciete officiële image is `postgres:16.15-bookworm`, gecontroleerd in de [Docker Official Images-manifest](https://github.com/docker-library/official-images/blob/master/library/postgres). De inrichting volgt de [GitHub-documentatie voor PostgreSQL-services](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers). De testverbinding wijst uitsluitend naar deze lege wegwerpdatabase:

```sh
DG_BO_TEST_DATABASE_URL=postgresql://postgres:ci-disposable-only@127.0.0.1:5432/dg_bo_contract_test \
  node --test tests/backoffice-domain-sql.test.mjs
```

Deze test bootstrapt uitsluitend de benodigde auth-testtabellen, rollen en claimsfuncties in de wegwerpdatabase, past de migratie daar toe en controleert de SQL-contracten. De runner maakt daarvoor zelf een database met een willekeurige `dg_bo_test_*`-naam en verwijdert die in `finally`; de lokale testgebruiker heeft daarom `CREATEDB` nodig. Zet deze testvariabele nooit op een bestaand project of een echte Supabase-database. Zonder expliciete testverbinding slaat de losse Node-suite de SQL-test over; in de aparte CI-job is de verbinding verplicht aanwezig.

## Staging en acceptatie

De native brokerbewijsroute en de vereiste staging-/releasegates zijn nog niet vervuld. Deze wijziging migreert het bestaande websitecontract niet naar een nieuw brokercontract. CI-succes of een HTTP-200 geeft geen automatische acceptatie of releasebevoegdheid.

Er is nog geen afzonderlijk bevestigd backoffice-stagingproject. Gebruik het productieproject niet voor fixtures, voorbeeldklanten of een stagingmigratie. Staging moet een eigen accountscope, poort, configuratie en Supabase-project hebben voordat echte databaseacceptatie kan plaatsvinden. Een geïsoleerde loopbackfixture mag intussen de interface en gesimuleerde contracten bewijzen; zij bewijst geen echte providerverbinding, productieautorisatie of stagingacceptatie.

Vóór een productievoorstel moeten minimaal de volgende resultaten beschikbaar zijn:

- De exacte bron- en configuratierevisies, geslaagde CI en een volledige build op de bedoelde developmentomgeving.
- Functionele en technische stagingacceptatie met eigen configuratie, inclusief behoud van de marketingroutes en de oorspronkelijke desktop-/mobielweergave.
- Login, MFA, uitloggen, verlopen/ingetrokken sessies, actuele membership en scheiding tussen beheerder en klant gecontroleerd tegen de bedoelde omgeving.
- RLS en databasecontracten gecontroleerd voor de nieuwe backofficetabellen, zonder bestaande projecttabellen te verruimen. Reeds gevonden projectadvisories blijven afzonderlijke bevindingen en worden niet automatisch opgelost door deze release.
- De echte administratie start zonder v8-voorbeeldklanten, diensten, facturen, mailboxinhoud of hostmetingen. Providerwrites blijven uit. Een bewaard dossier of handmatige controle wordt nooit als geverifieerde provideractivatie getoond.
- Beoordeelde klantimport en Support bewaren alleen toegestane metadata/portaalberichten. Facturatie blijft bij import gepauzeerd; facturen, incasso, uitnodigingen en externe mail worden niet stilzwijgend gestart.

Leg daarna de expliciete releasegoedkeuring vast voor de concrete SHA, configuratie-ID en scope. Pas dan mag de goedgekeurde wijziging via de beschermde `production`-branch en de bestaande environment-/runnercontroles worden vrijgegeven.

## Controle en rollback na een vrijgegeven deploy

Controleer de marketingroutes en `/admin`, `/admin/runtime.js` en `/admin/api/session`, inclusief authenticatiegrenzen, cacheheaders, assetnamespace en de bestaande mobiele preview. De publieke website-smoketest in de workflow blijft behouden; een HTTP-200 op `/admin` kan een loginpagina zijn en bewijst geen volledige backofficewerking.

Gebruik bij een operationeel probleem het bestaande backup-/rollbackpad van de deployhelper, zodat code en runtimeconfiguratie als dezelfde bekende release terugkeren. Een bronrevert is een normale traceerbare commit en vereist opnieuw de beschermde vrijgaveroute. Geen force-push, destructieve reset of losse symlink/configuratie-aanpassing. Een databasewijziging en bestaande bedrijfsgegevens worden niet automatisch ongedaan gemaakt door een coderevert; beoordeel een eventuele databaseterugval afzonderlijk.
