// Guided, local project intake. No deployment, secret access or provider calls.
const SOURCE = 'Uitrolprocedure en projectintake · 11 november 2026';
const HEX_SHA = /^[0-9a-f]{40}$/i;
const SCOPE = {prepare:'Alleen voorbereiding',staging:'Staging',production:'Staging en productie na acceptatie'};
const AUTH = {otp:'E-mail met OTP',google:'Google',both:'E-mail met OTP en Google',other:'Anders / nog te bepalen'};
const V = (data,name) => String(data[name] ?? '').trim();
const has = (data,name) => data[name] === true || ['true','on','1'].includes(V(data,name));
const origin = (value) => {
 if (!value) return '';
 try {
  const u=new URL(value);
  return u.protocol==='https:' && !u.username && !u.password && u.pathname==='/' && !u.search && !u.hash ? u.origin : '';
 } catch { return ''; }
};
const host = value=>value.toLowerCase().replace(/\.$/,'');
const isProduction = data=>V(data,'scope')==='production';
const isSet = (data,keys)=>keys.every(k=>V(data,k));
const keyPrefix = data=>/^[A-Z][A-Z0-9_]{1,31}$/.test(V(data,'projectCode'))?V(data,'projectCode'):'PROJECT';
const valueOr = (data,key,fallback)=>V(data,key)||fallback;
const field = (name,label,help,extra={})=>({name,label,help,type:'text',maxLength:160,...extra});
const check = (name,label,help)=>({name,label,help,type:'checkbox',span:2});
const select = (name,label,help,options,initial)=>({name,label,help,type:'select',required:true,options:Object.entries(options).map(([value,label])=>({value,label})),default:initial});
const shaField = (name,label,help)=>field(name,label,help,{pattern:'[0-9a-fA-F]{40}',maxLength:40,placeholder:'Volledige SHA van 40 tekens'});
const httpsField = (name,label,help,placeholder,required=false)=>field(name,label,help,{type:'url',placeholder,required,maxLength:240});
const port = (name,label,required)=>field(name,label,'Reserveer een vrije loopbackpoort na controle op de doelhost.',{type:'number',required,placeholder:'Bijvoorbeeld 4181',min:1,max:65535,step:1});
const readiness = d=>{
 const src=V(d,'sourceSha').toLowerCase(),accepted=V(d,'acceptedSha').toLowerCase();
 const stage=HEX_SHA.test(src)&&src===accepted&&has(d,'ciGreen')&&has(d,'stagingHealthy')&&has(d,'stagingAccepted')&&isSet(d,['ciEvidence','acceptanceEvidence','stagingConfig']);
 const prod=isProduction(d)&&stage&&has(d,'varsConfirmed')&&has(d,'hostConfirmed')&&has(d,'productionApproved')&&has(d,'restoreReady')&&isSet(d,['approvalEvidence','restoreReference','productionConfig','productionHost','productionOrigin','productionProjectRef','productionSupabase','hostEvidence']);
 return {stage,prod};
};

