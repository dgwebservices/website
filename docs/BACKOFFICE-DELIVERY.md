# Backoffice — overdracht en bewijs, 11 november 2026

De kandidaat brengt de oorspronkelijke v8-interface onder `/admin` in de bevestigde repository `dgwebservices/website`, met afzonderlijke authenticatie en een Supabase-backend voor afgebakende metadata en Support. De bron staat op `codex/dg-backoffice-admin`, gebaseerd op de bevestigde productiecommit `a308e76769ae26712186e9a4cc51408fd4025008`. De definitieve kandidaatcommit, volledige websitebuild, CI en stagingacceptatie zijn op dit documentmoment **nog niet bewezen**. Er is geen productiepush of liveactivatie uitgevoerd.

Dit is geen volledige providergekoppelde backoffice. Ondersteunde administratieve handelingen staan hieronder; overige pagina’s tonen in de echte gegevensmodus een expliciete lege of niet-gekoppelde toestand. Voorbeeldklanten, fictieve omzet, betaalbewijzen, mailboxinhoud en hostmetingen worden daar niet als echte administratie getoond. De visuele acceptatie staat open.

## Bron en runtime

De v8-bron is vastgelegd in [SOURCE.json](../backoffice/provenance/SOURCE.json): commit `66632d2d92e1ac4fa7ee5645c2153ad0d9256557`, 16 beheerroutes, 11 klantroutes en twee oorspronkelijke infrastructuurwizards van elk acht stappen. [preserved-files.json](../backoffice/provenance/preserved-files.json) bevat 28 bytegelijk behouden oorspronkelijke bestanden, waaronder CSS, logo’s, fonts en wizarddefinities. De entry, assetpaden en gegevensadapters zijn aangepast voor de websiteomgeving; die volledige bestanden worden niet als ongewijzigde kopie gepresenteerd.

| Modus | Gegevens en toegang | Grens |
| --- | --- | --- |
| `supabase` | Gecontroleerde HTTPS-configuratie; servercookies; geverifieerde actuele Auth-gebruiker, bevestigd e-mailadres, MFA, bestaande sessie en precies één actief databaselidmaatschap | Alleen bevoegde servergegevens; geen browserrol of automatische eerste beheerder |
| Afzonderlijke `fixture` | Expliciete lokale reviewserver met eigen SQLite-bestand en vaste testprincipal | Alleen loopback; geen productieauthenticatie, echte klanten of providerbewijs |
| Pariteitsfixture | Oorspronkelijke voorbeeldtoestanden voor vergelijking | Afzonderlijk visueel bewijs; oorspronkelijke browseropslag is uitsluitend hier toegestaan |

De website levert het beveiligde document via `app/admin/`, runtime via `/admin/runtime.js` en APIs via `/admin/api/*`. Logische `/api/*`-paden worden door `admin-paths.js` naar die namespace vertaald. Er is geen onbeveiligde `public/admin/index.html`. De marketingroutes houden hun eigen namespace en bestaande uitrolcontract.

In de echte modus gebruikt `business-store.js` acht expliciete statebronnen. Een ontbrekende bron wordt met `empty-state.js` leeg geïnitialiseerd in de rendercache, zonder voorbeeldrecords of automatische write. Alleen infrastructuur- en wizardmetadata zijn via deze legacy-stateadapter beschrijfbaar; overige oude demoacties worden server-side geweigerd. Support gebruikt uitsluitend zijn eigen genormaliseerde API. Thema/displayvoorkeuren kunnen lokaal blijven; bedrijfsgegevens en supportconcepten gebruiken geen lokale browseropslag in deze modus.

## Route → component → gegevensbron → mutatie → test

Alle onderstaande hash-routes blijven onder `/admin` bestaan. Zichtbaarheid volgt de actuele actor en permissies; een hash, rolknop of browserheader verleent geen serverrecht. Componentnamen verwijzen naar `public/admin/`. De tabel beschrijft de **echte gegevensmodus**; de originele voorbeelden zijn alleen in de afzonderlijke fixture beschikbaar.

Testverwijzingen:

