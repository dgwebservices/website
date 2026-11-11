import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackofficeWeb} from '../backoffice/server/web.mjs';

// These are transport-boundary tests. Tokens deliberately have no real signature:
// the injected identity provider, rather than a decoded browser claim, decides
// which token is authenticated. No test can make an external network request.
const origin='https://dgwebservices.nl';
const supabase='https://abcdefghijklmnopqrst.supabase.co';
const ids={user:'10000000-0000-4000-8000-000000000001',other:'10000000-0000-4000-8000-000000000002',workspace:'20000000-0000-4000-8000-000000000001',organization:'30000000-0000-4000-8000-000000000001',session:'40000000-0000-4000-8000-000000000001',factor:'50000000-0000-4000-8000-000000000001',foreignFactor:'50000000-0000-4000-8000-000000000002',challenge:'60000000-0000-4000-8000-000000000001'};
const cookieNames={access:'__Host-dg_bo_access',refresh:'__Host-dg_bo_refresh',csrf:'__Host-dg_bo_csrf'};
const env={DGWEB_DATA_MODE:'supabase',DGWEB_APP_ORIGIN:origin+'/admin',NEXT_PUBLIC_SUPABASE_URL:supabase,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_transport_test_key_12345'};
const entry='<html><body>AUTHORIZED_BACKOFFICE_ENTRY</body></html>';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const token=(overrides={})=>[Buffer.from(JSON.stringify({alg:'ES256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:ids.user,iss:supabase+'/auth/v1',aud:'authenticated',session_id:ids.session,aal:'aal2',exp:Math.floor(Date.now()/1000)+3600,...overrides})).toString('base64url'),'testsignature'].join('.');
const user=(overrides={})=>({id:ids.user,email:'person@example.invalid',email_confirmed_at:'2026-11-01T00:00:00Z',is_anonymous:false,factors:[{id:ids.factor,status:'verified',factor_type:'totp',friendly_name:'Own authenticator'}],...overrides});
const actor=(overrides={})=>({id:ids.user,workspaceId:ids.workspace,organizationId:null,role:'admin',permissions:['support.ticket.read','support.ticket.create'],...overrides});
const cookies=({access,refresh='refresh-token-for-tests',csrf='csrf-bound-to-browser-session'}={})=>Object.entries({[cookieNames.access]:access,[cookieNames.refresh]:refresh,[cookieNames.csrf]:csrf}).filter(([,value])=>value!==undefined&&value!==null).map(([name,value])=>name+'='+value).join('; ');
function request(path,{method='GET',cookie,body,headers={},sameOrigin=method!=='GET'}={}){
 return new Request(origin+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(sameOrigin?{Origin:origin}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
}
function provider({access=token(),identity=user(),context=actor(),respond}={}){
 const calls=[],accepted=new Map([[access,identity]]),state={context,respond,refreshResult:null};
 const fetcher=async(input,options={})=>{
  const url=new URL(input instanceof Request?input.url:String(input));
  assert.equal(url.origin,supabase,'All identity calls stay on the configured provider');
  assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
  const headers=new Headers(options.headers),call={path:url.pathname+url.search,method:options.method||'GET',headers,body:options.body?JSON.parse(options.body):undefined};calls.push(call);
  assert.equal(headers.get('apikey'),env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if(state.respond){const response=await state.respond(call);if(response!==undefined)return response;}
  const bearer=headers.get('authorization')?.replace(/^Bearer /,'');
  if(call.path==='/auth/v1/user')return accepted.has(bearer)?json(accepted.get(bearer)):json({message:'Untrusted or revoked token'},401);
  if(call.path==='/rest/v1/rpc/dg_bo_context')return typeof state.context==='function'?state.context(call):json(state.context);
  if(call.path==='/auth/v1/token?grant_type=refresh_token'&&state.refreshResult)return json(state.refreshResult);
  throw new Error('Unexpected mocked provider call: '+call.path);
 };
 return{access,calls,accepted,state,fetcher};
}
function harness(options={}){
 const identity=provider(options),domainCalls=[];
 const domain=options.domain||(async input=>{domainCalls.push(input);return{status:200,value:{ok:true,role:input.actor.role,permissions:input.actor.permissions}};});
 return{...identity,domainCalls,web:createBackofficeWeb({env,fetcher:identity.fetcher,domain})};
}
const setCookies=response=>response.headers.getSetCookie();
function cookieJar(response){return setCookies(response).map(value=>value.split(';')[0]).join('; ');}
function assertPrivate(response){assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.match(response.headers.get('x-robots-tag'),/noindex/);}
function assertCleared(response){const values=setCookies(response);assert.equal(values.length,3);for(const name of Object.values(cookieNames))assert.ok(values.some(value=>value.startsWith(name+'=;')&&value.includes('Max-Age=0')&&value.includes('HttpOnly')&&value.includes('Secure')&&value.includes('SameSite=Strict')));}

test('a browser-supplied identity is never enough: forged tokens and failed getUser block domain, runtime and entry',async()=>{
 const h=harness(),forged=token({role:'admin',user_metadata:{role:'admin'},sub:ids.other});
 const req=path=>request(path,{cookie:cookies({access:forged})});
 const api=await h.web.api(req('/admin/api/support/tickets'));assert.equal(api.status,401);assert.equal((await api.json()).code,'AUTHENTICATION_FAILED');assertPrivate(api);
 const runtime=await h.web.runtime(req('/admin/runtime.js'));assert.equal(runtime.status,401);assert.doesNotMatch(await runtime.text(),/DG_RUNTIME/);
 const page=await h.web.page(req('/admin'),entry);assert.equal(page.status,200);assert.doesNotMatch(await page.text(),/AUTHORIZED_BACKOFFICE_ENTRY/);
 assert.equal(h.domainCalls.length,0);assert.ok(h.calls.every(call=>call.path==='/auth/v1/user'));
});

test('verified identity must match issuer, subject, audience, session and current account state',async t=>{
 for(const [name,claims,identity,status,code]of[
  ['subject mismatch',{sub:ids.other},user(),401,'INVALID_SESSION'],
  ['foreign issuer',{iss:'https://attacker.invalid/auth/v1'},user(),401,'INVALID_SESSION'],
  ['wrong audience',{aud:'service_role'},user(),401,'INVALID_SESSION'],
  ['missing session',{session_id:null},user(),401,'INVALID_SESSION'],
  ['anonymous account',{},user({is_anonymous:true}),401,'INVALID_SESSION'],
  ['currently banned account',{},user({banned_until:new Date(Date.now()+3600000).toISOString()}),401,'INVALID_SESSION'],
  ['unconfirmed email',{},user({email_confirmed_at:null}),403,'EMAIL_VERIFICATION_REQUIRED'],
 ])await t.test(name,async()=>{const access=token(claims),h=harness({access,identity}),response=await h.web.api(request('/admin/api/support/tickets',{cookie:cookies({access})}));assert.equal(response.status,status);assert.equal((await response.json()).code,code);assert.equal(h.domainCalls.length,0);assert.equal(h.calls.filter(call=>call.path.includes('dg_bo_context')).length,0);});
});

test('aal1 can reach MFA state but cannot receive domain data, runtime or the protected document',async()=>{
 const access=token({aal:'aal1'}),h=harness({access}),cookie=cookies({access});
 for(const invoke of[()=>h.web.api(request('/admin/api/support/tickets',{cookie})),()=>h.web.runtime(request('/admin/runtime.js',{cookie}))]){const response=await invoke();assert.equal(response.status,403);assert.equal((await response.json()).code,'MFA_REQUIRED');}
 const page=await h.web.page(request('/admin',{cookie}),entry);assert.doesNotMatch(await page.text(),/AUTHORIZED_BACKOFFICE_ENTRY/);
 const state=await h.web.auth(request('/admin/auth/session',{cookie}));assert.equal(state.status,200);const value=await state.json();assert.equal(value.state,'mfa_required');assert.deepEqual(value.factors,[{id:ids.factor,name:'Own authenticator'}]);
 assert.equal(h.domainCalls.length,0);assert.equal(h.calls.filter(call=>call.path.includes('dg_bo_context')).length,0);
});

test('stale aal2 assurance cannot outlive a current verified MFA factor',async t=>{
 for(const [name,factors]of[
  ['factor was removed',[]],
  ['factor is no longer verified',[{id:ids.factor,status:'unverified',factor_type:'totp'}]],
  ['factor verification status is absent',[{id:ids.factor,factor_type:'totp'}]],
 ])await t.test(name,async()=>{
  const h=harness({identity:user({factors})}),cookie=cookies({access:h.access});
  const response=await h.web.api(request('/admin/api/support/tickets',{cookie}));assert.equal(response.status,403);assert.equal((await response.json()).code,'MFA_REQUIRED');assert.equal(h.domainCalls.length,0);assert.equal(h.calls.filter(call=>call.path.includes('dg_bo_context')).length,0,'Stale assurance must be rejected before membership or business data is queried');
  const state=await h.web.auth(request('/admin/auth/session',{cookie}));assert.equal(state.status,200);const value=await state.json();assert.equal(value.state,'mfa_required');assert.deepEqual(value.factors,[]);assert.ok(value.csrf,'The existing browser session can continue through the MFA flow');assert.equal(h.calls.filter(call=>call.path.includes('dg_bo_context')).length,0);
  const page=await h.web.page(request('/admin',{cookie}),entry);assert.equal(page.status,200);assert.doesNotMatch(await page.text(),/AUTHORIZED_BACKOFFICE_ENTRY/);
 });
 for(const factor_type of['totp','phone','webauthn'])await t.test('current verified '+factor_type+' with genuine aal2 remains valid',async()=>{
  const h=harness({identity:user({factors:[{id:ids.factor,status:'verified',factor_type}]})}),cookie=cookies({access:h.access});
  const control=await h.web.api(request('/admin/api/support/tickets',{cookie}));assert.equal(control.status,200);assert.equal(h.domainCalls.length,1);
  const state=await h.web.auth(request('/admin/auth/session',{cookie}));assert.equal(state.status,200);assert.equal((await state.json()).state,'ready');assert.ok(h.calls.every(call=>!call.path.includes('/factors')),'Accepting an existing MFA session must not send SMS, enroll or challenge another factor');
 });
});

test('membership and permissions are fetched anew for every authorized request; user metadata and spoofed headers are ignored',async()=>{
 const access=token({role:'admin',user_metadata:{role:'admin'},app_metadata:{role:'admin'}}),h=harness({access,identity:user({user_metadata:{role:'admin',workspaceId:ids.workspace}}),context:actor({role:'client',organizationId:ids.organization,permissions:['support.ticket.read']})}),cookie=cookies({access});
 const first=await h.web.api(request('/admin/api/support/tickets',{cookie,headers:{'X-Role':'admin','X-User-ID':ids.other,'X-Workspace-ID':ids.other,Authorization:'Bearer browser-supplied-admin'}}));assert.equal(first.status,200);assert.equal((await first.json()).role,'client');
 assert.equal(h.domainCalls[0].actor.organizationId,ids.organization);assert.equal(h.domainCalls[0].accessToken,access);
 h.state.context=actor({role:'support',permissions:['support.ticket.internal_note']});
 const second=await h.web.api(request('/admin/api/support/tickets',{cookie}));assert.equal(second.status,200);assert.deepEqual((await second.json()).permissions,['support.ticket.internal_note']);
 h.state.context=()=>json({message:'membership has been revoked'},403);
 const third=await h.web.api(request('/admin/api/support/tickets',{cookie}));assert.equal(third.status,403);assert.equal(h.domainCalls.length,2);
 assert.equal(h.calls.filter(call=>call.path==='/auth/v1/user').length,3);assert.equal(h.calls.filter(call=>call.path==='/rest/v1/rpc/dg_bo_context').length,3);
});

test('malformed or unscoped current membership never authorizes a domain action',async t=>{
 for(const [name,context]of[
  ['different actor',actor({id:ids.other})],['unknown role',actor({role:'superadmin'})],['missing workspace',actor({workspaceId:null})],['client without organization',actor({role:'client',organizationId:null})],['invalid organization',actor({organizationId:'browser-org'})],['invalid permission type',actor({permissions:[{admin:true}]})],
 ])await t.test(name,async()=>{const h=harness({context}),response=await h.web.api(request('/admin/api/support/tickets',{cookie:cookies({access:h.access})}));assert.equal(response.status,403);assert.equal(h.domainCalls.length,0);});
});

test('cross-site requests and missing, mismatched or duplicate CSRF cookies are denied before provider or domain work',async t=>{
 for(const [name,options]of[
  ['foreign origin',{headers:{Origin:'https://attacker.invalid','X-CSRF-Token':'csrf-bound-to-browser-session'}}],
  ['absent origin',{sameOrigin:false,headers:{'X-CSRF-Token':'csrf-bound-to-browser-session'}}],
  ['cross-site fetch metadata',{headers:{'Sec-Fetch-Site':'cross-site','X-CSRF-Token':'csrf-bound-to-browser-session'}}],
  ['missing header',{}],['wrong header',{headers:{'X-CSRF-Token':'wrong'}}],
  ['missing csrf cookie',{cookie:cookies({access:token(),csrf:null}),headers:{'X-CSRF-Token':'csrf-bound-to-browser-session'}}],
  ['duplicate csrf cookie',{duplicate:true,headers:{'X-CSRF-Token':'csrf-bound-to-browser-session'}}],
 ])await t.test(name,async()=>{const h=harness(),base=cookies({access:h.access}),cookie=options.duplicate?base+'; '+cookieNames.csrf+'=different':options.cookie||base,response=await h.web.api(request('/admin/api/support/tickets',{method:'POST',cookie,body:{subject:'Retained input'},...options}));assert.ok([401,403].includes(response.status));assert.equal(h.calls.length,0);assert.equal(h.domainCalls.length,0);});
 const h=harness(),read=await h.web.api(request('/admin/api/support/tickets',{cookie:cookies({access:h.access}),headers:{Origin:'https://attacker.invalid'}}));assert.equal(read.status,403);assert.equal(h.calls.length,0);
});

test('password login binds its response CSRF to strict host cookies, and only that browser token permits writes',async()=>{
 const access=token(),h=harness({access,respond:call=>call.path==='/auth/v1/token?grant_type=password'?json({access_token:access,refresh_token:'new-password-refresh-token'}):undefined});
 const blocked=await h.web.auth(request('/admin/auth/login',{method:'POST',body:{email:'person@example.invalid',password:'never-reflect-this-password'},headers:{Origin:'https://attacker.invalid'}}));assert.equal(blocked.status,403);assert.equal(h.calls.length,0);
 const response=await h.web.auth(request('/admin/auth/login',{method:'POST',body:{email:'person@example.invalid',password:'never-reflect-this-password'},cookie:cookies({access,csrf:'previous-csrf'})}));assert.equal(response.status,200);const value=await response.json();assert.ok(value.csrf);assert.notEqual(value.csrf,'previous-csrf');assert.doesNotMatch(JSON.stringify(value),/never-reflect|refresh-token|testsignature/);assert.equal(setCookies(response).length,3);
 for(const set of setCookies(response)){assert.match(set,/; Path=\//);assert.match(set,/; HttpOnly/);assert.match(set,/; Secure/);assert.match(set,/; SameSite=Strict/);assert.doesNotMatch(set,/Domain=/i);}
 const cookie=cookieJar(response);assert.ok(cookie.includes(cookieNames.csrf+'='+value.csrf));
 const rejected=await h.web.api(request('/admin/api/support/tickets',{method:'POST',cookie,body:{subject:'Example'},headers:{'X-CSRF-Token':'previous-csrf'}}));assert.equal(rejected.status,403);
 const accepted=await h.web.api(request('/admin/api/support/tickets',{method:'POST',cookie,body:{subject:'Example'},headers:{'X-CSRF-Token':value.csrf}}));assert.equal(accepted.status,200);assert.equal(h.domainCalls.length,1);
});

test('concurrent refresh is coalesced without caching current user checks or membership revocation',async()=>{
 const expired=token({exp:Math.floor(Date.now()/1000)-100}),renewed=token({exp:Math.floor(Date.now()/1000)+7200}),refresh='coalescing-'+crypto.randomUUID();let release,started;
 const gate=new Promise(resolve=>{release=resolve;}),start=new Promise(resolve=>{started=resolve;});
 const h=harness({access:expired,respond:async call=>{if(call.path==='/auth/v1/token?grant_type=refresh_token'){started();await gate;return json({access_token:renewed,refresh_token:'rotated-'+refresh});}}});h.accepted.set(renewed,user());
 const cookie=cookies({access:expired,refresh}),pending=[h.web.api(request('/admin/api/support/tickets',{cookie})),h.web.api(request('/admin/api/support/tickets',{cookie}))];
 await start;release();const results=await Promise.all(pending);for(const response of results){assert.equal(response.status,200);assert.ok(cookieJar(response).includes(renewed));}
 assert.equal(h.calls.filter(call=>call.path.includes('grant_type=refresh_token')).length,1);assert.equal(h.calls.filter(call=>call.path==='/auth/v1/user').length,2);assert.equal(h.calls.filter(call=>call.path.includes('dg_bo_context')).length,2);
 h.state.context=()=>json({message:'access removed'},403);const denied=await h.web.api(request('/admin/api/support/tickets',{cookie}));assert.equal(denied.status,403);assert.equal(h.domainCalls.length,2);assert.equal(h.calls.filter(call=>call.path.includes('grant_type=refresh_token')).length,1);
 h.accepted.delete(renewed);const revoked=await h.web.api(request('/admin/api/support/tickets',{cookie}));assert.equal(revoked.status,401);assert.equal(h.domainCalls.length,2);assert.equal(h.calls.filter(call=>call.path==='/auth/v1/user').length,4);
});

test('an expired aal1 document request returns rotated cookies together with the MFA page',async()=>{
 const access=token({aal:'aal1',exp:Math.floor(Date.now()/1000)-100}),renewed=token({aal:'aal1'}),refresh='mfa-page-'+crypto.randomUUID(),h=harness({access});h.accepted.set(renewed,user());h.state.refreshResult={access_token:renewed,refresh_token:'rotated-'+refresh};
 const response=await h.web.page(request('/admin',{cookie:cookies({access,refresh})}),entry);assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/AUTHORIZED_BACKOFFICE_ENTRY/);assert.ok(cookieJar(response).includes(cookieNames.access+'='+renewed),'The new session must reach the browser after the old refresh token was consumed');assert.ok(cookieJar(response).includes('rotated-'+refresh));
});

test('a completed refresh survives a later recoverable failure without exposing session material in JSON',async t=>{
 for(const stage of['identity temporarily unavailable','invalid API JSON','MFA code rejected','domain exception'])await t.test(stage,async()=>{
  const aal=stage==='MFA code rejected'?'aal1':'aal2',access=token({aal,exp:Math.floor(Date.now()/1000)-100}),renewed=token({aal}),refresh='recovery-'+crypto.randomUUID();
  const h=harness({access,respond:call=>{
   if(stage==='identity temporarily unavailable'&&call.path==='/auth/v1/user')return json({message:'PRIVATE outage'},503);
   if(stage==='MFA code rejected'&&call.path.endsWith('/challenge'))return json({id:ids.challenge});
   if(stage==='MFA code rejected'&&call.path.endsWith('/verify'))return json({message:'PRIVATE rejected code'},400);
  },...(stage==='domain exception'?{domain:async()=>{throw new Error('PRIVATE domain exception');}}:{})});
  h.accepted.set(renewed,user());h.state.refreshResult={access_token:renewed,refresh_token:'rotated-'+refresh};
  const cookie=cookies({access,refresh}),headers={'X-CSRF-Token':'csrf-bound-to-browser-session'};
  const response=stage==='MFA code rejected'
   ?await h.web.auth(request('/admin/auth/verify',{method:'POST',cookie,headers,body:{factorId:ids.factor,code:'000000'}}))
   :stage==='invalid API JSON'
    ?await h.web.api(request('/admin/api/support/tickets',{method:'POST',cookie,headers,body:'{"subject":'}))
    :await h.web.api(request('/admin/api/support/tickets',{cookie}));
  assert.equal(response.status,stage==='invalid API JSON'?400:stage==='MFA code rejected'?401:503);
  const body=await response.text();assert.doesNotMatch(body,/PRIVATE/);assert.ok(!body.includes(renewed));assert.ok(!body.includes('rotated-'+refresh));
  assert.ok(cookieJar(response).includes(cookieNames.access+'='+renewed),'The acknowledged refresh must reach the browser even though the following operation failed');assert.ok(cookieJar(response).includes('rotated-'+refresh));assertPrivate(response);
 });
});

test('MFA verifies only the current user-owned TOTP factor and a valid six-digit code',async()=>{
 const access=token({aal:'aal1'}),h=harness({access}),cookie=cookies({access}),headers={'X-CSRF-Token':'csrf-bound-to-browser-session'};
 const foreign=await h.web.auth(request('/admin/auth/verify',{method:'POST',cookie,headers,body:{factorId:ids.foreignFactor,code:'123456'}}));assert.equal(foreign.status,403);assert.equal((await foreign.json()).code,'INVALID_MFA');assert.ok(h.calls.every(call=>!call.path.includes('/factors/')));
 const invalid=await h.web.auth(request('/admin/auth/verify',{method:'POST',cookie,headers,body:{factorId:ids.factor,code:'1234567'}}));assert.equal(invalid.status,422);assert.ok(h.calls.every(call=>!call.path.includes('/factors/')));
 const existing=await h.web.auth(request('/admin/auth/enroll',{method:'POST',cookie,headers,body:{}}));assert.equal(existing.status,409);assert.equal((await existing.json()).code,'MFA_ALREADY_ENROLLED');
 const elevated=token(),newRefresh='mfa-verified-refresh-token';h.accepted.set(elevated,user());h.state.respond=call=>call.path===`/auth/v1/factors/${ids.factor}/challenge`?json({id:ids.challenge}):call.path===`/auth/v1/factors/${ids.factor}/verify`?json({access_token:elevated,refresh_token:newRefresh}):undefined;
 const verified=await h.web.auth(request('/admin/auth/verify',{method:'POST',cookie,headers,body:{factorId:ids.factor,code:'123456'}}));assert.equal(verified.status,200);assert.deepEqual(await verified.json(),{verified:true,csrf:'csrf-bound-to-browser-session'});assert.ok(cookieJar(verified).includes(elevated));
 assert.deepEqual(h.calls.find(call=>call.path.endsWith('/verify')).body,{challenge_id:ids.challenge,code:'123456'});
 const granted=await h.web.api(request('/admin/api/session',{cookie:cookieJar(verified)}));assert.equal(granted.status,200);assert.equal((await granted.json()).authentication,'supabase-mfa');
});

test('MFA enrollment exposes only the authenticated user new factor and does not authorize the domain',async()=>{
 const access=token({aal:'aal1'}),secret='TOTPENROLLMENTONLY',h=harness({access,identity:user({factors:[]}),respond:call=>call.path==='/auth/v1/factors'?json({id:ids.factor,totp:{qr_code:'<svg xmlns="http://www.w3.org/2000/svg"></svg>',secret}}):undefined});
 const response=await h.web.auth(request('/admin/auth/enroll',{method:'POST',cookie:cookies({access}),headers:{'X-CSRF-Token':'csrf-bound-to-browser-session'},body:{}}));assert.equal(response.status,200);assert.equal((await response.json()).secret,secret);assertPrivate(response);assert.equal(h.domainCalls.length,0);assert.deepEqual(h.calls.find(call=>call.path==='/auth/v1/factors').body,{factor_type:'totp',friendly_name:'DG Webservices'});
});

test('provider failures and unexpected server errors never reflect passwords, tokens, metadata or error bodies',async t=>{
 const marker='PRIVATE-provider-token-password-person@example.invalid';
 for(const [name,respond,expected]of[
  ['provider 500',()=>json({message:marker,details:{token:marker}},500),503],
  ['provider 401',()=>json({message:marker},401),401],
  ['network exception',()=>{throw new Error(marker);},503],
  ['invalid JSON',()=>new Response(marker,{status:200}),503],
  ['oversized response',()=>new Response(marker,{status:200,headers:{'Content-Length':'2000000'}}),503],
 ])await t.test(name,async()=>{const h=harness({respond}),response=await h.web.api(request('/admin/api/support/tickets',{cookie:cookies({access:h.access})}));assert.equal(response.status,expected);assert.doesNotMatch(await response.text(),new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.equal(h.domainCalls.length,0);assertPrivate(response);});
 const h=harness({domain:async()=>{throw new Error(marker);}}),response=await h.web.api(request('/admin/api/support/tickets',{cookie:cookies({access:h.access})}));assert.equal(response.status,503);assert.equal((await response.json()).code,'BACKOFFICE_UNAVAILABLE');
});

test('logout clears all host cookies even when upstream revocation is uncertain, and reports that uncertainty',async t=>{
 for(const stage of['user','logout'])await t.test(stage,async()=>{const h=harness({respond:call=>(stage==='user'&&call.path==='/auth/v1/user'||stage==='logout'&&call.path.startsWith('/auth/v1/logout'))?json({message:'PRIVATE upstream failure'},503):undefined}),response=await h.web.auth(request('/admin/auth/logout',{method:'POST',cookie:cookies({access:h.access}),headers:{'X-CSRF-Token':'csrf-bound-to-browser-session'},body:{}}));assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,localSessionCleared:true,serverRevocationConfirmed:false});assertCleared(response);});
 const h=harness({respond:call=>call.path==='/auth/v1/logout?scope=local'?new Response(null,{status:204}):undefined}),response=await h.web.api(request('/admin/api/logout',{method:'POST',cookie:cookies({access:h.access}),headers:{'X-CSRF-Token':'csrf-bound-to-browser-session'},body:{}}));assert.equal(response.status,200);assert.equal((await response.json()).serverRevocationConfirmed,true);assertCleared(response);
 const invalid=await h.web.auth(request('/admin/auth/logout',{method:'POST',cookie:cookies({access:h.access}),body:{}}));assert.equal(invalid.status,403);assert.equal(setCookies(invalid).length,0);
});

test('signed-out, malformed body and duplicate session cookies fail closed without leaking an authenticated entry',async()=>{
 const h=harness(),signedOut=await h.web.auth(request('/admin/auth/session'));assert.equal(signedOut.status,200);assert.deepEqual(await signedOut.json(),{state:'signed_out'});assertCleared(signedOut);assert.equal(h.calls.length,0);
 const cookie=cookies({access:h.access})+'; '+cookieNames.access+'='+h.access,duplicate=await h.web.api(request('/admin/api/session',{cookie}));assert.equal(duplicate.status,401);assert.equal(h.calls.length,0);
 const malformed=await h.web.auth(request('/admin/auth/login',{method:'POST',body:'{"email":'}));assert.equal(malformed.status,400);assert.equal((await malformed.json()).code,'INVALID_JSON');assert.equal(h.calls.length,0);
 const tooLarge=await h.web.auth(request('/admin/auth/login',{method:'POST',body:{email:'person@example.invalid',password:'p'.repeat(5000)}}));assert.equal(tooLarge.status,413);assert.equal(h.calls.length,0);
 const wrongType=await h.web.auth(request('/admin/auth/login',{method:'POST',body:'email=person',headers:{'Content-Type':'text/plain'}}));assert.equal(wrongType.status,415);assert.equal(h.calls.length,0);
});

test('a noncanonical document host redirects only to the configured admin URL without authenticating or reflecting a target host',async()=>{
 const h=harness(),response=await h.web.page(new Request('https://untrusted.example/admin?returnTo=https%3A%2F%2Fattacker.invalid%2F'),entry);
 assert.equal(response.status,307);const location=new URL(response.headers.get('location'));assert.equal(location.origin,origin);assert.equal(location.pathname,'/admin');assert.equal(location.search,'?returnTo=https%3A%2F%2Fattacker.invalid%2F');assert.equal(await response.text(),'');assert.equal(setCookies(response).length,0);assert.equal(h.calls.length,0);assertPrivate(response);
});

test('fixture mode cannot be promoted to the public origin or selected by browser input, and missing production config never falls back to fixtures',async()=>{
 let calls=0;const neverFetch=async()=>{calls++;throw new Error('A rejected environment must not contact any upstream');};
 const publicFixture=createBackofficeWeb({env:{DGWEB_DATA_MODE:'fixture',DGWEB_APP_ORIGIN:origin+'/admin'},fetcher:neverFetch});
 const rejected=await publicFixture.page(request('/admin'),entry);assert.equal(rejected.status,503);assert.equal((await rejected.json()).code,'FIXTURE_LOOPBACK_ONLY');
 const loopback=createBackofficeWeb({env:{DGWEB_DATA_MODE:'fixture',DGWEB_APP_ORIGIN:'http://127.0.0.1:4188/admin'},fetcher:neverFetch});
 for(const response of[await loopback.page(request('/admin'),entry),await loopback.runtime(request('/admin/runtime.js')),await loopback.api(request('/admin/api/session'))]){assert.equal(response.status,403);assert.equal((await response.json()).code,'FIXTURE_LOOPBACK_ONLY');}
 const missing=createBackofficeWeb({env:{DGWEB_APP_ORIGIN:origin+'/admin'},fetcher:neverFetch}),unconfigured=await missing.page(request('/admin?mode=fixture'),entry);assert.equal(unconfigured.status,503);assert.equal((await unconfigured.json()).code,'CONFIGURATION_REQUIRED');
 const h=harness(),browserChoice=await h.web.api(request('/admin/api/session?mode=fixture',{cookie:'dg_fixture_session='+'a'.repeat(64),headers:{'X-DGWEB-Data-Mode':'fixture','X-Role':'admin'}}));assert.equal(browserChoice.status,401);assert.equal((await browserChoice.json()).code,'UNAUTHENTICATED');assert.equal(h.calls.length,0);assert.equal(h.domainCalls.length,0);assert.equal(calls,0);
});
