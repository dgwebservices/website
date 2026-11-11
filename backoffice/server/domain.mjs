import { ApiError, rejectSecrets, integrationValues, integrationKinds, validateWizardState } from './validation.mjs';
import { describeFixtureIntegration } from './integration-status.mjs';

const stateKeys=new Set(['services','management','account','commerce','infrastructure','vaults','maildesk','infra-wizards'].map(name=>`dg-midnight-${name}-v1`));
const metadataEnvironment=config=>['development','staging','production'].includes(config.mode)?config.mode:'production';
const fail=(status,code,message)=>{throw new ApiError(status,code,message);};
function configuration(config){
  let origin;
  try{origin=new URL(config?.url);}catch{fail(503,'BACKEND_UNAVAILABLE','De beveiligde backendconfiguratie ontbreekt.');}
  if(origin.protocol!=='https:'||origin.origin!==config.url||origin.username||origin.password||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey||''))fail(503,'BACKEND_UNAVAILABLE','De beveiligde backendconfiguratie is niet beschikbaar.');
  return origin.origin;
}
async function json(response){
  if(!response.body)return response.json();
  const reader=response.body.getReader(),parts=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>12_000_000){await reader.cancel();throw new Error('bounded response');}parts.push(value);}
  const joined=new Uint8Array(size);let offset=0;for(const part of parts){joined.set(part,offset);offset+=part.byteLength;}
  return JSON.parse(new TextDecoder().decode(joined));
}
function enrich(value){
  if(!value||typeof value!=='object')return value;
  if(value.integration?.kind)value={...value,integration:{...value.integration,...describeFixtureIntegration(value.integration)}};
  if(value.current?.kind)value={...value,current:{...value.current,...describeFixtureIntegration(value.current)}};
  if(Array.isArray(value.items))value={...value,items:value.items.map(item=>item?.kind?{...item,...describeFixtureIntegration(item)}:item)};
  return value;
}

/** Request-scoped HTTP transport only. PostgreSQL independently authenticates,
 * checks current memberships/MFA/session and enforces every mutation atomically.
 * No service-role key, Node native module, provider call or fixture identity. */
export async function handleDomain({path,method='GET',body,accessToken,config,requestId=globalThis.crypto.randomUUID(),idempotencyKey}){
  try{
    const origin=configuration(config),fetchImpl=config.fetchImpl||globalThis.fetch;
    if(typeof accessToken!=='string'||accessToken.length>16000||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+$/.test(accessToken))fail(401,'AUTH_REQUIRED','Meld je opnieuw aan.');
    if(typeof path!=='string'||!path.startsWith('/api/')||path.includes('?')||path.includes('#')||path.length>300)fail(404,'NOT_FOUND','API-route niet gevonden.');
    method=method.toUpperCase();
    if(!['GET','POST','PUT','PATCH'].includes(method))fail(405,'METHOD_NOT_ALLOWED','Deze methode is niet beschikbaar.');
    let payload=body??{};
    if(!payload||typeof payload!=='object'||Array.isArray(payload))fail(422,'INVALID_BODY','Gebruik een JSON-object.');
    if(method!=='GET')rejectSecrets(payload);
    const rpc=async(logicalPath,rpcMethod,rpcBody,rpcKey=null)=>{
      let response,result;
      try{
        response=await fetchImpl(origin+'/rest/v1/rpc/dg_bo_domain',{method:'POST',headers:{apikey:config.publishableKey,Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({p_path:logicalPath,p_method:rpcMethod,p_body:rpcBody,p_idempotency_key:rpcKey,p_request_id:requestId}),redirect:'error',signal:AbortSignal.timeout(12000)});
        if(!response.ok){
          if(response.status===401)fail(401,'AUTH_REQUIRED','Meld je opnieuw aan.');
          if(response.status===403)fail(403,'FORBIDDEN','Deze sessie heeft geen toegang tot de backoffice.');
          if(response.status===404)fail(503,'BACKEND_SCHEMA_REQUIRED','De beveiligde backofficemigratie is nog niet beschikbaar.');
          fail(503,'BACKEND_UNAVAILABLE','De backend kon deze aanvraag niet veilig verwerken.');
        }
        result=await json(response);
      }catch(error){if(error instanceof ApiError)throw error;fail(503,'BACKEND_UNAVAILABLE','De backend is tijdelijk niet beschikbaar. Je invoer is niet als verwerkt bevestigd.');}
      if(!result||!Number.isInteger(result.status)||result.status<200||result.status>599||!result.value||typeof result.value!=='object')fail(503,'BACKEND_UNAVAILABLE','De backendrespons is niet herkenbaar.');
      return result;
    };
    const validateState=async change=>{
      if(!change||!stateKeys.has(change.key))fail(change?.key==='dg-midnight-support-v1'?403:404,'STATE_UNAVAILABLE','Dit gegevensonderdeel is niet beschikbaar via de oorspronkelijke opslagroute.');
      if(!Object.hasOwn(change,'value')||!Number.isInteger(change.revision)||change.revision<0)fail(422,'INVALID_STATE','Een waarde en geldige revisie zijn vereist.');
      if(change.key==='dg-midnight-infra-wizards-v1'){
        const previous=await rpc('/api/state/'+change.key,'GET',{});
        if(previous.status!==200)return previous;
        change.value=validateWizardState(change.value,previous.value.value);
      }
    };
    if(method==='PUT'&&path==='/api/state'){
      if(!Array.isArray(payload.changes)||!payload.changes.length||payload.changes.length>8)fail(422,'INVALID_BATCH','Bewaar één tot acht gegevensonderdelen.');
      payload=structuredClone(payload);const seen=new Set();
      for(const change of payload.changes){if(seen.has(change.key))fail(422,'INVALID_BATCH','Een gegevensonderdeel mag maar één keer voorkomen.');seen.add(change.key);const error=await validateState(change);if(error)return error;}
    }else if(method==='PUT'&&path.startsWith('/api/state/')){
      const change={...structuredClone(payload),key:path.slice('/api/state/'.length)},error=await validateState(change);if(error)return error;payload={value:change.value,revision:change.revision};
    }else if(method==='POST'&&path==='/api/integrations'){
      if(!integrationKinds.includes(payload.kind)||typeof payload.name!=='string'||!payload.name.trim()||payload.name.length>120)fail(422,'INVALID_INTEGRATION','Kies een installatie en vul een naam in.');
      payload={...payload,name:payload.name.trim(),values:integrationValues(payload.values||{},payload.kind)};payload.values.environment=metadataEnvironment(config);
    }else if(method==='PUT'&&/^\/api\/integrations\/[^/]+$/.test(path)){
      const current=await rpc(path,'GET',{});if(current.status!==200)return current;
      payload={...payload,values:integrationValues(payload.values,current.value.integration.kind)};payload.values.environment=metadataEnvironment(config);
    }
    const result=await rpc(path,method,payload,idempotencyKey||null);
    return{status:result.status,value:enrich(result.value)};
  }catch(error){
    if(error instanceof ApiError)return{status:error.status,value:{code:error.code,message:error.message,requestId,...error.details}};
    return{status:500,value:{code:'INTERNAL_ERROR',message:'De aanvraag kon niet veilig worden verwerkt.',requestId}};
  }
}
