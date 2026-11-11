import {realDataMode,createEmptyLegacyModule} from './empty-state.js';
import {businessStore} from './business-store.js';
// Interactive project inbox. No network requests or real email delivery.
const PROJECTS = {
  dartflow:{name:'DartFlow', mark:'DF', color:'#6D6AF5', domain:'dartflow.example'},
  veyocast:{name:'VeyoCast', mark:'VC', color:'#367DE9', domain:'veyocast.example'},
  fieldgrid:{name:'Fieldgrid', mark:'FG', color:'#15A383', domain:'fieldgrid.example'},
  nxttrack:{name:'NXTTRACK', mark:'NX', color:'#0D96C9', domain:'nxttrack.example'},
};
const TYPES={support:'Support',lead:'Lead'};
const STATUS={open:'Open',waiting:'Wacht op klant',done:'Afgehandeld'};
const PEOPLE={none:'Niet toegewezen',support:'Ik · Support',danny:'Danny'};
const STORE='dg-midnight-maildesk-v1';
const own=(obj,key)=>Object.hasOwn(obj,key);
const seedThreads=[
  ['DF-1042','dartflow','support','Milan','QR-code bij baan 3 werkt niet','11T09:42','open','none',true,'Goedemorgen,\n\nBij baan 3 krijgen spelers na het scannen alleen een wit scherm. De QR bij baan 2 werkt wel. Kunnen jullie meekijken? We spelen vanavond competitie.\n\nGroet,\nMilan'],
  ['FG-0721','fieldgrid','lead','Sofie','Demo aanvragen voor ons serviceteam','11T09:28','open','none',true,'Hoi Fieldgrid,\n\nWe zoeken een manier om planning en werkbonnen te combineren voor 14 monteurs. Is een demo volgende week mogelijk?\n\nGroet,\nSofie'],
  ['VC-0815','veyocast','support','Jeroen','Playlist voor de clubmuur aanpassen','11T09:06','open','support',true,'Goedemorgen, ik wil een nieuwe slide voor het weekend klaarzetten. Kan ik de volgorde alvast aanpassen zonder de actieve playlist te wijzigen?'],
  ['NX-0203','nxttrack','support','Lotte','Uitnodiging voor lesgroep ontbreekt','11T08:51','waiting','danny',false,'Ik zie de nieuwe lesgroep wel in het portaal maar heb nog geen uitnodiging ontvangen. Willen jullie kijken of ik in de juiste groep sta?'],
  ['DF-1040','dartflow','lead','Ravi','DartFlow voor onze vereniging','10T17:25','open','support',false,'We hebben zes banen en willen onze interne toernooien digitaal bijhouden. Hoe ziet het verenigingspakket eruit?'],
  ['VC-0802','veyocast','lead','Nina','Clubmuur op twee schermen','10T15:30','waiting','support',false,'Kunnen we in de kantine en bij de ingang een andere playlist tonen met één account?'],
  ['FG-0711','fieldgrid','support','Amir','Werkbon exporteren naar PDF','10T13:45','done','danny',false,'Dank voor het meekijken. De werkbon staat nu goed in het rapport.'],
  ['NX-0201','nxttrack','lead','Sara','Kennismaken met NXTTRACK','10T11:30','open','none',false,'Wij zijn benieuwd hoe het leerlingvolgsysteem werkt voor een zwemschool met meerdere leslocaties.'],
];
const newId=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const currentTime=()=>new Date().toISOString();
const seedTime=value=>`2026-11-${value}:00+01:00`;
const formatClock=new Intl.DateTimeFormat('nl-NL',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Amsterdam'});
const formatFull=new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Amsterdam'});
const formatDate=(format,value)=>{const date=new Date(value);return Number.isNaN(+date)?'—':format.format(date)};
const readStore=()=>{
  try{
    const value=JSON.parse(businessStore.getItem(STORE)||'null');
    if(value?.version===1&&Array.isArray(value.threads)&&value.brands&&typeof value.brands==='object'){
      return {version:1,brands:value.brands,threads:value.threads.filter(t=>t&&typeof t.id==='string'&&own(PROJECTS,t.project)&&own(TYPES,t.type)&&own(STATUS,t.status)&&own(PEOPLE,t.owner)&&Array.isArray(t.messages)&&Array.isArray(t.activity))};
    }
  }catch{}
  return {version:1,brands:{},threads:seedThreads.map(([id,project,type,contact,subject,at,status,owner,unread,body],index)=>{
    const address=contact.toLowerCase()+'@contact.example';
    return {id,project,type,contact,address,subject,updatedAt:seedTime(at),status,owner,unread,messages:[
      ...(index===0?[{id:'df-prev',kind:'inbound',name:contact,address,at:seedTime('11T09:31'),body:'Hoi DartFlow, we zijn de banen aan het testen voor de competitie van vanavond.'}]:[]),
      {id:id+'-initial',kind:'inbound',name:contact,address,at:seedTime(at),body},
    ],activity:[{label:'Demobericht ontvangen',at:seedTime(at)}]};
  })};
};

export function createMaildesk(ctx){
 if(realDataMode)return createEmptyLegacyModule(ctx,'maildesk');
  const {escape:esc,icon}=ctx.h;
  const db=readStore();
  let project='all',type='all',status='all',owner='all',query='',selected='',threadOpen=false;
  const isDesk=()=>{const state=ctx.getState();return state.role==='admin'&&state.page==='maildesk'};
  const trim=(value,max)=>String(value??'').trim().slice(0,max);
  const getThread=id=>db.threads.find(t=>t.id===id);
  function brand(id){
    const base=PROJECTS[id],item=own(db.brands,id)?db.brands[id]:{};
    const color=/^#[0-9a-f]{6}$/i.test(item?.color)?item.color:base.color;
    return {...base,color,sender:trim(item?.sender,80)||base.name,signature:trim(item?.signature,320)||`Met vriendelijke groet,\nTeam ${base.name}`};
  }
  const mailbox=t=>`${t.type==='lead'?'leads':'support'}@${PROJECTS[t.project].domain}`;
  const style=id=>`style="--desk-brand:${brand(id).color}"`;
  const mark=id=>`<span class="desk-brandmark" ${style(id)} aria-hidden="true">${esc(PROJECTS[id].mark)}</span>`;
  const tag=(kind,label)=>`<span class="desk-tag desk-tag--${kind}">${esc(label)}</span>`;
  const button=(action,label,{id='',iconName='',primary=false,extra=''}={})=>`<button type="button" class="btn ${primary?'primary ':''}${extra}" data-action="desk-${action}" data-id="${esc(id)}">${iconName?icon(iconName):''}${esc(label)}</button>`;
  const option=(value,label,selectedValue)=>`<option value="${esc(value)}"${value===selectedValue?' selected':''}>${esc(label)}</option>`;
  const options=(values,selectedValue)=>Object.entries(values).map(([value,label])=>option(value,label,selectedValue)).join('');
  const save=()=>{try{businessStore.setItem(STORE,JSON.stringify(db));return true}catch{return false}};
  function notice(message){ctx.toast(save()?message:'Wijziging geldt alleen voor deze sessie. Lokale opslag is niet beschikbaar.')}
  function record(t,label){t.activity=[{label,at:currentTime()},...t.activity].slice(0,30)}
  function visibleThreads(){
    const term=query.trim().toLocaleLowerCase('nl-NL');
    return db.threads.filter(t=>
      (project==='all'||t.project===project)&&(type==='all'||t.type===type)&&(status==='all'||t.status===status)&&
      (owner==='all'||t.owner===owner)&&(!term||[t.subject,t.contact,t.address,PROJECTS[t.project].name,t.id].join(' ').toLocaleLowerCase('nl-NL').includes(term))
    ).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  }
  function selectCurrent(threads){
    if(!threads.some(t=>t.id===selected)){selected=threads[0]?.id??'';threadOpen=false}
    return getThread(selected);
  }
  const activeCount=id=>db.threads.filter(t=>(id==='all'||t.project===id)&&t.status!=='done').length;
  const projectCount=id=>{const count=activeCount(id);return `<span class="desk-count" title="${count} actief">${count}<span class="sr-only"> actief</span></span>`};
  function projectBar(){
    return `<div class="desk-projects" role="group" aria-label="Projectfilter">
      <button type="button" class="desk-project ${project==='all'?'is-active':''}" data-action="desk-project" data-id="all" aria-pressed="${project==='all'}"><span class="desk-brandmark" aria-hidden="true">${icon('layers')}</span><span class="desk-project-text"><strong>Alle projecten</strong><small>Gedeelde inbox</small></span>${projectCount('all')}</button>
      ${Object.keys(PROJECTS).map(id=>`<button type="button" class="desk-project ${project===id?'is-active':''}" data-action="desk-project" data-id="${id}" aria-pressed="${project===id}" ${style(id)}>${mark(id)}<span class="desk-project-text"><strong>${esc(PROJECTS[id].name)}</strong><small>Support en leads</small></span>${projectCount(id)}</button>`).join('')}
    </div>`;
  }
  function rows(threads){
    if(!threads.length)return `<div class="desk-empty">${icon('search')}<strong>Geen gesprekken gevonden</strong><p>Pas je zoekterm of filters aan.</p>${button('reset','Filters wissen')}</div>`;
    return threads.map(t=>{
      const inbound=[...t.messages].reverse().find(m=>m?.kind==='inbound');
      return `<button type="button" class="desk-thread-row ${t.id===selected?'is-active ':''}${t.unread?'is-unread':''}" data-action="desk-thread" data-id="${esc(t.id)}" aria-pressed="${t.id===selected}" ${style(t.project)}>
        <span class="desk-row-top"><span class="desk-row-project">${esc(PROJECTS[t.project].name)} ${tag(t.type,TYPES[t.type])}</span><time datetime="${esc(t.updatedAt)}">${formatDate(formatClock,t.updatedAt)}</time>${t.unread?'<i class="desk-dot" aria-hidden="true" title="Ongelezen"></i>':''}</span>
        <strong class="desk-row-subject">${esc(t.subject)}${t.unread?'<span class="sr-only"> · Ongelezen</span>':''}</strong><span class="desk-row-sender">${esc(t.contact)} · ${esc(STATUS[t.status])}</span>
        <span class="desk-row-preview">${esc(String(inbound?.body||'').replace(/\s+/g,' '))}</span>
      </button>`;
    }).join('');
  }
  function message(m){
    if(!m||!['inbound','outbound','note'].includes(m.kind))return '';
    const note=m.kind==='note';
    const initials=String(m.name||'?').split(/\s+/).slice(0,2).map(v=>v.charAt(0)).join('').toUpperCase();
    return `<article class="desk-message ${m.kind==='outbound'?'is-outbound':''} ${note?'is-note':''}">
      <div class="desk-message-head"><span class="desk-avatar" aria-hidden="true">${note?icon('lock'):esc(initials)}</span><div><strong>${esc(m.name)}</strong><small>${note?'Interne notitie · alleen voor het team':esc(m.address)}</small></div><time datetime="${esc(m.at)}">${formatDate(formatFull,m.at)}</time></div>
      <div class="desk-message-body">${esc(m.body)}${m.signature?`<div class="desk-signature">${esc(m.signature)}</div>`:''}</div>
    </article>`;
  }
  function contextPane(t){
    const b=brand(t.project);
    return `<aside class="desk-context" aria-label="Gespreksgegevens">
      <section class="desk-context-card"><span class="eyebrow">MERK & AFZENDER</span><div class="desk-context-brand">${mark(t.project)}<div><strong>${esc(b.name)}</strong><small>${esc(TYPES[t.type])}</small></div></div><p class="desk-from">${esc(mailbox(t))}</p></section>
      <section class="desk-context-card"><span class="eyebrow">OPVOLGING</span><dl><div><dt>Eigenaar</dt><dd>${esc(PEOPLE[t.owner])}</dd></div><div><dt>Status</dt><dd>${esc(STATUS[t.status])}</dd></div></dl>${button('manage','Beheren',{id:t.id,iconName:'settings'})}</section>
      <section class="desk-context-card"><span class="eyebrow">ACTIVITEIT</span><ol class="desk-activity">${t.activity.slice(0,4).map(a=>`<li><span>${esc(a?.label)}</span><time datetime="${esc(a?.at)}">${formatDate(formatFull,a?.at)}</time></li>`).join('')}</ol></section>
    </aside>`;
  }
  function detail(t){
    if(!t)return `<div class="desk-empty">${icon('mail')}<strong>Geen gesprek geselecteerd</strong><p>Kies een gesprek in de inbox.</p></div>`;
    return `<div class="desk-thread-head" ${style(t.project)}>
      ${button('back','Naar inbox',{extra:'desk-mobile-back'})}
      <div class="desk-thread-title"><span class="desk-meta">${mark(t.project)} ${esc(PROJECTS[t.project].name)} ${tag(t.type,TYPES[t.type])}<span>${esc(t.id)}</span></span><h2 id="desk-thread-title" tabindex="-1">${esc(t.subject)}</h2><p>${esc(t.contact)} · ${esc(mailbox(t))}</p></div>
      <div class="desk-thread-actions">${tag(t.status,STATUS[t.status])}</div>
    </div><div class="desk-detail-grid" ${style(t.project)}><div class="desk-main-thread"><div class="desk-conversation">${t.messages.map(message).join('')}</div>
      <div class="desk-reply-bar">${button('reply','Beantwoorden',{id:t.id,iconName:'arrow',primary:true})}${button('note','Interne notitie',{id:t.id,iconName:'lock'})}</div>
    </div>${contextPane(t)}</div>`;
  }
  function render(role,page){
    if(role!=='admin'||page!=='maildesk')return '';
    const threads=visibleThreads(),t=selectCurrent(threads);
    return `<div class="adm-root desk-root">
      <div class="adm-page-head"><div><span class="eyebrow">KLANTCONTACT</span><h1>Projectinbox.</h1><p>Leads en support van al je projecten op één plek, elk met een eigen afzender en huisstijl.</p></div>
        <div class="desk-page-actions">${button('brands','Merken en afzenders',{iconName:'settings'})}${button('simulate','Simuleer inkomend',{iconName:'plus',primary:true})}</div>
      </div>
      ${projectBar()}
      <div class="desk-board panel ${threadOpen?'desk-thread-open':''}" id="desk-board">
        <section class="desk-inbox" aria-label="Inbox">
          <div class="desk-inbox-head"><div><span class="eyebrow">GEDEELDE WERKVOORRAAD</span><h2>Inbox</h2></div><span class="desk-count" id="desk-list-count" aria-live="polite">${threads.length} gesprekken</span></div>
          <div class="desk-controls">
            <label class="desk-search">${icon('search')}<input type="search" name="desk-search" data-desk-search aria-label="Gesprekken zoeken" placeholder="Zoek op naam of onderwerp" value="${esc(query)}"></label>
            <div class="desk-filters">
              <select data-desk-filter="type" aria-label="Type">${option('all','Alle typen',type)}${options(TYPES,type)}</select>
              <select data-desk-filter="status" aria-label="Status">${option('all','Alle statussen',status)}${options(STATUS,status)}</select>
              <select data-desk-filter="owner" aria-label="Toewijzing">${option('all','Iedereen',owner)}${options(PEOPLE,owner)}</select>
            </div>
          </div>
          <div class="desk-threads" id="desk-threads">${rows(threads)}</div>
        </section>
        <section class="desk-detail" id="desk-detail" aria-label="Gesprek">${detail(t)}</section>
      </div>
      <p class="desk-demo">${icon('shield')} Voorbeeldinbox · er zijn geen mailboxen aangesloten en er wordt geen echte e-mail verstuurd.</p>
    </div>`;
  }
  function refreshResults(){
    const threads=visibleThreads(),t=selectCurrent(threads);
    const list=document.getElementById('desk-threads'),result=document.getElementById('desk-detail'),count=document.getElementById('desk-list-count');
    if(list)list.innerHTML=rows(threads);
    if(result)result.innerHTML=detail(t);
    if(count)count.textContent=`${threads.length} gesprekken`;
    document.getElementById('desk-board')?.classList.toggle('desk-thread-open',threadOpen);
  }
  const footer=label=>`<div class="modal-actions"><button type="button" class="btn" data-action="close">Annuleren</button><button type="submit" class="btn primary">${esc(label)}</button></div>`;
  const modalNote=text=>`<div class="modal-note">${esc(text)}</div>`;
  function mailForm(t,kind){
    const note=kind==='note',b=brand(t.project);
    ctx.modal(note?'Interne notitie':'Demobericht beantwoorden',`<form id="desk-${kind}-form" data-thread="${esc(t.id)}">
      ${modalNote(note?'Deze notitie blijft binnen het team en wordt nooit verstuurd.':'Demo: het antwoord wordt alleen lokaal aan het gesprek toegevoegd.')}
      ${note?'':`<div class="desk-send-preview" ${style(t.project)}>${mark(t.project)}<div><strong>${esc(b.sender)} &lt;${esc(mailbox(t))}&gt;</strong><small>Aan: ${esc(t.contact)} &lt;${esc(t.address)}&gt;</small><small>Onderwerp: Re: ${esc(t.subject)}</small></div></div>`}
      <label class="field">${note?'Notitie':'Antwoord'}<textarea name="body" rows="6" maxlength="2000" required placeholder="${note?'Voeg context toe voor je collega…':'Schrijf je reactie…'}"></textarea></label>
      ${note?'':`<div class="desk-signature"><strong>Handtekening van ${esc(b.name)}</strong><p>${esc(b.signature)}</p></div>`}
      ${footer(note?'Notitie bewaren':'Verstuur in demo')}
    </form>`);
  }
  function manage(t){
    ctx.modal('Gesprek beheren',`<form id="desk-manage-form" data-thread="${esc(t.id)}">
      <p>${esc(t.subject)}</p><div class="fields"><label class="field">Toewijzing<select name="owner">${options(PEOPLE,t.owner)}</select></label><label class="field">Status<select name="status">${options(STATUS,t.status)}</select></label></div>${footer('Wijzigingen bewaren')}
    </form>`);
  }
  function brands(){
    ctx.modal('Merken en afzenders',`${modalNote('Elk project heeft eigen voorbeeldadressen. Je kunt de afzendernaam, kleur en handtekening per project bewerken.')}
      <div class="desk-brand-settings">${Object.keys(PROJECTS).map(id=>{
        const b=brand(id);
        return `<div class="desk-send-preview" ${style(id)}>${mark(id)}<div><strong>${esc(b.name)}</strong><small>support@${esc(b.domain)} · leads@${esc(b.domain)}</small></div>${button('brand','Bewerken',{id})}</div>`;
      }).join('')}</div>`);
  }
  function brandForm(id){
    const b=brand(id);
    ctx.modal(`Merk en afzender · ${b.name}`,`<form id="desk-brand-form" data-project="${esc(id)}">
      <div class="desk-send-preview" ${style(id)}>${mark(id)}<div><strong>${esc(b.name)}</strong><small>support@${esc(b.domain)} · leads@${esc(b.domain)}</small></div></div>
      <div class="fields"><label class="field">Afzendernaam<input name="sender" value="${esc(b.sender)}" maxlength="80" required></label><label class="field">Merkkleur<input type="color" name="color" value="${b.color}"></label></div>
      <label class="field">Handtekening<textarea name="signature" rows="4" maxlength="320" required>${esc(b.signature)}</textarea></label>${footer('Merk bewaren')}
    </form>`);
  }
  function simulate(){
    ctx.modal('Inkomend bericht simuleren',`<form id="desk-simulate-form">
      ${modalNote('Voeg een fictieve aanvraag toe aan de inbox van het gekozen project.')}
      <div class="fields"><label class="field">Project<select name="project">${Object.keys(PROJECTS).map(id=>option(id,PROJECTS[id].name,project==='all'?'dartflow':project)).join('')}</select></label><label class="field">Type<select name="type">${options(TYPES,type==='all'?'support':type)}</select></label></div>${footer('Ontvang demobericht')}
    </form>`);
  }
  function action(name,el){
    if(!name?.startsWith('desk-'))return false;
    if(!isDesk())return true;
    if(ctx.isModalDirty?.()){ctx.requestClose();return true}
    const id=el?.dataset.id;
    if(name==='desk-project'&&(id==='all'||own(PROJECTS,id))){
      project=id;selected='';threadOpen=false;ctx.render();document.querySelector('.desk-project.is-active')?.focus({preventScroll:true});
    }else if(name==='desk-thread'){
      const t=visibleThreads().find(item=>item.id===id);if(!t)return true;
      selected=t.id;threadOpen=true;
      if(t.unread){t.unread=false;save()}
      refreshResults();
      document.getElementById('desk-thread-title')?.focus({preventScroll:true});
    }else if(name==='desk-back'){
      threadOpen=false;refreshResults();document.querySelector('.desk-thread-row.is-active')?.focus({preventScroll:true});
    }else if(name==='desk-reset'){
      project=type=status=owner='all';query='';selected='';threadOpen=false;ctx.render();document.querySelector('[data-desk-search]')?.focus({preventScroll:true});
    }else if(name==='desk-brands')brands();
    else if(name==='desk-brand'&&own(PROJECTS,id))brandForm(id);
    else if(name==='desk-simulate')simulate();
    else{
      const t=id===selected?getThread(id):null;if(!t)return true;
      if(name==='desk-manage')manage(t);
      if(name==='desk-reply')mailForm(t,'reply');
      if(name==='desk-note')mailForm(t,'note');
    }
    return true;
  }
  function submit(form,data){
    if(!['desk-reply-form','desk-note-form','desk-manage-form','desk-simulate-form','desk-brand-form'].includes(form.id))return false;
    if(!isDesk())return true;
    let feedback='';
    if(form.id==='desk-simulate-form'){
      const id=data.get('project'),category=data.get('type');
      if(!own(PROJECTS,id)||!own(TYPES,category))return true;
      const p=PROJECTS[id],at=currentTime(),name='Noor (demo)',address='noor@contact.example',ref=`${p.mark}-${newId().slice(0,8).toUpperCase()}`;
      const subject=category==='lead'?`Een demo van ${p.name} aanvragen`:'Vraag over mijn account';
      const body=category==='lead'?`Hoi ${p.name},\n\nWij willen graag zien hoe jullie platform werkt. Kunnen we een demo inplannen?\n\nGroet,\nNoor`:`Hoi ${p.name},\n\nIk wil een collega uitnodigen voor ons account. Kunnen jullie uitleggen waar ik dit kan instellen?\n\nGroet,\nNoor`;
      db.threads.unshift({id:ref,project:id,type:category,contact:name,address,subject,updatedAt:at,status:'open',owner:'none',unread:true,messages:[{id:newId(),kind:'inbound',name,address,body,at}],activity:[{label:'Demobericht ontvangen',at}]});
      project=id;type=status=owner='all';query='';selected=ref;threadOpen=false;feedback='Demobericht ontvangen in '+p.name+'.';
    }else if(form.id==='desk-brand-form'){
      const id=form.dataset.project,sender=trim(data.get('sender'),80),signature=trim(data.get('signature'),320),color=String(data.get('color'));
      if(!own(PROJECTS,id)||!sender||!signature||!/^#[0-9a-f]{6}$/i.test(color)){ctx.toast('Vul de afzendernaam en handtekening in.');return true}
      db.brands[id]={sender,signature,color};feedback='Merk en afzender lokaal bewaard.';
    }else{
      const t=form.dataset.thread===selected?getThread(selected):null;if(!t)return true;
      if(form.id==='desk-manage-form'){
        const nextOwner=data.get('owner'),nextStatus=data.get('status');
        if(!own(PEOPLE,nextOwner)||!own(STATUS,nextStatus))return true;
        if(nextOwner!==t.owner){t.owner=nextOwner;record(t,'Toewijzing: '+PEOPLE[nextOwner])}
        if(nextStatus!==t.status){t.status=nextStatus;record(t,'Status: '+STATUS[nextStatus])}
        feedback='Gesprek bijgewerkt.';
      }else{
        const body=trim(data.get('body'),2000);
        if(!body){ctx.toast('Vul eerst een tekst in.');return true}
        const at=currentTime(),note=form.id==='desk-note-form',b=brand(t.project);
        t.messages.push(note?{id:newId(),kind:'note',name:'Team Support',at,body}:{id:newId(),kind:'outbound',name:b.sender,address:mailbox(t),at,body,signature:b.signature});
        t.updatedAt=at;t.unread=false;
        if(!note&&t.status!=='done')t.status='waiting';
        record(t,note?'Interne notitie toegevoegd':'Demoantwoord toegevoegd');
        feedback=note?'Interne notitie bewaard.':'Demoantwoord toegevoegd. Er is geen echte mail verstuurd.';
      }
    }
    ctx.closeModal();notice(feedback);ctx.render();
    return true;
  }
  function input(e){
    if(!isDesk()||!e.target.matches('[data-desk-search]'))return false;
    query=trim(e.target.value,120);refreshResults();return true;
  }
  function change(e){
    if(!isDesk()||!e.target.matches('[data-desk-filter]'))return false;
    const key=e.target.dataset.deskFilter,value=e.target.value;
    if(key==='type'&&(value==='all'||own(TYPES,value)))type=value;
    if(key==='status'&&(value==='all'||own(STATUS,value)))status=value;
    if(key==='owner'&&(value==='all'||own(PEOPLE,value)))owner=value;
    refreshResults();return true;
  }
  return {render,action,submit,input,change};
}
