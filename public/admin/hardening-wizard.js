// Guided, browser-local checklist. This module never accesses or changes a server.
export function hardeningWizard(h) {
 const esc=h.escape;
 const on=(v,k)=>v[k]===true||v[k]==='on'||v[k]==='true';
 const value=(v,k)=>String(v[k]??'').trim();
 const options=(...items)=>items.map(item=>Array.isArray(item)?{value:item[0],label:item[1]}:{value:item,label:item});
 const field=(name,label,help,extra={})=>({name,label,help,type:'text',maxLength:160,...extra});
 const check=(name,label,help)=>({name,label,type:'checkbox',help,span:2});
 const select=(name,label,help,opts,initial)=>({name,label,type:'select',help,options:opts,default:initial,required:true});
 const guide=(title,items)=>'<div class="wiz-guide"><strong>'+title+'</strong><ol>'+items.map(item=>'<li>'+item+'</li>').join('')+'</ol></div>';
 const labels={
  consoleVerified:'Provider-MFA en onafhankelijke console-/rescuetoegang gecontroleerd',
  inventoryVerified:'Juiste host en bestaande diensten gecontroleerd',
  hostKeyVerified:'Hostfingerprint onafhankelijk vergeleken',
  ubuntuVerified:'Ubuntu-baseline, updates, capaciteit en klok gecontroleerd',
  adminVerified:'Tweede beheersessie met persoonlijke key en sudo geslaagd',
  tailLoginVerified:'Gewone OpenSSH over Tailscale met sudo geslaagd',
  tailPolicyVerified:'Beperkte Tailscale-grants inclusief negatieve proef aangetoond',
  sshConfigVerified:'sshd-syntax en effectieve hardening gecontroleerd',
  tailAfterReloadVerified:'Verse Tailscale-beheersessie na herladen van SSH geslaagd',
  dualFirewallVerified:'Hetzner-firewall én UFW volgens doelbeleid gecontroleerd',
  publicSshClosed:'Publieke TCP 22 geweigerd op alle gebruikte publieke adressen',
  maintenanceVerified:'Securityupdates, serviceherstarts, AppArmor en loglimieten beproefd',
  runtimeVerified:'Projecttoolchain en webingress gecontroleerd',
  isolationVerified:'Runner-, build- en apprechten, broker en locks beproefd',
  runnerVerified:'Echte GitHub-run op de bedoelde dedicated runner geslaagd',
  readinessVerified:'Exacte actieve release, loopback, externe HTTPS en readiness aangetoond',
  restoreVerified:'Afzonderlijke backups en geïsoleerde herstelproef aangetoond',
  rebootVerified:'Beheer, apps en runner werken na gecontroleerde reboot',
  monitoringVerified:'Echte meting en waarschuwing buiten deze wizard beproefd'
 };
 const flag=(key,help)=>check(key,labels[key],help);
 const publicSshPrereqs=['consoleVerified','inventoryVerified','hostKeyVerified','adminVerified','tailLoginVerified','tailPolicyVerified','sshConfigVerified','tailAfterReloadVerified','dualFirewallVerified'];
 const validateFirewall=v=>{
  if(on(v,'tailAfterReloadVerified')&&(!on(v,'sshConfigVerified')||!on(v,'tailLoginVerified'))) return 'Vink de hertest pas af nadat zowel de Tailscale-login als de effectieve SSH-instellingen zijn gecontroleerd.';
  if(on(v,'publicSshClosed')&&publicSshPrereqs.some(k=>!on(v,k))) return 'Markeer publieke SSH pas als gesloten nadat hersteltoegang, beheeraccount, Tailscale-beleid, verse privélogin en beide firewalls zijn gecontroleerd. Laat deze controle anders open.';
 };
 const steps=[
  {
   id:'host',title:'Host en hersteltoegang',
   description:'Leg de identiteit, baseline en veilige beheerroute vast vóór installatie. Nieuwe host inrichten en bestaande host beoordelen zijn verschillende opdrachten.',
   content:()=>guide('Controleer eerst bij de provider',[
    'Vergelijk providerproject, server-ID, regio, IP, image, architectuur en capaciteit met je beoogde VPS. Noteer aanwezige services en data. Begin op een bestaande host alleen-lezen; maak een afzonderlijk wijzigingsplan per host.',
    'Test console en het herstelpad onafhankelijk van SSH. Zet provider-MFA aan en bewaar herstelmiddelen buiten de VPS. Een OS-herinstallatie wist gegevens; deze wizard vraagt of start geen herinstallatie.',
    'Gebruik voor een nieuwe host tijdelijk TCP 22 vanaf alleen het bekende beheeradres. Publieke 80/443 horen alleen bij webingress. Verifieer dat de juiste cloudfirewall aan deze server hangt.'
   ]),
   fields:[
    field('hostName','Hostnaam','Gebruik de werkelijke naam uit providerconsole en hostinventaris.',{required:true,placeholder:'dg-web-demo-01',pattern:'[A-Za-z0-9][A-Za-z0-9.-]{0,62}'}),
    field('providerId','Provider-ID','Het server-ID uit de providerconsole, geen accounttoken.',{required:true,placeholder:'demo-vps-001'}),
    field('region','Providerregio','Datacenter of regio uit de providerinventaris.',{placeholder:'Bijvoorbeeld fsn1'}),
    field('owner','Beheer- en herstelcontact','Naam of team dat host en herstel beheert.',{placeholder:'DG Webservices'}),
    select('profile','Inrichtingsscope','Bestaande VPS’en worden eerst alleen-lezen geïnventariseerd.',options(['new','Nieuwe VPS'],['existing','Bestaande VPS beoordelen']),'new'),
    select('role','Serverrol','Het doel van de host; dit staat los van de projectomgeving.',options(['Web','Web / app'],['Beheer','Private beheerhost'],['Build','Buildhost'],['Gemengd','Meerdere rollen']),'Web'),
    select('environment','Omgeving','Kies gemengd als staging en productie de host delen.',options('Development','Staging','Productie','Beheer','Gemengd'),'Staging'),
    field('image','OS-image','Referentie DG-baseline: Ubuntu 24.04 LTS. Noteer een bewuste afwijking.',{default:'Ubuntu 24.04 LTS',required:true}),
    select('architecture','Architectuur','Controleer met uname -m op de host.',options('x86_64','aarch64','Onbekend'),'x86_64'),
    field('publicIpv4','Publiek IPv4','Optioneel bij een private host. Neem over uit de providerconsole.',{placeholder:'192.0.2.40'}),
    field('publicIpv6','Publiek IPv6','Laat leeg als IPv6 niet publiek in gebruik is.',{placeholder:'2001:db8::40'}),
    field('capacity','Capaciteit','CPU, RAM, disk en eventueel gekoppelde volumes.',{placeholder:'4 vCPU · 8 GB RAM · 80 GB disk'}),
    flag('inventoryVerified','Ik heb de exacte host en bestaande workloads zelf gecontroleerd.'),
    flag('consoleVerified','Ik kan de host onafhankelijk bereiken en heb de herstelroute beschikbaar.')
   ]
  },
  {
   id:'bootstrap',title:'Ubuntu en persoonlijke SSH-toegang',
   description:'Leg eerst een werkend persoonlijk beheeraccount vast. Houd de originele sessie en providerconsole beschikbaar.',
   content:()=>guide('Van eerste verbinding naar persoonlijk beheer',[
    'Vergelijk de hostfingerprint in de providerconsole met de eerste SSH-verbinding. Gebruik een eigen publieke ED25519-key en bewaar de private key op je beheerwerkplek. Omzeil hostkeycontrole niet.',
    'Controleer OS, architectuur, vrije ruimte en geheugen. Werk Ubuntu bij en configureer hostnaam, tijdzone en NTP. Minimale cloud-init mag alleen bootstrap bevatten; leg herhaalbare instellingen versiebeheerd vast.',
    'Maak het persoonlijke beheeraccount met gecontroleerde sudo. Test keylogin, account en sudo in een nieuwe sessie terwijl de eerste nog openstaat. Plan een eventuele reboot en bevestig dat toegang daarna terugkomt.'
   ]),
   fields:[
    field('adminUser','Persoonlijk beheeraccount','Geen root, runner- of appaccount.',{placeholder:'dgadmin'}),
    field('keyReference','Publieke sleutelreferentie','Noteer een referentie of publieke fingerprint, geen sleutelinhoud, wachtwoord of passphrase.',{placeholder:'Kluis / beheer / publieke fingerprint'}),
    flag('hostKeyVerified','De fingerprint is langs een onafhankelijk kanaal gecontroleerd.'),
    flag('ubuntuVerified','Image, kernel, hostnaam, NTP en gemeten capaciteit zijn bekend.'),
    flag('adminVerified','In een tweede sessie werkten whoami en sudo -v voor het bedoelde account.')
   ]
  },
  {
   id:'tailscale',title:'Tailscale en netwerkbeleid',
   description:'Richt de private beheerroute in en test zowel toegestane als geweigerde toegang.',
   content:()=>guide('Toegang binnen het tailnet',[
    'Sluit de host aan op het bedoelde tailnet. Gebruik normale OpenSSH over Tailscale; schakel Tailscale SSH, exit-node of subnetrouter niet impliciet in.',
    'Gebruik een specifieke hosttag en verleen SSH alleen aan aangewezen beheeridentiteiten. Metrics krijgen desgewenst een afzonderlijke grant voor de collector. Beoordeel bestaande brede regels en het nodekey-verloopbeleid.',
    'Test opnieuw met een bevoegde SSH-key en sudo. Verifieer weigering vanaf een onbevoegd apparaat of host. UFW alleen bewijst deze scheiding niet; controleer het effectieve tailnetbeleid.'
   ]),
   fields:[
    field('tailName','Tailscale-hostnaam','Naam of alias uit de gecontroleerde tailnetinventaris.',{placeholder:'dg-web-demo-01'}),
    field('tailTag','Tailscale-tag','Gebruik een specifieke tag; noteer geen enrollmenttoken.',{placeholder:'tag:dg-web-demo-01'}),
    field('grantRef','Policy- of grantreferentie','Veilige verwijzing naar het beoordeelde beleid en bronidentiteiten.',{placeholder:'infra-policy / hosts / dg-web-demo-01',span:2}),
    flag('tailLoginVerified','Een nieuwe OpenSSH-sessie via Tailscale en sudo werkt.'),
    flag('tailPolicyVerified','De gerichte grant is actief en de negatieve proef is daadwerkelijk geweigerd.')
   ]
  },
  {
   id:'firewall',title:'SSH verharden en poort 22 sluiten',
   description:'Controleer eerst effectieve SSH-instellingen en houd de private beheersessie open. Pas firewallregels alleen toe op de bedoelde host.',
   content:()=>guide('Volg deze volgorde',[
    'Controleer het inbound-beleid in de gekoppelde Hetzner-firewall én UFW, inclusief IPv6 indien gebruikt. Sta alleen bedoelde webingress toe; apppoorten blijven op loopback. Publiceer geen GitHub-runnerpoort of metrics.',
    'Gebruik een beheerde SSH-snippet: root-login, wachtwoordlogin, keyboard-interactive en X11 uit; public-key login aan. Controleer <code>sshd -t</code> en de effectieve <code>sshd -T</code>-uitvoer inclusief relevante Match-context. Herlaad alleen bij geldige instellingen.',
    'Test een verse Tailscale-SSH-sessie met sudo ná herladen. Verwijder pas dan de tijdelijke publieke TCP 22-regel uit beide firewalls. Controleer extern dat TCP 22 publiek dicht is op ieder gebruikt IPv4-/IPv6-adres en dat privé-SSH nog werkt.',
    'Mislukt de test? Stop met vervolgstappen en herstel via de geopende sessie of providerconsole. Een werkende publieke website bewijst geen veilige beheertoegang.'
   ]),
   fields:[
    flag('sshConfigVerified','Syntax én effectieve OpenSSH-instellingen kloppen voor deze host.'),
    flag('tailAfterReloadVerified','Na de SSH-configuratie is een nieuwe Tailscale-sessie met sudo getest.'),
    flag('dualFirewallVerified','Beide firewalls, IPv4/IPv6 en bedoelde web- en private poorten zijn gecontroleerd.'),
    flag('publicSshClosed','Publieke TCP 22 is extern geweigerd en de private verbinding bleef werken.')
   ],
   validate:validateFirewall
  },
  {
   id:'maintenance',title:'Onderhoud, Caddy en toolchain',
   description:'Leg de vaste hostbaseline vast. Pas alleen de onderdelen toe die bij deze hostrol en de projectversies horen.',
   content:()=>guide('Beheerbare hostbasis',[
    'Test de automatische securityupdates en het gedrag van serviceherstarts. Plan reboots en bewaak reboot-required; Automatic-Reboot=false voorkomt niet alle herstarts. Houd AppArmor actief.',
    'Begrens journald, volg diskbytes, inodes, RAM en buildpiek. Houd ruimte voor actieve, nieuwe en vorige releases. Scherm geheimen af in logs en bewijs.',
    'Voor webrollen: installeer Caddy via de gecontroleerde bron. Gebruik afzonderlijke siteconfiguraties, valideer vóór herladen en behoud bestaande routes. Kies de exacte Node- en pakketmanagerversie uit het projectcontract; installeer niet blind latest.'
   ]),
   fields:[
    field('toolchain','Toolchainreferentie','Noteer goedgekeurde Node-, package manager- en Caddy-versies, of verwijs naar het hostprofiel.',{placeholder:'Versies uit packageManager, CI en hostprofiel',span:2}),
    field('maintenanceWindow','Onderhoudsvenster','Tijdvenster met tijdzone en verantwoordelijke.',{placeholder:'Dinsdag 22:00–23:00 · Europe/Amsterdam'}),
    field('baselineRef','Configuratie- of Ansible-revisie','Versiebeheerde bron; een check mode is alleen een simulatie.',{placeholder:'infra / hostprofiel / revisie'}),
    flag('maintenanceVerified','Securitybronnen, rebootbeleid, serviceherstarts en logs zijn gecontroleerd.'),
    flag('runtimeVerified','Runtime is gepind en getest; voor een webrol ook Caddy en loopbackrouting.')
   ]
  },
  {
   id:'runner',title:'Projectisolatie en runnerproef',
   description:'Test een aparte projectomgeving zonder bestaande projecten te wijzigen. Gebruik de projectuitrolwizard voor de volgende release.',
   content:()=>guide('Controleer de grenzen van de doelhost',[
    'Gebruik per omgeving eigen runner-, build- en appidentiteiten, releasepad, beschermde configuratie, systemd-unit en vrije loopbackpoort. Houd data buiten vervangbare releases.',
    'Laat alleen de root-beheerde beperkte deploybroker vaste repositories, omgevingen, acties en diensten activeren. Geen algemene sudo, Docker-groep of toegang tot siblingconfiguratie. Builds draaien onprivileged.',
    'Gebruik een hostbrede buildlock en een activatielock per site. Laat de vertrouwde GitHub-proef werkelijk op de dedicated runner draaien en controleer host, gebruiker, workspace, labels, omgeving en SHA. Een online of overgeslagen job telt niet.'
   ]),
   fields:[
    field('siteRef','Projectomgeving of site-ID','Kies een bestaande veilige referentie of noteer het nog open voorbereidingspunt.',{placeholder:'demoapp-staging'}),
    field('runnerEvidence','GitHub-proefbewijs','Verwijzing naar de echte workflowrun. Gebruik geen registratietoken of ondertekende downloadlink.',{placeholder:'Run-ID of beheerreferentie'}),
    flag('isolationVerified','Negatieve rechtenproeven, build-/activatielocks en gecontroleerde deploybroker zijn aangetoond.'),
    flag('runnerVerified','De echte runnerproef is afgerond en het bewijs hoort bij deze host en omgeving.')
   ]
  },
  {
   id:'acceptance',title:'DNS, herstel en acceptatie',
   description:'Leg de werkelijke waarnemingen vast. Een host zonder metingen, restoreproef of gebruikersbewijs houdt open punten.',
   content:()=>guide('Bewijs de hele keten',[
    'Controleer voor webdiensten autoritatieve DNS, IPv4 en eventueel IPv6, TLS, loopbackhealth, externe HTTPS-readiness en de actieve SHA/configuratie. Een algemene Caddy-200 telt niet als appacceptatie.',
    'Test onafhankelijke backups voor serverdisk, volumes, appdata en externe database. Probeer restore geïsoleerd zonder productie-DNS, uitgaande echte effecten, gekloonde runner of hergebruikte Tailscale-identiteit. Een approllback herstelt de database niet.',
    'Controleer na een geplande reboot SSH, Caddy, app, runner en een nieuwe GitHub-job. Test monitoring en een echte waarschuwing; zet geen groene status op ontbrekende of onbeproefde onderdelen.'
   ]),
   fields:[
    field('recoveryPolicy','Backup en hersteldoelen','Leg hersteldoel, maximale dataverliesperiode, bewaarbeleid en verantwoordelijke vast.',{placeholder:'RPO 24u · RTO 4u · verwijzing naar beleid',span:2}),
    field('acceptanceEvidence','Acceptatie- en herstelbewijs','Noteer per open/falende proef de reden, eigenaar en veilige bewijsreferentie.',{type:'textarea',maxLength:1200,span:2,placeholder:'Datum · Pass / Fail / Open / n.v.t. met reden · bewijsreferentie'}),
    flag('readinessVerified','De bedoelde release en readiness zijn vanaf loopback en de bedoelde toegangsroute aangetoond.'),
    flag('restoreVerified','Herstel op een geïsoleerde omgeving is daadwerkelijk getest.'),
    flag('rebootVerified','Beheer, services en runnerproef zijn na reboot opnieuw getest.'),
    flag('monitoringVerified','Werkelijke monitoring en alarmtest zijn elders aangetoond; de wizard voert zelf geen meting uit.')
   ]
  },
  {
   id:'dg-link',title:'DG-beheer koppelen',
   description:'Sla een lokaal hostprofiel en de checklist op. Je kunt de VPS ook opnemen in Mijn inventaris.',
   content:v=>guide('Koppeling en resultaat',[
    'Hostprofiel: <strong>'+esc(value(v,'hostName')||'Nog geen hostnaam')+'</strong> · baseline 4 november 2026. '+Object.keys(labels).filter(k=>on(v,k)).length+' van '+Object.keys(labels).length+' controles zijn handmatig afgevinkt.',
    'Met de optie hieronder gaat alleen de veilige hostmetadata naar Mijn inventaris. Er wordt geen agent geïnstalleerd, geen toegang geopend en geen echte meting opgehaald.',
    'Bij latere koppeling: verifieer de stabiele server-ID en agentidentiteit, beperk de collector tot read-only telemetrie over het private netwerk en toon de eerste authentieke heartbeat vóór je de verbinding actief noemt.'
   ]),
   fields:[
    check('registerInDg','Opnemen in Mijn inventaris','Optioneel. Registreert alleen lokale VPS-metadata; monitoring blijft in afwachting.'),
    field('handoffNote','Vervolgactie','Noteer wie de ontbrekende checks of latere koppeling uitvoert. Voeg geen geheimen toe.',{type:'textarea',maxLength:1200,span:2,placeholder:'Bijvoorbeeld: onderhoudsvenster afstemmen en restoreproef plannen.'})
   ],
   validate:validateFirewall
  }
 ];
 return {
  id:'hardening',
  title:'VPS-hardening',
  description:'Van gecontroleerde hersteltoegang tot een herhaalbaar hostprofiel, met optionele registratie in DG-beheer.',
  version:'VPS-standaard · 4 november 2026 · v1',
  example:{
   hostName:'dg-web-demo-01',providerId:'demo-vps-001',region:'Voorbeeldregio',owner:'DG Webservices',profile:'new',role:'Web',environment:'Staging',image:'Ubuntu 24.04 LTS',architecture:'x86_64',publicIpv4:'192.0.2.40',publicIpv6:'2001:db8::40',capacity:'4 vCPU · 8 GB RAM · 80 GB disk',adminUser:'dgadmin',keyReference:'Voorbeeld: publieke fingerprint in beheerkluis',tailName:'dg-web-demo-01',tailTag:'tag:dg-web-demo-01',grantRef:'Voorbeeld: infra-policy / hosts / dg-web-demo-01',toolchain:'Versies nog controleren tegen projectlockfile',maintenanceWindow:'Dinsdag 22:00–23:00 · Europe/Amsterdam',baselineRef:'Voorbeeld: infra / hostprofiel / demo',siteRef:'demoapp-staging',runnerEvidence:'Open · nog geen GitHub-proef uitgevoerd',recoveryPolicy:'Voorbeeld: RPO 24u · RTO 4u',acceptanceEvidence:'Open · plan geïsoleerde restoreproef en leg het resultaat vast.',handoffNote:'Bevestig de echte host en beheerroute vóór configuratiewijzigingen.'
  },
  steps,
  result:v=>{
   const remaining=Object.keys(labels).filter(k=>!on(v,k));
   const prerequisitesOk=!on(v,'publicSshClosed')||publicSshPrereqs.every(k=>on(v,k));
   const complete=remaining.length===0&&prerequisitesOk;
   const registerInDg=on(v,'registerInDg');
   const status=complete?'Controles handmatig gemeld':'Open punten';
   const hostName=value(v,'hostName');
   const row=(label,key)=>label+': '+(value(v,key)||'Open');
   const report=[
    'DG Webservices · VPS-hardening',
    'Baseline: VPS-standaard en VPS-stappenplan · 4 november 2026 · v1',
    'Lokale checklist. Geen VPS, firewall, GitHub-runner of collector gewijzigd.',
    '',
    row('Hostnaam','hostName'),row('Provider-ID','providerId'),row('Regio','region'),row('Rol','role'),row('Omgeving','environment'),row('Beheercontact','owner'),row('Image','image'),row('Architectuur','architecture'),row('IPv4','publicIpv4'),row('IPv6','publicIpv6'),row('Capaciteit','capacity'),
    'Scope: '+(value(v,'profile')==='existing'?'Bestaande VPS · alleen-lezen vergelijken vóór wijzigingsplan':'Nieuwe VPS · aparte proef en acceptatie'),
    row('Beheeraccount','adminUser'),row('Publieke sleutelreferentie','keyReference'),row('Tailscale-naam','tailName'),row('Tailscale-tag','tailTag'),row('Grantreferentie','grantRef'),row('Toolchain','toolchain'),row('Onderhoudsvenster','maintenanceWindow'),row('Configuratierevisie','baselineRef'),row('Site-ID','siteRef'),
    '',
    'Checklist · '+status,
    ...Object.entries(labels).map(([k,label])=>(on(v,k)?'[Handmatig afgevinkt] ':'[Open] ')+label),
    !prerequisitesOk?'Blokkade: publieke SSH gemeld zonder alle vereiste voorafgaande controles.':'',
    '',
    row('Runnerbewijs','runnerEvidence'),row('Backup- en herstelbeleid','recoveryPolicy'),row('Acceptatiebewijs en afwijkingen','acceptanceEvidence'),
    'Mijn inventaris: '+(registerInDg?'lokale registratie gekozen; heartbeat wacht op werkelijke koppeling':'niet gekozen'),
    row('Vervolgactie','handoffNote'),
    'Een lokale registratie of afgevinkte checklist is geen geautomatiseerde hostacceptatie.'
   ].join('\n');
   return {
    title:'VPS-profiel vastgelegd',
    summary:hostName+' · '+(complete?'alle controles handmatig afgevinkt':remaining.length+' controles open')+(registerInDg?' · telemetrie in afwachting':''),
    report,
    metadata:{
     kind:'vps-hardening',registerInDg,hostName,providerId:value(v,'providerId'),role:value(v,'role'),region:value(v,'region'),owner:value(v,'owner'),environment:value(v,'environment'),
     baselineVersion:'2026-11-04-v1',status,reportedStatus:complete?'reported_pass':'open',monitoringStatus:registerInDg?'pending':'not_requested'
    }
   };
  }
 };
}
