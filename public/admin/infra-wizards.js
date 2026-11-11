import {hasBackofficePermission} from './admin-paths.js';
import {realDataMode} from './empty-state.js';
import {businessStore} from './business-store.js';
import {deployWizard} from './deploy-wizard.js';
import {hardeningWizard} from './hardening-wizard.js';

export function createInfraWizards(ctx,{onComplete=()=>''}={}){
 const {escape:esc,icon}=ctx.h;
 const canWrite=()=>!realDataMode||ctx.session?.actor?.role==='admin'&&hasBackofficePermission(ctx.session.actor,'state.write');
 const defs={deploy:deployWizard(ctx.h),hardening:hardeningWizard(ctx.h)};
 const key='dg-midnight-infra-wizards-v1';
 const signs={deploy:'layers',hardening:'shield'};
 let items=[],active=null;
 const own=(obj,k)=>Object.hasOwn(obj,k);
 const admin=()=>ctx.getState().role==='admin'&&ctx.getState().page==='infrastructure';
 const now=()=>new Date().toISOString();
 const safe=(x,n=2000)=>typeof x==='string'?x.slice(0,n):x===true;
 const fields=(step,values)=>typeof step.fields==='function'?step.fields(values):step.fields||[];
 const fieldLimit=f=>Math.min(2000,Number(f.maxLength)||300);
 const label=(record)=>record.values.projectName||record.values.hostName||defs[record.kind].title;
 const isSecret=value=>typeof value==='string'&&/(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|github_pat_[A-Za-z0-9_]{24,}|gh[pousr]_[A-Za-z0-9]{24,}|sb_secret_[A-Za-z0-9_\-]{8,}|sk-(?:proj-)?[A-Za-z0-9_\-]{24,}|(?:https?|postgres(?:ql)?|ssh):\/\/[^\s/@:]+:[^\s/@]+@)/i.test(value);
 function readValues(def,raw){
  const allowed={};
  for(const step of def.steps)for(const f of fields(step,{...raw,...allowed})){
   const val=raw?.[f.name];
   if(f.type==='checkbox')allowed[f.name]=val===true||val===undefined&&f.default===true;
   else if(!isSecret(val))allowed[f.name]=typeof val==='string'?safe(val,fieldLimit(f)):String(f.default??'');
  }
  return allowed;
 }
 try{const data=JSON.parse(businessStore.getItem(key)||'[]');if(Array.isArray(data))items=data.slice(0,40).filter(x=>x&&own(defs,x.kind)&&typeof x.id==='string'&&x.values&&typeof x.values==='object').map(x=>({id:x.id.slice(0,100),kind:x.kind,step:Math.max(0,Math.min(defs[x.kind].steps.length-1,Number(x.step)||0)),values:readValues(defs[x.kind],x.values),updated:String(x.updated||''),done:x.done===true,example:x.example===true,link:typeof x.link==='string'?x.link.slice(0,300):''}));}catch{}
 const btn=(caption,action,id='',primary=false,attrs='')=>!canWrite()&&['start','example','edit','save','back'].includes(action)?'':`<button type="button" class="btn ${primary?'primary':''}" data-action="wiz-${action}" data-id="${esc(id)}" ${attrs}>${caption}</button>`;
 const status=(text,tone='unknown')=>`<span class="infra-state ${tone}"><i aria-hidden="true"></i>${esc(text)}</span>`;
 const textDate=(d)=>Number.isFinite(new Date(d).valueOf())?new Date(d).toLocaleString('nl-NL',{dateStyle:'short',timeStyle:'short'}):'Zojuist';
 const demoLine=()=>`<div class="wiz-notice">${icon('shield')}<span><strong>${realDataMode?'Voorbereiding · servermetadata':'Lokale voorbereiding'}</strong> · De wizard bewaart wat je invult of zelf controleert. Hij maakt geen verbinding met GitHub of een VPS. Vul geen geheimen in.</span></div>`;
 function persist(){try{businessStore.setItem(key,JSON.stringify(items));return true}catch{ctx.toast('Opslag niet beschikbaar. Het dossier blijft alleen in deze sessie.');return false}}
 function saveRecord(){
  active.updated=now();items=[{...active,values:{...active.values}},...items.filter(x=>x.id!==active.id)].slice(0,40);return persist();
 }
 function shortcut(kind){const w=defs[kind];if(!w)return '';return `<div class="wiz-shortcut">${icon(signs[kind])}<span><strong>${esc(w.title)}</strong><small>${kind==='deploy'?'Vier GitHub Variables per omgeving, van intake tot releasebewijs.':'De vaste VPS-standaard, van consoleherstel tot overdracht.'}</small></span>${btn('Wizard starten '+icon('arrow'),'start',kind,true)}</div>`;}
 function overview(){
  return `<section class="wiz-root"><div class="wiz-hero"><div><span class="eyebrow">DG STANDAARDEN · NOVEMBER 2026</span><h2>Installatiewizards.</h2><p>Doorloop dezelfde controles voor ieder project en iedere VPS. Bewaar je voortgang en lever een duidelijk dossier op.</p></div><span class="wiz-hero-icon">${icon('layers')}</span></div><div class="wiz-cards">${Object.values(defs).map(w=>`<article class="panel wiz-card"><div class="wiz-card-top"><span class="wiz-card-icon">${icon(signs[w.id])}</span>${status(w.steps.length+' stappen','blue')}</div><span class="eyebrow">${w.id==='deploy'?'RELEASEPROCEDURE':'VEILIGHEIDSBASELINE'}</span><h3>${esc(w.title)}</h3><p>${esc(w.description)}</p><div class="wiz-card-meta">${w.id==='deploy'?'Dev-VPS → CI → staging → productie':'Console → Tailscale → firewall → beheer'}</div><div class="wiz-actions">${btn('Start wizard '+icon('arrow'),'start',w.id,true)}${w.example?btn('Probeer voorbeeld','example',w.id):''}</div></article>`).join('')}</div><section class="panel wiz-dossiers"><header><div><span class="eyebrow">${realDataMode?'OP DE SERVER':'OP DIT APPARAAT'}</span><h3>Opgeslagen dossiers</h3></div>${status(items.length+' dossiers')}</header>${items.length?items.map(r=>`<div class="wiz-dossier"><span class="wiz-card-icon">${icon(signs[r.kind])}</span><div><strong>${esc(label(r))}</strong><small>${esc(defs[r.kind].title)} · ${esc(textDate(r.updated))}${r.example?' · voorbeeld':''}</small></div>${status(r.done?'Dossier bewaard':`Stap ${r.step+1} van ${defs[r.kind].steps.length}`,r.done?'blue':'unknown')}${btn(r.done?'Dossier bekijken':'Verdergaan','resume',r.id)}</div>`).join(''):`<div class="wiz-empty">${icon('file')}<span><strong>Nog geen dossiers</strong><small>Een bewaarde wizard verschijnt hier om later verder te gaan.</small></span></div>`}</section>${demoLine()}</section>`;
 }
 function renderField(f,v,idx){
  const id='wiz-field-'+idx, attr=`id="${id}" name="${esc(f.name)}" ${f.required?'required':''} ${f.help?`aria-describedby="${id}-help"`:''}`;
  const help=f.help?`<small id="${id}-help">${esc(f.help)}</small>`:'';
  if(f.type==='checkbox')return `<div class="wiz-check"><input type="checkbox" ${attr} ${v?'checked':''}><label for="${id}"><strong>${esc(f.label)}</strong>${help}</label></div>`;
  let control='';
  if(f.type==='select')control=`<select ${attr}>${(f.options||[]).map(o=>`<option value="${esc(o.value)}" ${String(v)===String(o.value)?'selected':''}>${esc(o.label)}</option>`).join('')}</select>`;
  else if(f.type==='textarea')control=`<textarea ${attr} rows="3" maxlength="${fieldLimit(f)}" placeholder="${esc(f.placeholder||'')}">${esc(v||'')}</textarea>`;
  else{
   const type=['text','url','number','date'].includes(f.type)?f.type:'text';
   control=`<input ${attr} type="${type}" value="${esc(v??'')}" maxlength="${fieldLimit(f)}" placeholder="${esc(f.placeholder||'')}" autocomplete="off" ${f.pattern?`pattern="${esc(f.pattern)}"`:''} ${f.min!==undefined?`min="${esc(f.min)}"`:''} ${f.max!==undefined?`max="${esc(f.max)}"`:''} ${f.step!==undefined?`step="${esc(f.step)}"`:''}>`;
  }
  return `<label for="${id}" class="field wiz-field ${f.span===2?'wiz-full':''}"><span>${esc(f.label)}${f.required?' <span class="wiz-required" aria-hidden="true">*</span>':''}</span>${control}${help}</label>`;
 }
 function show(error=''){
  if(!active||!admin())return;if(!canWrite()){showResult();return;}const def=defs[active.kind],step=def.steps[active.step],last=active.step===def.steps.length-1;
  const progress=Math.round((active.step+1)/def.steps.length*100);
  ctx.modal(def.title,`<div class="wiz-root wiz-dialog"><div class="wiz-progress"><span><strong>Stap ${active.step+1} van ${def.steps.length}</strong><small>${esc(def.version||'DG Webservices')}${active.example?' · ingevuld voorbeeld':''}</small></span><div role="progressbar" aria-label="Wizardvoortgang" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><i style="width:${progress}%"></i></div></div><div class="wiz-layout"><aside class="wiz-steps" aria-label="Stappen">${def.steps.map((s,i)=>`<div class="wiz-step ${i===active.step?'current':''} ${i<active.step?'past':''}" ${i===active.step?'aria-current="step"':''}><span>${i+1}</span><strong>${esc(s.title)}</strong></div>`).join('')}</aside><form id="wiz-step-form" data-record="${esc(active.id)}"><div class="wiz-step-title"><span class="eyebrow">STAP ${String(active.step+1).padStart(2,'0')}</span><h3>${esc(step.title)}</h3>${step.description?`<p>${esc(step.description)}</p>`:''}</div>${step.content?.(active.values)||''}<div class="wiz-fields">${fields(step,active.values).map((f,i)=>renderField(f,active.values[f.name]??f.default,i)).join('')}</div><div class="wiz-error" role="alert" ${error?'':'hidden'}>${esc(error)}</div><div class="wiz-caption">${icon('lock')} Alleen metadata en eigen controlebevindingen · geen uitvoering</div><div class="modal-actions wiz-footer">${active.step?btn('Vorige','back'):''}${btn('Bewaar en sluit','save')}<button class="btn primary" type="submit">${last?'Dossier bewaren':'Volgende'} ${icon(last?'check':'arrow')}</button></div></form></div></div>`,{size:'wide'});
 }
 function fail(message){const el=document.querySelector('#wiz-step-form .wiz-error');if(el){el.textContent=message;el.hidden=false;el.tabIndex=-1;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest'});}else ctx.toast(message);}
 function gather(form,data){
  const def=defs[active.kind],next={...active.values};
  for(const f of fields(def.steps[active.step],active.values)){
   const v=f.type==='checkbox'?data.has(f.name):String(data.get(f.name)??'').trim().slice(0,fieldLimit(f));
   if(isSecret(v)){fail('Verwijder de sleutel of inloggegevens. Gebruik een verwijzing zonder geheime waarde.');return false;}
   next[f.name]=v;
  }
  const currentFields=fields(def.steps[active.step],active.values);
  const changed=currentFields.filter(f=>next[f.name]!==active.values[f.name]);
  if(changed.length){
   for(const later of def.steps.slice(active.step+1))for(const f of fields(later,next))if(f.type==='checkbox'&&f.name!=='registerInDg')next[f.name]=false;
   const identityFields=new Set(['hostName','providerId','sourceSha','acceptedSha']);
   if(changed.some(f=>identityFields.has(f.name)))for(const f of currentFields)if(f.type==='checkbox'&&active.values[f.name]===true&&next[f.name]===true)next[f.name]=false;
  }
  active.values=next;return true;
 }
 function resultFor(r){return defs[r.kind].result(r.values);}
 function report(r){const result=resultFor(r);return `${result.report}${r.link?`\n\nDG-beheer: ${r.link}`:''}\n\nBron: ${defs[r.kind].version||'DG Webservices'} · Lokaal dossier; geen externe uitvoering of meting.\n`;}
 function showResult(){
  const result=resultFor(active);
  ctx.modal(result.title||'Wizarddossier',`<section class="wiz-root wiz-result"><div class="wiz-result-head"><span class="wiz-card-icon">${icon('file')}</span><div><span class="eyebrow">DOSSIER · ${active.example?'VOORBEELD':realDataMode?'SERVERREGISTRATIE':'LOKALE REGISTRATIE'}</span><h3>${esc(label(active))}</h3><p>${esc(result.summary||'Voorbereiding vastgelegd.')}</p></div></div>${active.link?`<div class="wiz-notice">${icon('server')}<span>${esc(active.link)}</span></div>`:''}${demoLine()}<label class="field">Dossierinhoud<textarea class="wiz-report" readonly rows="12" aria-label="Dossierinhoud">${esc(report(active))}</textarea></label><div class="modal-actions">${active.link.startsWith('VPS-metadata')?'<button class="btn" type="button" data-action="infra-open-inventory">Mijn inventaris</button>':''}${btn('Dossier bewerken','edit')}${btn(icon('file')+' Download Markdown','download')}${btn(icon('check')+' Kopieer dossier','copy','',true)}</div></section>`,{size:'wide'});
 }
 function action(name,el){
  if(!name.startsWith('wiz-'))return false;if(!admin())return true;
  const n=name.slice(4),id=el?.dataset?.id||'';
  if(!canWrite()&&['start','example','edit','save','back'].includes(n)){ctx.toast('Je hebt alleen leesrecht voor installatiedossiers.');return true;}
  if((n==='start'||n==='example')&&own(defs,id)){
   const example=n==='example';active={id:globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),kind:id,step:0,values:readValues(defs[id],example?defs[id].example||{}:{}),updated:now(),done:false,example,link:''};show();return true;
  }
  if(n==='resume'){
   const r=items.find(x=>x.id===id);if(!r)return true;active={...r,values:{...r.values}};if(r.done||!canWrite())showResult();else show();return true;
  }
  if(!active)return true;
  if(n==='edit'&&active.done){active={...active,values:{...active.values},step:0,done:false,link:''};show();return true;}
  if(n==='copy'&&active.done){const value=report(active);const fallback=()=>{const area=document.querySelector('.wiz-report');area?.focus();area?.select();ctx.toast('Dossier geselecteerd. Kopieer met Ctrl+C of Cmd+C.');};if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(()=>ctx.toast('Dossier gekopieerd.'),fallback);else fallback();return true;}
  if(n==='download'&&active.done){const blob=new Blob([report(active)],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`DG-${active.kind==='deploy'?'projectuitrol':'vps-hardening'}-dossier.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;}
  const form=document.getElementById('wiz-step-form');if(!form||form.dataset.record!==active.id)return true;
  if((n==='save'||n==='back')&&gather(form,new FormData(form))){
   if(n==='back'){active.step=Math.max(0,active.step-1);saveRecord();show();}
   else{const ok=saveRecord();ctx.closeModal();ctx.render();if(ok)ctx.toast(realDataMode?'Wizardconcept op de server bewaard.':'Wizardconcept lokaal bewaard.');}
  }
  return true;
 }
 function submit(form,data){
  if(form.id!=='wiz-step-form')return false;if(!admin()||!canWrite()||!active||form.dataset.record!==active.id)return true;
  if(!gather(form,data))return true;
  const def=defs[active.kind],step=def.steps[active.step],error=step.validate?.(active.values);
  if(error){fail(error);return true;}
  if(active.step<def.steps.length-1){active.step++;saveRecord();show();return true;}
  // Recheck earlier cross-field rules before a dossier or inventory record is saved.
  for(let i=0;i<def.steps.length;i++){
   const s=def.steps[i],missing=fields(s,active.values).find(f=>f.required&&!active.values[f.name]),err=missing?`Vul ${missing.label} in.`:s.validate?.(active.values);
   if(err){active.step=i;show(err);return true;}
  }
  active.done=true;const ok=saveRecord();
  if(ok){active.link=onComplete(active.kind,resultFor(active).metadata||{},active.example)||'';if(active.link)saveRecord();ctx.toast(realDataMode?'Wizarddossier op de server bewaard.':'Wizarddossier lokaal bewaard.');}
  ctx.render();showResult();return true;
 }
 return {overview,shortcut,action,submit};
}