- **A**: [backoffice-assets.test.mjs](../tests/backoffice-assets.test.mjs), namespace, paden en roldefaults.
- **E**: [backoffice-empty-state.test.mjs](../tests/backoffice-empty-state.test.mjs), lege gegevens, geen automatische seeds/writes en geweigerde demoacties.
- **H**: [backoffice-auth.test.mjs](../tests/backoffice-auth.test.mjs), actuele identiteit/MFA/membership, sessies, oorsprong/CSRF, cookies en foutgrenzen.
- **D**: [backoffice-domain.test.mjs](../tests/backoffice-domain.test.mjs) en [backoffice-domain-sql.test.mjs](../tests/backoffice-domain-sql.test.mjs), transport en echte SQL-contracten in een wegwerpdatabase.
- **F**: [backoffice-fixture-support.test.mjs](../tests/backoffice-fixture-support.test.mjs), oorspronkelijke Support-HTML in de pariteitsfixture.
- **V(scene)**: bestaande visuele scene uit het eerdere reviewarchief; historische resultaten en open afwijkingen staan verderop. Dit is geen nieuwe volledige vergelijking van de websitekandidaat.

| Route | Component | Gegevensbron | Toegestane mutatie / huidige grens | Test |
| --- | --- | --- | --- | --- |
| `#/admin/overview` | `app.js`, `empty-state.js`; v8 `admin.js` bewaard | Geen gekoppelde bedrijfsmetingen | Navigatie naar bevoegde flows; geen fictieve KPI of financiële mutatie | A, E, H; V(`admin-overview`) |
| `#/admin/customers` | `management.js`, `empty-state.js`, `installations.js` | Genormaliseerd klantregister via `/api/customer-registry`; oude klantentabel leeg | Alleen beoordeelde één-recordimport via dossier, exacte preview en commit; geen oud klantformulier als echte opslag | E, D; V(`admin-customers`) |
| `#/admin/orders` | `management.js`, `empty-state.js` | Geen gekoppelde orderadministratie | Geen bestelling, betaal- of leverstatusmutatie | E, D; V(`admin-orders`) |
| `#/admin/domains` | `services.js`, `empty-state.js`; v8 `admin.js` | Geen geverifieerde domein-/DNSbron | Domeindossier voorbereiden; geen DNS-, registrar- of transferwrite | E, D; V(`admin-domains`) |
| `#/admin/hosting` | `services.js`, `empty-state.js`; v8 `admin.js` | Geen geverifieerde hostingbron | Resource-/20i-dossier voorbereiden; geen provisioning, pakketwijziging of restore | E, D; V(`admin-hosting`) |
| `#/admin/email` | `services.js`, `empty-state.js` | Geen gekoppelde mailboxbron | Mailbox-, migratie- of webmaildossier; geen mailbox, alias, wachtwoord of mailinhoud wijzigen | E, D; V(`admin-email`) |
| `#/admin/products` | `management.js`, `empty-state.js` | Geen gepubliceerde productcatalogus | Mapping en prijsmetadata voorbereiden; geen productpublicatie of herprijzen | E, D; V(`admin-products`) |
| `#/admin/subscriptions` | `account.js`, `empty-state.js`; v8 `admin.js` | Geen gekoppelde contractadministratie | Geen verlenging, opzegging, facturatie of incasso | E, D; V(`admin-subscriptions`) |
| `#/admin/invoices` | `commerce.js`, `empty-state.js` | Geen uitgegeven factuur-/betaalbron | Betaaldossier voorbereiden; geen factuur, betaling, refund of mandaat | E, D; V(`admin-invoices`) |
| `#/admin/support` | `support.js`, `support-api.js` | Genormaliseerde tickets, publieke berichten, afzonderlijke interne notities en eigen concepten | Aanmaken, reageren, interne notitie, toewijzen, prioriteit/status; permissies, CAS, idempotency en serverbevestiging | H, D, F; V(`admin-support`, `admin-support-ticket`) |
| `#/admin/infrastructure` | `infrastructure.js`, `infra-wizards.js`, `deploy-wizard.js`, `hardening-wizard.js`, `vaults.js` | Eigen gescopeerde infrastructuur-/wizardmetadata; geen hostmetingen | Admin kan inventaris en 8+8 dossiers opslaan; batch/CAS en serverguards; geen SSH, firewall, deploy, monitoring of secretreveal | E, H, D; V(`admin-infrastructure`) |
| `#/admin/maildesk` | `maildesk.js`, `empty-state.js` | Geen bevoegde IMAP-/inboxbron | Projectinboxdossier voorbereiden; geen mailbox lezen of antwoord verzenden | E, D; V(`admin-maildesk`) |
| `#/admin/automation` | `app.js`, `empty-state.js`; v8 `admin.js` | Geen externe workers; gescopeerde metadatajobs beschikbaar via installatiecentrum | Geen worker- of procesuitvoering; dossierjobs zijn expliciet lokaal/geblokkeerd | E, D; V(`admin-automation`) |
| `#/admin/communication` | `management.js`, `empty-state.js` | Geen vrijgegeven verzendprofiel/templatebron | Systeemmaildossier voorbereiden; geen mailverzending | E, D; V(`admin-communication`) |
| `#/admin/reports` | `app.js`, `empty-state.js`; v8 `admin.js` | Geen financiële rapportagebron | Geen fictieve omzet, financiële export of boeking | E, D; V(`admin-reports`) |
| `#/admin/settings` | `app.js`, `empty-state.js`, `installations.js` | Actuele sessie/permissies; installatie-ingang; gescopeerde audit-API | Dossiers openen; geen automatische teamgrant, secretconfiguratie of bedrijfsvoorkeurwrite | A, E, H, D; V(`admin-settings`) |
| `#/client/overview` | `app.js`, `empty-state.js`; v8 `midnight.js` | Geen gekoppelde eigen bedrijfsmetingen | Navigatie; geen verzonnen dienst- of factuurstatus | A, E, H; V(`client-overview`) |
| `#/client/domains` | `services.js`, `empty-state.js`; v8 `pages.js` | Geen geverifieerde eigen domeinbron | Geen DNS- of verlengmutatie | E, H, D; V(`client-domains`) |
| `#/client/hosting` | `services.js`, `empty-state.js`; v8 `pages.js` | Geen geverifieerde eigen hostingbron | Geen pakketinstelling of herstelactie | E, H, D; V(`client-hosting`) |
| `#/client/email` | `services.js`, `empty-state.js` | Geen gekoppelde eigen mailboxbron | Geen mailbox-, alias-, forwarding- of quotamutatie | E, H, D; V(`client-email`) |
| `#/client/webmail` | `services.js`, `empty-state.js`; v8 `pages.js` | Geen bevestigde webmailroute voor de organisatie | Geen mailboxlogin, SSO of providerredirect als geverifieerde koppeling | E, H; V(`client-webmail`) |
| `#/client/orders` | `commerce.js`, `empty-state.js`; v8 `pages.js` | Geen gekoppelde eigen orders | Geen demo-order als echte bestelling | E, H, D; V(`client-orders`) |
| `#/client/subscriptions` | `account.js`, `empty-state.js` | Geen gekoppelde eigen contracten | Geen verleng-/opzegverzoek of incasso | E, H, D; V(`client-subscriptions`) |
| `#/client/invoices` | `commerce.js`, `empty-state.js` | Geen geverifieerde eigen facturen/betalingen | Geen demo-checkout, betaalbevestiging of financiële export | E, H, D; V(`client-invoices`) |
| `#/client/support` | `support.js`, `support-api.js` | Alleen eigen membershiporganisatie; publieke berichten en eigen concepten | Aanmaken, publieke reactie, oplossen/heropenen; geen interne notities, bijlagen of e-mail | H, D, F; V(`client-support`) |
| `#/client/account` | `account.js`, `empty-state.js` | Geverifieerde sessie; profiel-/teamadministratie niet gekoppeld | Geen fictieve profiel-/MFA-status, uitnodiging of herstelverzoek opslaan | A, E, H; V(`client-account`) |
| `#/client/new` | `app.js`, `empty-state.js`; v8 `pages.js`/`commerce.js` | Geen vrijgegeven aanbod-/orderbron | Geen demo-checkout, registratie, betaling of levering | E, H, D; V(`client-new`) |
| `#/admin/installations` — toegevoegd | `installations.js`, `installations.css` | Gescopeerde integratiedossiers, jobs/audit; zo nodig importplan/register | Dossier aanmaken/hervatten/bewerken, gesimuleerd testen, preview, metadata pauzeren; activeren blijft geblokkeerd | H, D; aparte nieuwe flow, geen v8-baseline |