export function deployWizard(h){
 const esc=h.escape;
 const notice=(body)=>`<div class="notice">${body}</div>`;
 const details=(items)=>`<div class="wz-summary">${items.map(([k,v])=>`<div class="detail-row"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('')}</div>`;
 const variables=(d,environment)=>{
  const stage=environment==='staging';
  const prefix=keyPrefix(d);
  return [
   [`${prefix}_APP_ORIGIN`,origin(V(d,stage?'stagingOrigin':'productionOrigin'))||'<HTTPS-origin van deze omgeving>'],
   [`${prefix}_DATA_MODE`,'supabase'],
   ['NEXT_PUBLIC_SUPABASE_URL',origin(V(d,stage?'stagingSupabase':'productionSupabase'))||'<Supabase URL van deze omgeving>'],
   ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',`<publishable key uit het ${stage?'stagingproject':'productieproject'}>`]
  ];
 };
 const envMatrix=(d)=>{
  const stg=variables(d,'staging'),prod=variables(d,'production');
  return `<div class="infra-table-wrap" tabindex="0" aria-label="Vier GitHub Variables per omgeving"><table class="adm-table infra-table"><thead><tr><th scope="col">Environment Variable</th><th scope="col">staging</th><th scope="col">production</th></tr></thead><tbody>${stg.map(([name,value],i)=>`<tr><td data-label="Variable"><code>${esc(name)}</code></td><td data-label="staging">${esc(value)}</td><td data-label="production">${esc(prod[i][1])}</td></tr>`).join('')}</tbody></table></div>`;
 };
 const planState=(d)=>{
  const {stage,prod}=readiness(d);
  if(prod)return 'Productieplan klaar voor controle door de worker';
  if(stage&&isProduction(d))return 'Stagingacceptatie vastgelegd · productievoorwaarden open';
  if(stage)return 'Stagingacceptatie vastgelegd';
  return 'Concept · stagingbewijs nog niet compleet';
 };
 const steps=[
  {
   id:'intake',title:'Projectintake',description:'Leg het doel, de repository en de afgesproken uitrolscope vast.',
   fields:[
    field('projectName','Projectnaam','Naam voor het projectdossier.',{required:true,placeholder:'Bijvoorbeeld Voorbeeldportaal',maxLength:80}),
    field('projectCode','Prefix voor appvariabelen','Gebruik de prefix die de applicatie echt uitleest. Voor DartFlow is dat DARTFLOW.',{required:true,placeholder:'DARTFLOW',pattern:'[A-Z][A-Z0-9_]{1,31}',maxLength:32}),
    field('repository','GitHub-repository','Noteer eigenaar/repository. Controleer de bestemming vóór een push.',{required:true,placeholder:'voorbeeld-organisatie/portaal',pattern:'[A-Za-z0-9_.\\-]+/[A-Za-z0-9_.\\-]+'}),
    field('branch','Integratiebranch','CI moet voor de kandidaat op deze beschermde bronref gelden.',{required:true,default:'main',maxLength:100}),
    field('owner','Eigenaar / acceptant','Persoon of team dat het resultaat beoordeelt.',{required:true,placeholder:'Platformteam'}),
    field('devVps','Development-VPS','Bevestigde hostalias waar de worker ontwikkelt en test.',{required:true,placeholder:'dg-dev-voorbeeld.example'}),
    select('scope','Uitrolscope','De gekozen scope wordt vastgelegd in het plan. Dit formulier verleent geen externe bevoegdheid.',SCOPE,'prepare'),
    select('hostKind','Doelhost','Bij een nieuwe host eerst de VPS-hardeningwizard doorlopen.',{existing:'Bestaande VPS uitbreiden',new:'Nieuwe VPS inrichten'},'existing'),
    field('scopeNote','Opdracht en uitzonderingen','Verwijzing naar scope, acceptatiecriteria of onderhoudsvenster. Geen toegangscodes of geheimen.',{type:'textarea',span:2,maxLength:600,placeholder:'Bijvoorbeeld: stagingpilot met het platformteam, productie na acceptatie.'})
   ],
   validate:d=>{
    if(!/^[A-Z][A-Z0-9_]{1,31}$/.test(V(d,'projectCode')))return 'Gebruik 2 tot 32 hoofdletters, cijfers of underscores voor de variabeleprefix. Begin met een hoofdletter.';
    if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(V(d,'repository')))return 'Gebruik eigenaar/repository als GitHub-referentie.';
    if(!Object.hasOwn(SCOPE,V(d,'scope')))return 'Kies de afgesproken uitrolscope.';
   }
  },
  {
   id:'targets',title:'Doelomgevingen',description:'Kies per omgeving een eigen HTTPS-adres en installatie. De twee omgevingen mogen op dezelfde VPS draaien.',
   fields:d=>[
    field('stagingHost','VPS voor staging','Kies de gecontroleerde doelhost. De hardeningwizard legt nieuwe hosts en bewijs apart vast.',{required:true,placeholder:'dg-stage-voorbeeld.example'}),
    field('productionHost','VPS voor productie','Vul dezelfde alias in bij een gedeelde VPS. De omgevingen houden eigen serviceaccounts, paden en poorten.',{required:isProduction(d),placeholder:'dg-prod-voorbeeld.example'}),
    httpsField('stagingOrigin','HTTPS-origin staging','Alleen protocol en host, zonder pad, query of fragment.','https://staging.portaal.example',true),
    httpsField('productionOrigin','HTTPS-origin productie','Gebruik de eigen canonieke productie-origin.','https://portaal.example',isProduction(d)),
    port('stagingPort','Loopbackpoort staging',false),
    port('productionPort','Loopbackpoort productie',false),
    field('stagingConfig','Configuratie-ID staging','ID van de bijbehorende beschermde hostbundel, zodra die bestaat.',{placeholder:'voorbeeld-staging-001'}),
    field('productionConfig','Configuratie-ID productie','Eigen bundel-ID, nooit hergebruiken voor gewijzigde inhoud.',{placeholder:'voorbeeld-production-001'}),
    field('stagingRunner','Runnerlabels staging','Noteer de vaste labels uit het installatiebewijs.',{placeholder:'self-hosted, portaal-staging'}),
    field('productionRunner','Runnerlabels productie','Eigen deploymentrunner voor de productieworkflow.',{placeholder:'self-hosted, portaal-production'})
   ],
   content:d=>notice(`${V(d,'hostKind')==='new'?'Doorloop voor de nieuwe host eerst de VPS-hardeningwizard. ':'Inventariseer bestaande sites, diensten en vrije poorten vóór wijzigingen. '}Controleer A en eventueel AAAA tegen het doel, valideer de volledige Caddy-configuratie en test HTTPS per origin.`),
   validate:d=>{
    for(const [name,label] of [['stagingOrigin','staging'],['productionOrigin','productie']])if(V(d,name)&&!origin(V(d,name)))return `Gebruik voor ${label} een HTTPS-origin zonder gebruikersgegevens, pad, query of fragment.`;
    if(origin(V(d,'stagingOrigin'))&&origin(V(d,'stagingOrigin'))===origin(V(d,'productionOrigin')))return 'Staging en productie moeten verschillende HTTPS-origins hebben.';
    for(const name of ['stagingPort','productionPort'])if(V(d,name)&&(!/^\d{1,5}$/.test(V(d,name))||+V(d,name)<1||+V(d,name)>65535))return 'Vul een poort van 1 t/m 65535 in.';
    if(V(d,'stagingHost')&&host(V(d,'stagingHost'))===host(V(d,'productionHost'))&&V(d,'stagingPort')&&+V(d,'stagingPort')===+V(d,'productionPort'))return 'Staging en productie mogen op dezelfde VPS niet dezelfde loopbackpoort gebruiken.';
    if(V(d,'stagingConfig')&&V(d,'stagingConfig')===V(d,'productionConfig'))return 'Gebruik per omgeving een eigen configuratie-ID.';
    if(V(d,'stagingRunner')&&V(d,'stagingRunner').split(',').map(x=>x.trim().toLowerCase()).sort().join(',')===V(d,'productionRunner').split(',').map(x=>x.trim().toLowerCase()).sort().join(','))return 'Gebruik aparte, onderscheidende runnerlabels voor staging en productie.';
   }
  },
  {
   id:'supabase',title:'Supabase en login',description:'Leg twee afzonderlijke backendprojecten vast. Gebruik de publieke URL per project; geheime waarden blijven in de beheerde opslag.',
   fields:d=>[
    field('stagingProjectRef','Supabase-projectref staging','Lees de exacte projectref af in het toegewezen Supabase-project.',{required:true,placeholder:'portaalstagingvoorbeeld',maxLength:100}),
    field('productionProjectRef','Supabase-projectref productie','Afzonderlijk project binnen de bevestigde beheerorganisatie.',{required:isProduction(d),placeholder:'portaalproductievoorbeeld',maxLength:100}),
    httpsField('stagingSupabase','Supabase-URL staging','Publieke URL uit het stagingproject.','https://supabase-staging.portaal.example',true),
    httpsField('productionSupabase','Supabase-URL productie','Publieke URL uit het productieproject.','https://supabase.portaal.example',isProduction(d)),
    select('authMode','Aanmeldmethoden','Bevestig per omgeving de echte site-URL, callback en toegestane testaccounts.',AUTH,'otp'),
    field('callback','App-callbackpad','Vul uitsluitend een bestaande route in. Dit pad komt achter iedere eigen origin.',{placeholder:'/auth/callback',maxLength:120}),
    field('authReference','Verwijzing naar Auth, SMTP en migraties','Noteer een veilige dossier- of configuratieverwijzing. Bewaar SMTP-, OAuth- en DB-credentials op hun aangewezen plek.',{type:'textarea',span:2,maxLength:500,placeholder:'Runbook: omgeving, Auth Site URL, callback, mailprovider en DB-rol.'})
   ],
   content:()=>notice('Controleer toegang tot de exacte projecten, RLS en beperkte runtime-DB-rechten. Migraties gaan eerst naar staging via apart beheer. Voor Google wijst de provider naar de Supabase-callback; Supabase verwijst daarna terug naar de app. Voor echte loginmail: eigen SMTP en bezorgtest per omgeving.'),
   validate:d=>{
    if(V(d,'stagingProjectRef')&&V(d,'stagingProjectRef').toLowerCase()===V(d,'productionProjectRef').toLowerCase())return 'Kies een apart Supabase-project voor productie.';
    for(const name of ['stagingSupabase','productionSupabase'])if(V(d,name)&&!origin(V(d,name)))return 'De Supabase-URL moet een HTTPS-origin zonder pad, query of fragment zijn.';
    if(origin(V(d,'stagingSupabase'))&&origin(V(d,'stagingSupabase'))===origin(V(d,'productionSupabase')))return 'De Supabase-URL’s van staging en productie moeten verschillen.';
    if(V(d,'callback')&&!/^\/(?!\/)[a-zA-Z0-9_./~-]+$/.test(V(d,'callback')))return 'Gebruik een app-callbackpad, bijvoorbeeld /auth/callback.';
   }
  },
  {
   id:'github',title:'4 GitHub-variabelen',description:'Open GitHub → Settings → Environments. Voeg onderstaande waarden per omgeving toe als Variables.',
   fields:[check('varsConfirmed','Variabelen en hostbundels vergeleken','Vink aan zodra de worker de vier waarden in GitHub met de publieke hostconfiguratie heeft vergeleken. Het prototype kan dit niet controleren.')],
   content:d=>`${envMatrix(d)}${notice('Dit zijn de vier publieke variabelen van de native route. Kopieer de <strong>publishable key</strong> rechtstreeks vanuit het juiste Supabase-project naar GitHub. Plak geen secret key of service_role. De basisroute vraagt geen extra zelfgemaakte GitHub Secrets; runtimegeheimen staan in de eigen afgeschermde hostbundel. GitHub-variabelen wijzigen die bundel niet automatisch.')}`
  },
  {
   id:'host-contract',title:'Host en releasecontract',description:'Beschrijf wat de worker op de doelhost verifieert voordat er een release kan draaien.',
   fields:[
    field('toolchain','Vaste runtime en pakketmanager','Neem versies en lockfile uit de repository over, na controle op de host.',{placeholder:'Node/pnpm-versie en lockfile uit projectprofiel'}),
    field('hostEvidence','Installatie- en toegangsreferentie','Verwijs naar hostinventaris, consoleherstel, workerfingerprint en beperkte sudo. Geen sleutelmateriaal.',{placeholder:'Runbook of installatiebewijs'}),
    field('releaseContract','Broker, accounts en paden','Verwijs naar per omgeving gescheiden runner-, build- en appaccount, broker, Caddy/service en release-/configpaden.',{type:'textarea',span:2,maxLength:600}),
    check('hostConfirmed','Host en installaties onafhankelijk gecontroleerd','Leg vast dat toegangsgrenzen, bestaande sites, capaciteit en locks zijn getest. Alleen aanvinken met daadwerkelijk bewijs.')
   ],
   content:()=>notice('Algemene CI draait op GitHub-hosted runners. Een doelrunner verwerkt uitsluitend de vertrouwde deployworkflow. De root-beheerde broker verifieert repository, bronref, actuele CI, vaste paden en toegestane actie. Bouw zonder root of runtimegeheimen; gebruik hostbuildlock en eigen activatielock. Activeer release en configuratie samen; houd de vorige gezonde combinatie beschikbaar.')
  },
  {
   id:'staging',title:'Staging en acceptatie',description:'Noteer de exacte kandidaatcommit en het bewijs van technische én functionele acceptatie. Laat open wat nog moet worden uitgevoerd.',
   fields:[
    shaField('sourceSha','Kandidaatcommit','Volledige bron-SHA op de afgesproken branch. Geen afgekorte hash.'),
    field('ciEvidence','CI-run / bewijsreferentie','De nieuwste verplichte controles voor precies deze SHA moeten geslaagd zijn.',{placeholder:'Verwijzing naar de gecontroleerde CI-run',maxLength:240}),
    shaField('acceptedSha','Geaccepteerde stagingcommit','Neem de actieve en geaccepteerde SHA over uit het stagingbewijs.'),
    field('acceptanceEvidence','Stagingbewijs','Verwijs naar workflowrun, release-ID, health/readiness en bevestiging door de acceptant.',{placeholder:'Stagingacceptatie, release-ID of testrapport',maxLength:240}),
    check('ciGreen','Verplichte CI voor exact deze commit is geslaagd','Geen oudere groene run gebruiken als een nieuwere verplichte controle nog loopt of faalt.'),
    check('stagingHealthy','Actieve stagingrelease en eigen configuratie technisch gecontroleerd','Controleer configuratie-ID, bron-SHA en backend via loopback én HTTPS; HTTP 200 alleen is onvoldoende.'),
    check('stagingAccepted','Staging functioneel geaccepteerd','Aanmelden, afmelden, rollen, belangrijkste gegevensactie, mail en relevante foutgevallen getest. Dit is jouw vastlegging, geen automatische verificatie.')
   ],
   content:()=>notice('Start de stagingworkflow buiten dit prototype pas nadat CI en het migratieplan kloppen. Geef volledige SHA en stagingconfiguratie-ID mee. Bewijs de actieve release en controleer dat staging uitsluitend eigen diensten gebruikt.'),
   validate:d=>{
    const src=V(d,'sourceSha'),accepted=V(d,'acceptedSha');
    if((src&&!HEX_SHA.test(src))||(accepted&&!HEX_SHA.test(accepted)))return 'Vul een volledige SHA van 40 hexadecimale tekens in.';
    if(has(d,'ciGreen')&&(!src||!V(d,'ciEvidence')))return 'Leg de kandidaat-SHA en CI-bewijs vast voordat je CI als geslaagd markeert.';
    if(has(d,'stagingHealthy')&&(!src||!accepted||src.toLowerCase()!==accepted.toLowerCase()||!V(d,'stagingConfig')||!V(d,'acceptanceEvidence')))return 'Voor gezonde staging zijn dezelfde actieve SHA, stagingconfiguratie-ID en releasebewijs nodig.';
    if(has(d,'stagingAccepted')&&(!has(d,'stagingHealthy')||!has(d,'ciGreen')||!accepted||!src||src.toLowerCase()!==accepted.toLowerCase()||!V(d,'acceptanceEvidence')))return 'Leg eerst CI en gezonde staging vast met acceptatiebewijs voor exact dezelfde commit.';
   }
  },
  {
   id:'production',title:'Productie en herstel',description:'Productie bouwt dezelfde geaccepteerde bron-SHA opnieuw met de eigen configuratie. Beslis binnen de afgesproken scope.',
   fields:d=>[
    ...(isProduction(d)?[
     field('approvalEvidence','Productievrijgave','Verwijs naar een bestaande, concrete opdracht of vrijgave die deze uitrol omvat.',{placeholder:'Vrijgave of opdrachtreferentie',maxLength:240}),
     check('productionApproved','Productie is binnen de vastgelegde opdracht vrijgegeven','Zelf opgegeven bewijs in dit plan. Het prototype verleent geen live deployrecht.')
    ]:[]),
    field('restoreReference','Herstelpunt en terugvalroute','Verwijs naar backup, hersteltest, vorige gezonde release/config en compatibiliteit.',{placeholder:'Restorebewijs en release-/configreferentie',maxLength:240}),
    check('restoreReady','Herstelpad, migraties en actuele backup gecontroleerd','Een approllback herstelt de vorige release/configuratie; database, Storage en Auth hebben aparte herstelroutes.')
   ],
   content:d=>{
    const {stage}=readiness(d);
    return notice(`${!isProduction(d)?'Productie valt buiten de gekozen scope.':stage?'Dezelfde stagingcommit komt in aanmerking voor productie zodra variabelen, hostbewijs, vrijgave, productieconfiguratie en herstelbewijs compleet zijn.':'Productie blijft geblokkeerd zolang exact deze stagingcommit niet aantoonbaar is geaccepteerd.'} Controleer na een eventuele productieactivatie de actieve SHA, configuratie, HTTPS, readiness, gebruikersflows, achtergrondtaken en andere sites op dezelfde host.`);
   },
   validate:d=>{
    if(isProduction(d)&&has(d,'productionApproved')&&!V(d,'approvalEvidence'))return 'Noteer de concrete productievrijgave of haal het vinkje weg.';
    if(has(d,'restoreReady')&&!V(d,'restoreReference'))return 'Noteer de herstelreferentie of haal het vinkje weg.';
   }
  },
  {
   id:'review',title:'Plan controleren',description:'Controleer je intake en bewaar een kopie voor de uitvoerende worker.',fields:[],
   content:d=>`${details([
    ['Project',V(d,'projectName')],['Repository',`${V(d,'repository')} · ${V(d,'branch')}`],['Scope',SCOPE[V(d,'scope')]||'Niet gekozen'],['Kandidaat',valueOr(d,'sourceSha','Nog niet gekozen')],['Staging',`${V(d,'stagingHost')} · ${V(d,'stagingOrigin')}`],['Productie',V(d,'productionOrigin')?`${V(d,'productionHost')} · ${V(d,'productionOrigin')}`:'Nog niet ingericht'],['Status',planState(d)]
   ])}${notice('Bewaren registreert alleen dit uitrolplan en het opgegeven bewijs in het prototype. Er wordt geen GitHub-workflow gestart, host ingericht of release geactiveerd.')}`
  }
 ];
 const report=(d)=>{
  const lines=[
   `# DG Webservices · Uitrolplan ${V(d,'projectName')}`,
   '',`Referentie: ${SOURCE}`,'Lokaal plan. Bewijs is door de gebruiker vastgelegd; er is niets extern geverifieerd of uitgevoerd.','',
   `Status: ${planState(d)}`,`Scope: ${SCOPE[V(d,'scope')]||'Niet gekozen'}`,`Repository: ${V(d,'repository')} (${V(d,'branch')})`,`Acceptant: ${V(d,'owner')}`,`Dev-VPS: ${V(d,'devVps')}`,`Opdracht: ${valueOr(d,'scopeNote','Nog te preciseren')}`,'',
   '## Omgevingen',
   `Staging: ${V(d,'stagingHost')} · ${V(d,'stagingOrigin')} · loopbackpoort ${valueOr(d,'stagingPort','te controleren')} · Supabase-ref ${V(d,'stagingProjectRef')} · config ${valueOr(d,'stagingConfig','open')} · runner ${valueOr(d,'stagingRunner','open')}`,
   `Productie: ${valueOr(d,'productionHost','open')} · ${valueOr(d,'productionOrigin','open')} · loopbackpoort ${valueOr(d,'productionPort','te controleren')} · Supabase-ref ${valueOr(d,'productionProjectRef','open')} · config ${valueOr(d,'productionConfig','open')} · runner ${valueOr(d,'productionRunner','open')}`,
   `Auth: ${AUTH[V(d,'authMode')]||'Open'} · app-callback ${valueOr(d,'callback','te controleren')}`,`Auth/SMTP/migraties: ${valueOr(d,'authReference','open')}`,'',
   '## GitHub Environment Variables',
   'Settings → Environments → staging / production → Environment variables.',
   ...['staging','production'].flatMap(env=>['',`[${env}]`,...variables(d,env).map(([name,value])=>`${name}=${value}`)]),
   '',`Publieke waarden vergeleken met hostbundel: ${has(d,'varsConfirmed')?'vastgelegd':'open'}.`,
   'Geen extra zelfgemaakte GitHub Secrets voor de basisroute. Kopieer uitsluitend de publishable key uit het correcte project rechtstreeks naar GitHub. Runtime-, SMTP-, OAuth- en DB-geheimen horen in de afgeschermde hostbundel of het aangewezen beheerpad.',
   '', '## Releasebewijs en herstel',
   `Runtime/toolchain: ${valueOr(d,'toolchain','open')}`,`Hostinstallatie / toegang: ${valueOr(d,'hostEvidence','open')}`,`Broker en accounts: ${valueOr(d,'releaseContract','open')}`,`Hostcontrole: ${has(d,'hostConfirmed')?'vastgelegd':'open'}`,
   `Kandidaat-SHA: ${valueOr(d,'sourceSha','open')}`,`CI: ${has(d,'ciGreen')?'vastgelegd':'open'} · ${valueOr(d,'ciEvidence','geen bewijsreferentie')}`,
   `Actieve staging-SHA: ${valueOr(d,'acceptedSha','open')} · health/readiness ${has(d,'stagingHealthy')?'vastgelegd':'open'} · functionele acceptatie ${has(d,'stagingAccepted')?'vastgelegd':'open'}`,
   `Acceptatiebewijs: ${valueOr(d,'acceptanceEvidence','open')}`,
   `Productievrijgave: ${isProduction(d)&&has(d,'productionApproved')?valueOr(d,'approvalEvidence','open'):'niet vastgelegd voor deze scope'}`,
   `Herstelpad: ${has(d,'restoreReady')?'vastgelegd':'open'} · ${valueOr(d,'restoreReference','geen herstelreferentie')}`,
   '', 'Volgorde: dev-VPS → GitHub en CI op exacte SHA → staging met eigen configuratie → technische en functionele acceptatie → geautoriseerde productiebuild van dezelfde SHA met productieconfiguratie.',
   'De worker controleert scope, bewijs en huidige infrastructuur opnieuw. Leg de actieve release-ID, configuratie-ID, artifactdigest en migratieversie vast. Bij approllback herstel je de vorige gezonde app/config-combinatie; dataherstel volgt een eigen procedure.'
  ];
  return lines.join('\n');
 };
 return {id:'deploy',title:'Projectuitrol',description:'Van intake naar een herhaalbaar staging- en productieplan met vier GitHub-variabelen per omgeving.',version:'2026-11-11',steps,
  example:{projectName:'Voorbeeldportaal',projectCode:'PORTAAL',repository:'voorbeeld-organisatie/portaal',branch:'main',owner:'Platformteam (voorbeeld)',devVps:'dg-dev-voorbeeld.example',scope:'production',hostKind:'existing',scopeNote:'Voorbeeld: eerst staging testen, daarna productie binnen de afgesproken scope.',stagingHost:'dg-web-voorbeeld.example',productionHost:'dg-web-voorbeeld.example',stagingOrigin:'https://staging.portaal.example',productionOrigin:'https://portaal.example',stagingPort:'4181',productionPort:'4182',stagingConfig:'voorbeeld-staging-001',productionConfig:'voorbeeld-production-001',stagingRunner:'self-hosted, portaal-staging',productionRunner:'self-hosted, portaal-production',stagingProjectRef:'portaalstagingvoorbeeld',productionProjectRef:'portaalproductievoorbeeld',stagingSupabase:'https://supabase-staging.portaal.example',productionSupabase:'https://supabase.portaal.example',authMode:'otp',callback:'/auth/callback',authReference:'Voorbeeld: runbook Auth, SMTP en migraties per omgeving.',toolchain:'Gepinde Node- en pnpm-versie uit projectprofiel',releaseContract:'Voorbeeld: apart runner-, build- en appaccount per omgeving. Release en configuratie worden samen geactiveerd.',sourceSha:'0123456789abcdef0123456789abcdef01234567'},
  result:d=>({title:`Uitrolplan · ${V(d,'projectName')||'Nieuw project'}`,summary:planState(d),report:report(d),metadata:{projectName:V(d,'projectName'),repository:V(d,'repository'),scope:V(d,'scope'),stagingHost:V(d,'stagingHost'),productionHost:V(d,'productionHost'),sourceSha:V(d,'sourceSha'),productionEligible:readiness(d).prod}})
 };
}
