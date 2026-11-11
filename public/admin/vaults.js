import {realDataMode,createEmptyLegacyModule} from './empty-state.js';
import {businessStore} from './business-store.js';
// Local UI prototype. This module never accepts or stores credential values.
let disposeVaultRuntime;

export function createVaults(ctx,{hosts=[],projects=[],getInventory=()=>({}),log=()=>{}}={}){
 if(realDataMode)return createEmptyLegacyModule(ctx,'vaults');
 const {escape:esc,icon}=ctx.h;
 const storageKey='dg-midnight-vaults-v1';
 const kinds={login:{label:'Login',icon:'users'},database:{label:'Database',icon:'server'},api:{label:'API-sleutel',icon:'lock'},ssh:{label:'SSH-referentie',icon:'file'}};
 const environments={production:'Productie',staging:'Staging',development:'Development',shared:'Algemeen'};
 const eventNames={created:'Item toegevoegd',edited:'Metadata bijgewerkt',archived:'Item gearchiveerd',restored:'Item hersteld',rotated:'Voorbeeldwaarde vernieuwd',revealed:'Voorbeeldwaarde bekeken',copied:'Voorbeeldwaarde gekopieerd',unlocked:'Demokluis geopend',locked:'Demokluis gesloten'};
 const metadataFields=['username','site','host','port','database','provider','keyName','alias','keyReference','note'];
 const limits={username:160,dbUsername:160,sshUsername:160,site:500,host:200,port:5,database:160,provider:100,keyName:160,alias:160,keyReference:300,note:1000};
 const unlocked=new Set(),revealed=new Set(),timers=new Map();
 let currentVault='',selectedItem='',itemQuery='',kindFilter='all',envFilter='all',archived=false,overviewQuery='',overviewKind='all';
 let db={version:1,items:[],activity:[]};
 const isAdmin=()=>ctx.getState().role==='admin';
 const text=(value,max=200)=>String(value??'').trim().slice(0,max);
 const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value);
 const date=value=>{const parsed=new Date(value);return Number.isFinite(parsed.getTime())?parsed.toISOString():new Date().toISOString()};
 const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}};
 const formatDate=value=>new Date(value).toLocaleString('nl-NL',{dateStyle:'short',timeStyle:'short'});
 const badge=(label,tone='unknown')=>`<span class="infra-state ${tone}"><i aria-hidden="true"></i>${esc(label)}</span>`;
 const button=(label,action,id='',primary=false,attrs='')=>`<button type="button" class="btn ${primary?'primary':''}" data-action="vault-${action}" data-id="${esc(id)}" ${attrs}>${label}</button>`;
 const scopedButton=(label,action,item='',primary=false)=>button(label,action,item,primary,`data-vault-id="${esc(currentVault)}"`);
 const closeButton=()=>'<button type="button" class="btn" data-action="close">Sluiten</button>';
 const banner=()=>`<div class="vault-banner">${icon('shield')}<span><strong>Demokluis · uitsluitend voorbeeldwaarden.</strong> Gebruik alleen voorbeeldmetadata. Wachtwoorden en sleutels zijn fictief.</span></div>`;
 const empty=(title,body,action='')=>`<div class="vault-empty">${icon('lock')}<h3>${esc(title)}</h3><p>${esc(body)}</p>${action}</div>`;
 function scopes(){
  const inventory=getInventory()||{},slots=[...new Set([...Array.from({length:7},(_,i)=>i),...Object.keys(inventory).filter(k=>/^(0|[1-9][0-9]{0,3})$/.test(k)).map(Number)])].sort((a,b)=>a-b);
  return [...hosts.map(h=>({id:'host:'+h.id,name:h.name,kind:'host',label:'VPS-kluis',env:h.env||'Algemeen',owner:'DG Webservices',demo:true,related:(h.projects||[]).map(id=>projects.find(p=>p.id===id)?.name).filter(Boolean)})),...projects.map(p=>({id:'project:'+p.id,name:p.name,kind:'project',label:'Projectkluis',env:'Alle omgevingen',owner:p.owner||'DG Webservices',demo:true,related:[]})),...slots.map(index=>{const entry=inventory[String(index)]||{};return {id:'inventory:'+index,name:text(entry.name,100)||'VPS-plaats '+String(index+1).padStart(2,'0'),kind:'inventory',label:'VPS-kluis · eigen inventaris',env:text(entry.environment,60)||'Nog vast te leggen',owner:text(entry.owner,100)||'DG Webservices',demo:false,related:[]}})];
 }
 const scope=id=>scopes().find(v=>v.id===id);
 const itemsFor=id=>db.items.filter(item=>item.vaultId===id);
 const itemFor=(vaultId,itemId)=>db.items.find(item=>item.vaultId===vaultId&&item.id===itemId);
 const secret=item=>'DEMO_ONLY_'+item.id.replace(/[^A-Za-z0-9_-]/g,'').toUpperCase()+'_V'+item.rotation;
 const revealKey=item=>item.vaultId+'|'+item.id;
 function normalizedItem(value){
  if(!value||!scope(value.vaultId)||!validId(value.id)||!Object.hasOwn(kinds,value.type))return null;
  const metadata={};
  for(const name of metadataFields)metadata[name]=text(value.metadata?.[name],limits[name]);
  if(metadata.site&&!safeUrl(metadata.site))metadata.site='';
  const createdAt=date(value.createdAt);
  return {id:value.id,vaultId:value.vaultId,type:value.type,name:text(value.name,100)||kinds[value.type].label,environment:Object.hasOwn(environments,value.environment)?value.environment:'shared',metadata,archived:value.archived===true,rotation:Math.max(1,Math.min(9999,parseInt(value.rotation,10)||1)),createdAt,updatedAt:date(value.updatedAt||createdAt)};
 }
 function seedItem(vaultId,type,name,environment,metadata,index){return normalizedItem({id:'demo-'+vaultId.replace(':','-')+'-'+index,vaultId,type,name,environment,metadata,createdAt:'2026-11-03T14:10:00.000Z',updatedAt:'2026-11-03T14:10:00.000Z',rotation:1})}
 function seed(){
  const items=[];
  hosts.forEach(h=>{const env=h.env==='Staging'?'staging':h.env==='Development'?'development':h.env==='Productie'?'production':'shared';items.push(seedItem('host:'+h.id,'ssh','SSH · beheer',env,{alias:h.name,username:'demo-admin',keyReference:'demo/ssh/'+h.id,note:'Fictieve sleutelreferentie. De private key blijft buiten dit prototype.'},'ssh'));if(['web01','data01'].includes(h.id))items.push(seedItem('host:'+h.id,'login','Providerconsole','shared',{username:'beheer@example.invalid',site:'https://console.example.invalid',note:'Voorbeeld van servergebonden beheertoegang.'},'provider'))});
  projects.forEach(p=>{items.push(seedItem('project:'+p.id,'login','Supabase · beheer','shared',{username:'beheer@example.invalid',site:'https://supabase.example.invalid',note:'Fictieve Supabase-login voor dit voorbeeldproject.'},'supabase'));items.push(seedItem('project:'+p.id,'database','PostgreSQL · productie','production',{host:p.id+'.db.example.invalid',port:'5432',database:'demo_'+p.id,username:'demo_app',note:'Voorbeeldgegevens; geen bereikbare database.'},'database'));items.push(seedItem('project:'+p.id,'api','Transactionele e-mail','staging',{provider:'Voorbeeldprovider',keyName:p.id+'-staging-mail',note:'Fictieve API-sleutel, uitsluitend voor de interactiedemo.'},'api'))});
  return {version:1,items:items.filter(Boolean),activity:[]};
 }
 try{
  const saved=JSON.parse(businessStore.getItem(storageKey)||'null');
  if(saved?.version===1&&Array.isArray(saved.items)){
   const seen=new Set();
   db.items=saved.items.slice(0,500).map(normalizedItem).filter(item=>{if(!item)return false;const id=item.vaultId+'|'+item.id;if(seen.has(id))return false;seen.add(id);return true});
   db.activity=(Array.isArray(saved.activity)?saved.activity:[]).slice(0,250).filter(a=>a&&scope(a.vaultId)&&Object.hasOwn(eventNames,a.action)&&(!a.itemId||validId(a.itemId))).map(a=>({vaultId:a.vaultId,itemId:a.itemId||'',action:a.action,at:date(a.at)}));
  }else db=seed();
 }catch{db=seed()}
 function save(){try{businessStore.setItem(storageKey,JSON.stringify(db));return true}catch{ctx.toast('Opslag niet beschikbaar. Deze demowijziging blijft alleen in deze sessie.');return false}}
 function record(action,vaultId,itemId=''){
  if(!Object.hasOwn(eventNames,action)||!scope(vaultId))return;
  db.activity.unshift({vaultId,itemId,action,at:new Date().toISOString()});db.activity=db.activity.slice(0,250);
  log('Kluis · '+eventNames[action],vaultId+' · lokaal prototype');
 }
 function persist(action,vaultId,itemId,message){record(action,vaultId,itemId);const ok=save();ctx.render();if(ok)ctx.toast(message||'Demometadata lokaal bewaard.');return ok}
 function guardNavigation(){if(ctx.isModalDirty?.()&&document.querySelector('.modal form')){ctx.requestClose();return false}return true}
 function hideAll(){
  revealed.clear();for(const timer of timers.values())clearTimeout(timer);timers.clear();
  document.querySelectorAll('[data-vault-secret]').forEach(input=>{input.type='password'});
  document.querySelectorAll('[data-action="vault-reveal"]').forEach(el=>{el.textContent='Tonen';el.setAttribute('aria-pressed','false')});
 }
 function hideOne(key){
  revealed.delete(key);clearTimeout(timers.get(key));timers.delete(key);
  document.querySelectorAll('[data-vault-secret]').forEach(input=>{if(input.dataset.vaultSecret===key)input.type='password'});
  document.querySelectorAll('[data-action="vault-reveal"]').forEach(el=>{if(el.dataset.vaultId+'|'+el.dataset.id===key){el.textContent='Tonen';el.setAttribute('aria-pressed','false')}});
 }
 const onVisibility=()=>{if(document.hidden)hideAll()};
 const onPageHide=()=>{hideAll();unlocked.clear()};
 disposeVaultRuntime?.();
 document.addEventListener('visibilitychange',onVisibility);
 window.addEventListener('pagehide',onPageHide);
 disposeVaultRuntime=()=>{hideAll();unlocked.clear();document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('pagehide',onPageHide)};
 function summary(vaultId){
  if(!isAdmin())return '';const v=scope(vaultId);if(!v)return '';
  const count=itemsFor(vaultId).filter(i=>!i.archived).length;
  return `<section class="vault-root vault-summary"><span class="vault-card-icon">${icon('lock')}</span><div><span class="eyebrow">${esc(v.label)}</span><h3>Een eigen plek voor je credentials.</h3><p>${count} ${count===1?'item':'items'} · ${esc(v.name)} · afzonderlijke scope</p><small>Login, database, API-sleutel en SSH-referentie · demo</small></div>${button('Kluis openen '+icon('arrow'),'open',v.id,true)}</section>`;
 }
 function overviewCards(){
  const list=scopes().filter(v=>v.demo&&(overviewKind==='all'||v.kind===overviewKind)&&`${v.name} ${v.label} ${v.env}`.toLowerCase().includes(overviewQuery.toLowerCase()));
  if(!list.length)return empty('Geen kluizen gevonden','Probeer een andere zoekterm of categorie.',button('Filters wissen','overview-clear'));
  return `<div class="vault-grid">${list.map(v=>{const entries=itemsFor(v.id).filter(i=>!i.archived),types=[...new Set(entries.map(i=>kinds[i.type].label))];return `<article class="vault-card panel"><div class="vault-card-meta"><span class="vault-card-icon">${icon(v.kind==='project'?'grid':'server')}</span>${badge(v.kind==='project'?'Project':'VPS',v.kind==='project'?'blue':'unknown')}</div><span class="vault-label">${esc(v.label)}</span><h3>${esc(v.name)}</h3><p>${esc(v.env)} · voorbeeld</p><div class="vault-card-meta"><strong>${entries.length} ${entries.length===1?'item':'items'}</strong><span>${icon('lock')} ${unlocked.has(v.id)?'Demo geopend':'Demo gesloten'}</span></div><small>${esc(types.join(' · ')||'Klaar voor je eerste item')}</small>${button('Kluis openen '+icon('arrow'),'open',v.id)}</article>`}).join('')}</div>`;
 }
 function overview(){
  if(!isAdmin())return '';
  const total=db.items.filter(i=>!i.archived&&!i.vaultId.startsWith('inventory:')).length;
  return `<section class="vault-root"><div class="vault-hero"><div><span class="eyebrow">CREDENTIALS & TOEGANG</span><h2>Alles op de juiste plek.</h2><p>Een eigen kluis voor iedere VPS en ieder project. Helder gescheiden, rustig georganiseerd.</p></div><span class="vault-card-icon">${icon('lock')}</span></div><div class="vault-metrics"><div><strong>${hosts.length}</strong><span>VPS-kluizen</span></div><div><strong>${projects.length}</strong><span>Projectkluizen</span></div><div><strong>${total}</strong><span>Voorbeelditems</span></div><div><strong>Per scope</strong><span>Afzonderlijke toegang gepland</span></div></div>${banner()}<div class="vault-toolbar"><label class="vault-search">${icon('search')}<input type="search" data-vault-search="overview" value="${esc(overviewQuery)}" aria-label="Kluizen zoeken" placeholder="Zoek een VPS of project…"></label><label class="field">Kluis<select data-vault-filter="overview-kind"><option value="all" ${overviewKind==='all'?'selected':''}>Alle kluizen</option><option value="host" ${overviewKind==='host'?'selected':''}>VPS-kluizen</option><option value="project" ${overviewKind==='project'?'selected':''}>Projectkluizen</option></select></label></div><div id="vault-overview-results">${overviewCards()}</div><p class="vault-meta">Je eigen VPS-kluizen vind je bij <strong>Mijn inventaris</strong>. Een projectkluis krijgt geen toegang via de gekoppelde VPS.</p></section>`;
 }
 function filteredItems(){return itemsFor(currentVault).filter(i=>i.archived===archived&&(kindFilter==='all'||i.type===kindFilter)&&(envFilter==='all'||i.environment===envFilter)&&`${i.name} ${kinds[i.type].label} ${environments[i.environment]} ${i.metadata.provider} ${i.metadata.username} ${i.metadata.host}`.toLowerCase().includes(itemQuery.toLowerCase()))}
 function fieldRows(item){
  const m=item.metadata;
  const rows=item.type==='login'?[['Gebruikersnaam',m.username],['Website',m.site]]:item.type==='database'?[['Host',m.host],['Poort',m.port],['Database',m.database],['Gebruikersnaam',m.username]]:item.type==='api'?[['Provider',m.provider],['Sleutelnaam',m.keyName]]:[['SSH-alias',m.alias],['Gebruikersnaam',m.username],['Sleutelreferentie',m.keyReference]];
  return `<dl class="vault-detail-grid">${rows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${label==='Website'&&safeUrl(value)?`<a href="${esc(value)}" target="_blank" rel="noopener noreferrer">${esc(value)} ${icon('external')}</a>`:esc(value||'Niet ingevuld')}</dd></div>`).join('')}</dl>`;
 }
 function recentActivity(vaultId,itemId='',limit=5){
  const entries=db.activity.filter(e=>e.vaultId===vaultId&&(!itemId||e.itemId===itemId)).slice(0,limit);
  return entries.length?`<div class="vault-activity">${entries.map(e=>`<div>${icon('clock')}<span><strong>${esc(eventNames[e.action])}</strong><small>${esc(formatDate(e.at))} · lokaal voorbeeld</small></span></div>`).join('')}</div>`:'<p class="vault-meta">Nog geen lokale activiteit. Voorbeelditems zijn vooraf gevuld.</p>';
 }
 function detailHtml(){
  const entries=filteredItems();let item=entries.find(i=>i.id===selectedItem);if(!item){item=entries[0];selectedItem=item?.id||''}
  if(!item)return empty(archived?'Geen gearchiveerde items':'Nog geen items in deze selectie',archived?'Items die je archiveert verschijnen hier.':'Voeg een voorbeelditem toe of pas je filters aan.',!archived?scopedButton(icon('plus')+' Item toevoegen','add','',true):'');
  const key=revealKey(item),shown=revealed.has(key),v=scope(currentVault);
  return `<div class="vault-detail-head"><div class="vault-item-icon">${icon(kinds[item.type].icon)}</div><div><span class="vault-label">${esc(kinds[item.type].label)}</span><h3>${esc(item.name)}</h3><p>${esc(v.name)}</p></div>${badge(environments[item.environment],item.environment==='production'?'good':'blue')}</div>${item.archived?`<div class="vault-banner">${icon('file')}<span>Dit item is gearchiveerd. Herstel het om de demowaarde weer te gebruiken.</span></div>`:''}${fieldRows(item)}${item.type!=='ssh'&&!item.archived?`<div class="vault-secret"><label class="field">${item.type==='api'?'Voorbeeldsleutel':'Voorbeeldwachtwoord'}<input aria-label="Fictieve ${item.type==='api'?'API-sleutel':'wachtwoordwaarde'}" readonly autocomplete="off" spellcheck="false" type="${shown?'text':'password'}" value="${esc(secret(item))}" data-vault-secret="${esc(key)}"></label><div class="vault-actions">${button(shown?'Verbergen':'Tonen','reveal',item.id,false,`data-vault-id="${esc(currentVault)}" aria-pressed="${shown}"`)}${scopedButton('Kopieer demo','copy',item.id)}</div><small>Fictieve waarde · versie ${item.rotation} · verbergt automatisch na 30 seconden</small></div>`:item.type==='ssh'?`<div class="vault-banner">${icon('shield')}<span>Alleen een verwijzing naar een SSH-key. Er wordt geen private key ingevoerd of opgeslagen.</span></div>`:''}${item.metadata.note?`<div class="vault-note"><span class="vault-label">Notitie · metadata</span><p>${esc(item.metadata.note)}</p></div>`:''}<div class="vault-actions">${item.archived?scopedButton('Item herstellen','restore',item.id,true):scopedButton('Metadata bewerken','edit',item.id)+ (item.type!=='ssh'?scopedButton(icon('refresh')+' Demo vernieuwen','rotate',item.id):'')+scopedButton('Archiveren','archive',item.id)}</div><div class="vault-section-head"><h4>Recente activiteit</h4>${scopedButton('Alle activiteit','activity',item.id)}</div>${recentActivity(currentVault,item.id,3)}<p class="vault-meta">Bijgewerkt ${esc(formatDate(item.updatedAt))} · alleen deze kluis</p>`;
 }
 function itemsHtml(){
  const list=filteredItems();
  return `<div class="vault-section-head"><strong>${list.length} ${list.length===1?'item':'items'}</strong><small>${archived?'Archief':'Actief'}</small></div>${list.map(i=>`<button type="button" class="vault-item ${selectedItem===i.id?'active':''}" data-action="vault-select" data-id="${esc(i.id)}" data-vault-id="${esc(currentVault)}" aria-pressed="${selectedItem===i.id}"><span class="vault-item-icon">${icon(kinds[i.type].icon)}</span><span class="vault-item-main"><strong>${esc(i.name)}</strong><small>${esc(kinds[i.type].label)} · ${esc(environments[i.environment])}</small></span>${icon('chevron')}</button>`).join('')||'<p class="vault-meta">Geen items gevonden.</p>'}`;
 }
 function listToolbar(){return `<div class="vault-toolbar"><label class="vault-search">${icon('search')}<input type="search" data-vault-search="items" value="${esc(itemQuery)}" placeholder="Zoek in deze kluis…" aria-label="Zoeken in deze kluis"></label><label class="field">Type<select data-vault-filter="type"><option value="all">Alle types</option>${Object.entries(kinds).map(([id,k])=>`<option value="${id}" ${kindFilter===id?'selected':''}>${esc(k.label)}</option>`).join('')}</select></label><label class="field">Omgeving<select data-vault-filter="environment"><option value="all">Alle omgevingen</option>${Object.entries(environments).map(([id,label])=>`<option value="${id}" ${envFilter===id?'selected':''}>${label}</option>`).join('')}</select></label><label class="field">Status<select data-vault-filter="archived"><option value="active" ${!archived?'selected':''}>Actief</option><option value="archived" ${archived?'selected':''}>Archief</option></select></label></div>`}
 function modalHeader(v){return `<div class="vault-breadcrumb"><span>${icon(v.kind==='project'?'grid':'server')} ${esc(v.label)}</span><span>${esc(v.env)}</span>${badge(unlocked.has(v.id)?'Demo geopend':'Demo gesloten',unlocked.has(v.id)?'blue':'unknown')}</div>${banner()}`}
 function showMain(){
  if(!isAdmin())return;const v=scope(currentVault);if(!v)return;
  hideAll();
  if(!unlocked.has(v.id)){
   ctx.modal('Kluis · '+v.name,`<div class="vault-root">${modalHeader(v)}<div class="vault-locked"><span class="vault-card-icon">${icon('lock')}</span><span class="eyebrow">AFZONDERLIJKE ${v.kind==='project'?'PROJECT':'VPS'}KLUIS</span><h3>Toegang begint bij deze kluis.</h3><p>Bekijk de beheerflow voor ${esc(v.name)}. Openen is hier een demonstratie, zonder wachtwoordcontrole of echte beveiliging.</p><div class="vault-scope"><span>Eigenaar <strong>${esc(v.owner)}</strong></span><span>Scope <strong>${esc(v.id)}</strong></span><span>Toegang <strong>Admin · prototype</strong></span></div>${scopedButton(icon('lock')+' Demokluis openen','unlock','',true)}<small>Echte autorisatie en MFA worden server-side ingericht.</small></div><div class="modal-actions">${scopedButton('Toegang & scope','access')}${closeButton()}</div></div>`,{size:'wide'});return;
  }
  const detail=detailHtml();
  ctx.modal('Kluis · '+v.name,`<div class="vault-root">${modalHeader(v)}<div class="vault-section-head"><div><h3>${esc(v.name)}</h3><p class="vault-meta">${itemsFor(v.id).filter(i=>!i.archived).length} actieve items · ${esc(v.owner)}</p></div><div class="vault-actions">${scopedButton('Toegang & scope','access')}${scopedButton(icon('plus')+' Item toevoegen','add','',true)}</div></div>${listToolbar()}<div class="vault-layout"><nav class="vault-items" id="vault-items" aria-label="Kluisitems">${itemsHtml()}</nav><section class="vault-detail" id="vault-detail" aria-label="Itemdetails">${detail}</section></div><div class="modal-actions">${scopedButton(icon('lock')+' Demokluis sluiten','lock')}${closeButton()}</div></div>`,{size:'wide'});
 }
 function open(vaultId){if(!isAdmin()||!scope(vaultId)||!guardNavigation())return;hideAll();currentVault=vaultId;selectedItem='';itemQuery='';kindFilter=envFilter='all';archived=false;showMain()}
 function refreshItems(){
  if(!isAdmin()||!unlocked.has(currentVault))return;
  hideAll();const detail=document.getElementById('vault-detail'),list=document.getElementById('vault-items');if(!detail||!list)return;detail.innerHTML=detailHtml();list.innerHTML=itemsHtml();
 }
 function formField(label,name,value='',attrs=''){return `<label class="field">${esc(label)}<input name="${name}" value="${esc(value)}" maxlength="${limits[name]||100}" ${attrs}></label>`}
 function typeFields(type,metadata){
  const f=(label,name,attrs='')=>formField(label,name,metadata[name],attrs);
  return `<div class="vault-type-fields" data-vault-fields="login" ${type!=='login'?'hidden':''}><div class="vault-fields">${f('Gebruikersnaam','username','autocomplete="off" placeholder="beheer@example.invalid"')}${f('Website','site','type="url" placeholder="https://…"')}</div></div><div class="vault-type-fields" data-vault-fields="database" ${type!=='database'?'hidden':''}><div class="vault-fields">${f('Databasehost','host','placeholder="db.example.invalid"')}${f('Poort','port','inputmode="numeric" pattern="[0-9]{1,5}" placeholder="5432"')}${f('Databasenaam','database','placeholder="demo_database"')}${f('Databasegebruiker','dbUsername','autocomplete="off" placeholder="demo_app"')}</div></div><div class="vault-type-fields" data-vault-fields="api" ${type!=='api'?'hidden':''}><div class="vault-fields">${f('Provider','provider','placeholder="Bijvoorbeeld Supabase"')}${f('Sleutelnaam','keyName','placeholder="Bijvoorbeeld staging-service"')}</div></div><div class="vault-type-fields" data-vault-fields="ssh" ${type!=='ssh'?'hidden':''}><div class="vault-fields">${f('SSH-alias','alias','placeholder="demo-web-01"')}${f('SSH-gebruiker','sshUsername','autocomplete="off" placeholder="demo-admin"')}${f('Sleutelreferentie','keyReference','placeholder="Bijvoorbeeld persoonlijke-key / beheer"')}</div><p class="vault-form-help">Een verwijzing of label, geen private key.</p></div>`;
 }
 function editForm(itemId=''){
  const v=scope(currentVault),existing=itemId?itemFor(currentVault,itemId):null;if(!v||!unlocked.has(v.id)||(itemId&&(!existing||existing.archived)))return;
  hideAll();const id=existing?.id||'item-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));
  const item=existing||{id,vaultId:currentVault,type:'login',name:'',environment:'shared',rotation:1,metadata:{}};
  const m={...item.metadata,dbUsername:item.metadata.username||'',sshUsername:item.metadata.username||''};
  ctx.modal(existing?'Kluisitem bewerken':'Nieuw kluisitem',`<div class="vault-root">${modalHeader(v)}<p class="vault-meta">Je bewaart dit item uitsluitend in <strong>${esc(v.name)}</strong>.</p><form id="vault-item-form" class="vault-form" data-vault-id="${esc(v.id)}" data-item-id="${esc(id)}" data-mode="${existing?'edit':'create'}"><div class="vault-fields">${formField('Naam','name',item.name,'required placeholder="Bijvoorbeeld Supabase · beheer"')}<label class="field">Type<select name="type" data-vault-form-type>${Object.entries(kinds).map(([value,k])=>`<option value="${value}" ${item.type===value?'selected':''}>${esc(k.label)}</option>`).join('')}</select></label><label class="field">Omgeving<select name="environment">${Object.entries(environments).map(([value,label])=>`<option value="${value}" ${item.environment===value?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label class="field">Kluis<input readonly value="${esc(v.name)}" aria-label="Geselecteerde kluis"></label></div>${typeFields(item.type,m)}<div class="vault-secret" data-vault-form-secret ${item.type==='ssh'?'hidden':''}><label class="field">Automatisch gegenereerde demowaarde<input readonly type="password" autocomplete="off" value="${esc(secret(item))}" aria-label="Automatisch gegenereerde fictieve waarde"></label><small>Alleen het werkelijke systeem krijgt een invoerveld voor geheimen. Deze demo bewaart uitsluitend metadata.</small></div><label class="field">Notitie<textarea name="note" rows="3" maxlength="1000" placeholder="Doel of beheerafspraken; geen geheimen.">${esc(item.metadata.note||'')}</textarea></label><div class="modal-actions">${scopedButton('Terug naar kluis','back')}<button class="btn primary" type="submit">${existing?'Wijzigingen bewaren':'Item toevoegen'}</button></div></form></div>`,{size:'wide'});
  document.querySelectorAll('#vault-item-form [data-vault-fields]').forEach(group=>group.querySelectorAll('input').forEach(input=>{input.disabled=group.hidden}));
 }
 function accessModal(){
  const v=scope(currentVault);if(!v)return;hideAll();
  ctx.modal('Toegang & scope',`<div class="vault-root">${modalHeader(v)}<div class="vault-detail-head"><span class="vault-card-icon">${icon('shield')}</span><div><span class="vault-label">${esc(v.label)}</span><h3>${esc(v.name)}</h3><p>Rechten worden per kluis ingericht.</p></div></div><dl class="vault-detail-grid"><div><dt>Eigenaar</dt><dd>${esc(v.owner)}</dd></div><div><dt>Afzonderlijke scope</dt><dd>${esc(v.id)}</dd></div><div><dt>Huidige prototype-rol</dt><dd>Admin · demonstratie</dd></div><div><dt>MFA & rechtencontrole</dt><dd>Gepland · server-side</dd></div></dl><div class="vault-banner">${icon('users')}<span>Een gekoppelde VPS geeft geen automatische toegang tot een projectkluis. Toegang tot elke kluis wordt afzonderlijk toegekend.</span></div><div class="vault-scope"><span>Nu <strong>Lokale demo met fictieve waarden</strong></span><span>Echte implementatie <strong>Beveiligde opslag, autorisatie en audit</strong></span></div><div class="modal-actions">${scopedButton('Terug naar kluis','back')}${closeButton()}</div></div>`,{size:'standard'});
 }
 function activityModal(itemId=''){
  const v=scope(currentVault),item=itemId?itemFor(currentVault,itemId):null;if(!v||!unlocked.has(v.id)||(itemId&&!item))return;hideAll();
  ctx.modal('Kluisactiviteit',`<div class="vault-root">${modalHeader(v)}<h3>${esc(item?.name||v.name)}</h3><p class="vault-meta">Handelingen en tijdstippen, zonder credentialwaarden.</p>${recentActivity(v.id,itemId,30)}<div class="modal-actions">${scopedButton('Terug naar kluis','back')}${closeButton()}</div></div>`,{size:'standard'});
 }
 function confirmation(action,item){
  hideAll();const rotation=action==='rotate';
  ctx.modal(rotation?'Demowaarde vernieuwen':'Item archiveren',`<div class="vault-root">${banner()}<h3>${esc(item.name)}</h3><p>${rotation?'Maak een nieuwe fictieve voorbeeldwaarde aan. Dit verandert geen wachtwoord of sleutel bij een provider.':'Verplaats dit item naar het archief van deze kluis. Je kunt het later herstellen.'}</p><p class="vault-meta">${esc(scope(currentVault).name)} · ${esc(environments[item.environment])}</p><div class="modal-actions">${scopedButton('Terug','back')}${scopedButton(rotation?'Demo vernieuwen':'Archiveren',rotation?'confirm-rotate':'confirm-archive',item.id,true)}</div></div>`,{size:'small'});
 }
 function copyDummy(item){
  const value=secret(item);
  const done=()=>{if(!isAdmin())return;record('copied',item.vaultId,item.id);save();ctx.toast('Fictieve demowaarde gekopieerd.');};
  const fallback=()=>{if(!isAdmin()||currentVault!==item.vaultId||!unlocked.has(item.vaultId))return;const input=Array.from(document.querySelectorAll('[data-vault-secret]')).find(el=>el.dataset.vaultSecret===revealKey(item));if(input){input.type='text';input.focus();input.select();revealed.add(revealKey(item));clearTimeout(timers.get(revealKey(item)));timers.set(revealKey(item),setTimeout(()=>hideOne(revealKey(item)),30000));ctx.toast('Selectie gereed. Kopieer de fictieve waarde handmatig.')}else ctx.toast('Kopiëren is hier niet beschikbaar. Open het item opnieuw.');};
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(done,fallback);else fallback();
 }
 function action(name,el){
  if(!name.startsWith('vault-'))return false;if(!isAdmin())return true;
  const n=name.slice(6),id=el?.dataset?.id||'';
  if(!guardNavigation())return true;
  if(n==='open'){open(id);return true}
  if(n==='overview-clear'){overviewQuery='';overviewKind='all';ctx.render();return true}
  const v=scope(currentVault);if(!v||el?.dataset?.vaultId!==currentVault)return true;
  if(n==='access'){accessModal();return true}
  if(n==='back'){showMain();return true}
  if(n==='unlock'){unlocked.add(v.id);record('unlocked',v.id);save();ctx.render();showMain();ctx.toast('Demokluis geopend. Dit is een gesimuleerde toegangsstap.');return true}
  if(!unlocked.has(v.id))return true;
  if(n==='lock'){hideAll();unlocked.delete(v.id);record('locked',v.id);save();ctx.render();showMain();ctx.toast('Demokluis gesloten; voorbeeldwaarden zijn verborgen.');return true}
  if(n==='add'){editForm();return true}
  if(n==='activity'&&!id){activityModal();return true}
  const item=itemFor(currentVault,id);if(!item)return true;
  if(n==='select'){selectedItem=item.id;refreshItems();return true}
  if(n==='activity'){activityModal(item.id);return true}
  if(n==='restore'&&item.archived){item.archived=false;item.updatedAt=new Date().toISOString();persist('restored',v.id,item.id,'Item hersteld in de lokale demokluis.');archived=false;kindFilter=envFilter='all';itemQuery='';selectedItem=item.id;showMain();return true}
  if(item.archived)return true;
  if(n==='edit')editForm(item.id);
  else if(n==='archive'||n==='rotate'&&item.type!=='ssh')confirmation(n,item);
  else if(n==='confirm-archive'){hideAll();item.archived=true;item.updatedAt=new Date().toISOString();persist('archived',v.id,item.id,'Item lokaal gearchiveerd. Je kunt het herstellen via Archief.');selectedItem='';showMain()}
  else if(n==='confirm-rotate'&&item.type!=='ssh'){hideAll();item.rotation=Math.min(9999,item.rotation+1);item.updatedAt=new Date().toISOString();persist('rotated',v.id,item.id,'Nieuwe fictieve waarde gemaakt. Geen providercredential gewijzigd.');showMain()}
  else if(n==='reveal'&&item.type!=='ssh'){
   const key=revealKey(item);if(revealed.has(key)){hideOne(key);return true}
   revealed.add(key);const input=Array.from(document.querySelectorAll('[data-vault-secret]')).find(input=>input.dataset.vaultSecret===key);if(input)input.type='text';el.textContent='Verbergen';el.setAttribute('aria-pressed','true');timers.set(key,setTimeout(()=>hideOne(key),30000));record('revealed',v.id,item.id);save();
  }else if(n==='copy'&&item.type!=='ssh')copyDummy(item);
  return true;
 }
 function submit(form,data){
  if(form.id!=='vault-item-form')return false;if(!isAdmin())return true;
  const vaultId=form.dataset.vaultId,id=form.dataset.itemId,mode=form.dataset.mode;
  if(vaultId!==currentVault||!scope(vaultId)||!unlocked.has(vaultId)||!validId(id))return true;
  const existing=itemFor(vaultId,id);if(mode==='edit'&&(!existing||existing.archived)||mode==='create'&&existing||!['create','edit'].includes(mode))return true;
  const value=name=>text(data.get(name),limits[name]||100),type=value('type'),environment=value('environment');
  if(!value('name')||!Object.hasOwn(kinds,type)||!Object.hasOwn(environments,environment)){ctx.toast('Vul een naam, type en omgeving in.');return true}
  const metadata=Object.fromEntries(metadataFields.map(name=>[name,'']));metadata.note=value('note');
  if(type==='login'){metadata.username=value('username');metadata.site=value('site');if(metadata.site&&!safeUrl(metadata.site)){ctx.toast('Gebruik voor de website een HTTPS-link zonder inloggegevens.');return true}}
  if(type==='database'){metadata.host=value('host');metadata.port=value('port');metadata.database=value('database');metadata.username=text(data.get('dbUsername'),limits.username);if(metadata.port&&(!/^\d{1,5}$/.test(metadata.port)||Number(metadata.port)<1||Number(metadata.port)>65535)){ctx.toast('Gebruik een poort tussen 1 en 65535.');return true}}
  if(type==='api'){metadata.provider=value('provider');metadata.keyName=value('keyName')}
  if(type==='ssh'){metadata.alias=value('alias');metadata.username=text(data.get('sshUsername'),limits.username);metadata.keyReference=value('keyReference')}
  // Deliberately ignore all credential/secret fields, including injected payloads.
  const now=new Date().toISOString(),item=normalizedItem({id,vaultId,name:value('name'),type,environment,metadata,archived:false,rotation:existing?.rotation||1,createdAt:existing?.createdAt||now,updatedAt:now});
  if(existing)db.items[db.items.indexOf(existing)]=item;else db.items.push(item);
  record(existing?'edited':'created',vaultId,id);const ok=save();selectedItem=id;kindFilter=envFilter='all';itemQuery='';archived=false;ctx.closeModal();ctx.render();showMain();if(ok)ctx.toast('Demometadata lokaal bewaard. De credentialwaarde blijft fictief.');return true;
 }
 function input(e){
  const target=e.target,kind=target?.dataset?.vaultSearch;if(!kind)return false;if(!isAdmin())return true;
  if(kind==='overview'){overviewQuery=text(target.value,200);const results=document.getElementById('vault-overview-results');if(results)results.innerHTML=overviewCards()}
  if(kind==='items'&&unlocked.has(currentVault)){itemQuery=text(target.value,200);refreshItems()}
  return true;
 }
 function change(e){
  const target=e.target;if(!target?.matches?.('[data-vault-filter],[data-vault-form-type]'))return false;if(!isAdmin())return true;
  if(target.matches('[data-vault-form-type]')){
   const form=target.closest('#vault-item-form');if(!form||form.dataset.vaultId!==currentVault||!unlocked.has(currentVault)||!Object.hasOwn(kinds,target.value))return true;
   form.querySelectorAll('[data-vault-fields]').forEach(group=>{group.hidden=group.dataset.vaultFields!==target.value;group.querySelectorAll('input').forEach(input=>{input.disabled=group.hidden})});const demo=form.querySelector('[data-vault-form-secret]');if(demo)demo.hidden=target.value==='ssh';return true;
  }
  const filter=target.dataset.vaultFilter,value=target.value;
  if(filter==='overview-kind'&&['all','host','project'].includes(value)){overviewKind=value;const results=document.getElementById('vault-overview-results');if(results)results.innerHTML=overviewCards();return true}
  if(!unlocked.has(currentVault))return true;
  if(filter==='type'&&(value==='all'||Object.hasOwn(kinds,value)))kindFilter=value;
  if(filter==='environment'&&(value==='all'||Object.hasOwn(environments,value)))envFilter=value;
  if(filter==='archived'&&['active','archived'].includes(value))archived=value==='archived';
  refreshItems();return true;
 }
 return {overview,summary,open,action,submit,input,change};
}
