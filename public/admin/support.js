import {hasBackofficePermission} from './admin-paths.js';
import {businessStore} from './business-store.js';
import {createSupportApi} from './support-api.js';
/**
 * DG Midnight support. Parity preserves original fixtures; normal review uses
 * authorized normalized support APIs. No email transport or attachment uploads.
 * createSupport({getState,h,modal,closeModal,toast,render,go}) returns:
 * render(role,page,h), action(name,element), submit(form,FormData), input(event),
 * change(event), count(role), refresh(). Event methods return whether handled.
 * Call the event methods before legacy portal handlers. Load support.css last.
 */
const STORAGE_KEY = 'dg-midnight-support-v1';
const CLIENTS = ['Duindorp SV', 'Studio Noord', 'Bakkerij West'];
const SERVICES = {
  'Duindorp SV': ['Hosting Plus · duindorpsv.nl', 'Hosting Start · clubhuis.online', 'Domeinen', 'E-mail', 'Facturatie', 'Algemene vraag'],
  'Studio Noord': ['Hosting Zakelijk · studionoord.nl', 'Domeinen', 'E-mail', 'Facturatie', 'Algemene vraag'],
  'Bakkerij West': ['Hosting Start · bakkerijwest.nl', 'Domeinen', 'E-mail', 'Facturatie', 'Algemene vraag']
};
const STATUS = {new:'Nieuw', open:'In behandeling', waiting:'Wacht op klant', resolved:'Opgelost'};
const PRIORITY = {normal:'Normaal', high:'Hoog', urgent:'Urgent'};
const CATEGORIES = ['Technische vraag', 'Verhuizing', 'E-mail', 'Facturatie', 'Algemene vraag'];
const OWNERS = ['Nog niet toegewezen', 'DG Support', 'DG Techniek', 'DG Administratie'];
const TEMPLATES = {
  'template-email': {title:'E-mail instellen', icon:'mail', text:'Hallo,\n\nWe helpen je graag met het instellen van je e-mail. Open E-mail in je klantportaal en kies de instelhulp bij je mailbox. Gebruik IMAP zodat je berichten en mappen op je apparaten gelijk blijven.\n\nLukt het nog niet? Laat ons weten welk mailprogramma je gebruikt en welke foutmelding je ziet. Deel geen wachtwoord.\n\nMet vriendelijke groet,\nTeam DG Webservices'},
  'template-transfer': {title:'Domein of website verhuizen', icon:'globe', text:'Hallo,\n\nWe begeleiden je overstap graag. Kun je aangeven welke domeinnaam, website en mailboxen je wilt verhuizen en bij welke aanbieder ze nu staan?\n\nEen domeinverhuizing verplaatst niet automatisch je website en e-mail. We inventariseren eerst de bestaande diensten en stemmen het moment van overstappen met je af. Deel nog geen wachtwoorden of verhuiscodes in dit bericht.\n\nMet vriendelijke groet,\nTeam DG Webservices'},
  'template-payment': {title:'Vraag over een factuur', icon:'card', text:'Hallo,\n\nJe facturen en betaalstatus vind je onder Facturen in je klantportaal. Kun je aangeven om welk factuurnummer je vraag gaat? Dan kijken we met je mee.\n\nHeb je onlangs betaald? Vermeld dan de datum van betaling, zonder bankgegevens of betaalcodes mee te sturen.\n\nMet vriendelijke groet,\nTeam DG Webservices'}
};
const clone = value => JSON.parse(JSON.stringify(value));
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const msg = (id, author, body, at, visibility='public', type='message') => ({id, author, body, at, visibility, type, attachments:[]});
const SEED = [
  {id:'DG-284',client:'Duindorp SV',service:'Hosting Plus · duindorpsv.nl',category:'Verhuizing',priority:'normal',status:'open',assignee:'DG Support',createdAt:'2026-10-12T08:42:00Z',messages:[
    msg('m284a','Duindorp SV','We willen de clubwebsite naar de nieuwe hosting verplaatsen. Kunnen jullie ons hierbij helpen? De bestaande e-mail moet blijven werken.','2026-10-12T08:42:00Z'),
    msg('m284b','Team DG Webservices','Natuurlijk. Lever eerst een complete websiteback-up aan en laat weten welke mailboxen actief zijn. Daarna controleren we de afhankelijkheden en plannen we de overstap samen.','2026-10-13T08:18:00Z'),
    msg('m284c','DG Support','Website wacht op bronbestanden. DNS pas aanpassen na controle van website en mailboxen. Koppeling met bestelling DG-2026-0048.','2026-10-13T08:20:00Z','internal')
  ]},
  {id:'DG-271',client:'Duindorp SV',service:'E-mail',category:'E-mail',priority:'normal',status:'resolved',assignee:'DG Support',createdAt:'2026-10-09T07:25:00Z',messages:[
    msg('m271a','Duindorp SV','Hoe stel ik mijn mailbox in op mijn nieuwe telefoon?','2026-10-09T07:25:00Z'),
    msg('m271b','Team DG Webservices','Gebruik IMAP. De gegevens voor je eigen mailbox staan bij E-mail → Instelhulp. Daarmee blijven je berichten op al je apparaten beschikbaar.','2026-10-09T08:12:00Z'),
    msg('m271c','Duindorp SV','Het is gelukt, bedankt voor de hulp!','2026-10-09T09:02:00Z'),
    msg('m271d','DG Webservices','Dit verzoek is gemarkeerd als opgelost.','2026-10-09T09:10:00Z','public','system')
  ]},
  {id:'DG-1041',client:'Studio Noord',service:'Hosting Zakelijk · studionoord.nl',category:'Technische vraag',priority:'high',status:'open',assignee:'DG Techniek',createdAt:'2026-10-13T07:40:00Z',messages:[
    msg('m1041a','Studio Noord','Mijn nieuwe hostingpakket staat nog op Wordt ingesteld. Kunnen jullie controleren wanneer het beschikbaar is?','2026-10-13T07:40:00Z'),
    msg('m1041b','Team DG Webservices','Je betaling is ontvangen. We controleren de oplevering van het hostingpakket en houden je via dit verzoek op de hoogte.','2026-10-13T07:51:00Z'),
    msg('m1041c','DG Techniek','Bestaande provideractie eerst controleren voordat een nieuwe poging wordt gestart.','2026-10-13T07:55:00Z','internal')
  ]},
  {id:'DG-1039',client:'Bakkerij West',service:'Hosting Start · bakkerijwest.nl',category:'Technische vraag',priority:'normal',status:'resolved',assignee:'DG Techniek',createdAt:'2026-10-12T12:20:00Z',messages:[
    msg('m1039a','Bakkerij West','Kunnen jullie het SSL-certificaat van onze website nakijken?','2026-10-12T12:20:00Z'),
    msg('m1039b','Team DG Webservices','Het certificaat is gecontroleerd. De website is via HTTPS bereikbaar en de automatische vernieuwing staat aan.','2026-10-12T13:34:00Z'),
    msg('m1039c','DG Webservices','Dit verzoek is gemarkeerd als opgelost.','2026-10-12T13:35:00Z','public','system')
  ]}
];