De infrastructuurstates omvatten de oorspronkelijke Projectuitrol- en VPS-hardeningwizards met elk acht stappen. Dossierwijzigingen maken latere verklaringen ongeldig waar nodig; CI-/SHA-/acceptatieguards worden opnieuw op de server en in SQL getoetst. Een gekoppeld hardeningdossier is `reported_by_actor`, met monitoring `pending`, en bewijst geen extern uitgevoerde hardening. Oude fleet-, release-, runner-, back-up- en kluisdemo’s zijn geen live gegevensbron. De pariteitsfixture bewaart hun oorspronkelijke visuele states; in echte modus blijven niet aangesloten uitvoer- en secretflows geblokkeerd.

## Integraties en installatie

Alle vijftien typen delen `/api/integrations`, `/:id`, revisies en expliciete actiepermissies. De PostgreSQL-workspace bepaalt de omgeving. JavaScript én SQL valideren de veldschema’s; een rechtstreekse RPC mag de UI-validatie niet omzeilen. Tests zijn gesimuleerd/geblokkeerd, preview verandert niets extern, `activate` levert een geblokkeerde uitkomst op en `lastSuccessfulTestAt` blijft leeg zonder externe bewijsroute. Pauzeren verwijdert geen providerresource.

| Dossier-ID | Stappen | Opgeslagen gegevens / mutatie | Nog niet aangesloten | Test |
| --- | --- | --- | --- | --- |
| `20i` | 6 | Servicecontract, account-/inventaris-/productreferenties | Geheime runtimebinding, echte account-/capabilitycontrole | D: veldschema, revisies, test/preview/activate-grens |
| `resource-link` | 5 | Bestaande/nieuwe/externe resourcebinding als metadata | Providerbestelling of werkelijke binding | D |
| `domain` | 5 | Domein, houder, DNS-/registrarverantwoordelijkheid, wijzigingsplan | Registratie, transfer, DNS-write | D |
| `mailbox` | 5 | Mailbox-, quota-, alias-/forwardplan | Provisioning, wachtwoorden, mailinhoud | D |
| `mail-migration` | 5 | Bron/doel, kopie-/delta-/cutoverplan | Mailkopie, credentials, MX-wijziging | D |
| `product-mapping` | 5 | Productversie, prijs en providerreferentie | Publicatie, herprijzen of verkoop | D |
| `vps` | 5 | Eigen host-, provider- en monitoringreferenties | SSH, agentpairing, firewall of metingen | D |
| `project` | 5 | Repository, omgeving, host-/configuratiebinding | Deploy, runnerregistratie of release | D |
| `vaultref` | 5 | Niet-geheime, afgebakende kluisreferentie | Secretstore, reveal, rotatie, grants | D |
| `projectinbox` | 7 | Project, inbox, afzender, branding en toegangsdossier | IMAP/SMTP, mailboxinhoud of verzending | D |
| `customers-import` | 5 | Exact beoordeelde handmatige één-recordimport naar het klantregister | Providerimport, actieve dienst, factuur, incasso, uitnodiging | D: positieve import, replay, drift, conflict en rollback |
| `mollie` | 5 | Testprofiel en betaal-/callbackreferenties | Betaling, refund, mandaat of reconciliatie | D |
| `system-mail` | 5 | Afzender, ontvanger en templateversie | Testmail of andere verzending | D |
| `webmail` | 5 | HTTPS-route, branding en loginplan | DNS/TLS-/mailbox-/SSO-verificatie | D |
| `staff` | 5 | Beoogde identiteit, rol, project/inboxscope en MFA-beleid | Auth-user, uitnodiging, grant of mail | D |

