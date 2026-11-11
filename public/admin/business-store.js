import {backofficeApiPath} from './admin-paths.js';
import {realDataMode,emptyRealBusinessState} from './empty-state.js';
// The original synchronous renderers read this hydrated cache. Writes are committed
// with compare-and-swap to the isolated review database before a success toast.
export const fixtureParity = globalThis.DG_RUNTIME?.fixtureParity === true;
export let session;
session = await request('/api/session');
const keys = ['services','management','account','commerce','infrastructure','vaults','maildesk','infra-wizards'].map(k=>`dg-midnight-${k}-v1`);
const entries = new Map(), pending = new Map();
let flushing = null, failure = null;

export async function request(path, options = {}) {
  const url=backofficeApiPath(path);
  const headers = {'Accept':'application/json', ...options.headers};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (typeof session !== 'undefined' && session?.csrf) headers['X-CSRF-Token'] = session.csrf;
  const response = await fetch(url, {...options, headers, credentials:'same-origin', body:options.body === undefined ? undefined : JSON.stringify(options.body)});
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.message || result.error?.message || (typeof result.error === 'string' ? result.error : 'De handeling is niet opgeslagen.'));
    Object.assign(error, {status:response.status, code:result.code || result.error?.code, current:result.current});
    throw error;
  }
  return result;
}

async function hydrate() {
  await Promise.all(keys.map(async key=>{
    try {const item=await request('/api/state/'+encodeURIComponent(key));entries.set(key,{value:item.value===null?(realDataMode?JSON.stringify(emptyRealBusinessState(key)):null):JSON.stringify(item.value),revision:item.revision});}
    catch(error){if(error.status!==403)throw error;entries.set(key,{value:null,revision:0,denied:true});}
  }));
}
if (!fixtureParity) await hydrate();

export const businessStore = {
  canRead(key){return fixtureParity||entries.has(key)&&!entries.get(key).denied;},
  getItem(key) {
    if (fixtureParity) return localStorage.getItem(key);
    if(!entries.has(key))throw new Error('Onbekende gegevensbron.');
    return pending.has(key) ? pending.get(key) : entries.get(key).value;
  },
  setItem(key,value) {
    if(fixtureParity){localStorage.setItem(key,value);return;}
    if(!entries.has(key)||entries.get(key).denied)throw new Error('Je hebt geen toegang tot deze gegevens.');
    JSON.parse(value);pending.set(key,String(value));failure=null;
    queueMicrotask(()=>this.flush().catch(()=>{}));
  },
  get pending(){return pending.size>0||flushing!==null;},
  async flush() {
    if(fixtureParity)return;
    if(flushing)return flushing;
    if(!pending.size){if(failure)throw failure;return;}
    flushing=(async()=>{
      try{
        while(pending.size){
          const snapshots=new Map(pending);
          const changes=[...snapshots].map(([key,value])=>({key,value:JSON.parse(value),revision:entries.get(key).revision}));
          const result=await request('/api/state',{method:'PUT',body:{changes}});
          for(const change of result.changes){
            entries.set(change.key,{value:JSON.stringify(change.value),revision:change.revision});
            if(pending.get(change.key)===snapshots.get(change.key))pending.delete(change.key);
          }
        }
        dispatchEvent(new CustomEvent('dg-business-saved'));
      }catch(error){pending.clear();failure=error;await hydrate();dispatchEvent(new CustomEvent('dg-business-error',{detail:error}));throw error;}
      finally{flushing=null;}
    })();
    return flushing;
  }
};
addEventListener('pagehide',()=>{if(businessStore.pending)businessStore.flush().catch(()=>{});});
