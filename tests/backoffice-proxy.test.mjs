import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTrustedProxyRequest} from '../backoffice/server/proxy-request.mjs';
import {checkOrigin,checkCsrf} from '../backoffice/server/auth.mjs';
const production={mode:'supabase',appOrigin:'https://dgwebservices.nl/admin',origin:'https://dgwebservices.nl'};
const fixture={mode:'fixture',appOrigin:'http://127.0.0.1:4190/admin',origin:'http://127.0.0.1:4190'};
const request=(url,headers={})=>new Request(url,{headers});
test('native Next internal origin normalizes only exact configured Host and HTTPS forwarding',()=>{
 const input=request('https://localhost:4190/admin/api/session?keep=1',{host:'dgwebservices.nl','x-forwarded-proto':'https'});
 const output=normalizeTrustedProxyRequest(input,production);assert.equal(output.url,'https://dgwebservices.nl/admin/api/session?keep=1');checkOrigin(output,production);
 for(const headers of[{host:'foreign.example','x-forwarded-proto':'https'},{host:'dgwebservices.nl'},{host:'dgwebservices.nl','x-forwarded-proto':'https,http'},{host:'dgwebservices.nl','x-forwarded-proto':'http'},{host:'dgwebservices.nl,foreign.example','x-forwarded-proto':'https'},{host:'dgwebservices.nl:4190','x-forwarded-proto':'https'}]){
  const invalid=request(input.url,headers);assert.equal(normalizeTrustedProxyRequest(invalid,production),invalid);assert.throws(()=>checkOrigin(invalid,production));
 }
 const authorityPath=normalizeTrustedProxyRequest(request('https://localhost:4190//foreign.example/admin',{host:'dgwebservices.nl','x-forwarded-proto':'https'}),production);assert.equal(new URL(authorityPath.url).origin,production.origin);assert.equal(new URL(authorityPath.url).pathname,'//foreign.example/admin');
 const http=request('http://localhost:4190/admin',{host:'dgwebservices.nl','x-forwarded-proto':'https'});assert.equal(normalizeTrustedProxyRequest(http,production),http);
});
test('fixture reconstructs configured HTTP loopback origin only with same port',()=>{
 const input=request('http://localhost:4190/admin/api/session',{host:'127.0.0.1:4190'});const output=normalizeTrustedProxyRequest(input,fixture);assert.equal(output.url,fixture.origin+'/admin/api/session');checkOrigin(output,fixture);
 for(const url of['http://localhost:4191/admin','https://localhost:4190/admin']){const invalid=request(url,{host:'127.0.0.1:4190'});assert.equal(normalizeTrustedProxyRequest(invalid,fixture),invalid);assert.throws(()=>checkOrigin(invalid,fixture));}
});
test('public canonical and foreign Request origins remain unchanged',()=>{
 for(const url of['https://dgwebservices.nl/admin','https://foreign.example/admin']){const input=request(url,{host:'dgwebservices.nl','x-forwarded-proto':'https'});assert.equal(normalizeTrustedProxyRequest(input,production),input);}
});
test('POST stream, cookies and signal survive normalization; strict Origin and CSRF still reject',async()=>{
 const controller=new AbortController();const input=new Request('https://localhost:4190/admin/api/integrations',{method:'POST',body:new ReadableStream({start(stream){stream.enqueue(new TextEncoder().encode('{"safe":"metadata"}'));stream.close();}}),duplex:'half',signal:controller.signal,headers:{host:'dgwebservices.nl','x-forwarded-proto':'https',origin:production.origin,'content-type':'application/json',cookie:'__Host-dg_bo_csrf=fixture-csrf','x-csrf-token':'fixture-csrf'}});
 const output=normalizeTrustedProxyRequest(input,production);assert.equal(output.method,'POST');assert.equal(output.headers.get('cookie'),'__Host-dg_bo_csrf=fixture-csrf');checkCsrf(output,production);assert.deepEqual(await output.json(),{safe:'metadata'});controller.abort();assert.equal(output.signal.aborted,true);
 for(const origin of['https://foreign.example','null']){const forged=normalizeTrustedProxyRequest(new Request('https://localhost:4190/admin/api/integrations',{method:'POST',body:'{}',headers:{host:'dgwebservices.nl','x-forwarded-proto':'https',origin,cookie:'__Host-dg_bo_csrf=fixture-csrf','x-csrf-token':'fixture-csrf'}}),production);assert.throws(()=>checkCsrf(forged,production));}
 const wrongToken=normalizeTrustedProxyRequest(new Request('https://localhost:4190/admin/api/integrations',{method:'POST',body:'{}',headers:{host:'dgwebservices.nl','x-forwarded-proto':'https',origin:production.origin,cookie:'__Host-dg_bo_csrf=fixture-csrf','x-csrf-token':'wrong'}}),production);assert.throws(()=>checkCsrf(wrongToken,production));
});
