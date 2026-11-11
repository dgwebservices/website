import { randomBytes, randomUUID } from 'node:crypto';
import { hash } from './store.mjs';
import { fail, rejectSecrets } from './validation.mjs';

const categories=['Technische vraag','Verhuizing','E-mail','Facturatie','Algemene vraag'];
const assignees=['Nog niet toegewezen','DG Support','DG Techniek','DG Administratie'];
const statuses={new:'Nieuw',open:'In behandeling',waiting:'Wacht op klant',resolved:'Opgelost'};
const priorities=new Set(['normal','high','urgent']);
const fixtureCatalog=[
  {id:'fixture-client-organization',name:'Duindorp SV',services:['Hosting Plus · duindorpsv.nl','Hosting Start · clubhuis.online','Domeinen','E-mail','Facturatie','Algemene vraag']},
  {id:'fixture-org-studio-noord',name:'Studio Noord',services:['Hosting Zakelijk · studionoord.nl','Domeinen','E-mail','Facturatie','Algemene vraag']},
  {id:'fixture-org-bakkerij-west',name:'Bakkerij West',services:['Hosting Start · bakkerijwest.nl','Domeinen','E-mail','Facturatie','Algemene vraag']},
];
const generalServices=['Algemene vraag','Domeinen','E-mail','Facturatie'];
const time=()=>new Date().toISOString();
const own=(value,key)=>Object.hasOwn(value,key);
function plaintext(value,label,max,{required=true,singleLine=false}={}){
  if(typeof value!=='string')fail(422,'INVALID_SUPPORT_FIELD',`${label} moet tekst zijn.`);
  const result=value.replace(/\r\n/g,'\n').trim();
  if(required&&!result||result.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result)||singleLine&&/[\r\n]/.test(result))fail(422,'INVALID_SUPPORT_FIELD',`${label} is leeg, te lang of bevat ongeldige tekens.`);
  rejectSecrets(result);return result;
}
function fields(value,allowed){
  rejectSecrets(value);
  for(const key of Object.keys(value)){
    if(key==='attachments'&&Array.isArray(value[key])&&!value[key].length)continue;
    if(key==='attachments')fail(422,'ATTACHMENTS_DISABLED','Bijlagen worden niet geüpload of bewaard in deze lokale supportmodule.');
    if(!allowed.includes(key))fail(422,'UNKNOWN_SUPPORT_FIELD','Een supportveld is niet toegestaan.',{fieldErrors:{[key]:'Onbekend veld'}});
  }
}