Contextingangen staan op Instellingen, Hosting, Domeinen, E-mail (inclusief Webmail), Serverdashboard, Projectinbox, Klanten, Producten, Facturen en Communicatie. Ze volgen permissies en ontbreken in de oorspronkelijke pariteitsfixture. De UI vraagt alleen veilige metadata/referenties; runtimecredentials horen niet in dossiers of GitHub Variables voor dit basiscontract.

Klantimport vereist een voltooid `customers-import`-dossier, `sourceType=manual` en `resourceReference=unlinked`. Preview bindt actor, werkruimte, configuratierevisie, configuratie-/plandigest en registerrevisie, met vijftien minuten geldigheid. Commit bewaart organisatie, bronbinding, bronregel, ontvangstbewijs, job, audit en idempotent resultaat atomair. Bron-/naamconflict blokkeert; hetzelfde e-mailadres voegt geen organisaties samen. Facturatie blijft door een databaseconstraint gepauzeerd, diensten blijven ongekoppeld. Ontvangstbewijzen houden hun oorspronkelijke configuratiebinding en worden na drift als historisch behandeld.

Support hergebruikt de oorspronkelijke pagina en modals. Publieke berichten en interne notities zijn afzonderlijk opgeslagen; een interne notitie of toewijzing verandert geen client-DTO, publieke revisie, tijdstempel, telling of lijstvolgorde. Concepten zijn actor-/rol-/organisatie-/ticketgebonden en gebruiken CAS. Succes verschijnt pas na serverbevestiging; fouten en conflicten behouden invoer. Lijsten begrenzen op 200 en melden `hasMore`; publieke en interne kanalen hebben elk maximaal 500 berichten. Bijlagen en echte e-mail blijven uitgeschakeld.

