import {AuthError,authFail,readConfig,checkOrigin,checkCsrf,requestBody,passwordSession,verifiedSession,authorizedSession,currentActor,supabaseRequest,mfaAction,clearedCookies,hasVerifiedFactor} from './auth.mjs';
import {authPage} from './auth-page.mjs';
import {handleDomain} from './domain.mjs';

export const adminSecurityHeaders={
 'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'SAMEORIGIN','X-Robots-Tag':'noindex, nofollow, noarchive',
 'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
};
function response(body,status=200,{type='application/json; charset=utf-8',cookies=[]}={}){
 const headers=new Headers({...adminSecurityHeaders,'Content-Type':type,'X-Request-ID':crypto.randomUUID()});for(const cookie of cookies)headers.append('Set-Cookie',cookie);
 return new Response(type.startsWith('application/json')?JSON.stringify(body):body,{status,headers});
}
function failure(error,cookies=[]){
 const known=error instanceof AuthError||Number.isInteger(error?.status)&&error.status>=400&&error.status<500&&/^[A-Z][A-Z0-9_]{1,70}$/.test(error.code||'');
 return response({code:known?error.code:'BACKOFFICE_UNAVAILABLE',message:known?error.message:'De backoffice kon deze handeling niet bevestigen. Probeer later opnieuw.',...(known&&error.current?{current:error.current}:{})},known?error.status:503,{cookies:error instanceof AuthError&&error.cookies?.length?error.cookies:cookies});
}
export function createBackofficeWeb({env={},fetcher=fetch,domain=handleDomain,fixtureUpstream='http://127.0.0.1:4187'}={}){
 const config=()=>readConfig(typeof env==='function'?env():env||{});
 function fixtureBoundary(request,cfg){if(new URL(request.url).origin!==cfg.origin)authFail(403,'FIXTURE_LOOPBACK_ONLY','De reviewmodus is alleen bereikbaar op haar eigen loopbackadres.');checkOrigin(request,cfg,{write:!['GET','HEAD'].includes(request.method)});}
 async function proxyFixture(request,cfg){
  fixtureBoundary(request,cfg);const upstream=new URL(fixtureUpstream);
  if(upstream.protocol!=='http:'||upstream.hostname!=='127.0.0.1'||upstream.origin===cfg.origin)authFail(503,'FIXTURE_TARGET_INVALID','De afzonderlijke reviewserver is niet beschikbaar.');
  const original=new URL(request.url),path=original.pathname.slice('/admin'.length)+original.search;
  if(!path.startsWith('/api/'))authFail(404,'NOT_FOUND','Route niet gevonden.');
  const headers=new Headers({Accept:'application/json'});
  for(const name of ['content-type','x-csrf-token','idempotency-key']){const value=request.headers.get(name);if(value)headers.set(name,value);}
  const fixtureCookie=(request.headers.get('cookie')||'').split(';').map(value=>value.trim()).find(value=>/^dg_fixture_session=[a-f0-9]{64}$/.test(value));if(fixtureCookie)headers.set('Cookie',fixtureCookie);
  if(!['GET','HEAD'].includes(request.method))headers.set('Origin',upstream.origin);
  let body;if(!['GET','HEAD'].includes(request.method))body=JSON.stringify(await requestBody(request));
  let result;try{result=await fetcher(new URL(path,upstream),{method:request.method,headers,body,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000)});}catch{authFail(503,'FIXTURE_UNAVAILABLE','De afzonderlijke reviewserver is niet gestart.');}
  const text=await result.text(),out=new Headers({...adminSecurityHeaders,'Content-Type':'application/json; charset=utf-8'});
  for(const cookie of result.headers.getSetCookie())if(cookie.startsWith('dg_fixture_session='))out.append('Set-Cookie',cookie);
  return new Response(text,{status:result.status,headers:out});
 }
 async function logout(request,cfg){
  checkCsrf(request,cfg);let remote=false;
  try{const session=await verifiedSession(request,cfg,fetcher);await supabaseRequest(cfg,'/auth/v1/logout?scope=local',{method:'POST',accessToken:session.accessToken,fetcher});remote=true;}catch{}
  return response({ok:true,localSessionCleared:true,serverRevocationConfirmed:remote},200,{cookies:clearedCookies()});
 }
 return{
  async page(request,entryHtml){
   try{const cfg=config();if(cfg.mode==='fixture'){fixtureBoundary(request,cfg);return response(entryHtml,200,{type:'text/html; charset=utf-8'});}
    const url=new URL(request.url);if(url.origin!==cfg.origin){const headers=new Headers(adminSecurityHeaders);headers.set('Location',cfg.appOrigin+url.search);return new Response(null,{status:307,headers});}
    try{const session=await authorizedSession(request,cfg,fetcher);return response(entryHtml,200,{type:'text/html; charset=utf-8',cookies:session.cookies});}
    catch(error){if([401,403].includes(error.status))return response(authPage(),200,{type:'text/html; charset=utf-8',cookies:error.cookies||[]});throw error;}
   }catch(error){return failure(error);}
  },
  async runtime(request){
   try{const cfg=config();let cookies=[];if(cfg.mode==='fixture')fixtureBoundary(request,cfg);else{const session=await authorizedSession(request,cfg,fetcher);cookies=session.cookies;}
    return response('globalThis.DG_RUNTIME='+JSON.stringify({mode:cfg.mode,fixtureParity:false,basePath:'/admin'})+';',200,{type:'text/javascript; charset=utf-8',cookies});
   }catch(error){return failure(error);}
  },
  async api(request){
   let cookies=[];
   try{
    const cfg=config(),url=new URL(request.url);if(!url.pathname.startsWith('/admin/api/'))authFail(404,'NOT_FOUND','Route niet gevonden.');
    if(cfg.mode==='fixture')return await proxyFixture(request,cfg);
    checkOrigin(request,cfg);const path=url.pathname.slice('/admin'.length);
    if(request.method==='POST'&&path==='/api/logout')return await logout(request,cfg);
    if(!['GET','HEAD'].includes(request.method))checkCsrf(request,cfg);
    const session=await authorizedSession(request,cfg,fetcher);cookies=session.cookies;
    if(request.method==='GET'&&path==='/api/session')return response({actor:session.actor,csrf:session.csrf,mode:'supabase',fixtureParity:false,providerWrites:false,authentication:'supabase-mfa',expiresAt:new Date(session.claims.exp*1000).toISOString()},200,{cookies:session.cookies});
    const body=['GET','HEAD'].includes(request.method)?undefined:await requestBody(request);
    const result=await domain({path,method:request.method,body,actor:session.actor,accessToken:session.accessToken,config:{...cfg,fetchImpl:fetcher},requestId:crypto.randomUUID(),idempotencyKey:request.headers.get('idempotency-key')});
    return response(result.value,result.status,{cookies:session.cookies});
   }catch(error){return failure(error,cookies);}
  },
  async auth(request){
   let cookies=[];
   try{
    const cfg=config();if(cfg.mode!=='supabase')authFail(404,'NOT_FOUND','Gebruik de afzonderlijke reviewmodus.');checkOrigin(request,cfg,{write:request.method!=='GET'});
    const action=new URL(request.url).pathname.slice('/admin/auth/'.length);
    if(request.method==='GET'&&action==='session'){
     let session;try{session=await verifiedSession(request,cfg,fetcher);}catch(error){if(error.status===401)return response({state:'signed_out'},200,{cookies:clearedCookies()});throw error;}
     cookies=session.cookies;
     if(session.claims.aal!=='aal2'||!hasVerifiedFactor(session.user))return response({state:'mfa_required',csrf:session.csrf,factors:(session.user.factors||[]).filter(factor=>factor.status==='verified'&&factor.factor_type==='totp').map(factor=>({id:factor.id,name:factor.friendly_name||'Authenticator'}))},200,{cookies:session.cookies});
     try{const actor=await currentActor(session,cfg,fetcher);return response({state:'ready',csrf:session.csrf,actor},200,{cookies:session.cookies});}
     catch(error){if(error.status===403)return response({state:'membership_required',csrf:session.csrf},200,{cookies:session.cookies});throw error;}
    }
    if(request.method!=='POST')authFail(405,'METHOD_NOT_ALLOWED','Deze methode is niet beschikbaar.');
    if(action==='login'){const body=await requestBody(request,4096);const session=await passwordSession(cfg,body.email,body.password,fetcher);return response({ok:true,csrf:session.csrf},200,{cookies:session.cookies});}
    if(action==='logout')return await logout(request,cfg);
    if(!['enroll','verify'].includes(action))authFail(404,'NOT_FOUND','Route niet gevonden.');
    checkCsrf(request,cfg);const body=await requestBody(request,4096),session=await verifiedSession(request,cfg,fetcher);cookies=session.cookies;const result=await mfaAction(cfg,session,action,body,fetcher);
    if(action==='enroll')return response(result,200,{cookies:session.cookies});
    return response({verified:true,csrf:session.csrf},200,{cookies:result.cookies});
   }catch(error){return failure(error,cookies);}
  },
 };
}