export function createSupportService({db,tx,audit,actor}){
  const staff=['admin','support'].includes(actor.role),client=actor.role==='client';
  const principalScope=JSON.stringify([actor.id,actor.role,actor.organizationId]);
  const has=permission=>(staff||client)&&actor.permissions.includes(permission);
  const requirePermission=permission=>{if(!has(permission))fail(403,'FORBIDDEN','Deze serversessie mag deze supportactie niet uitvoeren.');};
  const internal=staff&&has('support.ticket.internal_note');
  const visible=row=>row&&row.workspace_id===actor.workspaceId&&(staff||client&&row.organization_id===actor.organizationId);
  const lookup=id=>{requirePermission('support.ticket.read');const row=db.prepare('SELECT * FROM support_tickets WHERE workspace_id=? AND id=?').get(actor.workspaceId,id);if(!visible(row))fail(404,'NOT_FOUND','Supportverzoek niet gevonden.');return row;};
  function organization(id){
    if(typeof id!=='string'||!id||id.length>128)fail(404,'NOT_FOUND','Organisatie niet gevonden.');
    if(client&&id!==actor.organizationId)fail(404,'NOT_FOUND','Organisatie niet gevonden.');
    const fixture=fixtureCatalog.find(item=>item.id===id);
    if(fixture)return{...fixture,fixture:true};
    const row=db.prepare('SELECT id,name FROM local_customer_orgs WHERE workspace_id=? AND id=?').get(actor.workspaceId,id);
    if(!row)fail(404,'NOT_FOUND','Organisatie niet gevonden.');
    return{id:row.id,name:row.name,services:generalServices,fixture:false};
  }
  function bindOrganization(item){
    db.prepare('INSERT INTO support_organizations VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id,id) DO UPDATE SET name=excluded.name,services=excluded.services').run(actor.workspaceId,item.id,item.name,item.fixture?'fixture':'registry',item.fixture?null:item.id,JSON.stringify(item.services));
  }
  function messages(row,summary=false){
    const suffix=summary?' ORDER BY event_order DESC LIMIT 1':' ORDER BY event_order';
    const publicRows=db.prepare('SELECT id,author,body,at,type,event_order FROM support_public_messages WHERE workspace_id=? AND ticket_id=?'+suffix).all(actor.workspaceId,row.id).map(item=>({...item,visibility:'public',attachments:[]}));
    const notes=internal?db.prepare('SELECT id,author,body,at,type,event_order FROM support_internal_notes WHERE workspace_id=? AND ticket_id=?'+suffix).all(actor.workspaceId,row.id).map(item=>({...item,visibility:'internal',attachments:[]})):[];
    const result=[...publicRows,...notes].sort((a,b)=>a.event_order-b.event_order);
    const count=db.prepare('SELECT COUNT(*) AS n FROM support_public_messages WHERE workspace_id=? AND ticket_id=?').get(actor.workspaceId,row.id).n+(internal?db.prepare('SELECT COUNT(*) AS n FROM support_internal_notes WHERE workspace_id=? AND ticket_id=?').get(actor.workspaceId,row.id).n:0);
    return{items:(summary?result.slice(-1):result).map(({event_order,...item})=>item),count};
  }
  function dto(row,summary=false){
    const org=organization(row.organization_id),thread=messages(row,summary);
    return{id:row.id,organizationId:row.organization_id,client:org.name,service:row.service,subject:row.subject,category:row.category,priority:row.priority,status:row.status,assignee:internal?row.assignee:'DG Support',revision:internal?row.revision:row.public_revision,createdAt:row.created_at,updatedAt:internal?row.updated_at:row.public_updated_at,messageCount:thread.count,messages:thread.items,historyComplete:true,historyLimit:internal?1000:500,fixture:org.fixture,mode:'local_fixture',attachmentsEnabled:false,emailEnabled:false};
  }
  function revision(body,row){if(!Number.isInteger(body.revision)||body.revision!==(internal?row.revision:row.public_revision))fail(409,'REVISION_CONFLICT','Het supportverzoek is gewijzigd. Laad de actuele gegevens.',{current:dto(row)});}
  function operation(path,body,key,requestId,action){
    if(typeof key!=='string'||!/^[A-Za-z0-9_.:-]{8,128}$/.test(key))fail(422,'IDEMPOTENCY_REQUIRED','Gebruik een unieke Idempotency-Key van 8 tot 128 tekens.');
    // A cached staff DTO must never survive revocation of internal visibility.
    const fingerprint=hash({method:'support-command',path,body,principalScope,internalVisibility:internal});
    return tx(()=>{
      const old=db.prepare('SELECT * FROM idempotency WHERE workspace_id=? AND actor_id=? AND key=?').get(actor.workspaceId,actor.id,key);
      if(old){if(old.fingerprint!==fingerprint)fail(409,'IDEMPOTENCY_CONFLICT','Deze Idempotency-Key hoort bij andere gegevens.');return{status:old.status,value:JSON.parse(old.response)};}
      const result=action();db.prepare('INSERT INTO idempotency VALUES(?,?,?,?,?,?,?)').run(actor.workspaceId,actor.id,key,fingerprint,result.status,JSON.stringify(result.value),time());return result;
    });
  }
  function addMessage(row,body,visibility,type='message',at=time()){
    const table=visibility==='internal'?'support_internal_notes':'support_public_messages';
    const author=visibility==='internal'?'DG Support':staff?'Team DG Webservices':organization(row.organization_id).name;
    const order=db.prepare('SELECT COALESCE(MAX(event_order),0)+1 AS n FROM (SELECT event_order FROM support_public_messages WHERE workspace_id=? AND ticket_id=? UNION ALL SELECT event_order FROM support_internal_notes WHERE workspace_id=? AND ticket_id=?)').get(actor.workspaceId,row.id,actor.workspaceId,row.id).n;
    // Private note volume must not change whether a customer can post publicly.
    const count=db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE workspace_id=? AND ticket_id=?`).get(actor.workspaceId,row.id).n;
    if(count>=500)fail(409,'SUPPORT_THREAD_LIMIT','Dit lokale verzoek heeft zijn maximale zichtbare berichtgeschiedenis bereikt.');
    db.prepare(`INSERT INTO ${table} VALUES(?,?,?,?,?,?,?,?)`).run(randomUUID(),actor.workspaceId,row.id,author,body,at,type,order);
  }
  function clearDraft(key,body){
    const draft=db.prepare('SELECT * FROM support_drafts WHERE workspace_id=? AND principal_scope=? AND key=?').get(actor.workspaceId,principalScope,key);
    if(body.draftRevision!==undefined&&(!Number.isInteger(body.draftRevision)||body.draftRevision!==(draft?.revision||0)))fail(409,'DRAFT_CONFLICT','Het supportconcept is gewijzigd.',{current:draftDto(draft,key)});
    if(!draft)return undefined;
    const saved=JSON.parse(draft.value),normalizedBody=body.body.replace(/\r\n/g,'\n').trim();
    if(saved.body!==normalizedBody)return undefined;
    if(body.draftRevision===undefined&&Object.entries(saved).some(([field,value])=>typeof body[field]!=='string'||body[field].replace(/\r\n/g,'\n').trim()!==value))return undefined;
    const revision=draft.revision+1;
    db.prepare('UPDATE support_drafts SET value=?,revision=?,updated_at=? WHERE workspace_id=? AND principal_scope=? AND key=?').run('{}',revision,time(),actor.workspaceId,principalScope,key);
    return{key,value:{},revision};
  }
  function bump(row,{publicChange=false,status=row.status,priority=row.priority,assignee=row.assignee,at=time()}={}){
    db.prepare('UPDATE support_tickets SET status=?,priority=?,assignee=?,revision=revision+1,public_revision=public_revision+?,updated_at=?,public_updated_at=? WHERE workspace_id=? AND id=? AND revision=?').run(status,priority,assignee,publicChange?1:0,at,publicChange?at:row.public_updated_at,actor.workspaceId,row.id,row.revision);
    return lookup(row.id);
  }
  function catalog(){
    requirePermission('support.ticket.read');
    const items=client?[organization(actor.organizationId)]:[...fixtureCatalog.map(item=>({...item,fixture:true})),...db.prepare('SELECT id,name FROM local_customer_orgs WHERE workspace_id=? ORDER BY name,id LIMIT 500').all(actor.workspaceId).map(row=>({...row,fixture:false,services:generalServices}))];
    return{items,assignees:staff?assignees:[],categories,capabilities:{isStaff:staff,canCreate:has('support.ticket.create'),canReply:has('support.ticket.reply'),canManage:staff&&has('support.ticket.manage'),canInternalNote:internal,canChangeStatus:has('support.ticket.status'),attachments:false,email:false,mode:'local_fixture'}};
  }
  function list(){
    requirePermission('support.ticket.read');if(client)organization(actor.organizationId);
    const rows=staff?db.prepare('SELECT * FROM support_tickets WHERE workspace_id=? ORDER BY '+(internal?'updated_at':'public_updated_at')+' DESC,id LIMIT 201').all(actor.workspaceId):db.prepare('SELECT * FROM support_tickets WHERE workspace_id=? AND organization_id=? ORDER BY public_updated_at DESC,id LIMIT 201').all(actor.workspaceId,actor.organizationId);
    const counts=staff?db.prepare('SELECT status,COUNT(*) AS n FROM support_tickets WHERE workspace_id=? GROUP BY status').all(actor.workspaceId):db.prepare('SELECT status,COUNT(*) AS n FROM support_tickets WHERE workspace_id=? AND organization_id=? GROUP BY status').all(actor.workspaceId,actor.organizationId);
    const total=counts.reduce((sum,row)=>sum+row.n,0),resolved=counts.find(row=>row.status==='resolved')?.n||0;
    const counters={active:total-resolved,waiting:counts.find(row=>row.status==='waiting')?.n||0,resolved,total};
    return{items:rows.slice(0,200).map(row=>dto(row,true)),counters,limit:200,hasMore:rows.length>200,mode:'local_fixture'};
  }
  function detail(id){return{ticket:dto(lookup(id))};}
  function create(body,key,requestId){
    requirePermission('support.ticket.create');requirePermission('support.ticket.read');
    fields(body,['organizationId','service','subject','category','priority','body','draftRevision']);
    const org=organization(client?body.organizationId??actor.organizationId:body.organizationId);
    const subject=plaintext(body.subject,'Onderwerp',160,{singleLine:true}),text=plaintext(body.body,'Bericht',8000),service=body.service||'Algemene vraag',category=body.category||'Algemene vraag',priority=body.priority||'normal';
    if(!org.services.includes(service)||!categories.includes(category)||!priorities.has(priority))fail(422,'INVALID_SUPPORT_FIELD','Kies een geldige dienst, categorie en prioriteit.');
    return operation('/api/support/tickets',body,key,requestId,()=>{
      const clearedDraft=clearDraft('create',body);bindOrganization(org);const id='DG-'+randomBytes(8).toString('hex').toUpperCase(),at=time();
      db.prepare('INSERT INTO support_tickets VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,actor.workspaceId,org.id,subject,service,category,priority,'new',assignees[0],1,1,at,at,at);
      const row=lookup(id);addMessage(row,text,'public','message',at);audit(actor,'support.ticket.create',id,'created',requestId,{organizationId:org.id,revision:1});
      return{status:201,value:{ticket:dto(row),...(clearedDraft?{clearedDraft}:{})}};
    });
  }
  function message(id,body,key,requestId){
    const row=lookup(id),visibility=body.visibility??'public';
    if(!['public','internal'].includes(visibility))fail(422,'INVALID_VISIBILITY','Kies een publieke reactie of interne notitie.');
    if(visibility==='internal'){if(!internal)fail(403,'FORBIDDEN','Deze serversessie mag geen interne notitie plaatsen.');}
    else requirePermission('support.ticket.reply');
    fields(body,['revision','body','visibility','draftRevision']);const text=plaintext(body.body,visibility==='internal'?'Interne notitie':'Bericht',8000);
    return operation(`/api/support/tickets/${id}/messages`,body,key,requestId,()=>{
      const current=lookup(id);revision(body,current);
      if(current.status==='resolved')fail(409,'TICKET_RESOLVED','Heropen het verzoek voordat je een reactie of notitie plaatst.');
      const clearedDraft=clearDraft(`${id}:${visibility}`,body);
      const at=time(),nextStatus=visibility==='internal'?current.status:staff?'waiting':'open';
      addMessage(current,text,visibility,'message',at);
      if(nextStatus!==current.status)addMessage(current,`Status gewijzigd naar ${statuses[nextStatus].toLocaleLowerCase('nl')}.`,'public','system',at);
      const updated=bump(current,{publicChange:visibility==='public',status:nextStatus,at});
      audit(actor,visibility==='internal'?'support.ticket.internal_note':'support.ticket.reply',id,'saved',requestId,{organizationId:row.organization_id,visibility,revision:updated.revision});
      return{status:200,value:{ticket:dto(updated),...(clearedDraft?{clearedDraft}:{})}};
    });
  }
  function update(id,body,key,requestId){
    lookup(id);fields(body,['revision','assignee','priority','status']);
    if(!['assignee','priority','status'].some(field=>own(body,field)))fail(422,'SUPPORT_CHANGE_REQUIRED','Er is geen wijziging opgegeven.');
    if(own(body,'assignee')||own(body,'priority')){requirePermission('support.ticket.manage');if(!staff)fail(403,'FORBIDDEN','Alleen bevoegde supportmedewerkers mogen verzoekdetails aanpassen.');}
    if(own(body,'assignee')&&!internal)fail(403,'FORBIDDEN','Interne toewijzing vereist toegang tot interne supportgegevens.');
    if(own(body,'status'))requirePermission('support.ticket.status');
    if(own(body,'assignee')&&!assignees.includes(body.assignee)||own(body,'priority')&&!priorities.has(body.priority)||own(body,'status')&&!own(statuses,body.status))fail(422,'INVALID_SUPPORT_FIELD','Ongeldige behandelaar, prioriteit of status.');
    if(client&&own(body,'status')&&!['resolved','open'].includes(body.status))fail(403,'FORBIDDEN','Een klant kan een eigen verzoek oplossen of heropenen.');
    return operation(`/api/support/tickets/${id}/details`,body,key,requestId,()=>{
      const current=lookup(id);revision(body,current);const status=body.status??current.status,priority=body.priority??current.priority,assignee=body.assignee??current.assignee;
      if(status!==current.status&&!(current.status==='resolved'?status==='open':['open','waiting','resolved'].includes(status)))fail(422,'INVALID_SUPPORT_TRANSITION','Deze statusovergang is niet toegestaan.');
      const publicChange=status!==current.status||priority!==current.priority,privateChange=assignee!==current.assignee;
      if(!publicChange&&!privateChange)return{status:200,value:{ticket:dto(current)}};
      const at=time();
      if(privateChange)addMessage(current,`Behandelaar gewijzigd naar ${assignee}.`,'internal','system',at);
      if(priority!==current.priority)addMessage(current,`Prioriteit gewijzigd naar ${priority==='normal'?'normaal':priority==='high'?'hoog':'urgent'}.`,'public','system',at);
      if(status!==current.status)addMessage(current,status==='resolved'?'Dit verzoek is gemarkeerd als opgelost.':current.status==='resolved'?'Dit verzoek is opnieuw geopend.':`Status gewijzigd naar ${statuses[status].toLocaleLowerCase('nl')}.`,'public','system',at);
      const updated=bump(current,{publicChange,status,priority,assignee,at});audit(actor,'support.ticket.update',id,'saved',requestId,{organizationId:current.organization_id,revision:updated.revision,changedFields:['status','priority','assignee'].filter(field=>body[field]!==undefined&&body[field]!==current[field])});return{status:200,value:{ticket:dto(updated)}};
    });
  }
  function draftTarget(key){
    requirePermission('support.draft.read');
    if(key==='create')return;
    if(typeof key!=='string'||key.length>120)fail(422,'INVALID_DRAFT_KEY','Ongeldig supportconcept.');
    const match=key.match(/^(DG-[A-F0-9]{16}):(public|internal)$/);
    if(!match)fail(422,'INVALID_DRAFT_KEY','Ongeldig supportconcept.');
    lookup(match[1]);if(match[2]==='internal'&&!internal)fail(403,'FORBIDDEN','Deze serversessie heeft geen intern concept.');
  }
  function draftDto(row,key){return{key,value:row?JSON.parse(row.value):{},revision:row?.revision||0};}
  function drafts(){
    requirePermission('support.draft.read');
    const items=[];
    for(const row of db.prepare('SELECT * FROM support_drafts WHERE workspace_id=? AND principal_scope=? ORDER BY key').all(actor.workspaceId,principalScope)){
      try{draftTarget(row.key);items.push(draftDto(row,row.key));}catch(error){if(![403,404].includes(error.status))throw error;}
    }
    return{items};
  }
  function saveDraft(body,requestId){
    requirePermission('support.draft.write');fields(body,['key','value','revision']);draftTarget(body.key);
    if(!body.value||typeof body.value!=='object'||Array.isArray(body.value))fail(422,'INVALID_DRAFT','Een concept bevat alleen tekstvelden.');
    const allowed=body.key==='create'?['organizationId','service','subject','category','priority','body']:['body'];fields(body.value,allowed);
    const value={};for(const[key,input]of Object.entries(body.value))value[key]=plaintext(input,'Conceptveld',key==='body'?8000:key==='subject'?160:300,{required:false,singleLine:key!=='body'});
    if(value.organizationId)organization(value.organizationId);
    return tx(()=>{
      const current=db.prepare('SELECT * FROM support_drafts WHERE workspace_id=? AND principal_scope=? AND key=?').get(actor.workspaceId,principalScope,body.key);
      if(!Number.isInteger(body.revision)||body.revision!==(current?.revision||0))fail(409,'REVISION_CONFLICT','Het supportconcept is gewijzigd.',{current:draftDto(current,body.key)});
      const next=(current?.revision||0)+1;
      db.prepare('INSERT INTO support_drafts VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id,principal_scope,key) DO UPDATE SET value=excluded.value,revision=excluded.revision,updated_at=excluded.updated_at').run(actor.workspaceId,principalScope,body.key,JSON.stringify(value),next,time());
      audit(actor,'support.draft.save',hash(body.key),'saved',requestId,{revision:next});return{draft:{key:body.key,value,revision:next}};
    });
  }
  return{catalog,list,detail,create,message,update,drafts,saveDraft};
}