## Werkelijk Supabase-project en eigenaar

Het bevestigde project is `dgwebservices-website` onder account `Duindorpdoet`, referentie `prjvxusiqzadpaitcqxr`. Het echte gedeelde project is alleen gelezen en **ongewijzigd gebleven**: deze oplevering heeft daar geen backofficemigratie, Auth-user, membership, voorbeeldklant of bedrijfsrecord aangemaakt. De backofficeadministratie start dus leeg/niet ingericht; dit is geen verklaring dat het gehele reeds bestaande project leeg is.

De nieuwe [migratie](../supabase/migrations/20261111155319_dg_bo_foundation.sql) maakt alleen `dg_bo_*`-objecten en private helpers. Nieuwe tabellen hebben RLS en geen directe anonymous/authenticated-rechten. Alleen de twee expliciete openbare RPCs zijn beschikbaar voor authenticated en toetsen de actuele scope opnieuw. De sessie moet bij de gebruiker horen en aan een actueel geverifieerde eigen MFA-factor gekoppeld zijn. Browserclaims of `user_metadata` bepalen geen rol. Bestaande projectobjecten en eerder geobserveerde advisories zijn niet stilzwijgend gewijzigd of opgelost.

De gebruiker bevestigde `info@dgwebservices.nl` als beoogde eerste eigenaar. [bootstrap-owner.sql](../supabase/bootstrap-owner.sql) is daarvoor **voorbereid, niet uitgevoerd**. De handmatige stap vereist een onafhankelijk bevestigd exact Auth-UUID van precies één bestaande, bevestigde en toegestane gebruiker. Zij maakt geen Auth-user aan, verstuurt geen mail en overschrijft geen afwijkende of ingetrokken membership. Signup, een e-mailadresmatch of de eerste login verleent nooit automatisch beheerrecht.

