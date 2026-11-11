import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackofficeServer } from '../server/index.mjs';
import { hash } from '../server/store.mjs';
import { installationDefinitions, importReceiptMatches } from '../../../public/admin/installations.js';

async function fixture(t){
 const app=createBackofficeServer({mode:'fixture'}),address=await app.listen(),origin=`http://127.0.0.1:${address.port}`;t.after(()=>app.close());
 const response=await fetch(origin+'/api/session'),cookie=response.headers.get('set-cookie').split(';')[0],session=await response.json();
 const request=async(path,method='GET',body,key)=>{const result=await fetch(origin+path,{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-CSRF-Token':session.csrf,...(key?{'Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});return{status:result.status,body:await result.json()};};
 const values={...Object.fromEntries(installationDefinitions['customers-import'].steps.flatMap(step=>step.fields).map(field=>[field.name,String(field.example??'')])),wizardStep:'4',wizardCompleted:'true'};
 const create=await request('/api/integrations','POST',{kind:'customers-import',name:'Receipt binding fixture',values});assert.equal(create.status,201);
 return{app,request,item:create.body.integration};
}
async function commit(f,item,key){const preview=await f.request(`/api/integrations/${item.id}/customer-import/preview`,'POST',{revision:item.revision},`${key}-preview`);assert.equal(preview.status,200);const plan=preview.body.plan;const result=await f.request(`/api/integrations/${item.id}/customer-import/commit`,'POST',{revision:item.revision,planId:plan.id,digest:plan.digest},`${key}-commit`);assert.equal(result.status,200);return{plan,receipt:result.body.import};}

test('a changed import dossier retains A as history and binds the new B receipt to its exact configuration',async t=>{
 const f=await fixture(t),a=await commit(f,f.item,'receipt-a');assert.equal(a.receipt.integrationRevision,f.item.revision);assert.equal(a.receipt.configurationDigest,hash(f.item.values));
 let registry=(await f.request('/api/customer-registry')).body;assert.equal(importReceiptMatches(registry.imports[0],f.item),true);
 const update=await f.request(`/api/integrations/${f.item.id}`,'PUT',{revision:f.item.revision,values:{...f.item.values,batchReference:'receipt-b-batch',customerReference:'receipt-b-customer',organizationName:'Tweede klant B',billingEmail:'finance@customer-b.example'}});assert.equal(update.status,200);const changed=update.body.integration;
 registry=(await f.request('/api/customer-registry')).body;assert.equal(registry.imports[0].currentConfigurationMatch,false);assert.equal(importReceiptMatches(registry.imports[0],changed),false);
 const b=await commit(f,changed,'receipt-b');assert.notEqual(b.receipt.id,a.receipt.id);assert.equal(b.receipt.integrationRevision,changed.revision);assert.equal(b.receipt.configurationDigest,hash(changed.values));
 registry=(await f.request('/api/customer-registry')).body;assert.equal(registry.items.length,2);assert.equal(registry.imports.filter(receipt=>importReceiptMatches(receipt,changed)).length,1);assert.equal(registry.imports.find(receipt=>receipt.id===a.receipt.id).currentConfigurationMatch,false);
});

test('older persisted receipts without a revision/digest remain history and are never inferred current',async t=>{
 const f=await fixture(t),{receipt}=await commit(f,f.item,'legacy-receipt');delete receipt.integrationRevision;delete receipt.configurationDigest;
 f.app.db.prepare('UPDATE local_customer_imports SET data=? WHERE id=?').run(JSON.stringify(receipt),receipt.id);
 const registry=await f.request('/api/customer-registry');assert.equal(registry.status,200);assert.equal(registry.body.imports[0].currentConfigurationMatch,false);assert.equal(importReceiptMatches(registry.body.imports[0],f.item),false);assert.equal(registry.body.items.length,1);
});

test('an import plan also rejects same-revision configuration drift using its immutable digest',async t=>{
 const f=await fixture(t),preview=await f.request(`/api/integrations/${f.item.id}/customer-import/preview`,'POST',{revision:f.item.revision},'digest-drift-preview'),plan=preview.body.plan;
 const stored=f.app.db.prepare('SELECT data FROM integrations WHERE id=?').get(f.item.id),record=JSON.parse(stored.data);record.values.owner='Changed without a revision';f.app.db.prepare('UPDATE integrations SET data=? WHERE id=?').run(JSON.stringify(record),f.item.id);
 const result=await f.request(`/api/integrations/${f.item.id}/customer-import/commit`,'POST',{revision:f.item.revision,planId:plan.id,digest:plan.digest},'digest-drift-commit');assert.equal(result.status,409);assert.equal(result.body.code,'IMPORT_PLAN_CHANGED');assert.equal((await f.request('/api/customer-registry')).body.items.length,0);
});
