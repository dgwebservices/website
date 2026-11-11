import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.DG_RUNTIME={mode:'supabase',fixtureParity:false,providerWrites:false};
const calls=[];
globalThis.addEventListener=()=>{};
globalThis.localStorage={getItem(){throw new Error('Business state must not use browser storage');},setItem(){throw new Error('Business state must not seed browser storage');}};
globalThis.fetch=async(path,options={})=>{calls.push({path,method:options.method||'GET'});return {ok:true,json:async()=>path.endsWith('/session')?{actor:{id:'real-admin',role:'admin'},csrf:'test-csrf',mode:'supabase',providerWrites:false}:{value:null,revision:0}};};
const empty=await import('../public/admin/empty-state.js');
const {businessStore,session}=await import('../public/admin/business-store.js');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const messages=[],ctx={session:{actor:{role:'admin',permissions:['state.write','integrations.manage']}},h:{escape,icon:()=>''},getState:()=>({role:'admin',page:'infrastructure'}),toast:m=>messages.push(m),render(){},closeModal(){}};

test('a missing production bucket hydrates all eight valid empty shapes without a write or browser storage',()=>{
 assert.equal(session.mode,'supabase');assert.equal(session.providerWrites,false);assert.equal(calls.length,9);assert.ok(calls.every(call=>call.method==='GET'&&call.path.startsWith('/admin/api/')));
 for(const key of empty.realBusinessKeys)assert.deepEqual(JSON.parse(businessStore.getItem(key)),empty.emptyRealBusinessState(key));
 assert.deepEqual(JSON.parse(businessStore.getItem('dg-midnight-services-v1')).mail,[]);assert.deepEqual(JSON.parse(businessStore.getItem('dg-midnight-commerce-v1')).paid,{});assert.deepEqual(JSON.parse(businessStore.getItem('dg-midnight-maildesk-v1')).threads,[]);assert.equal(businessStore.pending,false);
 const a=empty.emptyRealBusinessState('services');a.mail.push('mutation');assert.deepEqual(empty.emptyRealBusinessState('services').mail,[]);
});

test('runtime selection preserves fixtures only outside the Supabase runtime',()=>{
 assert.equal(empty.isRealDataRuntime({mode:'supabase'}),true);assert.equal(empty.isRealDataRuntime({mode:'fixture'}),false);assert.equal(empty.isRealDataRuntime({mode:'supabase',fixtureParity:true}),false);
 assert.throws(()=>empty.emptyRealBusinessState('unknown'));
});

test('the actual legacy module factories cannot render seeded business data in production',async()=>{
 const factories=[['services','createServices',['domains','hosting','email','webmail']],['management','createManagement',['customers','orders','products','communication']],['account','createAccount',['account','subscriptions']],['commerce','createCommerce',['invoices']],['maildesk','createMaildesk',['maildesk']]];
 for(const [file,name,pages]of factories){const mod=(await import(`../public/admin/${file}.js`))[name](ctx);for(const role of ['admin','client'])for(const page of pages){const html=mod.render(role,page);assert.match(html,/data-real-empty=/);assert.doesNotMatch(html,/duindorp|clubhuis\.online|DG-2026-0104|Studio Noord|Bakkerij West|VeyoCast|Welkom bij DartFlow/i);assert.equal(mod.action('payment-confirm',{dataset:{}}),false);}}
 const infrastructure=(await import('../public/admin/infrastructure.js')).createInfrastructure(ctx),html=infrastructure.render('admin','infrastructure');assert.match(html,/Nog geen serverinventaris/);assert.doesNotMatch(html,/web01|app01|Zeven fictieve|Waarneming 09|Gezond|Runtime bevestigd|31%/);assert.match(html,/data-action="installation-start"/);
 assert.equal(infrastructure.action('infra-mode',{dataset:{id:'demo'}}),true);assert.match(messages.at(-1),/nog niet gekoppeld/);assert.equal(calls.length,9,'No factory initialization saves sample state');
});