export function createSupport(ctx) {
  const remote=ctx.fixtureParity ? null : createSupportApi();
  const real=ctx.session?.mode==='supabase'||globalThis.DG_RUNTIME?.mode==='supabase';
  const can=permission=>!real||hasBackofficePermission(ctx.session?.actor,permission);
  const staff=()=>!real||['admin','support'].includes(ctx.session?.actor?.role);
  const canInternal=()=>staff()&&can('support.ticket.internal_note');
  const canManage=()=>staff()&&can('support.ticket.manage');
  const deny=()=>ctx.toast('Je hebt voor deze handeling geen toegewezen supportrechten.');
  let h = ctx.h || {}, db = remote ? remote.state : load(), activeTicket = null, composerMode = 'public', templateKey = null, busy=false;
  const catalog=()=>remote?.state.catalog||[];
  const organization=id=>catalog().find(item=>item.id===id);
  const createOrganization=draft=>organization(draft.organizationId||draft.client)||catalog().find(item=>item.id===ctx.session?.actor.organizationId)||(role()==='admin'?catalog()[0]:null);
  let storageWarning = false;
  const filters = {client:{query:'',status:'all',category:'all',sort:'latest'},admin:{query:'',status:'all',category:'all',sort:'latest'}};
  const e = escapeHTML;
  const icon = name => h.icon ? h.icon(name) : '';
  const role = () => ctx.getState().role === 'admin' ? 'admin' : 'client';
  const now = () => new Date().toISOString();
  const uid = () => globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const visible = (ticket, asRole=role()) => asRole === 'admin' || (remote ? ticket.organizationId===ctx.session?.actor.organizationId : ticket.client === 'Duindorp SV');
  const accessible = id => db.tickets.find(t => t.id === normalizeId(id) && visible(t));
  const normalizeId = id => remote ? id : ({'ticket-hosting':'DG-1041','ticket-ssl':'DG-1039'}[id] || id || 'DG-284');
  const ticketsFor = asRole => db.tickets.filter(t => visible(t,asRole));
  const messagesFor = (t,asRole=role()) => t.messages.filter(m => asRole === 'admin' && canInternal() || m.visibility !== 'internal');
  const lastMessage = (t,asRole=role()) => messagesFor(t,asRole).at(-1);
  const lastAt = (t,asRole=role()) => lastMessage(t,asRole)?.at || t.createdAt;
  const statusBadge = status => `<span class="sp-badge sp-badge--${e(status)}"><i></i>${e(STATUS[status] || STATUS.open)}</span>`;
  const priorityBadge = priority => `<span class="sp-priority sp-priority--${e(priority)}">${priority==='normal'?'':icon('clock')}${e(PRIORITY[priority] || PRIORITY.normal)}</span>`;
  const option = (value,label,selected) => `<option value="${e(value)}" ${value===selected?'selected':''}>${e(label)}</option>`;
  const formatDate = value => {const d=new Date(value);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Amsterdam'}).format(d);};
  const demoNote = `<div class="sp-demo-note">${icon('shield')}<span>${remote?'Lokale review · support en concepten worden op de server bewaard. Reacties zijn portaalberichten; geen e-mail of bijlagen worden verzonden.':'Demo · wijzigingen blijven op dit apparaat. Er worden geen berichten verstuurd.'}</span></div>`;

  function load() {
    try {
      const saved=JSON.parse(businessStore.getItem(STORAGE_KEY) || 'null');
      if(saved?.version===1 && Array.isArray(saved.tickets) && saved.tickets.every(t=>t && typeof t.id==='string' && CLIENTS.includes(t.client) && Array.isArray(t.messages))) {
        return {version:1,tickets:saved.tickets,drafts:saved.drafts && typeof saved.drafts==='object'?saved.drafts:{},nextId:Number.isFinite(saved.nextId)?saved.nextId:1043};
      }
    } catch {}
    return {version:1,tickets:clone(SEED),drafts:{},nextId:1043};
  }
  function persist(quiet=false) {
    try {businessStore.setItem(STORAGE_KEY,JSON.stringify(db));return true;}
    catch {if(!storageWarning){ctx.toast('Opslaan op dit apparaat lukt niet. Je wijzigingen blijven beschikbaar zolang deze pagina open is.');storageWarning=true;}return false;}
  }
  function draftKey(type='create',mode=composerMode) {return remote ? type==='create'?'create':`${type}:${mode}` : `${role()}:${type}:${type==='create'?'form':mode}`;}
  function getDraft(key) {return db.drafts[key] || {};}
  function setDraft(key,value) {if(real&&(!can('support.draft.write')||key.endsWith(':internal')&&!canInternal()))return;if(remote){remote.setDraft(key,value);return;}db.drafts[key]={...getDraft(key),...value};persist(true);}
  function formValue(data,key) {return String(typeof data?.get==='function'?data.get(key)??'':data?.[key]??'');}
  function markEvent(t,text,visibility='public') {t.messages.push(msg(uid(),role()==='admin'?'DG Webservices':t.client,text,now(),visibility,'system'));}
  function redraw(openId) {persist();ctx.render();if(openId)openTicket(openId);}
  function findForm(el) {return el?.closest?.('form') || null;}
  function preserveDraft(form) {
    if(!form?.dataset?.supportDraft||!can('support.draft.write'))return;
    if(real&&(form.id==='support-create-form'&&!can('support.ticket.create')||form.id==='support-reply-form'&&!(composerMode==='internal'?canInternal():can('support.ticket.reply'))))return;
    const values={};
    for(const el of form.elements || [])if(el.name && el.type!=='file' && !['submit','button'].includes(el.type))values[el.name]=el.value;
    setDraft(form.dataset.supportDraft,values);
  }

  function filteredTickets(asRole) {
    const f=filters[asRole], query=f.query.trim().toLocaleLowerCase('nl');
    return ticketsFor(asRole).filter(t=>(f.status==='all' || (f.status==='active'?t.status!=='resolved':t.status===f.status)) && (f.category==='all'||t.category===f.category) && (!query || [t.id,subject(t),t.client,t.service,t.category,...messagesFor(t,asRole).filter(m=>m.type==='message').map(m=>m.body)].join(' ').toLocaleLowerCase('nl').includes(query))).sort((a,b)=>f.sort==='oldest'?lastAt(a,asRole).localeCompare(lastAt(b,asRole)):f.sort==='priority'?(['urgent','high','normal'].indexOf(a.priority)-['urgent','high','normal'].indexOf(b.priority))||lastAt(b,asRole).localeCompare(lastAt(a,asRole)):lastAt(b,asRole).localeCompare(lastAt(a,asRole)));
  }
  function subject(t) {return t.subject || {'DG-284':'Hulp bij verhuizing clubwebsite','DG-271':'E-mail instellen op een nieuwe telefoon','DG-1041':'Extra hostingpakket activeren','DG-1039':'SSL-certificaat gecontroleerd'}[t.id] || 'Supportverzoek';}
  function listMarkup(asRole) {
    const items=filteredTickets(asRole);
    if(!items.length)return `<div class="sp-empty">${icon('search')}<h3>Geen verzoeken gevonden</h3><p>Probeer een andere zoekterm of wis de filters.</p><button class="btn" data-action="support-reset">Filters wissen</button></div>`;
    return items.map(t=>{const last=lastMessage(t,asRole);return `<button class="sp-ticket-row" data-action="ticket-view" data-id="${e(t.id)}"><span class="sp-ticket-avatar">${asRole==='admin'?e(t.client.split(' ').map(w=>w[0]).slice(0,2).join('')):icon(t.service==='E-mail'?'mail':t.service.includes('Hosting')?'server':'support')}</span><span class="sp-ticket-main"><span class="sp-ticket-eyebrow">${e(t.id)}<span>·</span>${e(asRole==='admin'?t.client:t.service)}</span><strong>${e(subject(t))}</strong><span class="sp-ticket-preview">${last?.visibility==='internal'?'Interne notitie · ':''}${e(last?.body||'Nieuw verzoek')}</span><span class="sp-ticket-mobile-meta">${e(formatDate(lastAt(t,asRole)))}</span></span><span class="sp-ticket-meta">${statusBadge(t.status)}${priorityBadge(t.priority)}<time datetime="${e(lastAt(t,asRole))}">${e(formatDate(lastAt(t,asRole)))}</time></span><span class="sp-ticket-chevron">${icon('chevron')}</span></button>`;}).join('');
  }
  function updateList() {
    const list=document.getElementById('support-ticket-list');
    if(list)list.innerHTML=listMarkup(role());
    const count=document.getElementById('support-result-count');
    if(count){const n=filteredTickets(role()).length;count.textContent=`${n} ${n===1?'verzoek':'verzoeken'}`;}
    document.querySelectorAll('[data-action="support-filter"]').forEach(button=>{const selected=button.dataset.id===filters[role()].status;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});
  }
  function render(asRole='client',page='support',helpers) {
    if(page && typeof page==='object'){helpers=page;page='support';}
    if(page!=='support')return null;
    if(helpers)h=helpers;
    if(remote&&!remote.state.loaded)return `<div class="sp-root"><div class="sp-page-head"><div><span class="eyebrow">SUPPORT</span><h1>Supportgegevens niet beschikbaar.</h1><p>Er zijn nog geen bevestigde gegevens geladen.</p></div></div><section class="panel sp-inbox"><div class="notice" role="alert">${e(remote.error?.message||'De servercontrole is niet afgerond.')} <button class="btn" data-action="support-load">Opnieuw laden</button></div></section></div>`;
    asRole=asRole==='admin'?'admin':'client';
    const ts=ticketsFor(asRole), f=filters[asRole], counts=remote&&((asRole==='admin'&&['admin','support','operations','finance'].includes(ctx.session?.actor.role))||(asRole==='client'&&ctx.session?.actor.role==='client'))?remote.state.counters:null, active=counts?.active??ts.filter(t=>t.status!=='resolved').length,waiting=counts?.waiting??ts.filter(t=>t.status==='waiting').length,resolved=counts?.resolved??ts.filter(t=>t.status==='resolved').length;
    return `<div class="sp-root"><div class="sp-page-head"><div><span class="eyebrow">${asRole==='admin'?'Klantcontact':'Persoonlijk dichtbij'}</span><h1>${asRole==='admin'?'Support, in één overzicht.':'We denken met je mee.'}</h1><p>${asRole==='admin'?'Een duidelijk antwoord, de juiste eigenaar en alle context bij elkaar.':'Je vragen, antwoorden en de volgende stap. Allemaal op één plek.'}</p></div>${can('support.ticket.create')?`<button class="btn primary" data-action="new-ticket">${icon('plus')} Nieuw supportverzoek</button>`:''}</div><div class="sp-stats"><div class="panel sp-stat"><span>${icon('support')} Actieve verzoeken</span><strong>${active.toString().padStart(2,'0')}</strong><small>${asRole==='admin'?'In de werkvoorraad van DG':'We werken met je mee'}</small></div><div class="panel sp-stat"><span>${icon('clock')} ${asRole==='admin'?'Wacht op klant':'Jouw reactie gevraagd'}</span><strong>${waiting.toString().padStart(2,'0')}</strong><small>${waiting?'Een antwoord helpt ons verder':'Alles is bijgewerkt'}</small></div><div class="panel sp-stat"><span>${icon('check')} Opgelost</span><strong>${resolved.toString().padStart(2,'0')}</strong><small>Altijd terug te lezen</small></div></div><div class="sp-content-grid"><section class="panel sp-inbox"><div class="sp-section-head"><div><h2>${asRole==='admin'?'Alle supportverzoeken':'Jouw supportverzoeken'}</h2><p>Gesorteerd op laatste activiteit.</p></div><span id="support-result-count" class="sp-result-count" aria-live="polite">${filteredTickets(asRole).length} verzoeken</span></div><div class="sp-toolbar"><label class="sp-search">${icon('search')}<span class="sr-only">Zoek supportverzoeken</span><input id="support-search" type="search" value="${e(f.query)}" placeholder="Zoek op onderwerp, bericht of nummer…" autocomplete="off"></label><label class="sp-sort"><span class="sr-only">Sorteer verzoeken</span><select id="support-sort">${option('latest','Nieuwste activiteit',f.sort)}${option('oldest','Oudste activiteit',f.sort)}${option('priority','Hoogste prioriteit',f.sort)}</select></label></div><div class="sp-filter-row"><div class="sp-tabs" aria-label="Filter op status">${[['all','Alles'],['active','Actief'],['waiting',asRole==='admin'?'Wacht op klant':'Jouw reactie'],['resolved','Opgelost']].map(([key,title])=>`<button data-action="support-filter" data-id="${key}" class="${f.status===key?'active':''}" aria-pressed="${f.status===key}">${title}</button>`).join('')}</div><label class="sp-category"><span class="sr-only">Categorie</span><select id="support-category">${option('all','Alle categorieën',f.category)}${CATEGORIES.map(c=>option(c,c,f.category)).join('')}</select></label></div><div id="support-ticket-list" class="sp-ticket-list">${listMarkup(asRole)}</div></section><aside class="sp-aside"><section class="panel sp-help"><span class="sp-help-icon">${icon('support')}</span><h2>${asRole==='admin'?'Goed geholpen.':'Direct verder.'}</h2><p>${asRole==='admin'?'Gebruik een antwoordtemplate als vertrekpunt. Pas je concept aan vóór je het plaatst.':'Praktische uitleg voor de vragen die vaker langskomen.'}</p>${asRole==='admin'?Object.entries(TEMPLATES).map(([key,t])=>`<button class="sp-help-link" data-action="admin-task" data-id="${key}">${icon(t.icon)}<span><strong>${e(t.title)}</strong><small>Bekijk antwoordtemplate</small></span>${icon('chevron')}</button>`).join(''):[['mail','E-mail instellen','Outlook, Apple Mail en mobiel','mail-help'],['globe','Domein verhuizen','Een zorgvuldige overstap','domain-help'],['file','Facturen en betalingen','Je administratie op orde','billing-help'],['server','Website overzetten','Samen naar je nieuwe hosting','hosting-help']].map(([i,title,sub,action])=>`<button class="sp-help-link" data-action="${action}">${icon(i)}<span><strong>${title}</strong><small>${sub}</small></span>${icon('chevron')}</button>`).join('')}</section><section class="sp-service-note">${icon('shield')}<div><strong>Persoonlijke aandacht.</strong><p>${asRole==='admin'?'Klantberichten en interne notities blijven duidelijk gescheiden.':'Deel je vraag met ons. In je verzoek zie je wie je helpt en wat de volgende stap is.'}</p></div></section></aside></div>${remote?.state.hasMore?'<div class="notice" role="status">De verzoeklijst is gedeeltelijk (maximaal 200 geladen). Zoeken en filters gelden voor de geladen verzoeken; de samenvatting toont alle toegestane verzoeken.</div>':''}${demoNote}</div>`;
  }

  function attachmentsMarkup(files=[], removable=false, key='') {
    return files.map((file,index)=>`<div class="sp-attachment">${icon('file')}<span><strong>${e(file.name)}</strong><small>${e(file.size>=1048576?`${(file.size/1048576).toFixed(1)} MB`:`${Math.max(1,Math.ceil(file.size/1024))} KB`)} · lokaal geselecteerd, niet geüpload</small></span>${removable?`<button type="button" class="icon-btn" data-action="support-remove-file" data-key="${e(key)}" data-id="${index}" aria-label="Verwijder ${e(file.name)}">${icon('close')}</button>`:''}</div>`).join('');
  }
  function attachmentField(key,files=[]) {
    if(remote)return `<div class="sp-upload-area"><label class="sp-upload-label">${icon('plus')}<span>Bijlagen nog niet beschikbaar<input type="file" disabled aria-label="Bijlagen niet beschikbaar"></span></label><small>Veilige upload, opslag en geautoriseerde downloads zijn nog niet aangesloten. Er worden geen bestanden geselecteerd of verstuurd.</small></div>`;
    return `<div class="sp-upload-area"><label class="sp-upload-label">${icon('plus')}<span>Bijlage selecteren<input type="file" data-support-files="${e(key)}" accept="image/*,.pdf,.txt,.log,.zip" multiple></span></label><small>Max. 5 bestanden · 10 MB per bestand. Alleen bestandsnamen worden in deze demo bewaard.</small><div class="sp-files" data-support-file-list="${e(key)}">${attachmentsMarkup(files,true,key)}</div></div>`;
  }
  function openCreate() {
    if(!can('support.ticket.create')){deny();return;}
    activeTicket=null;composerMode='public';
    const key=draftKey(), draft=getDraft(key), org=remote?createOrganization(draft):null, client=remote?(org?.name||''):role()==='admin' && CLIENTS.includes(draft.client)?draft.client:'Duindorp SV', serviceOptions=remote?(org?.services||[]):SERVICES[client], service=serviceOptions.includes(draft.service)?draft.service:serviceOptions[0];
    if(remote&&!org){showError(new Error('Er is geen geautoriseerde klantorganisatie beschikbaar. Vernieuw de supportgegevens.'));return;}
    ctx.modal('Nieuw supportverzoek',`<div class="sp-modal-intro"><span class="sp-help-icon">${icon('support')}</span><div><h3>Vertel ons waar je tegenaan loopt.</h3><p>Met de juiste details kunnen we je sneller helpen.</p></div></div><form id="support-create-form" data-support-draft="${e(key)}"><div class="fields">${role()==='admin'?`<label class="field full">Klant<select name="client" id="support-create-client">${remote?catalog().map(c=>option(c.id,c.name,org.id)).join(''):CLIENTS.map(c=>option(c,c,client)).join('')}</select></label>`:''}<label class="field">Dienst<select name="service" id="support-create-service">${serviceOptions.map(s=>option(s,s,service)).join('')}</select></label><label class="field">Categorie<select name="category">${CATEGORIES.map(c=>option(c,c,draft.category||CATEGORIES[0])).join('')}</select></label><label class="field full">Onderwerp<input name="subject" required maxlength="160" value="${e(draft.subject||'')}" placeholder="Bijvoorbeeld: hulp bij verhuizing van mijn website"></label><label class="field full">Je bericht<textarea name="body" required maxlength="8000" placeholder="Wat wil je regelen? Wat heb je al geprobeerd?">${e(draft.body||'')}</textarea></label><label class="field">Prioriteit<select name="priority">${Object.entries(PRIORITY).map(([k,v])=>option(k,v,draft.priority||'normal')).join('')}</select></label><div class="sp-priority-help">Kies urgent als een dienst niet beschikbaar is. De prioriteit wordt door DG beoordeeld.</div></div>${attachmentField(key,draft.attachments)}<div class="sp-draft-state">${icon('file')}<span>${remote?'Je concept wordt op de server bewaard na bevestiging.':'Je concept wordt op dit apparaat bewaard.'}</span></div>${demoNote}<div class="modal-actions"><button type="button" class="btn" data-action="close">Concept bewaren & sluiten</button><button type="submit" class="btn primary">${icon('plus')} Verzoek aanmaken</button></div></form>`,{size:'wide'});
  }
  function messageMarkup(m,t) {
    if(m.type==='system')return `<li class="sp-event ${m.visibility==='internal'?'sp-event--internal':''}">${icon(m.visibility==='internal'?'shield':'check')}<span>${e(m.body)}</span><time datetime="${e(m.at)}">${e(formatDate(m.at))}</time></li>`;
    const internal=m.visibility==='internal', customer=m.author===t.client;
    return `<li class="sp-message ${internal?'sp-message--internal':customer?'sp-message--customer':'sp-message--team'}"><div class="sp-message-head"><span class="sp-message-avatar">${internal?icon('shield'):customer?e(t.client.split(' ').map(s=>s[0]).slice(0,2).join('')):'DG'}</span><span><strong>${e(m.author)}</strong><small>${internal?'Interne notitie · alleen DG-beheer':customer?'Klant':'DG Webservices'}</small></span><time datetime="${e(m.at)}">${e(formatDate(m.at))}</time></div><div class="sp-message-body">${e(m.body).replace(/\n/g,'<br>')}</div>${m.attachments?.length?`<div class="sp-message-files">${attachmentsMarkup(m.attachments)}</div>`:''}</li>`;
  }
  function openTicket(id) {
    const t=accessible(id);
    if(!t){ctx.toast('Dit supportverzoek is niet beschikbaar in deze omgeving.');return;}
    activeTicket=t.id;if(role()!=='admin'||!canInternal())composerMode='public';if(!can('support.ticket.reply')&&canInternal())composerMode='internal';
    const key=draftKey(t.id),draft=getDraft(key),admin=role()==='admin',internal=admin&&canInternal()&&composerMode==='internal',canCompose=can('support.ticket.reply')||admin&&canInternal(),resolved=t.status==='resolved';
    ctx.modal(`${t.id} · Supportverzoek`,`<div class="sp-detail"><div class="sp-detail-title"><div><h3>${e(subject(t))}</h3><p>${e(t.client)} <span>·</span> ${e(t.service)}</p></div>${statusBadge(t.status)}</div><div class="sp-detail-layout"><div class="sp-conversation"><div class="sp-timeline-heading"><h4>Gesprek</h4><span>${messagesFor(t).filter(m=>m.type!=='system').length} berichten</span></div><ol class="sp-timeline">${messagesFor(t).map(m=>messageMarkup(m,t)).join('')}</ol>${resolved?`<div class="sp-resolved"><span>${icon('check')}</span><div><strong>Dit verzoek is opgelost.</strong><p>Heb je nog een vraag over hetzelfde onderwerp? Open het verzoek opnieuw.</p></div>${can('support.ticket.status')?`<button class="btn" data-action="support-reopen" data-id="${e(t.id)}">Heropenen</button>`:''}</div>`:!canCompose?'<div class="notice" data-support-read-only>Alleen lezen. Je hebt geen recht om een reactie of interne notitie te plaatsen.</div>':`<form id="support-reply-form" data-ticket-id="${e(t.id)}" data-support-draft="${e(key)}"><div class="sp-compose-tabs">${admin?`${can('support.ticket.reply')?`<button type="button" data-action="support-compose" data-id="public" class="${!internal?'active':''}" aria-pressed="${!internal}">${icon('mail')} Antwoord aan klant</button>`:''}${canInternal()?`<button type="button" data-action="support-compose" data-id="internal" class="${internal?'active':''}" aria-pressed="${internal}">${icon('shield')} Interne notitie</button>`:''}`:`<strong>Jouw reactie</strong>`}</div><div class="sp-composer ${internal?'sp-composer--internal':''}">${internal?'<div class="sp-compose-hint">Alleen zichtbaar voor DG-beheer. Deze notitie verschijnt niet in het klantgesprek.</div>':''}<label class="field"><span class="sr-only">${internal?'Interne notitie':'Je reactie'}</span><textarea name="body" required maxlength="8000" placeholder="${internal?'Voeg context toe voor je collega’s…':'Schrijf je reactie…'}">${e(draft.body||'')}</textarea></label>${admin&&!internal?`<label class="sp-template-select">${icon('file')}<span class="sr-only">Antwoordtemplate invoegen</span><select id="support-reply-template"><option value="">Antwoordtemplate invoegen</option>${Object.entries(TEMPLATES).map(([k,v])=>option(k,v.title,'')).join('')}</select></label>`:''}${attachmentField(key,draft.attachments)}<div class="sp-compose-footer"><small${remote?' data-support-draft-status':''}>${remote?'Concept wordt op de server bewaard na bevestiging':'Concept wordt lokaal bewaard'}</small><button type="submit" class="btn primary">${internal?icon('plus'):icon('arrow')}${internal?'Notitie toevoegen':'Reactie plaatsen'}</button></div></div></form>`}</div><aside class="sp-ticket-sidebar"><div class="sp-ticket-facts"><h4>Verzoekdetails</h4><dl><div><dt>Klant</dt><dd>${e(t.client)}</dd></div><div><dt>Dienst</dt><dd>${e(t.service)}</dd></div><div><dt>Categorie</dt><dd>${e(t.category)}</dd></div><div><dt>Aangemaakt</dt><dd>${e(formatDate(t.createdAt))}</dd></div><div><dt>Prioriteit</dt><dd>${priorityBadge(t.priority)}</dd></div><div><dt>Behandelaar</dt><dd>${admin?e(t.assignee):'Team DG Webservices'}</dd></div></dl></div>${admin&&(canManage()||can('support.ticket.status'))?`<form id="support-details-form" data-ticket-id="${e(t.id)}" class="sp-details-form"><h4>Beheer</h4>${canManage()&&canInternal()?`<label class="field">Toewijzen aan<select name="assignee">${OWNERS.map(o=>option(o,o,t.assignee)).join('')}</select></label>`:''}${canManage()?`<label class="field">Prioriteit<select name="priority">${Object.entries(PRIORITY).map(([k,v])=>option(k,v,t.priority)).join('')}</select></label>`:''}${!resolved&&can('support.ticket.status')?`<label class="field">Status<select name="status">${Object.entries(STATUS).filter(([k])=>k!=='resolved').map(([k,v])=>option(k,v,t.status)).join('')}</select></label>`:''}<button class="btn" type="submit">Wijzigingen bewaren</button></form>`:''}${!resolved&&can('support.ticket.status')?`<button class="btn sp-resolve-button" data-action="support-resolve" data-id="${e(t.id)}">${icon('check')} Markeren als opgelost</button>`:''}<div class="sp-side-note">${icon('shield')}<p>${admin?'Een interne notitie helpt je collega’s. Gebruik een antwoord voor informatie die de klant moet ontvangen.':'Deel geen wachtwoorden, herstelcodes of betaalgegevens in je bericht.'}</p></div></aside></div>${demoNote}</div>`,{size:'wide'});
  }
  function confirmStatus(id,status) {
    const t=accessible(id);if(!t)return;
    preserveDraft(document.getElementById('support-reply-form'));
    ctx.modal(status==='resolved'?'Verzoek afronden':'Verzoek heropenen',`<div class="sp-confirm"><span class="sp-help-icon">${icon(status==='resolved'?'check':'refresh')}</span><h3>${e(subject(t))}</h3><p>${status==='resolved'?'Is je vraag volledig beantwoord? Het gesprek blijft beschikbaar en kan later opnieuw worden geopend.':'We zetten dit verzoek weer in behandeling. Daarna kun je aanvullende informatie aan het gesprek toevoegen.'}</p><div class="sp-confirm-reference">${e(t.id)} · ${e(t.client)}</div></div><div class="modal-actions"><button class="btn" data-action="ticket-view" data-id="${e(t.id)}">Terug naar gesprek</button><button class="btn primary" data-action="support-confirm-status" data-id="${e(t.id)}" data-status="${e(status)}">${status==='resolved'?'Ja, markeren als opgelost':'Verzoek heropenen'}</button></div>`,{size:'small'});
  }
  function openTemplate(key) {
    if(role()!=='admin' || !TEMPLATES[key])return;
    templateKey=key;const template=TEMPLATES[key], ts=ticketsFor('admin').filter(t=>t.status!=='resolved');
    ctx.modal(`Antwoordtemplate · ${template.title}`,`<div class="sp-template-preview">${e(template.text).replace(/\n/g,'<br>')}</div><form id="support-template-form"><label class="field">Invoegen in supportverzoek<select name="ticket" required>${ts.length?ts.map(t=>option(t.id,`${t.id} · ${t.client} · ${subject(t)}`,activeTicket)).join(''):'<option value="">Geen actieve supportverzoeken</option>'}</select></label><p class="sp-template-note">Dit voegt tekst toe aan je concept. Controleer en personaliseer de tekst voordat je een reactie plaatst.</p><div class="modal-actions"><button type="button" class="btn" data-action="close">Sluiten</button><button type="submit" class="btn primary" ${ts.length&&can('support.ticket.reply')?'':'disabled'}>Als concept invoegen</button></div></form>`,{size:'standard'});
  }
  function insertTemplate(key,id=activeTicket) {if(!can('support.ticket.reply')){deny();return;}
    if(role()!=='admin' || !TEMPLATES[key])return;
    const t=accessible(id);if(!t || t.status==='resolved')return;
    preserveDraft(document.getElementById('support-reply-form'));composerMode='public';
    const keyDraft=draftKey(t.id,'public'),draft=getDraft(keyDraft);
    setDraft(keyDraft,{body:[draft.body,TEMPLATES[key].text].filter(Boolean).join('\n\n')});openTicket(t.id);
    ctx.toast('Template toegevoegd aan je concept. Controleer de tekst vóór het plaatsen.');
  }
  function action(name,el) {
    if(remote)return remoteAction(name,el);
    const id=el?.dataset?.id || '';
    if(name==='ticket' || name==='new-ticket' || (name==='admin-task' && id==='new-ticket')){openCreate();return true;}
    if(name==='ticket-view'){openTicket(id);return true;}
    if((name==='admin-task' && id.startsWith('template-')) || name.startsWith('template-')){openTemplate(name.startsWith('template-')?name:id);return true;}
    if(!name.startsWith('support-'))return false;
    if(name==='support-filter'){if(['all','active','waiting','resolved'].includes(id)){filters[role()].status=id;updateList();}return true;}
    if(name==='support-reset'){filters[role()]={query:'',status:'all',category:'all',sort:'latest'};ctx.render();return true;}
    if(name==='support-compose'){if(role()!=='admin'||!['public','internal'].includes(id))return true;preserveDraft(document.getElementById('support-reply-form'));composerMode=id;openTicket(activeTicket);return true;}
    if((name==='support-resolve'||name==='support-reopen'||name==='support-confirm-status')&&!can('support.ticket.status')){deny();return true;}
    if(name==='support-resolve'||name==='support-reopen'){confirmStatus(id,name==='support-resolve'?'resolved':'open');return true;}
    if(name==='support-confirm-status'){const t=accessible(id),status=el.dataset.status;if(t && ['resolved','open'].includes(status) && status!==t.status){t.status=status;markEvent(t,status==='resolved'?'Dit verzoek is gemarkeerd als opgelost.':'Dit verzoek is opnieuw geopend.');redraw(t.id);ctx.toast(status==='resolved'?'Verzoek gemarkeerd als opgelost.':'Verzoek opnieuw geopend.');}return true;}
    if(name==='support-remove-file'){const key=el.dataset.key;if(!key?.startsWith(`${role()}:`))return true;const draft=getDraft(key),files=[...(draft.attachments||[])];files.splice(Number(id),1);setDraft(key,{attachments:files});document.querySelectorAll('[data-support-file-list]').forEach(list=>{if(list.dataset.supportFileList===key)list.innerHTML=attachmentsMarkup(files,true,key);});return true;}
    return false;
  }
  function submit(form,data) {
    if(remote)return remoteSubmit(form,data);
    if(!form.id.startsWith('support-'))return false;
    if(real&&(form.id==='support-create-form'&&!can('support.ticket.create')||form.id==='support-reply-form'&&!(composerMode==='internal'?canInternal():can('support.ticket.reply'))||form.id==='support-details-form'&&!canManage()&&!can('support.ticket.status')||form.id==='support-template-form'&&!can('support.ticket.reply'))){deny();return true;}
    if(form.reportValidity && !form.reportValidity())return true;
    if(form.id==='support-create-form'){
      const client=role()==='admin'?formValue(data,'client'):'Duindorp SV',service=formValue(data,'service'),subjectText=formValue(data,'subject').trim(),body=formValue(data,'body').trim(),category=formValue(data,'category'),priority=formValue(data,'priority');
      if(!CLIENTS.includes(client)||!SERVICES[client].includes(service)||!CATEGORIES.includes(category)||!Object.hasOwn(PRIORITY,priority)||!subjectText||subjectText.length>160||!body||body.length>8000){ctx.toast('Controleer de klant, dienst, onderwerp en het bericht.');return true;}
      const id=`DG-${db.nextId++}`,key=draftKey(),attachments=getDraft(key).attachments||[],at=now();
      const ticket={id,client,service,subject:subjectText,category,priority,status:'new',assignee:'Nog niet toegewezen',createdAt:at,messages:[{...msg(uid(),role()==='admin'?'Team DG Webservices':client,body,at),attachments:clone(attachments)}]};
      db.tickets.unshift(ticket);delete db.drafts[key];persist();ctx.closeModal();ctx.render();openTicket(id);ctx.toast(`Verzoek ${id} is aangemaakt in deze demo.`);return true;
    }
    if(form.id==='support-reply-form'){
      const t=accessible(form.dataset.ticketId),body=formValue(data,'body').trim(),internal=role()==='admin' && composerMode==='internal';
      if(!t||t.status==='resolved'){ctx.toast('Heropen het verzoek om een reactie toe te voegen.');return true;}
      if(!body||body.length>8000){ctx.toast('Schrijf een reactie van maximaal 8.000 tekens.');return true;}
      const key=draftKey(t.id),draft=getDraft(key);
      t.messages.push({...msg(uid(),role()==='admin'?(internal?t.assignee==='Nog niet toegewezen'?'DG Support':t.assignee:'Team DG Webservices'):t.client,body,now(),internal?'internal':'public'),attachments:clone(draft.attachments||[])});
      if(!internal){const previous=t.status;t.status=role()==='client'?'open':'waiting';if(previous!==t.status)markEvent(t,`Status gewijzigd naar ${STATUS[t.status].toLocaleLowerCase('nl')}.`);}
      delete db.drafts[key];redraw(t.id);ctx.toast(internal?'Interne notitie toegevoegd.':'Je reactie is toegevoegd aan het demogesprek.');return true;
    }
    if(form.id==='support-details-form'){
      if(role()!=='admin')return true;const t=accessible(form.dataset.ticketId);if(!t)return true;
      const assignee=formValue(data,'assignee'),priority=formValue(data,'priority'),status=t.status==='resolved'?'resolved':formValue(data,'status');
      if(!OWNERS.includes(assignee)||!Object.hasOwn(PRIORITY,priority)||!Object.hasOwn(STATUS,status)||status==='resolved'&&t.status!=='resolved'){ctx.toast('Controleer de verzoekdetails.');return true;}
      preserveDraft(document.getElementById('support-reply-form'));
      if(t.assignee!==assignee){t.assignee=assignee;markEvent(t,`Behandelaar gewijzigd naar ${assignee}.`,'internal');}
      if(t.priority!==priority){t.priority=priority;markEvent(t,`Prioriteit gewijzigd naar ${PRIORITY[priority].toLocaleLowerCase('nl')}.`);}
      if(t.status!==status){t.status=status;markEvent(t,`Status gewijzigd naar ${STATUS[status].toLocaleLowerCase('nl')}.`);}
      redraw(t.id);ctx.toast('Verzoekdetails bijgewerkt.');return true;
    }
    if(form.id==='support-template-form'){insertTemplate(templateKey,formValue(data,'ticket'));return true;}
    return false;
  }
  function input(event) {
    const target=event.target;if(target.id==='support-search'){filters[role()].query=target.value;updateList();return true;}
    const form=findForm(target);if(form?.dataset.supportDraft){preserveDraft(form);return true;}return false;
  }
  function change(event) {
    const target=event.target;
    if(target.id==='support-sort'){if(['latest','oldest','priority'].includes(target.value))filters[role()].sort=target.value;updateList();return true;}
    if(target.id==='support-category'){filters[role()].category=CATEGORIES.includes(target.value)?target.value:'all';updateList();return true;}
    if(target.id==='support-create-client'){
      if(role()!=='admin'||(remote?!organization(target.value):!CLIENTS.includes(target.value)))return true;
      const services=remote?organization(target.value).services:SERVICES[target.value];
      const select=document.getElementById('support-create-service');if(select)select.innerHTML=services.map((s,i)=>option(s,s,i===0?s:'')).join('');preserveDraft(findForm(target));return true;
    }
    if(target.id==='support-reply-template'){if(target.value)insertTemplate(target.value);return true;}
    if(target.dataset?.supportFiles){
      if(remote){target.value='';return true;}
      const key=target.dataset.supportFiles;if(!key.startsWith(`${role()}:`))return true;
      const current=[...(getDraft(key).attachments||[])], chosen=Array.from(target.files||[]);let rejected=0;
      for(const file of chosen){if(file.size>10*1024*1024||current.length>=5){rejected++;continue;}if(!current.some(f=>f.name===file.name&&f.size===file.size))current.push({name:String(file.name).slice(0,220),size:file.size,type:file.type});}
      setDraft(key,{attachments:current});target.value='';document.querySelectorAll('[data-support-file-list]').forEach(list=>{if(list.dataset.supportFileList===key)list.innerHTML=attachmentsMarkup(current,true,key);});
      if(rejected)ctx.toast('Selecteer maximaal 5 bestanden van elk maximaal 10 MB.');return true;
    }
    const form=findForm(target);if(form?.dataset.supportDraft){preserveDraft(form);return true;}return false;
  }
  function draftFeedback(){
    if(!remote)return;
    document.querySelectorAll('.sp-draft-state span,[data-support-draft-status]').forEach(node=>{const key=node.closest('form[data-support-draft]')?.dataset.supportDraft;node.textContent=remote.error?'Concept nog niet bewaard; je invoer blijft behouden.':remote.pending?'Concept wordt bewaard…':remote.hasSavedDraft(key)?'Concept bevestigd op de server.':'Nog geen concept bewaard.';});
    if(remote.error&&document.querySelector('form[data-support-draft]'))showError(remote.error);
  }
  function showError(error){
    const form=document.querySelector('.modal form[id^="support-"]'),host=form||document.querySelector('.modal-body')||document.querySelector('.sp-root');
    if(!host){ctx.toast(error.message||'De supportgegevens zijn niet beschikbaar.');return;}
    let notice=host.querySelector('[data-support-error]');if(!notice){notice=document.createElement('div');notice.className='notice';notice.dataset.supportError='true';notice.setAttribute('role','alert');notice.tabIndex=-1;host.prepend(notice);}
    const key=form?.dataset.supportDraft,conflict=key&&remote?.conflicts.get(key);
    const message=error.status===409?'Deze gegevens zijn elders gewijzigd. Je invoer blijft hier staan. Vergelijk de actuele versie voordat je opnieuw bewaart.':error.message||'Bewaren is niet gelukt. Je invoer blijft behouden.';
    notice.innerHTML=`<p>${e(message)}</p>${conflict?`<p>Actueel serverconcept: ${e(JSON.stringify(conflict.current?.value||{}))}</p><div class="modal-actions"><button class="btn" type="button" data-action="support-draft-server">Serverconcept overnemen</button><button class="btn" type="button" data-action="support-draft-local">Eigen concept bewaren</button></div>`:error.status===409&&activeTicket?'<button class="btn" type="button" data-action="support-refresh-ticket">Actuele verzoekversie laden · tekst behouden</button>':''}`;
  }
  async function beforeClose(){
    if(!remote)return true;if(busy)return false;
    try{preserveDraft(document.querySelector('.modal form[data-support-draft]'));await remote.flush();return true;}catch(error){showError(error);return false;}
  }
  async function execute(form,operation){
    if(busy)return true;busy=true;
    const controls=[...(form?.querySelectorAll('button,input,select,textarea')||[])].map(node=>[node,node.disabled]);controls.forEach(([node])=>node.disabled=true);
    try{await operation();}catch(error){showError(error);}finally{controls.forEach(([node,disabled])=>node.disabled=disabled);busy=false;draftFeedback();}return true;
  }
  async function remoteAction(name,el){
    const id=el?.dataset?.id||'';
    if(name==='ticket'||name==='new-ticket'||name==='admin-task'&&id==='new-ticket'){
      await remote.ready();if(!remote.state.loaded){showError(remote.error);return true;}openCreate();draftFeedback();return true;
    }
    if(name==='ticket-view')return execute(document.querySelector('.modal form'),async()=>{preserveDraft(document.querySelector('.modal form[data-support-draft]'));await remote.flush();await remote.ticket(id);openTicket(id);draftFeedback();});
    if(name==='admin-task'&&id.startsWith('template-')||name.startsWith('template-')){openTemplate(name.startsWith('template-')?name:id);return true;}
    if(!name.startsWith('support-'))return false;
    if(name==='support-filter'){if(['all','active','waiting','resolved'].includes(id)){filters[role()].status=id;updateList();}return true;}
    if(name==='support-reset'){filters[role()]={query:'',status:'all',category:'all',sort:'latest'};ctx.render();return true;}
    if(name==='support-load')return execute(null,async()=>{await remote.ready();ctx.render();});
    if(name==='support-refresh')return execute(null,async()=>{await remote.refresh();ctx.render();});
    if(name==='support-refresh-ticket')return execute(document.querySelector('.modal form'),async()=>{preserveDraft(document.getElementById('support-reply-form'));await remote.ticket(activeTicket);ctx.render();openTicket(activeTicket);draftFeedback();});
    if(name==='support-draft-server'||name==='support-draft-local')return execute(document.querySelector('.modal form'),async()=>{const key=document.querySelector('.modal form[data-support-draft]')?.dataset.supportDraft;if(!key)return;await remote.resolveDraft(key,name==='support-draft-server'?'server':'local');if(activeTicket)openTicket(activeTicket);else openCreate();draftFeedback();});
    if(name==='support-compose'&&!(id==='internal'?canInternal():can('support.ticket.reply'))){deny();return true;}
    if(name==='support-compose')return execute(document.getElementById('support-reply-form'),async()=>{if(role()!=='admin'||!['public','internal'].includes(id))return;preserveDraft(document.getElementById('support-reply-form'));await remote.flush();composerMode=id;openTicket(activeTicket);draftFeedback();});
    if((name==='support-resolve'||name==='support-reopen'||name==='support-confirm-status')&&!can('support.ticket.status')){deny();return true;}
    if(name==='support-resolve'||name==='support-reopen'){confirmStatus(id,name==='support-resolve'?'resolved':'open');return true;}
    if(name==='support-confirm-status')return execute(null,async()=>{const ticket=accessible(id),status=el.dataset.status;if(!ticket||!['resolved','open'].includes(status))return;await remote.flush();await remote.update(ticket,{status});ctx.render();openTicket(id);ctx.toast(status==='resolved'?'Verzoek op de server gemarkeerd als opgelost.':'Verzoek op de server heropend.');});
    return true;
  }
  async function remoteSubmit(form,data){
    if(!form.id.startsWith('support-'))return false;
    if(real&&(form.id==='support-create-form'&&!can('support.ticket.create')||form.id==='support-reply-form'&&!(composerMode==='internal'?canInternal():can('support.ticket.reply'))||form.id==='support-details-form'&&!canManage()&&!can('support.ticket.status')||form.id==='support-template-form'&&!can('support.ticket.reply'))){deny();return true;}
    if(form.reportValidity&&!form.reportValidity())return true;
    return execute(form,async()=>{
      if(form.id==='support-template-form'){insertTemplate(templateKey,formValue(data,'ticket'));await remote.flush();return;}
      if(form.id==='support-create-form'){
        const org=role()==='admin'?organization(formValue(data,'client')):organization(ctx.session?.actor.organizationId);
        if(!org)throw new Error('De geautoriseerde klantorganisatie ontbreekt.');
        preserveDraft(form);await remote.flush();
        const ticket=await remote.create({organizationId:org.id,service:formValue(data,'service'),subject:formValue(data,'subject').trim(),body:formValue(data,'body').trim(),category:formValue(data,'category'),priority:formValue(data,'priority')});
        remote.forgetDraft('create');ctx.closeModal();ctx.render();openTicket(ticket.id);ctx.toast(`Verzoek ${ticket.id} is op de server aangemaakt. Geen e-mail verzonden.`);return;
      }
      if(form.id==='support-reply-form'){
        const ticket=accessible(form.dataset.ticketId),body=formValue(data,'body').trim(),visibility=role()==='admin'&&composerMode==='internal'?'internal':'public';
        if(!ticket||ticket.status==='resolved')throw new Error('Heropen het verzoek voordat je een reactie toevoegt.');
        preserveDraft(form);await remote.flush();await remote.message(ticket,body,visibility);remote.forgetDraft(draftKey(ticket.id));ctx.render();openTicket(ticket.id);ctx.toast(visibility==='internal'?'Interne notitie bevestigd op de server.':'Portaalreactie bevestigd op de server. Geen e-mail verzonden.');return;
      }
      if(form.id==='support-details-form'){
        if(role()!=='admin')return;const ticket=accessible(form.dataset.ticketId);if(!ticket)return;
        preserveDraft(document.getElementById('support-reply-form'));await remote.flush();
        const changes={};if(canManage()){if(canInternal()&&form.elements.namedItem('assignee'))changes.assignee=formValue(data,'assignee');if(form.elements.namedItem('priority'))changes.priority=formValue(data,'priority');}if(can('support.ticket.status')&&ticket.status!=='resolved'&&form.elements.namedItem('status'))changes.status=formValue(data,'status');if(!Object.keys(changes).length){deny();return;}
        await remote.update(ticket,changes);ctx.render();openTicket(ticket.id);ctx.toast('Verzoekdetails bevestigd op de server.');
      }
    });
  }
  if(remote)remote.onDraftChange(draftFeedback);
  return {render,action,submit,input,change,count:(asRole='client')=>ticketsFor(asRole).filter(t=>t.status!=='resolved').length,ready:()=>remote?.ready(),beforeClose,refresh:()=>{if(remote)return remote.refresh();db=load();}};
}
