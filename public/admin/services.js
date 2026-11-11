import {realDataMode,createEmptyLegacyModule} from './empty-state.js';
import {businessStore} from './business-store.js';
/* Domain, hosting and mail service workflows. All changes are local demonstration data. */
const STORE_KEY='dg-midnight-services-v1';
const DOMAIN_SEEDS=[
 ['duindorpsv.nl','Duindorp SV','18 november 2026','1 november 2026',12.95,true,'duindorpsv.nl','Vereniging','info@duindorpsv.nl'],
 ['duindorpsv.com','Duindorp SV','4 februari 2027','18 januari 2027',17.95,true,'duindorpsv.nl','Vereniging','info@duindorpsv.nl'],
 ['clubhuis.online','Duindorp SV','12 augustus 2027','26 juli 2027',29.95,false,'clubhuis.online','Vereniging','info@duindorpsv.nl'],
 ['studionoord.nl','Studio Noord','2 april 2027','16 maart 2027',12.95,true,'studionoord.nl','Bedrijf','hallo@studionoord.nl'],
 ['bakkerijwest.nl','Bakkerij West','20 oktober 2026','3 oktober 2026',12.95,true,'bakkerijwest.nl','Bedrijf','info@bakkerijwest.nl']
];
const HOST_SEEDS=[
 ['duindorpsv.nl','Duindorp SV','Plus','DG-HST-0012',8.4,50,10,19.95,'maand','1 november 2026'],
 ['clubhuis.online','Duindorp SV','Start','DG-HST-0018',1.2,10,2,59.40,'jaar','12 augustus 2027'],
 ['studionoord.nl','Studio Noord','Zakelijk','DG-HST-0019',8.1,25,5,9.95,'maand','1 november 2026'],
 ['bakkerijwest.nl','Bakkerij West','Start','DG-HST-0020',2.8,10,2,4.95,'maand','1 november 2026']
];
const MAIL_SEEDS=[
 ['info@duindorpsv.nl','Algemeen contact',3.2,['contact']],['voorzitter@duindorpsv.nl','Bestuur',1.8,[]],['secretaris@duindorpsv.nl','Secretariaat',2.6,['bestuur']],['penningmeester@duindorpsv.nl','Financiële administratie',1.4,['facturen']],['jeugd@duindorpsv.nl','Jeugdcommissie',1.2,['jeugdcommissie']],['wedstrijdzaken@duindorpsv.nl','Wedstrijdsecretariaat',1.1,[]],['sponsoring@duindorpsv.nl','Partners & sponsoring',.8,['sponsors']],['kantine@duindorpsv.nl','Kantine & vrijwilligers',.5,[]],['hallo@studionoord.nl','Algemeen contact',2.8,[]],['sanne@studionoord.nl','Sanne',.6,[]]
];
function seed(){return {version:1,domains:Object.fromEntries(DOMAIN_SEEDS.map(([id,owner,renewal,invoice,price,auto,host,type,contact],n)=>[id,{id,owner,renewal,invoice,price,auto,host,type,contact,nameservers:['ns1.dgwebservices.example','ns2.dgwebservices.example'],dns:[{id:'a',type:'A',name:'@',value:`203.0.113.${20+n}`,ttl:3600},{id:'cname',type:'CNAME',name:'www',value:id,ttl:3600},{id:'mx',type:'MX',name:'@',value:'mx1.mailprovider.example',ttl:3600,priority:10},{id:'txt',type:'TXT',name:'@',value:'v=spf1 include:mailprovider.example ~all',ttl:3600}],history:[],requests:[]} ])),hosts:Object.fromEntries(HOST_SEEDS.map(([id,owner,plan,number,used,quota,mailLimit,price,period,next])=>[id,{id,owner,plan,number,used,quota,mailLimit,price,period,next,php:'8.3',ssl:true,requests:[]}])),mail:MAIL_SEEDS.map(([email,name,used,aliases],n)=>({id:'mail-'+n,email,name,used,quota:10,aliases,forward:[],keepCopy:true,created:false,requests:[]}))};}
export function createServices(ctx){
 if(realDataMode)return createEmptyLegacyModule(ctx,'services');
 const h=ctx.h,esc=h.escape,icon=h.icon; let data=seed(),current={kind:'domain',id:'duindorpsv.nl',tab:'overview'},unsaved=false;
 const admin=()=>ctx.getState().role==='admin';
 const money=n=>'€ '+Number(n).toFixed(2).replace('.',',');
 const decimal=n=>Number(n).toLocaleString('nl-NL',{minimumFractionDigits:1,maximumFractionDigits:1});
 const now=()=>new Date().toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
 const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2,8);
 function read(){if(unsaved)return data;try{const saved=JSON.parse(businessStore.getItem(STORE_KEY)||'null');if(saved?.version===1&&saved.domains&&saved.hosts&&Array.isArray(saved.mail))data=saved;}catch{}if(!Array.isArray(data.intake))data.intake=[];return data;}
 function save(){try{businessStore.setItem(STORE_KEY,JSON.stringify(data));unsaved=false;}catch{unsaved=true;ctx.toast('Deze browser bewaart de demo alleen zolang de pagina open blijft.');}}
 read();
 const demo=()=>`<div class="sv-demo">${icon('shield')}<span>Interactieve demo · ${unsaved?'tijdelijk op deze pagina':'bewaard in deze browser'}. Er worden geen echte diensten gewijzigd.</span></div>`;
 const button=(text,action,id='',primary=false,extra='')=>`<button type="button" class="btn${primary?' primary':''}" data-action="${action}" data-id="${esc(id)}" ${extra}>${text}</button>`;
 const submitButton=(text)=>`<button class="btn primary" type="submit">${text}</button>`;
 const actions=(content)=>`<div class="modal-actions sv-actions">${content}</div>`;
 const field=(label,name,value='',type='text',attrs='')=>`<label class="field">${label}<input type="${type}" name="${name}" value="${esc(value)}" ${attrs}></label>`;
 const hidden=(name,value)=>`<input type="hidden" name="${name}" value="${esc(value)}">`;
 const select=(label,name,options,value)=>`<label class="field">${label}<select name="${name}">${options.map(x=>`<option value="${esc(Array.isArray(x)?x[0]:x)}" ${(Array.isArray(x)?x[0]:x)===value?'selected':''}>${esc(Array.isArray(x)?x[1]:x)}</option>`).join('')}</select></label>`;
 const details=rows=>`<dl class="sv-details">${rows.map(([a,b])=>`<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>`;
 const stat=(label,value,caption)=>`<div class="sv-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(caption||'')}</small></div>`;
 const back=(kind,id,tab,label='Terug')=>button(label,'service-tab',id,false,`data-kind="${kind}" data-tab="${tab}"`);
 const history=rows=>rows.length?`<ol class="sv-history">${rows.slice().reverse().map(x=>`<li><span>${icon('clock')}</span><div><strong>${esc(x.title)}</strong><p>${esc(x.detail||'')}</p><small>${esc(x.at)} · lokale demo</small></div></li>`).join('')}</ol>`:'<div class="sv-empty">Nog geen demo-aanvragen. Nieuwe acties verschijnen hier.</div>';
 const record=(domain,title,detail='')=>{domain.history.push({title,detail,at:now()});};
 const domainAllowed=d=>d&&(admin()||d.owner==='Duindorp SV');
 const mailAllowed=m=>m&&domainAllowed(data.domains[m.email.split('@')[1]]);
 function unavailable(){ctx.toast('Deze dienst is niet beschikbaar in deze omgeving.');return true;}
 function show(title,body,size='wide'){ctx.modal(title,`<div class="sv-flow">${body}</div>`,{size});}
 function tabs(kind,id,active,items){return `<nav class="modal-tabs sv-tabs" aria-label="Dienstonderdelen">${items.map(([key,label])=>`<button type="button" class="${key===active?'active':''}" data-action="service-tab" data-kind="${kind}" data-id="${esc(id)}" data-tab="${key}" aria-current="${active===key?'page':'false'}">${label}</button>`).join('')}</nav>`;}
 function openDomain(id,tab='overview'){
  const d=data.domains[id];if(!domainAllowed(d))return unavailable();current={kind:'domain',id,tab};let body='';
  if(tab==='overview')body=`<div class="sv-heading"><span class="sv-service-icon">${icon('globe')}</span><div><span class="eyebrow">DOMEIN · ${esc(d.owner)}</span><h3>${esc(d.id)}</h3></div><span class="pill">Actief</span></div><div class="sv-stats">${stat('Verlengdatum',d.renewal,'Registratie voor 12 maanden')}${stat('Verlengprijs',money(d.price),'Per jaar · excl. btw')}</div>${details([['Domeinhouder',d.owner],['Hostingpakket',`Hosting ${data.hosts[d.host].plan} · ${d.host}`],['Verlenging',d.auto?'Automatisch':'Handmatig'],['DNS-beheer','DG Webservices · voorbeeldzone']])}${actions(button('DNS beheren','service-tab',id,true,'data-kind="domain" data-tab="dns"')+button('Hosting bekijken','hosting',d.host))}`;
  if(tab==='dns')body=`<div class="sv-section-title"><div><h3>DNS-records</h3><p>De voorbeeldzone voor ${esc(id)}. Wijzigingen blijven per domein bewaard.</p></div>${button(`${icon('plus')} Record toevoegen`,'service-dns-new',id,true)}</div><div class="sv-dns-list">${d.dns.map(r=>`<article class="sv-dns-record"><div class="sv-dns-type">${esc(r.type)}</div><div class="sv-dns-content"><strong>${esc(r.name)}</strong><code>${esc(r.value)}</code><small>TTL ${r.ttl} seconden${r.type==='MX'?` · Prioriteit ${r.priority}`:''}</small></div><div class="sv-row-actions">${button('Bewerken','service-dns-edit',id,false,`data-record="${esc(r.id)}"`)}${button('Verwijderen','service-dns-delete',id,false,`data-record="${esc(r.id)}"`)}</div></article>`).join('')}</div><div class="notice">Deze DNS-waarden zijn voorbeelden. In productie controleert DG wijzigingen voordat ze invloed hebben op je website of e-mail.</div>`;
  if(tab==='nameservers')body=`<h3>Nameservers</h3><p>De nameservers bepalen waar de volledige DNS-zone wordt beheerd.</p>${details(d.nameservers.map((ns,n)=>['Nameserver '+(n+1),ns]))}<p class="sv-caption">Voorbeeldadressen · er wordt geen verbinding gemaakt.</p>${actions(button('Wijziging aanvragen','service-nameservers',id,true))}${d.requests.some(x=>x.type==='nameservers')?`<h3>Jouw aanvragen</h3>${history(d.requests.filter(x=>x.type==='nameservers'))}`:''}`;
  if(tab==='contact')body=`<h3>Domeinhouder</h3><p>Deze gegevens horen bij de registratie en staan los van het factuuradres.</p>${details([['Organisatie',d.owner],['Type',d.type],['Contactadres',d.contact],['Land','Nederland']])}${actions(button('Wijziging aanvragen','service-contact',id,true))}${d.requests.some(x=>x.type==='contact')?`<h3>Wijzigingsverzoeken</h3>${history(d.requests.filter(x=>x.type==='contact'))}`:''}`;
  if(tab==='renewal')body=`<h3>Je volgende verlenging</h3><p>Je domeinnaam en hostingpakket worden afzonderlijk verlengd.</p>${details([['Automatisch verlengen',d.auto?'Aan':'Uit'],['Registratie verlengen op',d.renewal],['Volgende factuur',d.auto?d.invoice:'Niet gepland · handmatig verlengen'],['Prijs per 12 maanden',money(d.price)+' excl. btw']])}<div class="sv-renew-choice"><span>${icon('refresh')}</span><div><strong>${d.auto?'Automatische verlenging staat aan':'Je verlengt dit domein handmatig'}</strong><p>${d.auto?'Je houdt je domein zolang je abonnement actief is.':'Verleng tijdig om te voorkomen dat je domeinnaam vervalt.'}</p></div>${button('Voorkeur wijzigen','service-renew',id)}</div>`;
  if(tab==='transfer')body=`<h3>Domein naar een andere aanbieder</h3><p>Een domeinverhuizing verplaatst geen website, mailboxen of berichten. We controleren eerst welke diensten blijven bestaan.</p>${details([['Domein',id],['Gekoppeld hostingpakket',`Hosting ${data.hosts[d.host].plan}`],['Identiteitscontrole','Nodig vóór een echte verhuiscode wordt verstrekt']])}${actions(button('Verhuisverzoek voorbereiden','service-transfer',id,true))}${history(d.requests.filter(x=>x.type==='transfer'))}`;
  if(tab==='activity')body=`<h3>Activiteit voor ${esc(id)}</h3>${history([{title:'Voorbeeldzone beschikbaar',detail:'Registratie en DNS horen bij '+d.owner,at:'13 okt 2026, 12:28'},...d.history])}`;
  if(!body)return openDomain(id,'overview');
  show(id,`${demo()}${tabs('domain',id,tab,[['overview','Overzicht'],['dns','DNS'],['nameservers','Nameservers'],['contact','Contactgegevens'],['renewal','Verlenging'],['transfer','Verhuizen'],['activity','Activiteit']])}${body}`);
 }
 function dnsEditor(domainId,recordId=''){
  const d=data.domains[domainId];if(!domainAllowed(d))return unavailable();const r=d.dns.find(x=>x.id===recordId)||{id:'',type:'A',name:'@',value:'',ttl:3600,priority:10};
  show(r.id?'DNS-record bewerken':'DNS-record toevoegen',`${demo()}<p>${esc(domainId)} · Vul de DNS-waarden in voor deze voorbeeldzone.</p><form id="service-dns-form">${hidden('domain',domainId)}${hidden('record',r.id)}<div class="fields">${select('Type','type',['A','AAAA','CNAME','MX','TXT','NS'],r.type)}${field('Naam','name',r.name,'text','required maxlength="253" placeholder="@, www of mail"')}${field('Waarde','value',r.value,'text','required maxlength="2048" autocomplete="off"')}${field('TTL in seconden','ttl',r.ttl,'number','required min="60" max="86400" step="1"')}<label class="field sv-mx-priority" ${r.type==='MX'?'':'hidden'}>MX-prioriteit<input type="number" name="priority" min="0" max="65535" step="1" value="${r.priority??10}" ${r.type==='MX'?'required':''}></label></div><div class="sv-inline-help" id="service-dns-hint">${dnsHint(r.type)}</div>${actions(back('domain',domainId,'dns','Annuleren')+submitButton('Bewaar demo-record'))}</form>`,'standard');
 }
 function dnsHint(type){return {A:'IPv4-adres, bijvoorbeeld 203.0.113.20. Gebruik @ voor het hoofddomein.',AAAA:'IPv6-adres, bijvoorbeeld 2001:db8::20.',CNAME:'Volledige doelhost, bijvoorbeeld website.example. Een CNAME kan niet naast andere records met dezelfde naam bestaan.',MX:'Volledige mailservernaam en prioriteit. Een lager getal heeft voorrang.',TXT:'De volledige tekstwaarde, bijvoorbeeld een SPF- of verificatierecord.',NS:'De volledige naam van de nameserver, bijvoorbeeld ns1.provider.example.'}[type]||'';}
 function openHosting(id,tab='overview'){
  const p=data.hosts[id];if(!p||(admin()===false&&p.owner!=='Duindorp SV'))return unavailable();current={kind:'hosting',id,tab};
  const boxes=data.mail.filter(m=>data.domains[m.email.split('@')[1]]?.host===id);let body='';
  if(tab==='overview')body=`<div class="sv-heading"><span class="sv-service-icon">${icon('server')}</span><div><span class="eyebrow">${esc(p.number)} · ${esc(p.owner)}</span><h3>Hosting ${esc(p.plan)}</h3><p>${esc(id)}</p></div><span class="pill">Online</span></div><div class="sv-stats">${stat('Websiteopslag',`${decimal(p.used)} / ${p.quota} GB`,'Website en database')}${stat('Mailboxen',`${boxes.length} / ${p.mailLimit}`,'Inbegrepen in dit pakket')}</div><div class="sv-usage"><span style="width:${Math.round(p.used/p.quota*100)}%"></span></div>${details([['Abonnement',`${money(p.price)} / ${p.period} excl. btw`],['Volgende termijn',p.next],['SSL-certificaat',p.ssl?'Actief · automatisch beheerd':'Uitgeschakeld in demo'],['PHP-versie',p.php],['Laatste back-up','13 oktober 2026 · 03:00']])}${actions(back('hosting',id,'backups','Back-ups bekijken')+back('hosting',id,'settings','Instellingen'))}`;
  if(tab==='backups')body=`<h3>Een vertrouwd herstelpunt</h3><p>Beschikbare voorbeeldback-ups voor ${esc(id)}. Een herstelverzoek is zichtbaar in de historie.</p><div class="sv-backup-list">${['13 oktober 2026','12 oktober 2026','11 oktober 2026'].map((date,n)=>`<article><span class="sv-service-icon">${icon('clock')}</span><div><strong>${date} · 03:00</strong><small>Website + database · ${decimal(p.used)} GB · gereed</small></div>${button('Herstellen','service-restore',id,false,`data-backup="${n}"`)}</article>`).join('')}</div><h3>Herstelverzoeken</h3>${history(p.requests.filter(x=>x.type==='restore'))}`;
  if(tab==='settings')body=`<h3>Technische instellingen</h3><p>Pas de voorbeeldinstellingen van dit hostingpakket aan. Een PHP-wijziging wordt in productie eerst getest met je website.</p><form id="service-host-settings-form">${hidden('host',id)}<div class="fields">${select('PHP-versie','php',[['8.2','PHP 8.2'],['8.3','PHP 8.3'],['8.4','PHP 8.4']],p.php)}${select('SSL-certificaat','ssl',[['on','Automatisch beheren'],['off','Uitgeschakeld in demo']],p.ssl?'on':'off')}</div><label class="choice-row"><input type="checkbox" name="confirm" required> Ik begrijp dat technische wijzigingen eerst getest moeten worden.</label>${actions(submitButton('Bewaar demo-instellingen'))}</form><div class="notice">Er wordt geen server aangepast. Deze keuze is alleen bedoeld om de beheerflow te beoordelen.</div>${p.requests.some(x=>x.type==='settings')?`<h3>Instellingshistorie</h3>${history(p.requests.filter(x=>x.type==='settings'))}`:''}`;
  if(!body)return openHosting(id,'overview');show(`Hosting · ${id}`,`${demo()}${tabs('hosting',id,tab,[['overview','Overzicht'],['backups','Back-ups'],['settings','Instellingen']])}${body}`);
 }
 function mailForm(id='new'){
  const m=data.mail.find(x=>x.email===id||x.id===id);if(id!=='new'&&!mailAllowed(m))return unavailable();current={kind:'mailbox',id:m?.id||'new',tab:'settings'};
  const domains=Object.values(data.domains).filter(domainAllowed),domain=m?.email.split('@')[1]||'duindorpsv.nl';
  show(m?'Mailbox beheren':'Mailbox toevoegen',`${demo()}${m?`<div class="sv-heading"><span class="sv-service-icon">${icon('mail')}</span><div><span class="eyebrow">${esc(data.domains[domain].owner)}</span><h3>${esc(m.email)}</h3></div><span class="pill${m.created?' blue':''}">${m.created?'Demo-mailbox':'Actief'}</span></div>`:'<p>Maak een voorbeeldmailbox aan binnen het hostingpakket. Er wordt geen mailbox bij de provider aangemaakt.</p>'}<form id="service-mail-form">${hidden('mailid',m?.id||'new')}<div class="fields">${m?'':field('Mailboxnaam','local','','text','required maxlength="64" placeholder="bijvoorbeeld bestuur"')}${m?'':select('Domein','domain',domains.map(d=>[d.id,`${d.id} · Hosting ${data.hosts[d.host].plan}`]),domain)}${field('Weergavenaam','display',m?.name||'','text','required maxlength="80"')}${field('Opslaglimiet in GB','quota',m?.quota||10,'number','required min="1" max="10" step="1"')}<label class="field full">Aliassen (komma-gescheiden)<input name="aliases" value="${esc((m?.aliases||[]).join(', '))}" placeholder="contact, bestuur" maxlength="600"><small>Alle aliassen ontvangen in dezelfde mailbox, op hetzelfde domein.</small></label><label class="field full">Doorsturen naar (optioneel, komma-gescheiden)<input name="forward" value="${esc((m?.forward||[]).join(', '))}" placeholder="naam@voorbeeld.nl" maxlength="1000"><small>Maximaal vijf adressen. De mailbox blijft ook via webmail bereikbaar.</small></label></div><label class="choice-row"><input type="checkbox" name="keepCopy" ${m?.keepCopy!==false?'checked':''}> Bewaar bij doorsturen een kopie in deze mailbox</label>${m?`<p class="sv-caption">${decimal(m.used)} GB gebruikt. De opslaglimiet kan niet lager zijn dan het huidige gebruik.</p>`:'<div id="service-mail-capacity" class="sv-inline-help">'+mailCapacity(domain)+'</div>'}${actions(m?button('Wachtwoord herstellen','service-mail-reset',m.id)+submitButton('Bewaar demo-instellingen'):button('Annuleren','close')+submitButton('Maak demo-mailbox'))}</form>${m?.requests?.length?`<h3>Verzoeken</h3>${history(m.requests)}`:''}`,'standard');
 }
 function mailCapacity(domain){const d=data.domains[domain];if(!d)return '';const p=data.hosts[d.host];const count=data.mail.filter(m=>data.domains[m.email.split('@')[1]]?.host===d.host).length;return `Hosting ${p.plan} · ${count} van ${p.mailLimit} mailboxplaatsen in gebruik · maximaal 10 GB per mailbox.`;}
 function requestPanel(kind='domains'){
  const requests=(data.intake||[]).filter(r=>(admin()||r.owner==='Duindorp SV')&&(kind==='email'?r.type==='email-migration':r.type!=='email-migration'));
  if(!requests.length)return '';
  return `<section class="panel sv-request-panel" data-service-requests="${kind}"><div class="sv-section-title"><div><span class="eyebrow">AANVRAGEN</span><h2>${kind==='email'?'Migratieverzoeken':'Domeinaanvragen'}</h2><p>Lokaal bewaard · nog niet uitgevoerd bij een provider.</p></div><span class="pill blue">${requests.length} verzoek${requests.length===1?'':'en'}</span></div>${history(requests)}</section>`;
 }
 function intakeForm(type='domain-transfer'){
  const titles={'domain-transfer':'Domein verhuizen','external-domain':'Extern domein koppelen','domain-new':'Domein toevoegen','email-migration':'E-mailmigratie voorbereiden'},title=titles[type];if(!title)return;
  const domains=Object.values(data.domains).filter(domainAllowed),hosts=Object.values(data.hosts).filter(p=>admin()||p.owner==='Duindorp SV'),migration=type==='email-migration';
  const intro=migration?'We inventariseren toegang, mappen, berichten en bijlagen. Na de eerste kopie volgt een controle en een laatste synchronisatie vóór de DNS-omschakeling.':type==='domain-transfer'?'Een domeinverhuizing verplaatst alleen de registratie. Websitebestanden en bestaande e-mail worden apart geïnventariseerd.':type==='external-domain'?'Je houdt de domeinregistratie bij je huidige aanbieder. DG controleert de benodigde DNS-wijzigingen voor het gekozen hostingpakket.':'Bereid een domeinregistratie voor. Beschikbaarheid, prijs en houdergegevens worden vóór een echte bestelling opnieuw gecontroleerd.';
  show(title,`${demo()}<p>${intro}</p><form id="service-intake-form">${hidden('requestType',type)}<div class="fields">${migration?select('Domein','domain',domains.map(d=>[d.id,`${d.id} · ${d.owner}`]),'duindorpsv.nl'):field('Domeinnaam','domain','','text','required maxlength="253" placeholder="jouwdomein.nl"')}${admin()&&!migration?select('Klantorganisatie','owner',['Duindorp SV','Studio Noord','Bakkerij West'],'Duindorp SV'):''}${type!=='domain-new'?field('Huidige aanbieder','provider','','text','required maxlength="100" placeholder="Naam hosting- of mailprovider"'):''}${type==='external-domain'?select('Gekoppeld hostingpakket','host',hosts.filter(p=>p.owner==='Duindorp SV').map(p=>[p.id,`${p.id} · Hosting ${p.plan}`]),'duindorpsv.nl'):''}${migration?field('Aantal te verhuizen mailboxen','mailboxCount','8','number','required min="1" max="500" step="1"'):''}${type==='domain-transfer'?select('Gevraagde begeleiding','scope',[['domain','Alleen domeinregistratie'],['website','Domein en website'],['email','Domein en e-mail'],['all','Domein, website en e-mail']],'domain'):''}<label class="field full">Opmerking (optioneel)<textarea name="comment" maxlength="1500" placeholder="Bijvoorbeeld een gewenste periode of bijzonderheden. Geen wachtwoorden of verhuiscodes."></textarea></label></div>${migration?'<div class="sv-migration-steps"><span>1. Toegang en inventarisatie</span><span>2. Eerste kopie + inhoudcontrole</span><span>3. Laatste synchronisatie</span><span>4. DNS en nazorg</span></div>':''}<div class="notice sv-space">${migration?'Bestaande mailboxen blijven actief totdat mappen, berichten en bijlagen gecontroleerd zijn. Toegang wordt later via een beveiligde route afgestemd.':'Dit is een aanvraag ter beoordeling. Er wordt niets geregistreerd, verhuisd, gekoppeld of gefactureerd.'}</div><label class="choice-row"><input type="checkbox" name="confirm" required> ${migration?'Ik ben bevoegd om de migratie voor deze organisatie aan te vragen.':'Ik begrijp dat dit verzoek eerst wordt gecontroleerd voordat een wijziging wordt uitgevoerd.'}</label>${actions(button('Annuleren','close')+submitButton('Bewaar demo-aanvraag'))}</form>`,'standard');
 }
 function refresh(){ctx.render();}
 function error(message,form,name){ctx.toast(message);if(form&&name){const input=form.elements?.namedItem(name);input?.setAttribute('aria-invalid','true');input?.focus();}return true;}
 function validHostname(s){return s.length<=253&&/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\.?$/i.test(s);}
 function validEmail(s){return s.length<=254&&/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@/i.test(s)&&validHostname(s.split('@')[1]||'')&&s.split('@').length===2;}
 function list(value){return String(value||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);}
 const domainAliases={'domain-duindorp':'duindorpsv.nl','domain-duindorp-com':'duindorpsv.com','domain-clubhuis':'clubhuis.online','domain-studio':'studionoord.nl','domain-bakkerij':'bakkerijwest.nl','renew-bakkerij':'bakkerijwest.nl'};
 const hostAliases={'hosting-duindorp':'duindorpsv.nl','hosting-clubhuis':'clubhuis.online','hosting-studio':'studionoord.nl','hosting-bakkerij':'bakkerijwest.nl'};
 function action(name,el){
  read();let id=el?.dataset?.id||'',recordId=el?.dataset?.record||'';
  if(name==='admin-task'){
   if(id==='renew-bakkerij'&&ctx.getState().page!=='domains')return false;
   if(domainAliases[id]){openDomain(domainAliases[id],id==='renew-bakkerij'?'renewal':'overview');return true;}
   if(hostAliases[id]){openHosting(hostAliases[id]);return true;}
   if(id.startsWith('backup-')&&data.hosts[id.slice(7)]){openHosting(id.slice(7),'backups');return true;}
   if(/^mailbox-\d+$/.test(id)){mailForm(data.mail[Number(id.slice(8))]?.id||'missing');return true;}
   if(id==='new-mailbox'){mailForm();return true;}
   if(id==='new-domain'){intakeForm('domain-new');return true;}
   if(id==='email-migration'){intakeForm('email-migration');return true;}
   if(id.startsWith('email-')&&data.mail.some(m=>m.email===id.slice(6))){mailForm(id.slice(6));return true;}
   return false;
  }
  if(name==='domain'){openDomain(id||'duindorpsv.nl');return true;}
  if(['domain-transfer','domain-help','external-domain','email-migration'].includes(name)){intakeForm(name==='domain-help'?'domain-transfer':name);return true;}
  if(name==='service-intake-list'){ctx.closeModal();ctx.go(id==='email'?'email':'domains');return true;}
  if(name==='hosting'){openHosting(id||'duindorpsv.nl');return true;}
  if(name==='backup'){openHosting(data.hosts[id]?id:current.kind==='hosting'?current.id:'duindorpsv.nl','backups');return true;}
  if(name==='mailbox'){mailForm(id||'new');return true;}
  if(name==='service-tab'){el.dataset.kind==='hosting'?openHosting(id,el.dataset.tab):openDomain(id,el.dataset.tab);return true;}
  if(name==='service-dns-new'||name==='service-dns-edit'){dnsEditor(id,name==='service-dns-edit'?recordId:'');return true;}
  if(name==='service-dns-delete'){
   const d=data.domains[id],r=d?.dns.find(x=>x.id===recordId);if(!domainAllowed(d)||!r)return unavailable();
   show('DNS-record verwijderen',`${demo()}<h3>${esc(r.type)} · ${esc(r.name)}</h3><p class="sv-value">${esc(r.value)}</p><div class="notice">Het verwijderen van een echt DNS-record kan invloed hebben op je website of e-mail. Hier verwijder je alleen dit demo-record.</div><form id="service-dns-delete-form">${hidden('domain',id)}${hidden('record',r.id)}<label class="choice-row"><input type="checkbox" name="confirm" required> Ik wil dit demo-record verwijderen.</label>${actions(back('domain',id,'dns','Annuleren')+submitButton('Verwijder demo-record'))}</form>`,'small');return true;
  }
  if(name==='service-nameservers'){
   const d=data.domains[id];if(!domainAllowed(d))return unavailable();show('Nameservers wijzigen',`${demo()}<p>${esc(id)} · Een aanvraag verandert de actieve nameservers nog niet.</p><form id="service-nameservers-form">${hidden('domain',id)}<div class="fields">${field('Primaire nameserver','ns1',d.nameservers[0],'text','required')}${field('Secundaire nameserver','ns2',d.nameservers[1],'text','required')}</div><label class="choice-row"><input type="checkbox" name="confirm" required> De nieuwe DNS-zone bevat ook alle benodigde mailrecords.</label>${actions(back('domain',id,'nameservers','Annuleren')+submitButton('Bewaar demo-aanvraag'))}</form>`,'standard');return true;
  }
  if(name==='service-contact'){
   const d=data.domains[id];if(!domainAllowed(d))return unavailable();show('Domeinhouder wijzigen',`${demo()}<p>${esc(id)} · DG controleert een houderwijziging voordat de registratie wordt aangepast.</p><form id="service-contact-form">${hidden('domain',id)}<div class="fields">${field('Organisatie','owner',d.owner,'text','required maxlength="120"')}${field('Contactadres','contact',d.contact,'email','required maxlength="254"')}</div>${actions(back('domain',id,'contact','Annuleren')+submitButton('Bewaar wijzigingsverzoek'))}</form>`,'standard');return true;
  }
  if(name==='service-renew'){
   const d=data.domains[id];if(!domainAllowed(d))return unavailable();show('Verlengvoorkeur wijzigen',`${demo()}<p>${esc(id)} · Registratie loopt tot ${esc(d.renewal)}.</p><form id="service-renew-form">${hidden('domain',id)}${select('Verlenging','auto',[['on','Automatisch verlengen'],['off','Handmatig verlengen']],d.auto?'on':'off')}<div class="notice sv-space">Bij handmatige verlenging blijft je huidige registratie actief tot de vervaldatum. Je moet daarna zelf op tijd verlengen.</div><label class="choice-row"><input type="checkbox" name="confirm" required> Ik heb de verlengdatum en de gevolgen gelezen.</label>${actions(back('domain',id,'renewal','Annuleren')+submitButton('Bewaar demovoorkeur'))}</form>`,'small');return true;
  }
  if(name==='service-transfer'){
   const d=data.domains[id];if(!domainAllowed(d))return unavailable();show('Verhuisverzoek voorbereiden',`${demo()}<p>Voor ${esc(id)} wordt een controleverzoek vastgelegd. De domeinnaam en gekoppelde diensten blijven actief. Deze demo verstrekt geen verhuiscode.</p><form id="service-transfer-form">${hidden('domain',id)}${field('Reden (optioneel)','reason','','text','maxlength="300"')}<label class="choice-row"><input type="checkbox" name="confirm" required> Ik begrijp dat hosting en e-mail apart blijven bestaan.</label>${actions(back('domain',id,'transfer','Annuleren')+submitButton('Bewaar demo-verzoek'))}</form>`,'standard');return true;
  }
  if(name==='service-restore'){
   const p=data.hosts[id],backup=Number(el.dataset.backup);if(!p||(!admin()&&p.owner!=='Duindorp SV')||![0,1,2].includes(backup))return unavailable();const date=['13 oktober 2026','12 oktober 2026','11 oktober 2026'][backup];
   show('Back-up terugzetten',`${demo()}<h3>${esc(id)}</h3>${details([['Herstelpunt',date+' · 03:00'],['Onderdelen','Websitebestanden en database'],['E-mail','Wordt niet teruggezet']])}<div class="notice">Een echt herstel overschrijft nieuwere websitegegevens. DG maakt vooraf een veiligheidskopie. In deze demo registreer je alleen een herstelverzoek.</div><form id="service-restore-form">${hidden('host',id)}${hidden('backup',backup)}${field('Typ de domeinnaam ter bevestiging','confirmDomain','','text',`required autocomplete="off" placeholder="${esc(id)}"`)}${actions(back('hosting',id,'backups','Annuleren')+submitButton('Registreer demo-herstel'))}</form>`,'standard');return true;
  }
  if(name==='service-mail-reset'||(name==='mail-reset'&&current.kind==='mailbox')){
   const m=data.mail.find(x=>x.id===(id||current.id));if(!mailAllowed(m))return unavailable();show('Mailboxwachtwoord herstellen',`${demo()}<h3>${esc(m.email)}</h3><p>DG verifieert de aanvrager en stuurt in het echte portaal een beveiligde herstellink naar een gecontroleerd contactadres. Hier wordt alleen een verzoek geregistreerd.</p><form id="service-mail-reset-form">${hidden('mailid',m.id)}<label class="choice-row"><input type="checkbox" name="confirm" required> Ik wil een herstelverzoek voor deze mailbox registreren.</label>${actions(button('Terug naar mailbox','mailbox',m.id)+submitButton('Registreer demo-verzoek'))}</form>`,'small');return true;
  }
  return false;
 }
 function submit(form,fd){
  if(!form.id.startsWith('service-'))return false;read();const get=n=>String(fd.get(n)||'').trim(),d=data.domains[get('domain')];
  if(form.id==='service-dns-form'){
   if(!domainAllowed(d))return unavailable();const type=get('type'),name=get('name').toLowerCase(),value=get('value'),ttl=Number(get('ttl')),priority=Number(get('priority')),recordId=get('record');
   if(!['A','AAAA','CNAME','MX','TXT','NS'].includes(type))return error('Kies een geldig DNS-type.',form,'type');
   if(!name||name.length>253||!(name==='@'||/^[a-z0-9_*.-]+$/i.test(name)&&name.split('.').every(l=>l&&l.length<=63&&!l.startsWith('-')&&!l.endsWith('-'))))return error('Vul een geldige DNS-naam in, zoals @, www of _dmarc.',form,'name');
   if(!value||value.length>2048)return error('Vul een geldige waarde in.',form,'value');
   if(type==='A'&&!/^(\d{1,3}\.){3}\d{1,3}$/.test(value)||type==='A'&&value.split('.').some(x=>Number(x)>255))return error('Vul een geldig IPv4-adres in.',form,'value');
   if(type==='AAAA'){try{if(!value.includes(':')||!/^[a-f0-9:.]+$/i.test(value))throw Error();new URL('http://['+value+']/');}catch{return error('Vul een geldig IPv6-adres in.',form,'value');}}
   if(['CNAME','MX','NS'].includes(type)&&!validHostname(value))return error('Gebruik een volledige hostnaam, zonder protocol of pad.',form,'value');
   if(type==='CNAME'&&name==='@')return error('Het hoofddomein kan hier geen CNAME-record krijgen. Gebruik A of AAAA.',form,'name');
   if(!Number.isInteger(ttl)||ttl<60||ttl>86400)return error('TTL moet een geheel getal tussen 60 en 86400 zijn.',form,'ttl');
   if(type==='MX'&&(!Number.isInteger(priority)||priority<0||priority>65535))return error('MX-prioriteit moet tussen 0 en 65535 liggen.',form,'priority');
   const others=d.dns.filter(x=>x.id!==recordId),sameName=others.filter(x=>x.name.toLowerCase()===name);
   if(sameName.some(x=>x.type==='CNAME')||type==='CNAME'&&sameName.length)return error('Deze naam heeft al een record. Een CNAME kan niet samen met andere records bestaan.',form,'name');
   if(others.some(x=>x.type===type&&x.name===name&&x.value.toLowerCase()===value.toLowerCase()&&(type!=='MX'||x.priority===priority)))return error('Dit DNS-record bestaat al.',form,'value');
   if(recordId&&!d.dns.some(x=>x.id===recordId))return unavailable();const item={id:recordId||uid(),type,name,value,ttl,...(type==='MX'?{priority}:{})};
   if(recordId)d.dns=d.dns.map(x=>x.id===recordId?item:x);else d.dns.push(item);record(d,recordId?'DNS-record bewerkt':'DNS-record toegevoegd',`${type} · ${name}`);save();openDomain(d.id,'dns');ctx.toast('DNS-record opgeslagen in de demo.');return true;
  }
  if(form.id==='service-dns-delete-form'){
   if(!domainAllowed(d)||!fd.get('confirm'))return error('Bevestig eerst de verwijdering.',form,'confirm');const r=d.dns.find(x=>x.id===get('record'));if(!r)return unavailable();d.dns=d.dns.filter(x=>x.id!==r.id);record(d,'DNS-record verwijderd',r.type+' · '+r.name);save();openDomain(d.id,'dns');ctx.toast('Demo-record verwijderd.');return true;
  }
  if(['service-nameservers-form','service-contact-form','service-transfer-form'].includes(form.id)){
   if(!domainAllowed(d))return unavailable();let req;
   if(form.id==='service-nameservers-form'){const ns1=get('ns1').toLowerCase(),ns2=get('ns2').toLowerCase();if(!validHostname(ns1)||!validHostname(ns2)||ns1===ns2)return error('Vul twee verschillende, geldige nameservers in.',form,'ns1');if(!fd.get('confirm'))return error('Bevestig dat de DNS-zone is voorbereid.',form,'confirm');req={type:'nameservers',title:'Nameserverwijziging aangevraagd',detail:ns1+' · '+ns2};}
   if(form.id==='service-contact-form'){if(!get('owner')||get('owner').length>120||!validEmail(get('contact')))return error('Vul een organisatienaam en een geldig contactadres in.',form,'contact');req={type:'contact',title:'Houderwijziging aangevraagd',detail:get('owner')+' · '+get('contact')};}
   if(form.id==='service-transfer-form'){if(!fd.get('confirm'))return error('Bevestig eerst dat hosting en e-mail apart blijven bestaan.',form,'confirm');req={type:'transfer',title:'Verhuiscontrole aangevraagd',detail:get('reason')||'Wacht op identiteits- en afhankelijkheidscontrole'};}
   req.at=now();d.requests.push(req);record(d,req.title,req.detail);save();openDomain(d.id,req.type==='nameservers'?'nameservers':req.type==='contact'?'contact':'transfer');ctx.toast('Demo-aanvraag bewaard. Actieve registratie is ongewijzigd.');return true;
  }
  if(form.id==='service-renew-form'){
   if(!domainAllowed(d))return unavailable();if(!fd.get('confirm'))return error('Bevestig eerst dat je de gevolgen hebt gelezen.',form,'confirm');d.auto=get('auto')==='on';record(d,'Verlengvoorkeur gewijzigd',d.auto?'Automatisch verlengen aan':'Handmatig verlengen');save();refresh();openDomain(d.id,'renewal');ctx.toast('Demo-verlengvoorkeur bewaard.');return true;
  }
  if(form.id==='service-restore-form'){
   const p=data.hosts[get('host')],n=Number(get('backup'));if(!p||(!admin()&&p.owner!=='Duindorp SV')||![0,1,2].includes(n))return unavailable();if(get('confirmDomain').toLowerCase()!==p.id)return error('Typ de volledige domeinnaam om dit verzoek te bevestigen.',form,'confirmDomain');
   const date=['13 oktober 2026','12 oktober 2026','11 oktober 2026'][n];p.requests.push({type:'restore',title:'Herstelverzoek geregistreerd',detail:'Herstelpunt '+date+' 03:00 · website en database · nog niet uitgevoerd',at:now()});save();openHosting(p.id,'backups');ctx.toast('Demo-herstelverzoek geregistreerd. Geen bestanden teruggezet.');return true;
  }
  if(form.id==='service-host-settings-form'){
   const p=data.hosts[get('host')];if(!p||(!admin()&&p.owner!=='Duindorp SV'))return unavailable();if(!fd.get('confirm'))return error('Bevestig eerst de technische wijziging.',form,'confirm');if(!['8.2','8.3','8.4'].includes(get('php')))return error('Kies een geldige PHP-versie.',form,'php');p.php=get('php');p.ssl=get('ssl')==='on';p.requests.push({type:'settings',title:'Demo-instellingen bijgewerkt',detail:'PHP '+p.php+' · SSL '+(p.ssl?'automatisch':'uit'),at:now()});save();refresh();openHosting(p.id,'settings');ctx.toast('Voorbeeldinstellingen bewaard.');return true;
  }
  if(form.id==='service-mail-form'){
   const existing=data.mail.find(x=>x.id===get('mailid')),isNew=get('mailid')==='new';if(!isNew&&!mailAllowed(existing))return unavailable();const domain=isNew?get('domain'):existing.email.split('@')[1],domainData=data.domains[domain];if(!domainAllowed(domainData))return unavailable();
   const local=isNew?get('local').toLowerCase():existing.email.split('@')[0];if(!/^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(local)||local.includes('..'))return error('Gebruik letters, cijfers, punten, streepjes of underscores voor de mailboxnaam.',form,'local');
   const email=local+'@'+domain,quota=Number(get('quota')),name=get('display'),aliases=list(fd.get('aliases')).map(x=>x.endsWith('@'+domain)?x.slice(0,-domain.length-1):x),forward=list(fd.get('forward'));
   if(!name||name.length>80)return error('Vul een weergavenaam van maximaal 80 tekens in.',form,'display');
   if(!Number.isInteger(quota)||quota<1||quota>10||quota<(existing?.used||0))return error('Kies 1 tot 10 GB, minimaal gelijk aan het gebruikte volume.',form,'quota');
   if(aliases.length>10||aliases.some(x=>!/^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(x)||x.includes('..'))||new Set(aliases).size!==aliases.length||aliases.includes(local))return error('Gebruik maximaal tien unieke aliassen zonder @domein. De mailboxnaam kan geen alias van zichzelf zijn.',form,'aliases');
   const occupied=new Set(data.mail.filter(x=>x.id!==existing?.id).flatMap(x=>[x.email,...x.aliases.map(a=>a+'@'+x.email.split('@')[1])]).map(x=>x.toLowerCase()));
   if(occupied.has(email))return error('Dit adres is al in gebruik als mailbox of alias.',form,'local');
   if(aliases.some(x=>occupied.has(x+'@'+domain)))return error('Een van de aliassen wordt al gebruikt door een andere mailbox.',form,'aliases');
   if(forward.length>5||new Set(forward).size!==forward.length||forward.some(x=>!validEmail(x)||x===email||aliases.some(a=>x===a+'@'+domain)))return error('Gebruik maximaal vijf verschillende geldige doorstuuradressen, buiten deze mailbox en haar aliassen.',form,'forward');
   if(isNew){const p=data.hosts[domainData.host],count=data.mail.filter(x=>data.domains[x.email.split('@')[1]]?.host===p.id).length;if(count>=p.mailLimit)return error('Dit hostingpakket heeft geen vrije mailboxplaatsen. Kies een ander pakket of neem contact op met support.',form,'domain');}
   const box={...(existing||{id:uid(),used:0,created:true,requests:[]}),email,name,quota,aliases,forward,keepCopy:!!fd.get('keepCopy')};if(existing)data.mail=data.mail.map(x=>x.id===existing.id?box:x);else data.mail.push(box);save();refresh();mailForm(box.id);ctx.toast(isNew?'Demo-mailbox toegevoegd aan het overzicht.':'Mailboxinstellingen in de demo opgeslagen.');return true;
  }
  if(form.id==='service-mail-reset-form'){
   const m=data.mail.find(x=>x.id===get('mailid'));if(!mailAllowed(m))return unavailable();if(!fd.get('confirm'))return error('Bevestig eerst het herstelverzoek.',form,'confirm');m.requests.push({title:'Wachtwoordherstel aangevraagd',detail:'Wacht op controle door DG · er is geen e-mail verzonden',at:now()});save();mailForm(m.id);ctx.toast('Demo-herstelverzoek geregistreerd.');return true;
  }
  if(form.id==='service-intake-form'){
   const type=get('requestType'),migration=type==='email-migration',domain=get('domain').toLowerCase().replace(/\.$/,''),provider=get('provider'),host=data.hosts[get('host')];
   if(!['domain-transfer','external-domain','domain-new','email-migration'].includes(type))return unavailable();
   if(!validHostname(domain))return error('Vul een volledige domeinnaam in, zonder https:// of een pad.',form,'domain');
   if(!migration&&data.domains[domain])return error('Dit domein staat al in je portfolio. Beheer het via Domeinen.',form,'domain');
   if(type!=='domain-new'&&(!provider||provider.length>100))return error('Vul de naam van de huidige aanbieder in.',form,'provider');
   if(!fd.get('confirm'))return error('Bevestig eerst dat je deze aanvraag wilt voorbereiden.',form,'confirm');
   let owner=admin()?get('owner'):'Duindorp SV';if(migration){if(!domainAllowed(data.domains[domain]))return unavailable();owner=data.domains[domain].owner;}
   if(!['Duindorp SV','Studio Noord','Bakkerij West'].includes(owner))return error('Kies een bestaande klantorganisatie.',form,'owner');
   if(type==='external-domain'&&(!host||host.owner!==owner))return error('Kies een hostingpakket van dezelfde klantorganisatie.',form,'host');
   const mailboxCount=Number(get('mailboxCount'));if(migration&&(!Number.isInteger(mailboxCount)||mailboxCount<1||mailboxCount>500))return error('Vul 1 tot 500 mailboxen in.',form,'mailboxCount');
   if((data.intake||[]).some(r=>r.type===type&&r.domain===domain))return error('Voor dit domein staat al een vergelijkbare demo-aanvraag klaar. Bekijk de aanvraaghistorie.',form,'domain');
   const labels={'domain-transfer':'Domeinverhuizing','external-domain':'Extern domein koppelen','domain-new':'Domeinregistratie','email-migration':'E-mailmigratie'},scopes={domain:'Alleen registratie',website:'Registratie en website',email:'Registratie en e-mail',all:'Registratie, website en e-mail'};
   if(type==='domain-transfer'&&!scopes[get('scope')])return error('Kies de gewenste begeleiding.',form,'scope');
   const request={id:'DG-REQ-'+uid().slice(0,8).toUpperCase(),type,domain,owner,title:labels[type]+' · '+domain,detail:[owner,provider?'van '+provider:'Registratie voorbereiden',type==='external-domain'?'naar Hosting '+host.plan+' · '+host.id:migration?mailboxCount+' mailboxen':type==='domain-transfer'?scopes[get('scope')]:'Beschikbaarheid nog te controleren','Wacht op beoordeling',get('comment')].filter(Boolean).join(' · '),at:now()};data.intake.push(request);save();refresh();show('Je aanvraag staat klaar',`${demo()}<span class="pill blue">Wacht op beoordeling</span><h3>${esc(request.title)}</h3>${details([['Referentie',request.id],['Klant',owner],['Huidige aanbieder',provider||'Nieuwe registratie'],['Status','Demo-aanvraag · nog niet uitgevoerd']])}<p>De aanvraag is lokaal bewaard en staat onder ${migration?'E-mail':'Domeinen'}. Er is geen bericht verzonden en geen provideractie gestart.</p>${actions(button('Bekijk aanvraagoverzicht','service-intake-list',migration?'email':'domains',true))}`,'standard');ctx.toast('Demo-aanvraag bewaard in het overzicht.');return true;
  }
  return false;
 }
 function change(event){
  const el=event.target,form=el.closest?.('form');if(form?.id==='service-dns-form'&&el.name==='type'){const priority=form.querySelector('.sv-mx-priority');priority.hidden=el.value!=='MX';priority.querySelector('input').required=el.value==='MX';form.querySelector('#service-dns-hint').textContent=dnsHint(el.value);return true;}
  if(form?.id==='service-mail-form'&&el.name==='domain'){const hint=form.querySelector('#service-mail-capacity');if(hint)hint.textContent=mailCapacity(el.value);return true;}
  if(form?.id==='service-intake-form'&&el.name==='domain'&&form.elements.namedItem('requestType')?.value==='email-migration'){const count=form.elements.namedItem('mailboxCount');if(count)count.value=Math.max(1,data.mail.filter(m=>m.email.split('@')[1]===el.value).length);return true;}
  if(form?.id==='service-intake-form'&&el.name==='owner'){const hostSelect=form.elements.namedItem('host');if(hostSelect)hostSelect.innerHTML=Object.values(data.hosts).filter(p=>p.owner===el.value).map(p=>`<option value="${esc(p.id)}">${esc(p.id)} · Hosting ${esc(p.plan)}</option>`).join('');return true;}return false;
 }
 function input(event){
  const target=event.target;if(target.closest?.('.sv-flow'))target.removeAttribute('aria-invalid');
  if(target.dataset?.filter==='service-mail'){
   const page=target.closest('.sv-mail-page'),query=target.value.trim().toLowerCase();let visible=0;
   page?.querySelectorAll('.sv-mail-row').forEach(row=>{const matched=row.dataset.search.includes(query);row.hidden=!matched;if(matched)visible++;});
   const empty=page?.querySelector('.sv-search-empty');if(empty)empty.hidden=visible>0;return true;
  }
  return false;
 }
 function render(role,page){
  if(page!=='email')return null;read();const boxes=data.mail.filter(m=>role==='admin'||data.domains[m.email.split('@')[1]]?.owner==='Duindorp SV'),used=boxes.reduce((sum,m)=>sum+m.used,0),quota=boxes.reduce((sum,m)=>sum+m.quota,0),domains=new Set(boxes.map(m=>m.email.split('@')[1]));
  return `<div class="sv-mail-page"><header class="pg-heading"><div><div class="eyebrow">${role==='admin'?'DIENSTEN · BEHEER':'BLIJF VERBONDEN'}</div><h1>${role==='admin'?'E-mailbeheer.':'E-mail'}</h1><p>Mailboxen, aliassen en doorstuuradressen. Alles bij elkaar.</p></div><div class="pg-heading-actions">${button(`${icon('plus')} Mailbox toevoegen`,'mailbox','new',true)}</div></header><div class="sv-stats sv-stats-three panel">${stat('Mailboxen',String(boxes.length).padStart(2,'0'),role==='admin'?'Binnen het klantenportfolio':'Verdeeld over jouw hostingpakketten')}${stat('Opslag gebruikt',decimal(used)+' GB','Van '+quota+' GB toegewezen')}${stat('Domeinen',String(domains.size).padStart(2,'0'),'Met actieve of lokale demo-mailboxen')}</div><section class="panel sv-mail-panel"><div class="pg-section-head"><div><h2>Alle mailboxen <span class="pg-count">${boxes.length}</span></h2><p>Wijzigingen blijven in deze browser bewaard.</p></div><label class="pg-search">${icon('search')}<input data-filter="service-mail" type="search" aria-label="Mailboxen zoeken" placeholder="Zoek adres of organisatie…"></label></div><div class="sv-mail-list" data-table="service-mail">${boxes.map(m=>{const domain=m.email.split('@')[1],owner=data.domains[domain]?.owner;return `<article class="sv-mail-row" data-search="${esc([m.email,m.name,owner,...m.aliases].join(' ').toLowerCase())}"><span class="sv-service-icon">${icon('mail')}</span><div class="sv-mail-identity"><strong>${esc(m.email)}</strong><span>${esc(m.name)}${role==='admin'?' · '+esc(owner):''}</span><div class="sv-mail-tags">${m.aliases.length?m.aliases.map(a=>`<span>${esc(a)}</span>`).join(''):'<small>Geen aliassen</small>'}${m.forward.length?`<span>${m.forward.length} doorstuuradres${m.forward.length>1?'sen':''}</span>`:''}</div></div><div class="sv-mail-usage"><span>${decimal(m.used)} / ${m.quota} GB</span><div class="sv-usage"><span style="width:${Math.min(100,Math.round(m.used/m.quota*100))}%"></span></div></div><span class="pill${m.created?' blue':''}">${m.created?'Demo-mailbox':'Actief'}</span>${button('Beheren','mailbox',m.id)}</article>`;}).join('')}</div><div class="sv-empty sv-search-empty" hidden>Geen mailboxen gevonden. Probeer een andere zoekterm.</div><div class="pg-table-foot"><span>${boxes.length} mailboxen · mailinhoud is niet gekoppeld</span><span>${role==='admin'?'DG-beheer':'Duindorp SV'}</span></div></section><div class="pg-split"><aside class="pg-note">${icon('settings')}<div><strong>E-mail op ieder apparaat</strong><p>Bekijk de voorbeeldinstellingen voor je telefoon of mailprogramma.</p></div>${button('Instelhulp','mail-help')}</aside><aside class="pg-note">${icon('shield')}<div><strong>Je eigen post blijft privé</strong><p>In deze demo worden geen wachtwoorden, berichten of bijlagen opgehaald.</p></div>${role==='client'?'<button class="btn" data-go="webmail">Naar webmail</button>':''}</aside></div></div>`;
 }
 function decorate(root=document){
  read();const state=ctx.getState();
  if(['domains','email'].includes(state.page)){
   const main=root.querySelector('#main');if(main&&!main.querySelector('[data-service-requests]'))main.insertAdjacentHTML('beforeend',requestPanel(state.page));
  }
  if(state.page==='email'){
   const actions=root.querySelector('.sv-mail-page .pg-heading-actions');if(actions&&!actions.querySelector('[data-action="email-migration"]'))actions.insertAdjacentHTML('afterbegin',button('E-mail verhuizen','email-migration'));
  }
  if(state.page==='domains'){
   root.querySelectorAll('tr').forEach(row=>{const btn=row.querySelector('[data-action="domain"],[data-action="admin-task"]');if(!btn)return;const id=domainAliases[btn.dataset.id]||btn.dataset.id,d=data.domains[id];if(!d)return;const cells=row.querySelectorAll('td');if(state.role==='client'&&cells[2])cells[2].textContent=d.auto?'Automatisch':'Handmatig';if(state.role==='admin'&&cells[3])cells[3].textContent=d.auto?'Aan':'Uit';});
   const count=Object.values(data.domains).filter(d=>domainAllowed(d)&&d.auto).length;
   if(state.role==='client'){const stats=root.querySelectorAll('.pg-metric');if(stats[1]){const value=stats[1].querySelector('strong');if(value)value.textContent=String(count).padStart(2,'0');}}
   else root.querySelectorAll('.adm-stat').forEach(card=>{if(card.textContent.includes('Automatisch verlengen')){const val=card.querySelector('strong'),caption=card.querySelector('small');if(val)val.textContent=count;if(caption)caption.textContent=(Object.keys(data.domains).length-count)+' domeinen worden handmatig verlengd';}});
  }
  if(state.page==='hosting')root.querySelectorAll('.pg-host-card,.adm-host-card').forEach(card=>{
   const btn=card.querySelector('[data-action="hosting"],[data-action="admin-task"]'),id=hostAliases[btn?.dataset.id]||btn?.dataset.id,p=data.hosts[id];if(!p)return;
   const health=card.querySelector('.pg-check-row,.adm-host-health');if(health){const ssl=health.querySelector('span');if(ssl)ssl.innerHTML=icon('shield')+' SSL '+(p.ssl?'actief':'uit in demo');}
   const count=data.mail.filter(m=>data.domains[m.email.split('@')[1]]?.host===id).length;
   card.querySelectorAll('.pg-usage').forEach(usage=>{if(usage.textContent.includes('Mailboxen')){const value=usage.querySelector('strong'),bar=usage.querySelector('.pg-track span');if(value)value.textContent=`${count} / ${p.mailLimit} in gebruik`;if(bar)bar.style.width=Math.min(100,count/p.mailLimit*100)+'%';}});
  });
  if(state.role==='client'&&state.page==='overview'){
   const boxes=data.mail.filter(m=>data.domains[m.email.split('@')[1]]?.owner==='Duindorp SV'),count=boxes.length,used=boxes.reduce((sum,m)=>sum+m.used,0);
   const node=root.querySelector('.md-node-mail strong'),summary=root.querySelector('.md-summary [data-go="email"]');if(node)node.textContent=String(count).padStart(2,'0');
   if(summary){const value=summary.querySelector('strong'),detail=summary.querySelector('div>span');if(value)value.textContent=count;if(detail)detail.textContent=decimal(used)+' GB in gebruik';}
   root.querySelector('.md-network')?.setAttribute('aria-label',`Je verbonden omgeving met 3 domeinen, 2 hostingpakketten en ${count} mailboxen`);
   const renewal=root.querySelector('.md-auto-renew'),auto=data.domains['duindorpsv.nl'].auto;if(renewal)renewal.innerHTML=icon(auto?'check':'clock')+(auto?'Automatisch · aan':'Handmatig verlengen');
   const renewalNote=root.querySelector('.md-renewal-note');if(renewalNote)renewalNote.textContent=auto?'Je domeinnaam blijft van jou. Wij regelen de verlenging.':'Je verlengt dit domein handmatig. Houd de vervaldatum in de gaten.';
   const backupNote=root.querySelector('.md-websites-footer>span');if(backupNote&&Object.values(data.hosts).some(p=>p.owner==='Duindorp SV'&&!p.ssl))backupNote.textContent='Een SSL-instelling is uitgezet in de demo. Back-ups blijven beschikbaar.';
  }
  if(state.page==='webmail'){
   const selectBox=root.querySelector('#webmail-mailbox');if(selectBox){const selected=selectBox.value;selectBox.innerHTML=data.mail.filter(mailAllowed).map(m=>`<option value="${esc(m.email)}">${esc(m.email)}${m.created?' · demo':''}</option>`).join('');if([...selectBox.options].some(o=>o.value===selected))selectBox.value=selected;}
  }
 }
 return {action,submit,change,input,decorate,render};
}
