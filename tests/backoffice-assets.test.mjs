import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backofficeApiPath, defaultBackofficeRole,defaultBackofficePage,backofficePageAllowed,hasBackofficePermission } from '../public/admin/admin-paths.js';

const root=fileURLToPath(new URL('../',import.meta.url));

test('the raw admin entry resolves every asset inside its own namespace from /admin without a trailing slash',async()=>{
 const source=await readFile(resolve(root,'backoffice/entry.ts'),'utf8'),match=source.match(/^export const entryHtml = (.+);$/m);assert.ok(match,'Private raw document export exists');const html=JSON.parse(match[1]);
 assert.ok(!html.includes('<base'));assert.ok(!html.includes('<iframe'));assert.ok(!html.includes('site-progress'));assert.match(html,/<body class="midnight-app">/);
 for(const attribute of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  if(attribute[1].startsWith('#'))continue;
  const url=new URL(attribute[1],'https://dgwebservices.nl/admin');assert.equal(url.origin,'https://dgwebservices.nl');assert.ok(url.pathname.startsWith('/admin/'),attribute[1]);
  const path=url.pathname==='/admin/runtime.js'?resolve(root,'app/admin/runtime.js/route.ts'):resolve(root,'public',url.pathname.slice(1));await access(path);
  if(path.endsWith('.css'))for(const font of(await readFile(path,'utf8')).matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)){const fontUrl=new URL(font[1],url);assert.ok(fontUrl.pathname.startsWith('/admin/'));await access(resolve(root,'public',fontUrl.pathname.slice(1)));}
 }
 await assert.rejects(access(resolve(root,'public/admin/index.html')));
});

test('logical API calls remain under /admin and cannot target marketing APIs or an external host',()=>{
 assert.equal(backofficeApiPath('/api/session'),'/admin/api/session');assert.equal(backofficeApiPath('/api/support/tickets?limit=20'),'/admin/api/support/tickets?limit=20');
 for(const path of ['https://other.example/api/session','//other.example/api/session','/admin/api/session','/api/../contact','/api/%2e%2e/contact','/api/%2fcontact','/api/session#fragment','/api/session\n'])assert.throws(()=>backofficeApiPath(path));
});

test('the authenticated actor controls the no-hash default while parity retains the original role selection',()=>{
 assert.equal(defaultBackofficeRole({actorRole:'admin'}),'admin');assert.equal(defaultBackofficeRole({actorRole:'client'}),'client');assert.equal(defaultBackofficeRole({actorRole:'client',requestedRole:'admin'}),'client');assert.equal(defaultBackofficeRole({actorRole:'admin',requestedRole:'client'}),'client');
 assert.equal(defaultBackofficeRole({fixtureParity:true,actorRole:'admin'}),'client');assert.equal(defaultBackofficeRole({fixtureParity:true,actorRole:'admin',requestedRole:'admin'}),'admin');assert.equal(defaultBackofficeRole({}),'client');
});


test('trusted staff roles use the admin shell with defaults limited to their actual read permissions',()=>{
 for(const role of ['support','operations','finance'])assert.equal(defaultBackofficeRole({actorRole:role,requestedRole:'client'}),'admin');
 assert.equal(defaultBackofficeRole({actorRole:'unknown',requestedRole:'admin'}),'client');
 assert.equal(defaultBackofficePage({actor:{role:'support',permissions:['support.ticket.read']}}),'support');
 assert.equal(defaultBackofficePage({actor:{role:'operations',permissions:['state.read']}}),'infrastructure');
 assert.equal(defaultBackofficePage({actor:{role:'operations',permissions:['support.ticket.read']}}),'support');
 assert.equal(defaultBackofficePage({actor:{role:'operations',permissions:[]}}),'overview');
 assert.equal(defaultBackofficePage({actor:{role:'finance',permissions:[]}}),'invoices');
 const reader={role:'support',permissions:['support.ticket.read','integrations.read']};
 assert.equal(backofficePageAllowed('support',reader),true);assert.equal(backofficePageAllowed('installations',reader),true);assert.equal(backofficePageAllowed('customers',reader),false);assert.equal(backofficePageAllowed('infrastructure',reader),false);assert.equal(hasBackofficePermission(reader,'integrations.manage'),false);
 assert.equal(backofficePageAllowed('installations',{role:'operations',permissions:['integrations.read']}),false,'UI follows existing backend role boundary');
});

test('fixture/parity role and page defaults remain exact for every authenticated role',()=>{
 for(const actorRole of ['admin','client','support','operations','finance',undefined])for(const requestedRole of ['admin','client',undefined]){
  assert.equal(defaultBackofficeRole({fixtureParity:true,actorRole,requestedRole}),requestedRole==='admin'?'admin':'client');
  assert.equal(defaultBackofficePage({fixtureParity:true,actor:{role:actorRole,permissions:['support.ticket.read','state.read']}}),'overview');
 }
});