Het native productiecontract gebruikt precies vier bestaande GitHub-environment Variables: `DGWEB_APP_ORIGIN`, `DGWEB_DATA_MODE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. De publishable key is geen beheercredential; waarden worden niet in dit document gekopieerd. De daadwerkelijke runtimeconfiguratie, migratie, eigenaarstoewijzing en acceptatie vereisen afzonderlijk bewezen uitvoering. Zie [BACKOFFICE-DEPLOYMENT.md](BACKOFFICE-DEPLOYMENT.md).

De actuele GitHub-controle geeft voor `production` **`protected: false`** en voor environment `production` **`protection_rules: []`**, met `deployment_branch_policy: null`. Verplichte reviewers en branch-/environmentbeperkingen zijn dus nog niet bewezen ingesteld. Dit is een open vrijgavegate; de workflowverwijzing naar een environment maakt die bescherming niet vanzelf aan.

## Beschikbaar testbewijs en beperkingen

| Bewijs | Uitkomst | Wat het bewijst / beperking |
| --- | --- | --- |
| `node --test tests/backoffice-auth.test.mjs` | **55/55 geslaagd** | HTTP Request/Response-tests met geïnjecteerde identiteitsprovider; vervalste/ingetrokken sessies, actuele rol/permissies, MFA-factorstaleness, oorsprong/CSRF, veilige cookies, refreshcoalescing, cookies na fouten, MFA-eigendom, foutredactie en onzeker uitloggen. Geen echte Supabase-login of mail |
| [acceptance-local-postgresql16.txt](../backoffice/server/acceptance-local-postgresql16.txt) | **19/19 geslaagd**, inclusief 12 SQL-contractscenario’s en 6 transport/schema-tests plus de overkoepelende SQL-test | De echte migratie in een geïsoleerde tijdelijke PostgreSQL 16.15-database met minimale Auth-testtabellen. Geen TCP of projectwrites; de testdatabase is opgeruimd. De echte project/PostgREST-acceptatie is nog open |
| `node scripts/check-backoffice-source.mjs` | **28/28 bestandshashes gelijk** | Gepinde oorspronkelijke bestanden zijn bytegelijk; dit zijn bestandchecks, geen 28 functionele tests of volledige visuele acceptatie |
| Lokale gecombineerde testsuite | **115 resultaten: 114 geslaagd, 1 SQL-suite expliciet overgeslagen** | Zonder databasevariabele wordt SQL niet als uitgevoerd meegerekend; het afzonderlijke SQL-bewijs staat hierboven |
| Lint en TypeScript | **0 lintfouten, 7 lintwaarschuwingen; TypeScript geslaagd** | Bestaande waarschuwingen zijn geen foutloze lintuitvoer; geen gedragswijziging door de laatste testvariabelehernoeming |
| A, E en F uit de routemapping | Gerichte bron-/rendercontracten opgenomen in de lokale suite | Namespace, lege echte state en oorspronkelijke Support-HTML; volledige actuele CI-uitvoering blijft afzonderlijk te registreren |
| Aanvullende UI-checks en [backoffice-production-ui.mjs](../tests/backoffice-production-ui.mjs) | **10 gerichte unitchecks en de browserproef met werkelijke assets geslaagd** | Geïnjecteerd API-contract, inclusief lege administratie en permissiegrenzen; geen bewijs van echte accounts, projectdata of providers |

De SQL-suite toetst onder andere directe tabel-/helperweigering, actuele gebruiker/MFA/sessie/membership, het weigeren van ontbrekende assurance en onvoltooide importdossiers, cross-org/workspace-IDOR, private DTO/replay, schema-/secretvalidatie, CAS/batches, idempotency, atomaire rollback en veilige handmatige eigenaarstoewijzing. Dat deze SQL-test lokaal slaagt, bewijst geen toegepaste migratie of succesvolle accountproef op het echte project. Zonder expliciet lokale `DG_BO_TEST_DATABASE_URL` wordt de losse SQL-suite herkenbaar overgeslagen.

De laatste aanscherping die rechtstreekse RPC-request-IDs tot UUID/null beperkt, is afzonderlijk op de VPS tegen de wegwerpdatabase hergetest: **13/13 geslaagd**, zonder skips; zie [acceptance-vps-postgresql16.txt](../backoffice/server/acceptance-vps-postgresql16.txt). De eigen testserver is gestopt en de tijdelijke database en uitgepakte pakketten zijn verwijderd. Volledige websitebuild en CI blijven pending.

### Historisch visueel bewijs: gate blijft open

Het eerdere zelfstandige reviewarchief staat lokaal onder `/home/codex/repos/dg-backoffice-review/app/evidence/`, met [PARITY.md](/home/codex/repos/dg-backoffice-review/app/evidence/PARITY.md) en [parity-summary.json](/home/codex/repos/dg-backoffice-review/app/evidence/parity-summary.json). De oorspronkelijke screenshotrunner/comparator zijn bewaard; alleen de gedocumenteerde DNS-sceneselector werd in het opnamerecept gecorrigeerd. Het archief hoort bij de eerdere reviewbron en fixture-runtime, niet bij een nieuwe volledige opname van de huidige website-/authkandidaat. De PNGs zijn lokaal beschikbaar maar niet automatisch onderdeel van deze repository.

| Suite | Exact gelijke pixelparen |
| --- | --- |
| Oorspronkelijke basissuite | 173/174 |
| Aanvullende schermformaten | 428/434 |
| Kritieke breakpoints | 62/62 |
| Alle oorspronkelijke 8+8 wizardstappen | 64/64 |
| **Canoniek totaal** | **727/734; zeven open afwijkingen** |

De zeven niet geaccepteerde paren zijn `mobile-light/client-dns-editor`, `minimum-dark/admin-support`, `minimum-dark/client-support`, `minimum-light/admin-support-ticket`, `minimum-light/client-support`, `minimum-light/wizard-overview` en `tablet-dark/wizard-hardening-firewall-blocked`. DOM-, stijl- en geometrieonderzoek en bronherhalingen zijn bewaard. Er is geen goedgekeurde uitzondering; een vermoedelijke browserpaintoorzaak is geen bewezen oplossing.

Het eerste aanvullende Support-bewijs had **11/12 gelijke beelden**, ondanks 12 gelijke DOM-snapshots. `mobile-light/client-support` verschilde op **1.136 pixels**, rond de selectlabels, met bounding box x49–145/y609–726. Referentie, kandidaat, manifest en diff blijven behouden in `support-parity-initial-reference/`, `support-parity-initial-candidate/` en [support-parity-initial-diff/report.json](/home/codex/repos/dg-backoffice-review/app/evidence/support-parity-initial-diff/report.json). De oorzaak is niet bevestigd en de afwijking is niet geaccepteerd.

Een latere gerichte Support-run bevat **12/12 gelijke DOM- én pixelparen**, met transparant een verse browser per profiel en gebruik van `/dev/shm`; zie [support-browser.json](/home/codex/repos/dg-backoffice-review/app/evidence/support-browser.json) en [het afzonderlijke eindrapport](/home/codex/repos/dg-backoffice-review/app/evidence/support-parity-runs/2026-11-11T15-54-56-506Z/diff/report.json). De manifests leggen de gebruikte bronhashes en opnamevariant vast. Die 12 gelijke paren verklaren de eerdere 1.136 pixels niet en vervangen noch de zeven canonieke afwijkingen, noch de eerdere aanvullende afwijking. **Er is geen algemene pixelperfecte acceptatie.**

Frontend/QA moet eerst een reproduceerbare browser/OS/fontomgeving pinnen en herhaald exact gelijk bron-tegen-bronbewijs leveren voor de probleemcases. Daarna volgt een vergelijking van de definitieve websitekandidaat, inclusief `/admin`-namespace, auth/lege toestanden en aanvullende installaties. Geen maskers, hogere pixeltolerantie of samengevoegde score verhult de open paren.

## Development-VPS en operationele overdracht

| Onderdeel | Bevestigde inrichting / status |
| --- | --- |
| Host | `dg-sites-vps-01.tail4ca740.ts.net`, Tailscale `100.123.10.22`, publiek `167.235.202.206` |
| Beheerverbinding | Eigen `codex-dg-bo-dev`, UID1007; workerbron `100.79.0.26`; hostkey onafhankelijk gepind op `SHA256:1lkM4I6hljBVHsVukXE+Ds9zbYrd60G4wAe453vP/bQ` |
| SSH-afloop | `2027-11-11T14:20:06Z`; sleutel beperkt tot de bevestigde workerbron en `restrict`; privésleutel buiten Git |
| App-/buildgebruiker | `dg-bo-dev-app`, UID982/GID975, werkelijk HOME `/home/dg-bo-dev-app`, geen sudo of extra groepen |
| Websitecheckout | `/srv/dg-backoffice-dev/website-source`, mode0700, van openbare HTTPS-clone; exact bevestigde basis `a308e76769ae26712186e9a4cc51408fd4025008` vóór checkout/installatie gecontroleerd |
| Installatie | Bestaande `npm run install:ci`, als UID982 met lege environment; helper beheert eigen HOME/cache onder `.sites-runtime`. Exit0 op `2026-11-11T16:05:51Z`, Node24.19.0/npm11.17.0; 774 pakketten |
| Installatiebewijs | `.sites-runtime/website-install-2026-11-11.log` mode0600; `node_modules/.sites-install.json` bindt lockfile-SHA256 `da49209f5036e265fefd1aff15c2fb968cf6ee7c1516e40ed7cf436ee84834b7` |
| Schijfruimte na voorbereiding | Websitecheckout circa 1,5GB, waarvan node_modules 1,2GB en runtime 257MB; circa 14GB vrij op de VPS |
| Eerdere afzonderlijke review | `/srv/dg-backoffice-dev/source`; eigen fixturedata buiten herbouwbare bron onder `/srv/dg-backoffice-dev/runtime/data/` |
| Fixture-API | `127.0.0.1:4187`; alleen de expliciete reviewserver, geen echte Supabase-auth of provideruitvoering |
| Websitepreview | Eigen loopbackdoel `127.0.0.1:4188`; build en bewijs van de definitieve websitekandidaat zijn op dit documentmoment pending |

De private installerlog vermeldt zes dependency-installatiescripts die nog niet door de bestaande allowScripts-configuratie zijn goedgekeurd. Er is geen pakketbeleid of globale installatie gewijzigd om dat te verbergen; de uiteindelijke build moet aantonen welke bestaande projectafhandeling nodig is. De afhankelijkheden zijn op de bevestigde basis geïnstalleerd; dat bewijst geen build van de latere kandidaatwijzigingen.

Na de voorbereiding geven de zes bestaande sites op poorten `3102`, `3105`, `3108`, `3109`, `3110`, `3111` opnieuw HTTP 200. Het bestaande websiteproces PID 878, gebruiker `dgwebservices`, is daarbij ongewijzigd. Dit is een beperkte continuïteitscontrole, geen volledige functionele acceptatie. Er zijn voor deze eigen checkout geen Caddy-, systemd-, runner-, firewall-, DNS- of bestaande livepadwijzigingen uitgevoerd. App, npm en build gebruiken geen sudo; het beheeraccount is geen applicatie-identiteit.

## Nog uit te voeren vóór een vrijgavevoorstel

1. Leg de definitieve kandidaat-SHA vast, breng alleen die bron over naar de eigen websitecheckout en voltooi de bestaande websitebuild onder UID 982. Registreer gebruikte configuratie, uitkomst en eigen loopbackpreview op 4188; beperk de fixture-API tot 4187. Herhaal de zes bestaande websitecontroles na eigen werkzaamheden.
2. Voer de bedoelde CI voor precies die SHA uit: bestaande installer, lint, TypeScript, dubbele Vinext/Next.js-build, websitecontracten, backofficetests en afzonderlijke SQL-job. De workflows en tests zijn voorbereid; een lokale deelproef is geen groene CI-run.
3. Bevestig een werkelijk gescheiden stagingconfiguratie/project en toets daar de migratie, Auth/MFA, actuele factor-/sessie-/membershipintrekking, rollen, organisaties, Support en beoordeelde import. Het echte productieproject wordt niet als fixture- of stagingdatabase gebruikt.
4. Herstel of beoordeel de open visuele paren op de vastgelegde definitieve bron en rond desktop-/mobielacceptatie af. Voeg de ontbrekende nieuwe scherm-/fout-/toegankelijkheidsproeven toe waar het historische bewijs die niet dekt.
5. Stel de ontbrekende branch-/environmentbescherming aantoonbaar in en laat de eigenaar de concrete SHA, configuratie-ID, scope en stagingresultaten beoordelen. Voer pas na expliciete vrijgave de benodigde echte migratie en afzonderlijk bevestigde eigenaarstoewijzing uit, en gebruik voor productie de goedgekeurde branch/environment en bestaande deployhelper. Provideractivaties vereisen bovendien hun eigen account-, credential-, capability- en uitvoeringsbewijs.

Rollback blijft gekoppeld aan de bestaande goedgekeurde websiteprocedure voor code en configuratie samen; deze kandidaat activeert dat pad niet zelf. Een codeterugval draait geen database- of bedrijfsgegevens terug. Zie de concrete vrijgave- en rollbackgrenzen in [BACKOFFICE-DEPLOYMENT.md](BACKOFFICE-DEPLOYMENT.md).
