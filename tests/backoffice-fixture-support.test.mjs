import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// HTML digests verified against the final v8 review source before role gates.
// Fixed icon placeholders make this independent of visual assets and raster size.
const expected={
 admin:{overview:'e642cf1a0d8155c3d90f5a3947a03b7139b49a77403ea1842abbfc830dea7a2f',public:'a6325e54b25fafc68ef3c16feec661fcaf7dbd6c23efb2df2db3dabd007db0c1',private:'e0fbef34d9cb4f2c361ccb944e5f5f7095441a1aa128d9809da74fb82126563a'},
 client:{overview:'5ed0be95be788a364ace65a0f17d18e4fc1de96624fd5304e5611c5f1946fd9f',public:'e70b2e2007c31321b27659d918bb081fba0703e9907eebca78488d6e00f4008f'}
};
globalThis.DG_RUNTIME={mode:'fixture',fixtureParity:true};
globalThis.addEventListener=()=>{};globalThis.dispatchEvent=()=>{};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
globalThis.document={getElementById:()=>null};
globalThis.fetch=async()=>({ok:true,json:async()=>({actor:{id:'fixture-admin',role:'admin'},csrf:'fixture',mode:'fixture'})});
const {createSupport}=await import('../public/admin/support.js');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),h={escape,icon:name=>`<i data-icon="${name}"></i>`};
for(const role of ['admin','client'])test(`fixture Support ${role} HTML remains identical after production permission gates`,()=>{
 let modal='';const ctx={fixtureParity:true,getState:()=>({role,page:'support'}),h,modal:(_title,html)=>modal=html,toast(){},render(){},closeModal(){}},support=createSupport(ctx),actual={overview:support.render(role,'support',h)};
 support.action('ticket-view',{dataset:{id:'DG-284'}});actual.public=modal;
 if(role==='admin'){support.action('support-compose',{dataset:{id:'internal'}});actual.private=modal;}
 for(const [view,html]of Object.entries(actual))assert.equal(createHash('sha256').update(html).digest('hex'),expected[role][view],view);
});
