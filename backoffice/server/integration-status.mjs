/* Metadata outcomes describe the persisted dossier, independently of any future
   connector. These descriptions never turn user input into external evidence. */
const definitions={
 '20i':{
  outcome:'20i-dossiermetadata opgeslagen. Er is geen reselleraccount gelezen, inventaris opgehaald of providerproduct geactiveerd.',
  requirements:['Een bevestigd 20i-servicecontract en runtimebinding voor uitsluitend de bedoelde worker ontbreken.','Een door de eigenaar toegewezen proefaccount en geverifieerde, gedocumenteerde leesoperatie ontbreken.','Accountscope, productreferenties en afzonderlijke provider-capabilities zijn niet extern geverifieerd.'],
  next:'Laat de platformbeheerder het 20i-servicecontract en proefaccount vastleggen; voer daarna de afzonderlijke geautoriseerde leescontrole uit.'
 },
 'resource-link':{
  outcome:'Hostingdossiermetadata opgeslagen. Deze wizard heeft geen DG-dienst aan een providerresource gekoppeld en geen bestelling geplaatst.',
  requirements:['De klant-, domein- en concrete provider/account/resource-identiteit zijn nog niet onafhankelijk bevestigd.','Een conflictvrije binding aan een bestaande DG-dienst is nog niet uitgevoerd.','Voor nieuwe hosting ontbreken de actuele product-/kostensnapshot en afzonderlijke toestemming.'],
  next:'Controleer klant en stabiele resource-ID; laat daarna de bedoelde bestaande binding beoordelen. Een nieuwe bestelling vraagt een apart kostenplan en vrijgave.'
 },
 'domain':{
  outcome:'Domeindossiermetadata opgeslagen. Registratie, registrar, houder, DNS en nameservers zijn door deze wizard niet gewijzigd.',
  requirements:['Zeggenschap, actuele registrar-/TLD-status en houdergegevens zijn niet onafhankelijk geverifieerd.','De gekozen registratie- of transferactie heeft nog geen actueel kosten- en afhankelijkhedenplan.','DNS- of delegatiewijzigingen vereisen een afzonderlijke gereviewde diff en herstelroute.'],
  next:'Laat de domeineigenaar de actuele registratie bevestigen en beoordeel de gekozen route; behandel een eventuele DNS-cutover als een aparte actie.'
 },
 'mailbox':{
  outcome:'Mailboxdossiermetadata opgeslagen. Er is geen mailbox, alias, forward of Projectinbox-verbinding aangemaakt.',
  requirements:['De klant/hosting/domeinrelatie en feitelijke mailprovider zijn niet geverifieerd.','Werkelijke quota, mailbox-/aliasconflicten en forwardingbestemmingen zijn niet bij de provider gecontroleerd.','Beveiligde toegangsinitiatie en readback na afzonderlijk goedgekeurde mailboxaanmaak ontbreken.'],
  next:'Controleer de bestaande mailroute en providerquota; laat het mailboxverzoek daarna afzonderlijk beoordelen en teruglezen.'
 },
 'mail-migration':{
  outcome:'Migratiedossiermetadata opgeslagen. Er is geen mailinhoud gekopieerd, bronbericht verwijderd of MX-record aangepast.',
  requirements:['Bevoegde bron-/doelconfiguratie en mailboxinventaris ontbreken.','TLS, doelquota, map-/aantallenvergelijking en bijlagensteekproef zijn niet uitgevoerd.','Een goedgekeurd delta-/cutovervenster met nazorg, bronretentie en terugval ontbreekt.'],
  next:'Wijs bron- en doeltestmailbox toe en verifieer de toegang; plan eerst een kopie zonder MX-wijziging of brondelete.'
 },
 'product-mapping':{
  outcome:'Productdossiermetadata opgeslagen. Er is geen catalogusversie gepubliceerd, providerproduct gekoppeld of bestaand contract herprijsd.',
  requirements:['Een exacte geverifieerde providerproductreferentie en geteste capability ontbreken.','Prijs, valuta, termijn en btw-configuratie hebben nog geen goedgekeurde commerciële snapshot.','Een afzonderlijk beoordeelde aanbodpreview en publicatiebevoegdheid ontbreken.'],
  next:'Beoordeel productreferentie en prijsversie; houd het aanbod buiten verkoop of als handmatige aanvraag tot afzonderlijke publicatie is toegestaan.'
 },
 'vps':{
  outcome:'VPS-dossiermetadata opgeslagen. Er is geen VPS besteld, apart inventarisrecord aangemaakt, agent gekoppeld of hostmeting ontvangen.',
  requirements:['De hostname, eventuele provideridentiteit en bestaande hostgrenzen zijn nog niet onafhankelijk bevestigd.','Een afzonderlijke inventarisregistratie is nog niet vanuit dit dossier uitgevoerd.','Private agentpairing, fingerprintbevestiging en eerste meetbewijs ontbreken.'],
  next:'Open Serverdashboard → Mijn inventaris en controleer het bestaande hostrecord, of gebruik de aparte VPS-hardeningregistratie met bewuste inventariskeuze. Meetbron en pairing blijven aparte stappen.'
 },
 'project':{
  outcome:'Projectdossiermetadata opgeslagen. Er is buiten dit dossier geen projectomgeving, hostbinding, runner of release aangemaakt.',
  requirements:['De geautoriseerde repository, bestaande projectidentiteit en eigenaar zijn niet onafhankelijk bevestigd.','Host/poort/unit/FQDN, paden en afzonderlijke runtime-identiteiten zijn niet tegen de bestaande omgeving gecontroleerd.','Getest back-up-/herstelbewijs en een apart goedgekeurd uitvoerprofiel ontbreken.'],
  next:'Vergelijk de intake met het bestaande project en de hostinventaris; gebruik daarna het aparte achtstappen-Projectuitroldossier. Vraag een release pas na onafhankelijk bewijs aan.'
 },
 'vaultref':{
  outcome:'Kluisreferentiedossier opgeslagen. Er is geen geheim opgeslagen, onthuld of geroteerd en er zijn geen grants verleend.',
  requirements:['De bestaande secretstore-referentie en exacte project/VPS/omgevingsscope zijn niet door de bevoegde beheerder bevestigd.','Minimale metadata-, onthul-, beheer- en workergrants zijn nog niet afzonderlijk beoordeeld.','Bewezen secretstoreherstel en recente herauthenticatie voor gevoelige handelingen ontbreken.'],
  next:'Laat de secretbeheerder de bestaande referentie en concrete grants via de beveiligde beheerroute beoordelen; plak geen geheime waarde in dit dossier.'
 },
 'projectinbox':{
  outcome:'Projectinboxdossiermetadata opgeslagen. Er is geen mailbox aangesloten, bericht geïmporteerd, antwoord verstuurd of inboxrecht toegekend.',
  requirements:['Een aangewezen projecttestmailbox en projectgebonden runtimeconfiguratie ontbreken.','Read-only IMAP/SMTP-bewijs, vaste merkafzender en concrete inboxgrants zijn niet geverifieerd.','Afzonderlijk ontvangst-/threadingbewijs en een expliciet goedgekeurde proefmail naar een beheerd testadres ontbreken.'],
  next:'Wijs één Support-testmailbox en beheerder aan; controleer eerst read-only verbinding en scope. Ontvangst en verzending krijgen daarna ieder een eigen vrijgave.'
 },
 'customers-import':{
  outcome:'Klantimportdossiermetadata opgeslagen. Klantrecords worden uitsluitend via het afzonderlijk beoordeelde lokale importplan verwerkt; facturatie blijft gepauzeerd.',
  requirements:['Beoordeel een actueel lokaal importplan en de stabiele bronreferentie voor deze dossierconfiguratie.','Conflicten, contractgegevens en technische dienstbinding vereisen afzonderlijke verificatie.','Facturatie en uitnodigingen worden door de lokale import niet geactiveerd.'],
  next:'Open het afgeronde dossier voor Lokaal importvoorbeeld bekijken of het bijbehorende importbewijs. Bekijk daarna het lokale klantregister; verifieer contract en dienstbinding vóór een aparte vervolgstap.'
 },
 'mollie':{
  outcome:'Betaaldossiermetadata opgeslagen. Er is geen echte checkout, betaling, mandaat, refund of incasso uitgevoerd.',
  requirements:['Het afzonderlijke Mollie-runtimecontract, toegewezen testaccount en juiste accountmodus zijn niet bevestigd.','Webhook/API-reconciliatie van factuur, bedrag, valuta en dubbele events is niet met een testaccount bewezen.','Voor terugkerende betalingen ontbreekt afzonderlijk geldig mandaatbewijs.'],
  next:'Wijs een Mollie-testprofiel aan en bevestig het runtimecontract; test daarna statusreconciliatie met een expliciete proeffactuur. Live betaling blijft een aparte vrijgave.'
 },
 'system-mail':{
  outcome:'Verzendprofiel- en templatedossiermetadata opgeslagen. Er is geen systeemmail, OTP, factuurmail of testmail verstuurd.',
  requirements:['Het bevoegd verzenddomein en de afzonderlijke provider-/runtimeconfiguratie zijn niet bevestigd.','TLS, passend DNS-authenticatiebeleid en feitelijke From/Reply-To-alignment zijn niet extern geverifieerd.','Een aangewezen testontvanger en ontvangen proefmailbewijs ontbreken.'],
  next:'Laat de mailbeheerder afzenderdomein, providerprofiel en beheerd testadres bevestigen; beoordeel de template vóór een afzonderlijk toegestane rooktest.'
 },
 'webmail':{
  outcome:'Webmaildossiermetadata opgeslagen. Er is geen DNS, providerbranding, SSO of mailboxlogin gewijzigd of getest.',
  requirements:['De HTTPS-providerhost en gewenste DG-route zijn niet door de beheerder bevestigd.','DNS expected/observed en het TLS-certificaat zijn niet onafhankelijk gecontroleerd.','Een gecontroleerde testmailboxlogin ontbreekt; SSO is geen beschikbare capability.'],
  next:'Bevestig de officiële providerhost en laat de DNS-/TLS-vergelijking uitvoeren. Test reguliere mailboxlogin op een aangewezen testmailbox; SSO blijft apart geblokkeerd.'
 },
 'staff':{
  outcome:'Medewerkerdossiermetadata opgeslagen. Er is geen uitnodiging verstuurd, account aangemaakt, MFA voltooid of toegangsrecht verleend.',
  requirements:['Identiteit, rolacties en concrete project-/inbox-/omgevingsscopes zijn nog niet door de bevoegde eigenaar bevestigd.','Een afzonderlijk beoordeelde, eenmalige en vervallende uitnodiging is nog niet verstuurd.','Een geverifieerd account, voltooide MFA en controle op directe URL-/export-/bijlagetoegang ontbreken.'],
  next:'Laat de scope-eigenaar ontvanger en concrete acties beoordelen. Een uitnodiging vereist daarna een aparte verzendactie; rechten volgen pas na accountverificatie en MFA.'
 }
};
export const fixtureInstallationKinds=Object.freeze(Object.keys(definitions));
export function describeFixtureIntegration(record={}){
 const definition=definitions[record.kind]||{outcome:'Veilige dossiermetadata opgeslagen. Deze backend heeft geen externe verbinding of resource geactiveerd.',requirements:['Een gecontroleerde adapter en concreet installatiecontract ontbreken.','Doel, scope en relevante capabilities zijn niet extern geverifieerd.'],next:'Laat de platformbeheerder het concrete integratiecontract en de benodigde controle vastleggen.'};
 const requirements=[...definition.requirements,'Deze backend staat geen externe providerwrites toe.'];
 let nextAction=definition.next;
 if(record.kind==='resource-link'&&record.values?.operation==='external-record'){requirements.splice(0,3,'Bevestig klant, domein, externe beheerpartij en technisch eigenaar.','Een afzonderlijke lokale DG-dienstregistratie is nog niet vanuit dit dossier uitgevoerd.');nextAction='Controleer de externe beheerafspraak en registreer de bedoelde DG-dienst afzonderlijk; deze werkwijze vraagt geen 20i-bestelling.';}
 return{savedOutcome:definition.outcome,missingRequirements:requirements,blockers:[...requirements],nextAction,verificationLevel:record.lastTest?.simulated===true?'simulated':'not_checked',providerWrites:false};
}
