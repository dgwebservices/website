import {realDataMode,createEmptyLegacyModule} from './empty-state.js';
import {businessStore} from './business-store.js';
// Customer organization and account flows. All state is local demo state;
// no invitation, authentication action, mandate or cancellation reaches a service.
const KEY = 'dg-midnight-account-v1';
const MAILBOXES=['info','voorzitter','secretaris','penningmeester','jeugd','wedstrijdzaken','sponsoring','kantine'].map(name=>`${name}@duindorpsv.nl`);
const ROLES = {
  owner: {label:'Eigenaar', description:'Beheert de organisatie, gebruikers, diensten en facturen.', rights:['Organisatiegegevens beheren','Gebruikers uitnodigen en rechten beheren','Domeinen, hosting en e-mail beheren','Facturen en abonnementen beheren','Supportverzoeken bekijken en beantwoorden']},
  finance: {label:'Financieel contact', description:'Regelt de administratie, zonder toegang tot technische instellingen.', rights:['Facturen en betaalstatus bekijken','Betaalvoorkeuren beheren','Abonnementskosten en looptijden bekijken','Financiële supportvragen stellen']},
  technical: {label:'Technisch beheerder', description:'Beheert de technische diensten en bijbehorende supportvragen.', rights:['Domeinen en DNS beheren','Hosting en back-ups beheren','Mailboxinstellingen beheren','Technische supportvragen stellen']},
  mailbox: {label:'Mailboxgebruiker', description:'Heeft alleen toegang tot de eigen toegewezen mailbox.', rights:['Eigen mailbox openen via webmail','Eigen mailboxinstellingen bekijken','Hulp bij de eigen mailbox aanvragen']}
};
const SERVICE = {
  'DG-HST-0012': {name:'Hosting Plus',domain:'duindorpsv.nl',type:'hosting',date:'1 november 2026',dateLabel:'Volgende maandtermijn',price:'€ 19,95 per maand excl. btw',impact:'Na de bevestigde einddatum stoppen de website en databases in dit pakket. De 8 gekoppelde mailboxen worden eerst gecontroleerd. Je domein heeft een afzonderlijk abonnement.'},
  'DG-HST-0018': {name:'Hosting Start',domain:'clubhuis.online',type:'hosting',date:'12 augustus 2027',dateLabel:'Volgende jaartermijn',price:'€ 59,40 per jaar excl. btw',impact:'Na de bevestigde einddatum stoppen de website en databases in dit pakket. Er zijn geen mailboxen in dit pakket. Het domein clubhuis.online blijft afzonderlijk actief.'},
  'duindorpsv.nl': {name:'Domein .nl',domain:'duindorpsv.nl',type:'domain',date:'18 november 2026',dateLabel:'Registratie geldig tot',price:'€ 12,95 per jaar excl. btw',impact:'Als het domein niet meer wordt verlengd, werken de website en e-mail op deze domeinnaam uiteindelijk niet meer. Hosting en mailboxabonnementen worden hiermee niet opgezegd.'},
  'duindorpsv.com': {name:'Domein .com',domain:'duindorpsv.com',type:'domain',date:'4 februari 2027',dateLabel:'Registratie geldig tot',price:'€ 17,95 per jaar excl. btw',impact:'Als het domein vervalt, stopt de doorverwijzing naar duindorpsv.nl. Je andere domeinen, hosting en mailboxen blijven afzonderlijk actief.'},
  'clubhuis.online': {name:'Domein .online',domain:'clubhuis.online',type:'domain',date:'12 augustus 2027',dateLabel:'Registratie geldig tot',price:'€ 29,95 per jaar excl. btw',manual:true,impact:'Automatische verlenging staat al uit. Laat DG controleren dat deze registratie mag verlopen. De website en e-mail op dit domein zijn dan niet meer bereikbaar; het hostingabonnement blijft afzonderlijk actief.'}
};
const fresh = () => ({
  org:{name:'Duindorp SV',contact:'info@duindorpsv.nl',email:'penningmeester@duindorpsv.nl',address:'Sportpark Houtrust',postcode:'',city:'Den Haag',phone:''},
  members:[{id:'owner',name:'Clubbeheer',email:'info@duindorpsv.nl',role:'owner'},{id:'finance',name:'Penningmeester',email:'penningmeester@duindorpsv.nl',role:'finance'}],
  invites:[{id:'websitebeheer',name:'Websitebeheer',email:'websitebeheer@duindorpsv.nl',role:'technical',status:'pending',created:'2026-10-12T09:20:00Z'}],
  preferences:{services:true,invoices:true,support:true,news:false},
  security:{recoveryEmail:'',recoveryRequested:'',otherSessions:true},
  payment:{requestMandate:false}, cancellations:{}
});
const asText = (value,max=150) => typeof value==='string'?value.slice(0,max):'';
function restore() {
  const base=fresh();
  try {
    const data=JSON.parse(businessStore.getItem(KEY)||'null');
    if(!data||typeof data!=='object')return base;
    for(const key of Object.keys(base.org))if(typeof data.org?.[key]==='string')base.org[key]=data.org[key].slice(0,150);
    if(Array.isArray(data.members))base.members=base.members.map(member=>{
      const saved=data.members.find(value=>value?.id===member.id);
      return saved?{...member,name:asText(saved.name)||member.name,email:asText(saved.email)||member.email,role:member.id==='owner'?'owner':(['finance','technical','mailbox'].includes(saved.role)?saved.role:member.role),mailbox:MAILBOXES.includes(saved.mailbox)?saved.mailbox:''}:member;
    });
    if(Array.isArray(data.invites))base.invites=data.invites.slice(0,30).filter(v=>v&&typeof v.id==='string'&&typeof v.email==='string'&&['finance','technical','mailbox'].includes(v.role)).map(v=>({id:asText(v.id,80),name:asText(v.name,80),email:asText(v.email),role:v.role,mailbox:MAILBOXES.includes(v.mailbox)?v.mailbox:'',status:['pending','draft','revoked'].includes(v.status)?v.status:'draft',created:asText(v.created,40)}));
    for(const key of Object.keys(base.preferences))if(typeof data.preferences?.[key]==='boolean')base.preferences[key]=data.preferences[key];
    base.security.recoveryEmail=asText(data.security?.recoveryEmail);
    base.security.recoveryRequested=asText(data.security?.recoveryRequested,40);
    if(typeof data.security?.otherSessions==='boolean')base.security.otherSessions=data.security.otherSessions;
    base.payment.requestMandate=data.payment?.requestMandate===true;
    for(const id of Object.keys(SERVICE)) {
      const saved=data.cancellations?.[id];
      if(saved&&['pending','withdrawn'].includes(saved.status))base.cancellations[id]={status:saved.status,reason:asText(saved.reason,600),created:asText(saved.created,40),ref:asText(saved.ref,40)};
    }
  }catch{}
  return base;
}

