// Server-only Supabase transport. No service key, provider error bodies or browser
// supplied identities are accepted as authorization.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const roles=new Set(['admin','client','support','operations','finance']);
const names={access:'__Host-dg_bo_access',refresh:'__Host-dg_bo_refresh',csrf:'__Host-dg_bo_csrf'};
const refreshes=new Map();
export class AuthError extends Error {
  constructor(status,code,message){super(message);this.status=status;this.code=code;}
}
export const authFail=(status,code,message)=>{throw new AuthError(status,code,message);};
export function readConfig(env={}){
  const mode=env.DGWEB_DATA_MODE;
  const app=new URL(env.DGWEB_APP_ORIGIN||'https://invalid.invalid');
  if(app.username||app.password||app.search||app.hash||app.pathname.replace(/\/$/,'')!=='/admin')authFail(503,'CONFIGURATION_REQUIRED','De bevestigde backofficeconfiguratie ontbreekt.');
  if(mode==='fixture'){
    if(app.protocol!=='http:'||!['127.0.0.1','localhost'].includes(app.hostname))authFail(503,'FIXTURE_LOOPBACK_ONLY','De reviewmodus vereist een afzonderlijke loopbackomgeving.');
    return Object.freeze({mode,appOrigin:app.href.replace(/\/$/,''),origin:app.origin,url:null,publishableKey:null});
  }
  if(mode!=='supabase'||app.protocol!=='https:')authFail(503,'CONFIGURATION_REQUIRED','De bevestigde backofficeconfiguratie ontbreekt.');
  let url;try{url=new URL(env.NEXT_PUBLIC_SUPABASE_URL);}catch{authFail(503,'CONFIGURATION_REQUIRED','De Supabaseconfiguratie ontbreekt.');}
  const publishableKey=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(url.protocol!=='https:'||!/^[a-z0-9]{20}\.supabase\.co$/.test(url.hostname)||url.port||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname)||typeof publishableKey!=='string'||!/^sb_publishable_[A-Za-z0-9_-]{12,256}$/.test(publishableKey))authFail(503,'CONFIGURATION_REQUIRED','De Supabaseconfiguratie is niet geldig.');
  return Object.freeze({mode,appOrigin:app.href.replace(/\/$/,''),origin:app.origin,url:url.origin,publishableKey});
}
export function cookiesOf(request){
  const result={};
  for(const part of (request.headers.get('cookie')||'').split(';')){
    const index=part.indexOf('=');if(index<0)continue;
    const name=part.slice(0,index).trim(),value=part.slice(index+1).trim();
    if(Object.values(names).includes(name)&&value.length<=3900){if(Object.hasOwn(result,name))authFail(401,'INVALID_SESSION','Meld opnieuw aan.');result[name]=value;}
  }
  return result;
}
export function constantEqual(a,b){
  if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;
  let different=0;for(let i=0;i<a.length;i++)different|=a.charCodeAt(i)^b.charCodeAt(i);return different===0;
}
export function checkOrigin(request,config,{write=false}={}){
  const origin=request.headers.get('origin');
  if(new URL(request.url).origin!==config.origin||request.headers.get('sec-fetch-site')==='cross-site'||origin&&origin!==config.origin||write&&origin!==config.origin)authFail(403,'ORIGIN_REJECTED','Deze herkomst heeft geen toegang tot de backoffice.');
}
export function checkCsrf(request,config){
  checkOrigin(request,config,{write:true});
  const csrf=cookiesOf(request)[names.csrf];
  if(!csrf||!constantEqual(csrf,request.headers.get('x-csrf-token')))authFail(403,'CSRF_REJECTED','Vernieuw de pagina voordat je opnieuw probeert.');
}
export async function boundedJson(response,max=1024*1024){
  if(response.status===204)return{};
  if(Number(response.headers.get('content-length')||0)>max||!response.body)authFail(503,'UPSTREAM_UNAVAILABLE','De identiteitscontrole is tijdelijk niet beschikbaar.');
  const reader=response.body.getReader(),parts=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();authFail(503,'UPSTREAM_UNAVAILABLE','De identiteitscontrole is tijdelijk niet beschikbaar.');}parts.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{authFail(503,'UPSTREAM_UNAVAILABLE','De identiteitscontrole is tijdelijk niet beschikbaar.');}
}
export async function supabaseRequest(config,path,{method='GET',body,accessToken,fetcher=fetch}={}){
  if(config.mode!=='supabase'||!/^\/(?:auth|rest)\/v1\//.test(path)||path.includes('..')||path.includes('://'))authFail(503,'INVALID_AUTH_TARGET','De identiteitscontrole is niet beschikbaar.');
  let response;
  try{response=await fetcher(config.url+path,{method,headers:{apikey:config.publishableKey,Accept:'application/json',...(body!==undefined?{'Content-Type':'application/json'}:{}),...(accessToken?{Authorization:'Bearer '+accessToken}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});}
  catch{authFail(503,'UPSTREAM_UNAVAILABLE','De identiteitscontrole is tijdelijk niet beschikbaar. Probeer later opnieuw.');}
  if(!response.ok){
    // Never return provider text, metadata, account details or token values.
    await response.body?.cancel();
    if(response.status===429)authFail(429,'AUTH_RATE_LIMIT','Te veel pogingen. Wacht even voordat je opnieuw probeert.');
    if(response.status>=500)authFail(503,'UPSTREAM_UNAVAILABLE','De identiteitscontrole is tijdelijk niet beschikbaar.');
    if(path.startsWith('/rest/'))authFail(response.status===401?401:403,'ACCESS_NOT_CONFIGURED','Er is nog geen actuele backofficetoegang voor dit account, of de backend is nog niet ingericht.');
    authFail(401,'AUTHENTICATION_FAILED','Aanmelden of verificatie is niet gelukt. Controleer je gegevens.');
  }
  return boundedJson(response);
}
function claimsOf(token){
  try{const part=token.split('.')[1];return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part.replace(/-/g,'+').replace(/_/g,'/')),char=>char.charCodeAt(0))));}
  catch{authFail(401,'INVALID_SESSION','Meld opnieuw aan.');}
}
function tokenPair(value){
  if(typeof value?.access_token!=='string'||value.access_token.length>3800||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+$/.test(value.access_token)||typeof value.refresh_token!=='string'||!/^[A-Za-z0-9_.-]{8,3800}$/.test(value.refresh_token))authFail(503,'INVALID_AUTH_RESPONSE','De aanmeldsessie kon niet veilig worden opgeslagen.');
  return{accessToken:value.access_token,refreshToken:value.refresh_token};
}
export function sessionCookies(pair,csrf){
  return [[names.access,pair.accessToken,3600],[names.refresh,pair.refreshToken,28800],[names.csrf,csrf,28800]].map(([name,value,max])=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${max}`);
}
export function clearedCookies(){return Object.values(names).map(name=>`${name}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);}
export function hasVerifiedFactor(user){return user?.factors?.some(factor=>uuid.test(factor.id||'')&&factor.status==='verified'&&['totp','phone','webauthn'].includes(factor.factor_type))===true;}
export async function passwordSession(config,email,password,fetcher=fetch){
  if(typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=='string'||password.length<1||password.length>256)authFail(422,'INVALID_LOGIN','Vul je e-mailadres en wachtwoord in.');
  const pair=tokenPair(await supabaseRequest(config,'/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},fetcher}));
  const csrf=crypto.randomUUID();return{pair,csrf,cookies:sessionCookies(pair,csrf)};
}
export async function verifiedSession(request,config,fetcher=fetch){
  const input=cookiesOf(request);let accessToken=input[names.access],refreshToken=input[names.refresh],csrf=input[names.csrf]||crypto.randomUUID(),out=[];
  if(!accessToken&&!refreshToken)authFail(401,'UNAUTHENTICATED','Meld je aan om de backoffice te openen.');
  let expires=0;try{expires=Number(claimsOf(accessToken||'').exp)||0;}catch{}
  if(!accessToken||expires<=Date.now()/1000+45){
    if(!refreshToken)authFail(401,'UNAUTHENTICATED','Je sessie is verlopen. Meld opnieuw aan.');
    const key=config.url+':'+refreshToken;
    for(const [id,value]of refreshes)if(value.until<Date.now())refreshes.delete(id);
    if(refreshes.size>=1000)authFail(503,'AUTH_BUSY','De aanmeldservice is tijdelijk bezet.');
    let record=refreshes.get(key);
    if(!record){record={until:Date.now()+10000,promise:supabaseRequest(config,'/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:refreshToken},fetcher}).then(tokenPair)};refreshes.set(key,record);record.promise.catch(()=>refreshes.delete(key));}
    ({accessToken,refreshToken}=await record.promise);out=sessionCookies({accessToken,refreshToken},csrf);
  }
  try{
  const user=await supabaseRequest(config,'/auth/v1/user',{accessToken,fetcher});
  const claims=claimsOf(accessToken);
  if(!uuid.test(user?.id||'')||user.is_anonymous===true||user.banned_until&&Date.parse(user.banned_until)>Date.now()||claims.sub!==user.id||claims.iss!==config.url+'/auth/v1'||claims.aud!=='authenticated'||!uuid.test(claims.session_id||'')||!Number.isFinite(claims.exp)||claims.exp<=Date.now()/1000)authFail(401,'INVALID_SESSION','De huidige sessie kan niet worden geverifieerd.');
  if(!user.email_confirmed_at)authFail(403,'EMAIL_VERIFICATION_REQUIRED','Bevestig eerst het e-mailadres van je account.');
  if(!input[names.csrf]&&!out.length)out=sessionCookies({accessToken,refreshToken},csrf);
  return{accessToken,refreshToken,csrf,cookies:out,user,claims};
  }catch(error){if(error instanceof AuthError)error.cookies=out;throw error;}
}
export async function currentActor(session,config,fetcher=fetch){
  try{
  if(session.claims.aal!=='aal2'||!hasVerifiedFactor(session.user))authFail(403,'MFA_REQUIRED','Bevestig je aanmelding met een actuele authenticator.');
  const actor=await supabaseRequest(config,'/rest/v1/rpc/dg_bo_context',{method:'POST',body:{},accessToken:session.accessToken,fetcher});
  if(actor?.id!==session.user.id||!roles.has(actor.role)||!uuid.test(actor.workspaceId||'')||actor.organizationId!==null&&!uuid.test(actor.organizationId||'')||!Array.isArray(actor.permissions)||actor.permissions.some(value=>typeof value!=='string')||actor.role==='client'&&!actor.organizationId)authFail(403,'ACCESS_NOT_CONFIGURED','Er is geen actuele, afgebakende toegang voor dit account.');
  return Object.freeze({...actor,permissions:Object.freeze([...actor.permissions])});
  }catch(error){if(error instanceof AuthError)error.cookies=session.cookies;throw error;}
}
export async function authorizedSession(request,config,fetcher=fetch){
  const session=await verifiedSession(request,config,fetcher);return{...session,actor:await currentActor(session,config,fetcher)};
}
export async function mfaAction(config,session,action,body,fetcher=fetch){
  if(action==='enroll'){
    if(session.user.factors?.some(factor=>factor.status==='verified'&&factor.factor_type==='totp'))authFail(409,'MFA_ALREADY_ENROLLED','Gebruik een bestaande authenticator voor deze aanmelding.');
    const factor=await supabaseRequest(config,'/auth/v1/factors',{method:'POST',body:{factor_type:'totp',friendly_name:'DG Webservices'},accessToken:session.accessToken,fetcher});
    if(!uuid.test(factor?.id||'')||typeof factor.totp?.qr_code!=='string'||typeof factor.totp?.secret!=='string')authFail(503,'INVALID_AUTH_RESPONSE','De authenticator kon niet worden ingericht.');
    return{factorId:factor.id,qrCode:factor.totp.qr_code,secret:factor.totp.secret};
  }
  if(action!=='verify'||!uuid.test(body.factorId||'')||!/^\d{6}$/.test(body.code||''))authFail(422,'INVALID_MFA','Vul de zescijferige code van je authenticator in.');
  if(!session.user.factors?.some(factor=>factor.id===body.factorId&&factor.factor_type==='totp'))authFail(403,'INVALID_MFA','Deze authenticator hoort niet bij je account.');
  const challenge=await supabaseRequest(config,`/auth/v1/factors/${body.factorId}/challenge`,{method:'POST',body:{},accessToken:session.accessToken,fetcher});
  if(!uuid.test(challenge?.id||''))authFail(503,'INVALID_AUTH_RESPONSE','De verificatie kon niet worden gestart.');
  const pair=tokenPair(await supabaseRequest(config,`/auth/v1/factors/${body.factorId}/verify`,{method:'POST',body:{challenge_id:challenge.id,code:body.code},accessToken:session.accessToken,fetcher}));
  return{cookies:sessionCookies(pair,session.csrf),verified:true};
}
export async function requestBody(request,max=1024*1024){
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))authFail(415,'CONTENT_TYPE','Gebruik application/json.');
  if(Number(request.headers.get('content-length')||0)>max)authFail(413,'BODY_TOO_LARGE','De aanvraag is te groot.');
  if(!request.body)authFail(400,'INVALID_JSON','Ongeldige aanvraag.');
  const reader=request.body.getReader(),parts=[];let size=0;
  try{for(;;){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();authFail(413,'BODY_TOO_LARGE','De aanvraag is te groot.');}parts.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
  let value;try{value=JSON.parse(new TextDecoder().decode(bytes));}catch{authFail(400,'INVALID_JSON','Ongeldige aanvraag.');}
  if(!value||typeof value!=='object'||Array.isArray(value))authFail(400,'INVALID_JSON','Ongeldige aanvraag.');return value;
}
