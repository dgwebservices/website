import {request,session} from './business-store.js';

// Only normal local review uses this adapter. Visual fixtures never instantiate it.
const state={tickets:[],drafts:{},catalog:[],capabilities:{},counters:null,hasMore:false,loaded:false,error:null};
const revisions=new Map(),pending=new Map(),conflicts=new Map(),commands=new Map();
let loading,writing,timer,changed;
const notify=()=>{dispatchEvent(new CustomEvent('dg-support-draft'));changed?.();};
const safeError=error=>Object.assign(new Error(error?.status ? error.message : 'De servercontrole kon niet worden afgerond. Je invoer blijft behouden; controleer de actuele status vóór opnieuw proberen.'),{status:error?.status,code:error?.code,current:error?.current});
function mergeTicket(ticket){const index=state.tickets.findIndex(t=>t.id===ticket.id);if(index<0)state.tickets.unshift(ticket);else state.tickets[index]=ticket;return ticket;}
function adjustCounters(previous,next,created=false){if(!state.counters)return;const count=status=>({active:status!==undefined&&status!=='resolved'?1:0,waiting:status==='waiting'?1:0,resolved:status==='resolved'?1:0});const before=count(previous?.status),after=count(next.status);for(const key of ['active','waiting','resolved'])state.counters[key]+=after[key]-before[key];if(created)state.counters.total++;}
function accepted(result,previous,created=false){if(result.clearedDraft){const item=result.clearedDraft;state.drafts[item.key]=item.value;revisions.set(item.key,item.revision);pending.delete(item.key);conflicts.delete(item.key);}adjustCounters(previous,result.ticket,created);return mergeTicket(result.ticket);}
function draftFailure(key,error){if(error.code==='DRAFT_CONFLICT'){conflicts.set(key,{local:state.drafts[key]||{},current:error.current?.draft||error.current});state.error=error;notify();}throw error;}
function draftValue(value){const allowed=['organizationId','service','subject','body','category','priority'];return Object.fromEntries(allowed.filter(key=>value[key]!==undefined&&String(value[key])!=='').map(key=>[key,String(value[key])]));}
async function command(path,body,method='POST'){
  const fingerprint=JSON.stringify([path,method,body]);
  const key=commands.get(fingerprint)||crypto.randomUUID();commands.set(fingerprint,key);
  try{const result=await request(path,{method,body,headers:{'Idempotency-Key':key}});commands.delete(fingerprint);return result;}catch(error){throw safeError(error);}
}
async function flushDrafts(){
  clearTimeout(timer);if(writing)return writing;
  writing=(async()=>{
    while(pending.size){
      const [key,value]=pending.entries().next().value;
      if(conflicts.has(key))throw Object.assign(new Error('Het serverconcept is elders gewijzigd. Vergelijk beide versies voordat je bewaart.'),{status:409,code:'DRAFT_CONFLICT'});
      try{
        const result=await request('/api/support/drafts',{method:'PUT',body:{key,value,revision:revisions.get(key)||0}});
        const item=result.draft||result;revisions.set(key,item.revision);
        if(pending.get(key)===value)pending.delete(key);
        state.error=null;notify();
      }catch(error){
        if(error.status===409){const current=error.current?.draft||error.current;conflicts.set(key,{local:value,current});}
        state.error=safeError(error);notify();throw state.error;
      }
    }
  })();
  try{await writing;}finally{writing=null;notify();}
}
export function createSupportApi(){return {
  state,conflicts,
  onDraftChange(callback){changed=callback;},
  hasSavedDraft(key){return(revisions.get(key)||0)>0;},
  async ready(){
    if(state.loaded)return;if(loading)return loading;
    if(session.mode==='supabase'&&!session.actor.permissions?.includes('support.ticket.read')){Object.assign(state,{tickets:[],drafts:{},catalog:[],capabilities:{isStaff:session.actor.role!=='client',canCreate:false,canReply:false,canManage:false,canInternalNote:false,canChangeStatus:false,attachments:false,email:false,mode:'database_metadata'},counters:{total:0,active:0,waiting:0,resolved:0},hasMore:false,loaded:true,error:null});return;}
    loading=(async()=>{try{
      const [catalog,tickets,drafts]=await Promise.all([request('/api/support/catalog'),request('/api/support/tickets'),session.mode==='supabase'&&!session.actor.permissions?.includes('support.draft.read')?Promise.resolve({items:[]}):request('/api/support/drafts')]);
      state.catalog=catalog.items;state.capabilities=catalog.capabilities;state.tickets=tickets.items;state.counters=tickets.counters;state.hasMore=tickets.hasMore===true;
      for(const draft of drafts.items){state.drafts[draft.key]=draft.value;revisions.set(draft.key,draft.revision);}
      state.loaded=true;state.error=null;
    }catch(error){state.error=safeError(error);}finally{loading=null;}})();return loading;
  },
  async refresh(){const result=await request('/api/support/tickets');state.tickets=result.items;state.counters=result.counters;state.hasMore=result.hasMore===true;return state.tickets;},
  async ticket(id){const result=await request('/api/support/tickets/'+encodeURIComponent(id));return mergeTicket(result.ticket);},
  async create(values){try{return accepted(await command('/api/support/tickets',{...values,draftRevision:revisions.get('create')||0}),null,true);}catch(error){return draftFailure('create',error);}},
  async message(ticket,body,visibility){const key=ticket.id+':'+visibility;try{return accepted(await command('/api/support/tickets/'+encodeURIComponent(ticket.id)+'/messages',{revision:ticket.revision,body,visibility,draftRevision:revisions.get(key)||0}),ticket);}catch(error){return draftFailure(key,error);}},
  async update(ticket,changes){const result=await command('/api/support/tickets/'+encodeURIComponent(ticket.id),{revision:ticket.revision,...changes},'PATCH');adjustCounters(ticket,result.ticket);return mergeTicket(result.ticket);},
  setDraft(key,value){
    if(value.client!==undefined){value={...value,organizationId:value.client};delete value.client;}
    const safe=draftValue({...state.drafts[key],...value});
    if(JSON.stringify(state.drafts[key]||{})===JSON.stringify(safe))return;
    state.drafts[key]=safe;pending.set(key,safe);
    if(conflicts.has(key)){conflicts.get(key).local=safe;state.error=Object.assign(new Error('Het serverconcept is elders gewijzigd. Je laatste invoer blijft behouden.'),{status:409});}else state.error=null;
    notify();
    clearTimeout(timer);timer=setTimeout(()=>void flushDrafts().catch(()=>{}),350);
  },
  async clearDraft(key){this.setDraft(key,{});state.drafts[key]={};pending.set(key,state.drafts[key]);await flushDrafts();},
  async syncDrafts(){const result=await request('/api/support/drafts');for(const item of result.items){if(!pending.has(item.key)){state.drafts[item.key]=item.value;revisions.set(item.key,item.revision);}}notify();},
  forgetDraft(key){state.drafts[key]={};pending.delete(key);conflicts.delete(key);notify();},
  flush:flushDrafts,
  async resolveDraft(key,choice){
    const conflict=conflicts.get(key);if(!conflict)return;
    const result=await request('/api/support/drafts'),current=result.items.find(item=>item.key===key)||{value:{},revision:0};
    revisions.set(key,current.revision);conflicts.delete(key);
    if(choice==='server'){state.drafts[key]=current.value;pending.delete(key);state.error=null;notify();return;}
    pending.set(key,conflict.local);state.drafts[key]=conflict.local;await flushDrafts();
  },
  get pending(){return pending.size>0||!!writing;},
  get error(){return state.error;}
};}
addEventListener('beforeunload',event=>{if(pending.size||writing){event.preventDefault();event.returnValue='';}});