export function createAccount(ctx) {
 if(realDataMode)return createEmptyLegacyModule(ctx,'account');
  const h=ctx.h;
  const esc=value=>h.escape(value);
  const i=name=>h.icon(name);
  let data=restore();
  let pendingCancellation='';
  const isClient=()=>ctx.getState().role==='client';
  const button=(label,action,id='',primary=false)=>`<button type="button" class="btn${primary?' primary':''}" data-action="${action}"${id?` data-id="${esc(id)}"`:''}>${label}</button>`;
  const badge=(label,muted=false)=>`<span class="pg-badge${muted?' pg-badge-muted':''}"><span></span>${esc(label)}</span>`;
  const note='<div class="modal-note">Demo · wijzigingen worden op dit apparaat bewaard. Er wordt niets verstuurd of bij een provider aangepast.</div>';
  const row=(label,value)=>`<div class="detail-row"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  const summary=items=>`<div class="detail-list ac-detail-list">${items.map(([label,value])=>row(label,value)).join('')}</div>`;
  const field=(label,name,value='',type='text',attrs='')=>`<label class="field">${label}<input type="${type}" name="${name}" value="${esc(value)}" ${attrs}></label>`;
  const footer=(text)=>`<div class="modal-actions">${button('Annuleren','close')}<button class="btn primary" type="submit">${text}</button></div>`;
  const roles=(value)=>Object.entries(ROLES).filter(([key])=>key!=='owner').map(([key,role])=>`<option value="${key}"${value===key?' selected':''}>${role.label}</option>`).join('');
  const mailboxField=(role,selected='')=>`<label class="field full ac-top-gap" data-ac-mailbox${role==='mailbox'?'':' hidden'}>Toegewezen mailbox<select name="mailbox"${role==='mailbox'?' required':''}><option value="">Kies een mailbox</option>${MAILBOXES.map(email=>`<option value="${email}"${email===selected?' selected':''}>${email}</option>`).join('')}</select><small class="ac-form-hint">Selecteer uitsluitend de mailbox waarvoor deze gebruiker toegang krijgt.</small></label>`;
  const date=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'13 oktober 2026':d.toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'})};
  const initials=name=>name.trim().split(/\s+/).slice(0,2).map(word=>word[0]||'').join('').toUpperCase();
  const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)&&value.length<=150;
  function save(message) {
    let retained=true;
    try{businessStore.setItem(KEY,JSON.stringify(data))}catch{retained=false}
    if(message)ctx.toast(retained?message:'Wijziging geldt zolang dit scherm open is; je browser kon deze niet bewaren.');
    return retained;
  }
  function finish(message){save(message);ctx.closeModal();ctx.render()}
  function fail(form,message,name) {
    let error=form.querySelector('.ac-form-error');
    if(!error){error=document.createElement('p');error.className='ac-form-error';error.setAttribute('role','alert');form.prepend(error)}
    error.textContent=message;
    if(name)form.elements.namedItem(name)?.focus();
    return true;
  }
  function access(role) {
    const value=ROLES[role]||ROLES.finance;
    return `<div class="ac-access"><span class="eyebrow">TOEGANG VOOR DEZE ROL</span><p>${value.description}</p><ul>${value.rights.map(right=>`<li>${i('check')}<span>${right}</span></li>`).join('')}</ul><small>Portaaltoegang geeft nooit automatisch toegang tot de inhoud van mailboxen.</small></div>`;
  }
  function orgEdit() {
    ctx.modal('Organisatiegegevens',`${note}<form id="ac-org-form"><div class="fields">${field('Organisatienaam','name',data.org.name,'text','required minlength="2" maxlength="100" autocomplete="organization"')}${field('Primair contact','contact',data.org.contact,'email','required maxlength="150" autocomplete="email"')}${field('Factuurcontact','email',data.org.email,'email','required maxlength="150"')}${field('Telefoon <span class="ac-optional">optioneel</span>','phone',data.org.phone,'tel','maxlength="30" autocomplete="tel"')}${field('Straat en huisnummer / locatie','address',data.org.address,'text','required minlength="2" maxlength="150" autocomplete="street-address"')}${field('Postcode <span class="ac-optional">optioneel</span>','postcode',data.org.postcode,'text','maxlength="7" placeholder="1234 AB" autocomplete="postal-code"')}${field('Plaats','city',data.org.city,'text','required minlength="2" maxlength="100" autocomplete="address-level2"')}<label class="field">Land<input value="Nederland" readonly aria-readonly="true"></label></div><p class="ac-form-hint">Deze gegevens worden gebruikt voor je organisatieprofiel. Bestaande facturen en domeinhoudergegevens veranderen niet mee.</p>${footer('Gegevens bewaren')}</form>`,{size:'wide'});
  }
  function organization(id='',el) {
    if(!isClient()) {
      ctx.modal('DG Webservices',`${summary([['Werkruimte','Beheeromgeving'],['Toegang','DG-beheerder'],['Omgeving','Interactief prototype']])}<p>Je beheert hier klanten, diensten en de aanvragen in dit voorbeeld.</p><div class="modal-actions">${button('Sluiten','close')}<button class="btn primary" data-go="settings">Beheerinstellingen</button></div>`,{size:'standard'});
      return;
    }
    if(id==='edit'||(!id&&ctx.getState().page==='account'&&!el?.classList?.contains('workspace-switch'))){orgEdit();return}
    if(id==='owner'||id==='finance') {
      const member=data.members.find(value=>value.id===id);
      ctx.modal(id==='owner'?'Jouw toegang':'Toegang beheren',`${note}${summary([['Gebruiker',member.name],['E-mailadres',member.email],['Rol',ROLES[member.role].label]])}${id==='owner'?`${access('owner')}<div class="notice">Je bent de eigenaar van deze organisatie. Eigenaarschap overdragen vraagt om een aparte identiteitscontrole bij DG.</div><div class="modal-actions">${button('Sluiten','close')}${button('Organisatie bewerken','organization','edit',true)}</div>`:`<form id="ac-member-form" data-member="${member.id}"><label class="field ac-top-gap">Rol<select name="role" data-ac-role>${roles(member.role)}</select></label>${mailboxField(member.role,member.mailbox)}<div data-ac-access>${access(member.role)}</div>${footer('Toegang bewaren')}</form>`}`,{size:'standard'});
      return;
    }
    ctx.modal('Jouw werkruimte',`<div class="ac-workspace"><span class="pg-org-monogram">${esc(initials(data.org.name))}</span><div><span class="eyebrow">KLANTORGANISATIE</span><h3>${esc(data.org.name)}</h3><p>DG-00042 · eigenaar</p></div></div>${summary([['Primair contact',data.org.contact],['Factuurcontact',data.org.email],['Vestigingsplaats',data.org.city]])}<div class="modal-actions">${button('Sluiten','close')}<button class="btn primary" data-go="account">Organisatie & account ${i('arrow')}</button></div>`,{size:'standard'});
  }
  function invitation(id) {
    const existing=id==='pending'?data.invites.find(invite=>invite.status!=='revoked'):data.invites.find(invite=>invite.id===id);
    if(existing) {
      const active=existing.status!=='revoked';
      ctx.modal('Uitnodiging bekijken',`${note}${badge(active?(existing.status==='pending'?'Openstaande voorbeelduitnodiging':'Lokaal voorbereid'):'Ingetrokken',true)}${summary([['Naam',existing.name||'Niet ingevuld'],['E-mailadres',existing.email],['Rol',ROLES[existing.role].label],...(existing.role==='mailbox'?[['Toegewezen mailbox',existing.mailbox||'Nog niet toegewezen']]:[]),['Voorbereid op',date(existing.created)]])}${access(existing.role)}<div class="notice">Er is geen uitnodigingsmail verstuurd. Een nieuwe gebruiker kan in deze demo niet echt inloggen.</div><div class="modal-actions">${button('Sluiten','close')}${active?button('Uitnodiging intrekken','ac-invite-revoke',existing.id):''}</div>`,{size:'standard'});
      return;
    }
    ctx.modal('Gebruiker uitnodigen',`${note}<form id="ac-invite-form"><div class="fields">${field('Naam','name','','text','required minlength="2" maxlength="80" autocomplete="name"')}${field('E-mailadres','email','','email','required maxlength="150" autocomplete="email"')}<label class="field full">Rol<select name="role" data-ac-role>${roles('technical')}</select></label></div>${mailboxField('technical')}<div data-ac-access>${access('technical')}</div><p class="ac-form-hint">Je bereidt een uitnodiging voor. De ontvanger krijgt in dit prototype geen e-mail.</p>${footer('Uitnodiging voorbereiden')}</form>`,{size:'standard'});
  }
  function preferences() {
    const choices=[['services','Updates over mijn diensten','Onderhoud, beschikbaarheid en de voortgang van aanvragen.'],['invoices','Facturen en betaalherinneringen','Nieuwe facturen en herinneringen aan een betaaltermijn.'],['support','Antwoorden op supporttickets','Een melding wanneer DG op jouw vraag reageert.'],['news','Nieuws van DG Webservices','Nieuwe diensten en handige tips voor jouw organisatie.']];
    ctx.modal('Meldingsvoorkeuren',`${note}<form id="ac-preferences-form"><div class="ac-option-list">${choices.map(([key,title,description])=>`<label class="ac-option"><input name="${key}" type="checkbox"${data.preferences[key]?' checked':''}><span><strong>${title}</strong><small>${description}</small></span></label>`).join('')}</div><div class="notice ac-top-gap">Noodzakelijke beveiligings- en contractberichten blijven altijd beschikbaar. Deze voorkeuren gelden voor jouw account.</div>${footer('Voorkeuren bewaren')}</form>`,{size:'standard'});
  }
  function security() {
    ctx.modal('Beveiliging & toegang',`${note}<div class="ac-security-heading"><span class="pg-icon">${i('shield')}</span><div><h3>Je account beschermd.</h3><p>Tweestapsverificatie staat aan in dit voorbeeld.</p></div>${badge('Ingeschakeld')}</div><section class="ac-section"><h3>Actieve sessies</h3><div class="ac-session"><span class="pg-icon">${i('desktop')}</span><div><strong>Chrome · Windows</strong><small>Huidige voorbeeldsessie · dit apparaat</small></div>${badge('Huidig')}</div>${data.security.otherSessions?`<div class="ac-session"><span class="pg-icon">${i('mobile')}</span><div><strong>Safari · iPhone</strong><small>Voorbeeldsessie · 12 oktober 2026</small></div>${button('Beëindigen','ac-session-end','iphone')}</div>`:'<p class="ac-empty">Geen andere actieve voorbeeldsessies.</p>'}</section><section class="ac-section"><h3>Je hersteladres</h3><p>Gebruik een persoonlijk adres buiten je eigen domeinen, zodat je bereikbaar blijft als je zakelijke e-mail uitvalt.</p><form id="ac-security-form">${field('Persoonlijk hersteladres','recoveryEmail',data.security.recoveryEmail,'email','required maxlength="150" placeholder="jouwnaam@example.com" autocomplete="email"')}<div class="modal-actions"><button class="btn" type="submit">Hersteladres bewaren</button></div></form></section><section class="ac-section"><h3>Toegang herstellen</h3><p>Kun je je tweede factor niet meer gebruiken? Bereid een herstelverzoek voor. DG moet je identiteit controleren voordat toegang kan worden hersteld.</p>${data.security.recoveryRequested?`<div class="notice">Herstelverzoek lokaal voorbereid op ${esc(date(data.security.recoveryRequested))}. Er zijn geen herstelcodes of berichten aangemaakt.</div>`:button('Herstelverzoek voorbereiden','ac-security-request')}</section>`,{size:'wide'});
  }
  function recoveryRequest() {
    ctx.modal('Herstelverzoek voorbereiden',`${note}<p>Dit verzoek is bedoeld voor het herstellen van je portaaltoegang. Er worden geen herstelcodes getoond, wachtwoorden gewijzigd of e-mails verstuurd.</p>${summary([['Account',data.members[0].email],['Hersteladres',data.security.recoveryEmail||'Nog niet ingesteld'],['Volgende stap','Identiteit controleren door DG']])}<form id="ac-recovery-form"><label class="ac-option ac-top-gap"><input type="checkbox" name="confirmed" required><span><strong>Ik wil hulp bij het herstellen van mijn toegang.</strong><small>Mijn huidige toegang en tweestapsverificatie blijven actief.</small></span></label>${footer('Verzoek voorbereiden')}</form>`,{size:'standard'});
  }
  function payment() {
    ctx.modal('Betaalinstellingen',`${note}${summary([['Organisatie',data.org.name],['Factuurcontact',data.org.email],['Huidige betaalwijze','Per factuur'],['Incassomachtiging','Geen actieve machtiging']])}<form id="ac-payment-form"><h3>Automatische incasso</h3><label class="ac-option"><input id="mandate-consent" name="requestMandate" type="checkbox"${data.payment.requestMandate?' checked':''}><span><strong>Ik wil automatische incasso aanvragen.</strong><small>Bewaar mijn voorkeur voor een toekomstige machtiging.</small></span></label><div class="notice ac-top-gap">Een opgeslagen voorkeur is geen incassomachtiging. In de werkende omgeving rond je hiervoor een aparte betaal- en toestemmingsstap af. Je blijft nu per factuur betalen.</div>${footer('Voorkeur bewaren')}</form>`,{size:'standard'});
  }
  function cancellation(id) {
    const service=SERVICE[id];
    if(!service){ctx.toast('Kies eerst het abonnement dat je wilt wijzigen.');return}
    pendingCancellation=id;
    const request=data.cancellations[id];
    if(request?.status==='pending') {
      ctx.modal('Jouw wijzigingsverzoek',`${note}<div class="ac-request-status">${badge('Controle door DG nodig',true)}<h3>${esc(service.name)} · ${esc(service.domain)}</h3><p>Je dienst blijft actief. Er is nog geen opzegging of wijziging uitgevoerd.</p></div>${summary([['Referentie',request.ref],['Voorbereid op',date(request.created)],['Gevraagde wijziging',service.type==='domain'?'Niet meer verlengen':'Stoppen na huidige contracttermijn'],[service.dateLabel,service.date],['Definitieve einddatum','Wordt bevestigd na controle']])}${request.reason?`<div class="ac-request-reason"><span class="eyebrow">JOUW TOELICHTING</span><p>${esc(request.reason)}</p></div>`:''}<div class="notice ac-top-gap">DG controleert eerst je afspraken, opzegtermijn en gekoppelde diensten. Dit verzoek staat alleen in dit demoportaal.</div><div class="modal-actions">${button('Sluiten','close')}${button('Verzoek intrekken','ac-cancel-withdraw',id)}</div>`,{size:'standard'});
      return;
    }
    ctx.modal(service.type==='domain'?'Domeinverlenging wijzigen':'Hostingabonnement opzeggen',`${note}<div class="ac-request-status">${badge('Dienst actief')}<h3>${esc(service.name)} · ${esc(service.domain)}</h3></div>${summary([['Huidig tarief',service.price],[service.dateLabel,service.date],['Gewenste wijziging',service.type==='domain'?'Niet meer verlengen':'Stoppen na huidige contracttermijn'],['Definitieve einddatum','Wordt eerst gecontroleerd door DG']])}<div class="ac-impact"><span class="pg-icon">${i('shield')}</span><div><strong>Wat betekent dit voor je diensten?</strong><p>${esc(service.impact)}</p></div></div>${service.manual?'<div class="notice">Dit domein wordt al handmatig verlengd. Met dit verzoek laat je het geplande verloop en de gevolgen controleren.</div>':''}<form id="ac-cancel-form" data-service="${esc(id)}"><label class="field ac-top-gap">Toelichting <span class="ac-optional">optioneel</span><textarea name="reason" maxlength="600" rows="3" placeholder="Vertel ons eventueel waarom je wilt stoppen."></textarea></label><label class="ac-option ac-top-gap"><input type="checkbox" name="confirmed" id="cancel-confirm" required><span><strong>Ik heb de gevolgen gelezen.</strong><small>Ik begrijp dat mijn dienst actief blijft totdat de wijziging is gecontroleerd en bevestigd.</small></span></label>${footer('Wijzigingsverzoek voorbereiden')}</form>`,{size:'wide'});
  }
  function action(name,el) {
    const id=el?.dataset?.id||'';
    if(name==='organization'){organization(id,el);return true}
    if(!isClient())return false;
    switch(name) {
      case 'invite':invitation(id);return true;
      case 'preferences':preferences();return true;
      case 'security':security();return true;
      case 'security-request':if(ctx.getState().page!=='account')return false;recoveryRequest();return true;
      case 'ac-security-request':recoveryRequest();return true;
      case 'payment-settings':payment();return true;
      case 'mandate-save':data.payment.requestMandate=!!document.getElementById('mandate-consent')?.checked;finish('Betaalvoorkeur bewaard. Er is geen incassomachtiging aangemaakt.');return true;
      case 'cancel':cancellation(id);return true;
      case 'cancel-confirm': {
        const form=document.getElementById('ac-cancel-form');
        if(form)return submit(form,new FormData(form));
        ctx.toast('Open eerst het abonnement en bevestig de gevolgen.');return true;
      }
      case 'ac-invite-revoke': {
        const invite=data.invites.find(value=>value.id===id&&value.status!=='revoked');
        if(!invite){ctx.toast('Deze uitnodiging is niet meer actief.');return true}
        ctx.modal('Uitnodiging intrekken',`<p>Wil je de lokale uitnodiging voor <strong>${esc(invite.email)}</strong> intrekken? Dit verandert geen bestaande gebruiker.</p><div class="modal-actions">${button('Terug','invite',id)}${button('Uitnodiging intrekken','ac-invite-revoke-confirm',id,true)}</div>`,{size:'small'});return true;
      }
      case 'ac-invite-revoke-confirm': {
        const invite=data.invites.find(value=>value.id===id);
        if(invite){invite.status='revoked';finish('De lokale uitnodiging is ingetrokken.')}return true;
      }
      case 'ac-session-end':
        ctx.modal('Voorbeeldsessie beëindigen',`<p>Wil je de voorbeeldsessie <strong>Safari · iPhone</strong> verwijderen uit dit overzicht? Je huidige sessie blijft beschikbaar.</p><div class="notice">Dit is een lokale demonstratie. Er worden geen echte aanmeldingen beëindigd.</div><div class="modal-actions">${button('Terug','security')}${button('Sessie beëindigen','ac-session-confirm','',true)}</div>`,{size:'small'});return true;
      case 'ac-session-confirm':data.security.otherSessions=false;save('Voorbeeldsessie beëindigd.');security();return true;
      case 'ac-cancel-withdraw':
        if(!SERVICE[id]||data.cancellations[id]?.status!=='pending'){ctx.toast('Dit verzoek is niet meer open.');return true}
        ctx.modal('Wijzigingsverzoek intrekken',`<p>Je trekt alleen het lokale verzoek voor <strong>${esc(SERVICE[id].name)} · ${esc(SERVICE[id].domain)}</strong> in. Je dienst blijft actief onder de huidige afspraken.</p><div class="modal-actions">${button('Terug','cancel',id)}${button('Verzoek intrekken','ac-cancel-withdraw-confirm',id,true)}</div>`,{size:'small'});return true;
      case 'ac-cancel-withdraw-confirm':
        if(data.cancellations[id]){data.cancellations[id].status='withdrawn';finish('Je lokale wijzigingsverzoek is ingetrokken.')}return true;
      default:return false;
    }
  }
  function submit(form,values) {
    if(!isClient()||!form.id?.startsWith('ac-'))return false;
    const val=name=>String(values.get(name)||'').trim();
    switch(form.id) {
      case 'ac-org-form': {
        for(const name of ['name','address','city'])if(val(name).length<2||val(name).length>(name==='address'?150:100))return fail(form,'Vul een geldige naam, locatie en plaats in.',name);
        for(const name of ['contact','email'])if(!validEmail(val(name)))return fail(form,'Vul een geldig e-mailadres in.',name);
        const postcode=val('postcode').replace(/\s/g,'').toUpperCase();
        if(postcode&&!/^[1-9][0-9]{3}[A-Z]{2}$/.test(postcode))return fail(form,'Vul een Nederlandse postcode in, bijvoorbeeld 1234 AB.', 'postcode');
        if(val('phone')&&!/^[+()\d .-]{6,30}$/.test(val('phone')))return fail(form,'Vul een geldig telefoonnummer in.', 'phone');
        data.org={name:val('name'),contact:val('contact'),email:val('email'),address:val('address'),postcode:postcode?`${postcode.slice(0,4)} ${postcode.slice(4)}`:'',city:val('city'),phone:val('phone')};
        finish('Organisatiegegevens bijgewerkt in dit demoportaal.');return true;
      }
      case 'ac-invite-form': {
        const email=val('email').toLowerCase(),role=val('role'),name=val('name');
        if(name.length<2||name.length>80)return fail(form,'Vul een naam van 2 tot 80 tekens in.','name');
        if(!validEmail(email))return fail(form,'Vul een geldig e-mailadres in.','email');
        if(!['finance','technical','mailbox'].includes(role))return fail(form,'Kies een beschikbare toegangsrol.','role');
        if(role==='mailbox'&&!MAILBOXES.includes(val('mailbox')))return fail(form,'Kies de mailbox waartoe deze gebruiker toegang krijgt.','mailbox');
        if(data.members.some(value=>value.email.toLowerCase()===email)||data.invites.some(value=>value.email.toLowerCase()===email&&value.status!=='revoked'))return fail(form,'Dit e-mailadres heeft al toegang of een openstaande uitnodiging.','email');
        if(data.invites.filter(value=>value.status!=='revoked').length>=20)return fail(form,'Er zijn al 20 openstaande demo-uitnodigingen. Trek eerst een ongebruikte uitnodiging in.');
        const invite={id:`invite-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,email,role,mailbox:role==='mailbox'?val('mailbox'):'',status:'draft',created:new Date().toISOString()};
        data.invites=data.invites.filter(value=>value.status!=='revoked').concat(invite);save('Uitnodiging lokaal voorbereid. Er is geen e-mail verstuurd.');ctx.closeModal();ctx.render();invitation(invite.id);return true;
      }
      case 'ac-member-form': {
        const member=data.members.find(value=>value.id===form.dataset.member&&value.role!=='owner');
        if(!member)return fail(form,'Voor deze gebruiker kunnen de rechten hier niet worden gewijzigd.');
        if(!['finance','technical','mailbox'].includes(val('role')))return fail(form,'Kies een beschikbare toegangsrol.','role');
        if(val('role')==='mailbox'&&!MAILBOXES.includes(val('mailbox')))return fail(form,'Kies de mailbox waartoe deze gebruiker toegang krijgt.','mailbox');
        member.role=val('role');member.mailbox=member.role==='mailbox'?val('mailbox'):'';finish('Toegangsrol bijgewerkt in dit demoportaal.');return true;
      }
      case 'ac-preferences-form':
        for(const key of Object.keys(data.preferences))data.preferences[key]=values.has(key);
        finish('Je meldingsvoorkeuren zijn bewaard.');return true;
      case 'ac-security-form': {
        const email=val('recoveryEmail').toLowerCase();
        if(!validEmail(email))return fail(form,'Vul een geldig hersteladres in.','recoveryEmail');
        const domain=email.split('@')[1];
        if(Object.values(SERVICE).some(service=>domain===service.domain||domain.endsWith(`.${service.domain}`)))return fail(form,'Kies een hersteladres buiten je domeinen bij DG.','recoveryEmail');
        data.security.recoveryEmail=email;save('Hersteladres lokaal bewaard. Verificatie per e-mail volgt pas in de werkende omgeving.');security();return true;
      }
      case 'ac-recovery-form':
        if(!values.has('confirmed'))return fail(form,'Bevestig eerst dat je een herstelverzoek wilt voorbereiden.','confirmed');
        data.security.recoveryRequested=new Date().toISOString();save('Herstelverzoek lokaal voorbereid. Er zijn geen codes aangemaakt.');security();return true;
      case 'ac-payment-form':data.payment.requestMandate=values.has('requestMandate');finish('Betaalvoorkeur bewaard. Je blijft per factuur betalen.');return true;
      case 'ac-cancel-form': {
        const id=form.dataset.service||pendingCancellation;
        if(!SERVICE[id])return fail(form,'Deze dienst bestaat niet in je overzicht.');
        if(data.cancellations[id]?.status==='pending'){cancellation(id);return true}
        if(!values.has('confirmed'))return fail(form,'Bevestig eerst dat je de gevolgen hebt gelezen.','confirmed');
        if(val('reason').length>600)return fail(form,'Beperk je toelichting tot 600 tekens.','reason');
        data.cancellations[id]={status:'pending',reason:val('reason'),created:new Date().toISOString(),ref:`DG-WZ-${Date.now().toString(36).toUpperCase()}`};
        save('Verzoek lokaal voorbereid. Je dienst blijft actief.');ctx.closeModal();ctx.render();cancellation(id);return true;
      }
      default:return false;
    }
  }
  function change(event) {
    const element=event.target;
    if(!element?.matches?.('[data-ac-role]'))return false;
    const target=element.closest('form')?.querySelector('[data-ac-access]');
    if(target)target.innerHTML=access(element.value);
    const assignment=element.closest('form')?.querySelector('[data-ac-mailbox]');
    if(assignment){assignment.hidden=element.value!=='mailbox';assignment.querySelector('select').required=element.value==='mailbox'}
    return true;
  }
  function input(event) {
    const form=event.target?.closest?.('form[id^="ac-"]');
    if(!form)return false;
    form.querySelector('.ac-form-error')?.remove();return true;
  }
  function render(role,page) {
    if(role!=='client'||page!=='account')return null;
    const pending=data.invites.filter(invite=>invite.status!=='revoked');
    const prefs=Object.values(data.preferences).filter(Boolean).length;
    const identity=(name,email)=>`<div class="pg-identity"><span class="pg-icon">${i('users')}</span><div><strong>${esc(name)}</strong><span>${esc(email)}</span></div></div>`;
    return `<div class="ac-account"><header class="pg-heading"><div><div class="eyebrow">JOUW ORGANISATIE</div><h1>Organisatie & account</h1><p>De juiste gegevens, mensen en toegang. Alles op één plek.</p></div><div class="pg-heading-actions">${button('Organisatie bewerken','organization','edit',true)}</div></header><div class="pg-account-top"><section class="panel pg-org-card"><div class="pg-org-monogram">${esc(initials(data.org.name))}</div><div><span class="eyebrow">KLANTORGANISATIE</span><h2>${esc(data.org.name)}</h2><p>Klantnummer DG-00042 · Nederland</p>${badge('Organisatie actief')}</div></section><section class="panel pg-org-info"><div><span>Primair contact</span><strong>${esc(data.org.contact)}</strong></div><div><span>Factuurcontact</span><strong>${esc(data.org.email)}</strong></div><div><span>Factuuradres</span><strong>${esc(data.org.address)}<br>${esc([data.org.postcode,data.org.city].filter(Boolean).join(' '))}</strong></div></section></div><section class="panel pg-list-panel"><div class="pg-section-head"><div><h2>De mensen achter je organisatie <span class="pg-count">${data.members.length}</span></h2><p>Iedereen krijgt de toegang die bij zijn of haar rol past.</p></div>${button(`${i('plus')} Gebruiker uitnodigen`,'invite')}</div><div class="ac-members">${data.members.map(member=>`<article class="ac-member">${identity(member.name,`${member.email}${member.id==='owner'?' · jij':''}`)}<div class="ac-member-role"><span>${ROLES[member.role].label}</span>${badge('Actief')}</div>${button(member.id==='owner'?'Mijn toegang':'Rechten beheren','organization',member.id)}</article>`).join('')}</div><div class="ac-invites"><div class="ac-invites-heading"><h3>Uitnodigingen <span class="pg-count">${pending.length}</span></h3><span>Geen e-mails verstuurd in de demo</span></div>${pending.length?pending.map(invite=>`<article class="ac-member ac-member-pending">${identity(invite.name||'Nieuwe gebruiker',invite.email)}<div class="ac-member-role"><span>${ROLES[invite.role].label}</span>${badge(invite.status==='pending'?'Openstaand voorbeeld':'Lokaal voorbereid',true)}</div>${button('Bekijken','invite',invite.id)}</article>`).join(''):'<p class="ac-empty">Er zijn geen openstaande uitnodigingen.</p>'}</div></section><div class="pg-split ac-settings"><section class="panel pg-settings-card"><span class="pg-icon">${i('shield')}</span><h2>Veilig toegang houden</h2><p>Beheer je voorbeeldsessies en een hersteladres buiten je eigen domein.</p><div class="pg-setting-line"><span>Tweestapsverificatie</span>${badge('Ingeschakeld')}</div><div class="pg-setting-line"><span>Hersteladres</span>${badge(data.security.recoveryEmail?'Lokaal ingesteld':'Nog toevoegen',!data.security.recoveryEmail)}</div>${button(`Beveiliging beheren ${i('arrow')}`,'security')}</section><section class="panel pg-settings-card"><span class="pg-icon">${i('bell')}</span><h2>Jouw meldingen</h2><p>Kies welke updates je ontvangt over diensten, facturen en supportverzoeken.</p><div class="pg-setting-line"><span>Meldingsvoorkeuren</span>${badge(`${prefs} van 4 ingeschakeld`,prefs===0)}</div><div class="pg-setting-line"><span>Beveiligingsmeldingen</span><strong>Altijd actief</strong></div>${button(`Voorkeuren instellen ${i('arrow')}`,'preferences')}</section></div><p class="pg-footnote">Dit is een interactief voorbeeld. Wijzigingen worden op dit apparaat bewaard; toegangsrechten, uitnodigingen en beveiliging zijn niet aan een echt account gekoppeld.</p></div>`;
  }
  function decorate(root=document) {
    if(!isClient())return;
    const workspace=root.querySelector('.workspace-switch');
    if(workspace){const title=workspace.querySelector('strong'),avatar=workspace.querySelector('.avatar');if(title)title.textContent=data.org.name;if(avatar)avatar.textContent=initials(data.org.name)}
    if(ctx.getState().page!=='subscriptions')return;
    root.querySelectorAll('[data-action="cancel"]').forEach(el=>{
      const request=data.cancellations[el.dataset.id];
      const cell=el.closest('tr')?.querySelector('td');
      cell?.querySelector('.ac-subscription-status')?.remove();
      if(request?.status==='pending') {
        el.textContent='Verzoek bekijken';
        const status=document.createElement('span');status.className='ac-subscription-status';status.textContent='Wijziging aangevraagd · nog actief';cell?.append(status);
      }
    });
    const count=Object.values(data.cancellations).filter(request=>request.status==='pending').length;
    const existing=root.querySelector('.ac-cancellation-note');existing?.remove();
    if(count){const message=document.createElement('div');message.className='notice ac-cancellation-note';message.textContent=`${count} lokaal wijzigingsverzoek${count===1?'':'en'} wacht${count===1?'':'en'} op controle. Alle diensten blijven actief totdat de wijziging en de einddatum zijn bevestigd.`;root.querySelector('.pg-list-panel')?.before(message)}
  }
  return {action,submit,input,change,decorate,render};
}
