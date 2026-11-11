import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request as httpRequest } from 'node:http';
import { createBackofficeServer } from '../server/index.mjs';
import { wizardDefinitions, reconcileProviderOutcome, validateWizardRecord } from '../server/validation.mjs';
import { installationDefinitions } from '../../../public/admin/installations.js';

async function fixture(t, options = {}) {
  const app = createBackofficeServer({ mode:'fixture', ...options });
  const address = await app.listen(); const origin=`http://127.0.0.1:${address.port}`;
  t.after(()=>app.close());
  const auth=await fetch(`${origin}/api/session`), cookie=auth.headers.get('set-cookie').split(';')[0], session=await auth.json();
  const request=async(path,{method='GET',body,headers={}}={})=>{
    const response=await fetch(origin+path,{method,headers:{Cookie:cookie,...(body?{'Content-Type':'application/json',Origin:origin,'X-CSRF-Token':session.csrf}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
    return{status:response.status,body:await response.json(),headers:response.headers};
  };
  return{app,origin,cookie,session,request};
}
const state='/api/state/dg-midnight-account-v1';
const create=async f=>(await f.request('/api/integrations',{method:'POST',body:{kind:'20i',name:'Fixture 20i',values:{configurationName:'Fixture 20i',owner:'Fixture operator',accountReference:'fixture-account',environment:'staging'}}})).body.integration;
const importValues=(extra={})=>({...Object.fromEntries(installationDefinitions['customers-import'].steps.flatMap(step=>step.fields).map(field=>[field.name,String(field.example??'')])),wizardStep:'4',wizardCompleted:'true',...extra});
async function importDossier(f,extra={}){const result=await f.request('/api/integrations',{method:'POST',body:{kind:'customers-import',name:'Fixture customer import',values:importValues(extra)}});assert.equal(result.status,201);return result.body.integration;}
async function importPreview(f,item,key='customer-preview-001'){return f.request(`/api/integrations/${item.id}/customer-import/preview`,{method:'POST',body:{revision:item.revision},headers:{'Idempotency-Key':key}});}
async function importCommit(f,item,plan,key='customer-commit-001',extra={}){return f.request(`/api/integrations/${item.id}/customer-import/commit`,{method:'POST',body:{revision:item.revision,planId:plan.id,digest:plan.digest,...extra},headers:{'Idempotency-Key':key}});}

test('fixture runtime fails closed outside loopback and does not mint live authorization',async t=>{
  assert.throws(()=>createBackofficeServer({mode:'production'}),/geblokkeerd/);
  assert.throws(()=>createBackofficeServer({mode:'fixture',host:'0.0.0.0'}),/loopback/);
  const f=await fixture(t);
  assert.equal(f.session.mode,'fixture');assert.equal(f.session.providerWrites,false);
  assert.match(f.cookie,/^dg_fixture_session=/);
  assert.throws(()=>f.app.server.listen(0,'0.0.0.0'),/loopback/);
  const unauthorized=await fetch(f.origin+state);assert.equal(unauthorized.status,401);
  const forgedHost=await new Promise((resolve,reject)=>{const request=httpRequest(f.origin+'/api/session',{headers:{Host:'attacker.invalid'}},response=>{response.resume();resolve(response.statusCode);});request.on('error',reject);request.end();});assert.equal(forgedHost,403);
  const crossSite=await fetch(f.origin+'/api/session',{headers:{Origin:'https://attacker.invalid'}});assert.equal(crossSite.status,403);
});

test('CSRF, origin and session expiry/logout protect writes',async t=>{
  const f=await fixture(t);
  assert.equal((await f.request(state,{method:'PUT',body:{value:{safe:true},revision:0},headers:{'X-CSRF-Token':'forged'}})).status,403);
  assert.equal((await f.request(state,{method:'PUT',body:{value:{safe:true},revision:0},headers:{'X-CSRF-Token':'é'.repeat(64)}})).status,403);
  assert.equal((await f.request(state,{method:'PUT',body:{value:{safe:true},revision:0},headers:{Origin:'https://attacker.invalid'}})).status,403);
  assert.equal((await f.request(state)).body.revision,0);
  assert.equal((await f.request('/api/logout',{method:'POST',body:{}})).status,200);
  assert.equal((await f.request(state)).status,401);
});

test('role switch and client-supplied permissions cannot grant backend access',async t=>{
  const f=await fixture(t,{fixturePrincipal:{id:'customer-a',role:'client',workspaceId:'workspace-a',organizationId:'org-a'}});
  assert.equal((await f.request('/api/state/dg-midnight-infrastructure-v1',{headers:{'X-Role':'admin'}})).status,403);
  assert.equal((await f.request('/api/integrations',{method:'POST',body:{role:'admin',permissions:['integrations.manage'],kind:'20i',name:'x',values:{}}})).status,403);
  assert.equal((await f.request('/api/audit')).status,403);
  assert.equal((await f.request('/api/jobs')).status,403);
  assert.equal((await f.request(state,{method:'PUT',body:{value:{role:'admin'},revision:0}})).status,200);
  assert.equal((await f.request('/api/integrations')).status,403);
});

test('state persists on the server and CAS rejects stale edits',async t=>{
  const folder=await mkdtemp(join(tmpdir(),'dg-backoffice-'));t.after(()=>rm(folder,{recursive:true,force:true}));
  const dbPath=join(folder,'state.sqlite');const f=await fixture(t,{dbPath});
  const saved=await f.request(state,{method:'PUT',body:{value:{note:'public fixture note'},revision:0}});assert.equal(saved.status,200);assert.equal(saved.body.revision,1);
  const conflict=await f.request(state,{method:'PUT',body:{value:{note:'stale'},revision:0}});assert.equal(conflict.status,409);assert.equal(conflict.body.current.revision,1);
  const g=await fixture(t,{dbPath});assert.deepEqual((await g.request(state)).body,{value:{note:'public fixture note'},revision:1});
});

test('principal and workspace scope prevent IDOR for state and installations',async t=>{
  const folder=await mkdtemp(join(tmpdir(),'dg-scope-'));t.after(()=>rm(folder,{recursive:true,force:true}));const dbPath=join(folder,'scope.sqlite');
  const f=await fixture(t,{dbPath,fixturePrincipal:{id:'admin-a',role:'admin',workspaceId:'a'}});
  const item=await create(f);await f.request(state,{method:'PUT',body:{value:{note:'workspace-a'},revision:0}});
  assert.throws(()=>f.app.db.prepare('INSERT INTO jobs VALUES(?,?,?,?,?,?,?)').run('cross-scope-job','b',item.id,'test','blocked','{}',new Date().toISOString()),/scope mismatch/);
  const g=await fixture(t,{dbPath,fixturePrincipal:{id:'admin-b',role:'admin',workspaceId:'b'}});
  assert.equal((await g.request(`/api/integrations/${item.id}`)).status,404);
  assert.equal((await g.request(`/api/integrations/${item.id}`,{method:'PUT',body:{revision:1,values:{name:'attack'}}})).status,404);
  assert.equal((await g.request('/api/integrations')).body.items.length,0);
  assert.equal((await g.request(state)).body.value,null);
  const peer=await fixture(t,{dbPath,fixturePrincipal:{id:'admin-c',role:'admin',workspaceId:'a'}});
  assert.equal((await peer.request(state)).body.value,null);
  const client=await fixture(t,{dbPath,fixturePrincipal:{role:'client'}});
  assert.equal(client.session.actor.id,'fixture-client');assert.equal((await client.request(state)).body.value,null);
  const orgA=await fixture(t,{dbPath,fixturePrincipal:{id:'shared-user',role:'client',workspaceId:'a',organizationId:'org-a'}});
  const orgB=await fixture(t,{dbPath,fixturePrincipal:{id:'shared-user',role:'client',workspaceId:'a',organizationId:'org-b'}});
  await orgA.request(state,{method:'PUT',body:{value:{note:'org-a'},revision:0}});assert.equal((await orgB.request(state)).body.value,null);
});

test('atomic multi-bucket persistence rolls back data and audit on any conflict',async t=>{
  const f=await fixture(t);
  await f.request(state,{method:'PUT',body:{value:{note:'existing'},revision:0}});
  const before=(await f.request('/api/audit')).body.items.length;
  const failed=await f.request('/api/state',{method:'PUT',body:{changes:[{key:'dg-midnight-infrastructure-v1',revision:0,value:{inventory:{}}},{key:'dg-midnight-account-v1',revision:0,value:{note:'stale'}}]}});
  assert.equal(failed.status,409);assert.equal((await f.request('/api/state/dg-midnight-infrastructure-v1')).body.revision,0);
  assert.equal((await f.request('/api/audit')).body.items.length,before);
  const saved=await f.request('/api/state',{method:'PUT',body:{changes:[{key:'dg-midnight-infrastructure-v1',revision:0,value:{inventory:{}}},{key:'dg-midnight-account-v1',revision:1,value:{note:'new'}}]}});
  assert.equal(saved.status,200);assert.deepEqual(saved.body.changes.map(x=>x.revision),[1,2]);
});

test('secret fields and patterns never reach data, jobs, responses or audit',async t=>{
  const f=await fixture(t);const marker='sk-proj-THIS_IS_A_TEST_SECRET_1234567890';
  for(const value of [{apiKey:'plain-credential'},{password:'private'},{api_key:'private'},{note:marker},{url:'postgres://user:password@database.invalid/db'}]){
    const result=await f.request(state,{method:'PUT',body:{value,revision:0}});assert.equal(result.status,422);assert.ok(!JSON.stringify(result.body).includes(marker));
  }
  assert.equal((await f.request(state)).body.value,null);
  const rejected=await f.request('/api/integrations',{method:'POST',body:{kind:'20i',name:'bad',values:{secretRef:'arbitrary-browser-ref'}}});assert.equal(rejected.status,422);
  assert.equal((await f.request('/api/audit')).body.items.length,0);
  assert.equal((await f.request('/api/jobs')).body.items.length,0);
  assert.equal(f.app.db.prepare('SELECT COUNT(*) AS n FROM fixture_state').get().n,0);
});

test('installation commands are idempotent, revision checked, simulated and never active',async t=>{
  const f=await fixture(t);const item=await create(f);
  const options={method:'POST',body:{revision:item.revision},headers:{'Idempotency-Key':'fixture-test-001'}};
  const first=await f.request(`/api/integrations/${item.id}/test`,options);assert.equal(first.status,200);assert.equal(first.body.integration.status,'blocked');assert.equal(first.body.job.simulated,true);assert.equal(first.body.integration.lastSuccessfulTestAt,null);
  assert.equal(first.body.integration.environment,'fixture');assert.equal(first.body.integration.lastTest.testedRevision,1);
  const repeat=await f.request(`/api/integrations/${item.id}/test`,options);assert.deepEqual(repeat.body,first.body);
  assert.equal((await f.request('/api/jobs')).body.items.length,1);
  const collision=await f.request(`/api/integrations/${item.id}/test`,{...options,body:{revision:first.body.integration.revision}});assert.equal(collision.status,409);assert.equal(collision.body.code,'IDEMPOTENCY_CONFLICT');
  const stale=await f.request(`/api/integrations/${item.id}`,{method:'PUT',body:{revision:1,values:{accountReference:'edited'}}});assert.equal(stale.status,409);assert.equal(stale.body.current.revision,2);
  const preview=await f.request(`/api/integrations/${item.id}/preview`,{method:'POST',body:{revision:2},headers:{'Idempotency-Key':'fixture-preview-001'}});assert.equal(preview.body.plan.noExternalWrites,true);assert.equal(preview.body.plan.status,'blocked');
  const activate=await f.request(`/api/integrations/${item.id}/activate`,{method:'POST',body:{revision:2,mode:'live',configured:true},headers:{'Idempotency-Key':'fixture-activate-001'}});assert.equal(activate.status,409);assert.equal(activate.body.integration.status,'blocked');assert.equal(activate.body.code,'ACTIVATION_BLOCKED');
  assert.equal((await f.request(`/api/integrations/${item.id}`)).body.integration.configured,false);
});

test('installation names persist, test history survives edits, progress alone does not invalidate test',async t=>{
  const f=await fixture(t);const item=await create(f);
  const checked=await f.request(`/api/integrations/${item.id}/test`,{method:'POST',body:{revision:1},headers:{'Idempotency-Key':'test-history-001'}});
  const progress=await f.request(`/api/integrations/${item.id}`,{method:'PUT',body:{revision:2,name:'Renamed fixture',values:{...item.values,wizardStep:'2'}}});assert.equal(progress.status,200);assert.equal(progress.body.integration.name,'Renamed fixture');assert.equal(progress.body.integration.lastTest.id,checked.body.integration.lastTest.id);assert.equal(progress.body.integration.testHistory.length,1);
  const edited=await f.request(`/api/integrations/${item.id}`,{method:'PUT',body:{revision:3,values:{...item.values,accountReference:'another-fixture'}}});assert.equal(edited.status,200);assert.equal(edited.body.integration.lastTest,null);assert.equal(edited.body.integration.testHistory.length,1);assert.equal(edited.body.integration.status,'draft');
});

test('installation API rejects skipped steps, forged completion, unknown fields and malformed nonempty draft fields',async t=>{
  const f=await fixture(t);
  for(const [kind,values]of [
    ['20i',{wizardStep:'2'}],['20i',{wizardStep:'5',wizardCompleted:'true'}],
    ['20i',{wizardStep:'999'}],['20i',{wizardStep:'0',wizardCompleted:'true'}],
    ['20i',{unrecognizedProviderParameter:'unsafe'}],
    ['webmail',{endpoint:'http://webmail.example'}],['domain',{domain:'not a hostname'}],
    ['mailbox',{quotaMb:'-1'}],['system-mail',{sender:'invalid-email'}],
    ['customers-import',{paidThrough:'2026-02-31'}],
    ['supabase',{wizardCompleted:true}],['github',{wizardStep:1}],
  ]){
    const response=await f.request('/api/integrations',{method:'POST',body:{kind,name:'Invalid fixture',values}});assert.equal(response.status,422,`${kind}: ${JSON.stringify(values)}`);
  }
  assert.equal((await f.request('/api/integrations')).body.items.length,0);
  assert.equal((await f.request('/api/jobs')).body.items.length,0);
  assert.equal((await f.request('/api/audit')).body.items.length,0);
  const draft=await f.request('/api/integrations',{method:'POST',body:{kind:'20i',name:'Incomplete safe draft',values:{mode:'live',environment:'production'}}});assert.equal(draft.status,201);assert.equal(draft.body.integration.values.mode,'dry_run');assert.equal(draft.body.integration.values.environment,'fixture');assert.equal(draft.body.integration.values.wizardStep,'0');assert.equal(draft.body.integration.values.wizardCompleted,'false');
  const invalidUpdate=await f.request(`/api/integrations/${draft.body.integration.id}`,{method:'PUT',body:{revision:1,values:{wizardStep:'5',wizardCompleted:true}}});assert.equal(invalidUpdate.status,422);assert.equal((await f.request(`/api/integrations/${draft.body.integration.id}`)).body.integration.revision,1);
});

test('all fifteen installation dossiers validate shared examples and complete as fixture metadata without jobs',async t=>{
  const f=await fixture(t);
  for(const[kind,definition]of Object.entries(installationDefinitions)){
    const values=Object.fromEntries(definition.steps.flatMap(step=>step.fields).map(field=>[field.name,String(field.example??'')]));
    Object.assign(values,{wizardStep:String(definition.steps.length-1),wizardCompleted:'true',mode:'live',environment:'production'});
    const response=await f.request('/api/integrations',{method:'POST',body:{kind,name:definition.title,values}});
    assert.equal(response.status,201,`${kind}: ${JSON.stringify(response.body)}`);assert.equal(response.body.integration.status,'draft');assert.equal(response.body.integration.configured,false);assert.equal(response.body.integration.values.environment,'fixture');assert.equal(response.body.integration.values.mode,'dry_run');assert.equal(response.body.integration.values.wizardCompleted,'true');
  }
  assert.equal((await f.request('/api/integrations')).body.items.length,15);assert.equal((await f.request('/api/jobs')).body.items.length,0);
});

test('local customer import freezes an exact plan and commits one paused, unlinked customer idempotently',async t=>{
  const f=await fixture(t),item=await importDossier(f),preview=await importPreview(f,item);assert.equal(preview.status,200);assert.equal(preview.body.plan.status,'ready');assert.equal(preview.body.plan.rows[0].classification,'new');assert.equal((await f.request('/api/customer-registry')).body.items.length,0);
  const committed=await importCommit(f,item,preview.body.plan);assert.equal(committed.status,200);assert.equal(committed.body.import.status,'imported_locally');assert.equal(committed.body.import.billingPaused,true);assert.equal(committed.body.import.noInvitations,true);assert.equal(committed.body.import.noExternalWrites,true);assert.equal(committed.body.import.planId,preview.body.plan.id);
  assert.deepEqual((await importCommit(f,item,preview.body.plan)).body,committed.body);
  const registry=(await f.request('/api/customer-registry')).body;assert.equal(registry.items.length,1);assert.equal(registry.items[0].serviceStatus,'unlinked');assert.equal(registry.items[0].customerReference,item.values.customerReference);assert.equal(registry.imports.length,1);assert.equal((await f.request('/api/jobs')).body.items.length,1);
  const invalid=await importCommit(f,item,preview.body.plan,'customer-commit-001',{digest:'changed'});assert.equal(invalid.status,409);assert.equal(invalid.body.code,'IDEMPOTENCY_CONFLICT');
  assert.throws(()=>f.app.db.prepare('UPDATE local_customer_orgs SET billing_paused=0').run(),/CHECK/);
  const audit=JSON.stringify((await f.request('/api/audit')).body);assert.ok(!audit.includes(item.values.billingEmail));assert.ok(!audit.includes(item.values.organizationName));
});

test('stable customer source references deduplicate without merging matching email addresses and conflicts require review',async t=>{
  const f=await fixture(t),first=await importDossier(f),firstPlan=(await importPreview(f,first)).body.plan;const receipt=(await importCommit(f,first,firstPlan)).body.import;
  const duplicate=await importDossier(f),duplicatePlan=(await importPreview(f,duplicate,'customer-duplicate-preview')).body.plan;assert.equal(duplicatePlan.rows[0].classification,'existing');const duplicateReceipt=(await importCommit(f,duplicate,duplicatePlan,'customer-duplicate-commit')).body.import;assert.equal(duplicateReceipt.id,receipt.id);assert.equal((await f.request('/api/jobs')).body.items.length,1);
  const other=await importDossier(f,{batchReference:'batch-other',customerReference:'customer-other',organizationName:'Another organization'}),otherPlan=(await importPreview(f,other,'customer-other-preview')).body.plan;assert.equal(otherPlan.rows[0].classification,'new');await importCommit(f,other,otherPlan,'customer-other-commit');assert.equal((await f.request('/api/customer-registry')).body.items.length,2);
  for(const[extra,key]of [[{organizationName:'Renamed source'},'renamed'],[{batchReference:'batch-third',customerReference:'customer-third'},'same-name']]){
    const item=await importDossier(f,extra),plan=(await importPreview(f,item,`preview-${key}`)).body.plan;assert.equal(plan.status,'blocked');assert.equal(plan.rows[0].classification,'conflict');assert.equal((await importCommit(f,item,plan,`commit-${key}`)).status,409);
  }
  assert.equal((await f.request('/api/customer-registry')).body.items.length,2);
});

test('local import refuses tampered digests, expired previews, changed configuration and stale registry revisions',async t=>{
  const f=await fixture(t),item=await importDossier(f),plan=(await importPreview(f,item)).body.plan;
  assert.equal((await importCommit(f,item,plan,'tampered-digest',{digest:'0'.repeat(64)})).body.code,'IMPORT_PLAN_CHANGED');
  f.app.db.prepare('UPDATE local_customer_import_plans SET expires_at=? WHERE id=?').run('2000-01-01T00:00:00.000Z',plan.id);assert.equal((await importCommit(f,item,plan,'expired-preview')).body.code,'IMPORT_PLAN_EXPIRED');
  const newer=(await importPreview(f,item,'newer-preview-001')).body.plan;
  const second=await importDossier(f,{customerReference:'customer-other',batchReference:'batch-other',organizationName:'Second fixture'}),secondPlan=(await importPreview(f,second,'second-preview-001')).body.plan;await importCommit(f,second,secondPlan,'second-commit-001');assert.equal((await importCommit(f,item,newer,'stale-registry-001')).body.code,'IMPORT_PLAN_BLOCKED');
  const current=(await importPreview(f,item,'current-preview-001')).body.plan;
  const changed=await f.request(`/api/integrations/${item.id}`,{method:'PUT',body:{revision:1,values:{...item.values,owner:'Another owner'}}});assert.equal(changed.status,200);assert.equal((await importCommit(f,item,current,'stale-config-001')).body.code,'REVISION_CONFLICT');
  assert.equal((await f.request('/api/customer-registry')).body.items.length,1);
});

test('backdated customer contracts remain paused and cannot schedule invoices or provider actions',async t=>{
  const f=await fixture(t),item=await importDossier(f,{paidThrough:'2000-01-01',nextInvoiceDate:'2000-02-01'}),plan=(await importPreview(f,item)).body.plan;assert.equal(plan.status,'ready');assert.ok(plan.rows[0].warnings.some(warning=>warning.includes('verleden')));
  const result=await importCommit(f,item,plan,'backdated-commit-001',{billingPaused:false,sendInvitation:true,mode:'live'});assert.equal(result.status,200);assert.equal(result.body.import.billingPaused,true);assert.equal(result.body.import.noInvitations,true);assert.equal(result.body.import.noExternalWrites,true);
  const jobs=(await f.request('/api/jobs')).body.items;assert.equal(jobs.length,1);assert.equal(jobs[0].action,'customer.import');assert.equal(jobs[0].status,'completed_locally');
  const invalid=await importDossier(f,{batchReference:'invalid-dates',customerReference:'invalid-dates',organizationName:'Invalid dates',paidThrough:'2026-12-01',nextInvoiceDate:'2026-11-01'});assert.equal((await importPreview(f,invalid,'invalid-dates-preview')).body.plan.status,'blocked');
});

test('customer import permissions and plan actor/workspace scope are enforced',async t=>{
  const folder=await mkdtemp(join(tmpdir(),'dg-import-scope-'));t.after(()=>rm(folder,{recursive:true,force:true}));const dbPath=join(folder,'scope.sqlite');
  const f=await fixture(t,{dbPath}),item=await importDossier(f),plan=(await importPreview(f,item)).body.plan;
  const client=await fixture(t,{dbPath,fixturePrincipal:{role:'client'}});assert.equal((await client.request('/api/customer-registry')).status,403);assert.equal((await importPreview(client,item,'client-preview-001')).status,403);
  const peer=await fixture(t,{dbPath,fixturePrincipal:{id:'other-admin',role:'admin'}});assert.equal((await importCommit(peer,item,plan,'other-actor-001')).status,404);
  const foreign=await fixture(t,{dbPath,fixturePrincipal:{id:'foreign-admin',role:'admin',workspaceId:'foreign-workspace'}});assert.equal((await importPreview(foreign,item,'foreign-preview-001')).status,404);
  const reader=await fixture(t,{dbPath,fixturePrincipal:{id:'reader',role:'support',permissions:['integrations.read','customer.read','customer.import.preview']}});assert.equal((await importCommit(reader,item,plan,'reader-commit-001')).status,403);
});

test('a failed local import transaction rolls back customer, lineage, receipt, job and audit writes',async t=>{
  const f=await fixture(t),item=await importDossier(f),plan=(await importPreview(f,item)).body.plan;const auditBefore=(await f.request('/api/audit')).body.items.length;
  f.app.db.exec("CREATE TRIGGER fail_import_job BEFORE INSERT ON jobs BEGIN SELECT RAISE(ABORT,'fixture storage fault'); END");
  const failed=await importCommit(f,item,plan);assert.equal(failed.status,500);assert.ok(!JSON.stringify(failed.body).includes('fixture storage fault'));
  for(const table of ['local_customer_orgs','local_customer_sources','local_customer_imports','local_customer_source_lines','jobs'])assert.equal(f.app.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n,0);
  assert.equal((await f.request('/api/audit')).body.items.length,auditBefore);assert.equal(f.app.db.prepare('SELECT status FROM local_customer_import_plans WHERE id=?').get(plan.id).status,'pending');
  f.app.db.exec('DROP TRIGGER fail_import_job');assert.equal((await importCommit(f,item,plan)).status,200);
});

test('wizard guards use original 8+8 definitions; a forged SSH closure is rejected',async t=>{
  assert.equal(wizardDefinitions.deploy.steps.length,8);assert.equal(wizardDefinitions.hardening.steps.length,8);
  const f=await fixture(t);
  const record={id:'fixture-host',kind:'hardening',step:3,values:{...wizardDefinitions.hardening.example,publicSshClosed:true},done:false,example:true};
  const bad=await f.request('/api/state/dg-midnight-infra-wizards-v1',{method:'PUT',body:{revision:0,value:[record]}});assert.equal(bad.status,422);assert.equal(bad.body.code,'WIZARD_GUARD');
  record.values.publicSshClosed=false;record.values.tailAfterReloadVerified=true;
  assert.equal((await f.request('/api/state/dg-midnight-infra-wizards-v1',{method:'PUT',body:{revision:0,value:[record]}})).status,422);
  record.values.tailAfterReloadVerified=false;
  assert.equal((await f.request('/api/state/dg-midnight-infra-wizards-v1',{method:'PUT',body:{revision:0,value:[record]}})).status,200);
  record.values.hostName='bad host with spaces';assert.throws(()=>validateWizardRecord(record),/formaat/);
});

test('fresh incomplete wizard drafts save, while changed identity invalidates later attestations',async t=>{
  const f=await fixture(t);const path='/api/state/dg-midnight-infra-wizards-v1';
  const fresh={id:'fresh',kind:'deploy',step:0,done:false,values:{}};
  assert.equal((await f.request(path,{method:'PUT',body:{value:[fresh],revision:0}})).status,200);
  const complete={id:'existing',kind:'deploy',step:5,done:false,values:{...wizardDefinitions.deploy.example,sourceSha:'0123456789abcdef0123456789abcdef01234567',acceptedSha:'0123456789abcdef0123456789abcdef01234567',ciGreen:true,stagingHealthy:true,stagingAccepted:true,ciEvidence:'fixture-ci',acceptanceEvidence:'fixture-acceptance',hostConfirmed:true,varsConfirmed:true}};
  assert.equal((await f.request(path,{method:'PUT',body:{value:[complete],revision:1}})).status,200);
  complete.values.sourceSha='ffffffffffffffffffffffffffffffffffffffff';
  const changed=await f.request(path,{method:'PUT',body:{value:[complete],revision:2}});assert.equal(changed.status,200);
  for(const flag of ['ciGreen','stagingHealthy','stagingAccepted'])assert.equal(changed.body.value[0].values[flag],false);
});

test('inventory and wizard completion commit together, stable host IDs deduplicate and monitoring stays pending',async t=>{
  const f=await fixture(t);const path='/api/state/dg-midnight-infrastructure-v1';
  const values={...wizardDefinitions.hardening.example,registerInDg:true};
  const record={id:'host-dossier',kind:'hardening',step:7,done:true,values,example:true};
  const host={name:values.hostName,providerId:values.providerId,example:true,hardening:{status:'verified',monitoring:'active'}};
  assert.equal((await f.request(path,{method:'PUT',body:{revision:0,value:{inventory:{0:host}}}})).status,422);
  const saved=await f.request('/api/state',{method:'PUT',body:{changes:[{key:'dg-midnight-infrastructure-v1',revision:0,value:{inventory:{0:host}}},{key:'dg-midnight-infra-wizards-v1',revision:0,value:[record]}]}});
  assert.equal(saved.status,200);const item=saved.body.changes[0].value.inventory[0];assert.equal(item.hardening.monitoring,'pending');assert.equal(item.hardening.status,'open');assert.equal(item.hardening.evidence.externallyVerified,false);assert.ok(item.hostId);
  const repeated=await f.request(path,{method:'PUT',body:{revision:1,value:{inventory:{0:host}}}});assert.equal(repeated.status,200);assert.equal(repeated.body.value.inventory[0].hostId,item.hostId);
  const conflict=await f.request(path,{method:'PUT',body:{revision:2,value:{inventory:{0:host,1:{...host,name:'another-host'}}}}});assert.equal(conflict.status,422);
  const foreign=await f.request(path,{method:'PUT',body:{revision:2,value:{inventory:{0:{...host,name:'another-host'}}}}});assert.equal(foreign.status,422);
  assert.equal((await f.request(path)).body.revision,2);
});

test('deploy evidence cannot substitute missing SHA and exactly four public variables remain',()=>{
  const def=wizardDefinitions.deploy;
  const record={id:'deploy-fixture',kind:'deploy',step:5,done:false,values:{...def.example,ciGreen:true,ciEvidence:'fixture/ci',sourceSha:''}};
  assert.throws(()=>validateWizardRecord(record),/kandidaat-SHA/);
  const report=def.result(def.example).report;
  for(const environment of ['staging','production']){
    const section=report.split(`[${environment}]\n`)[1].split('\n\n')[0];
    assert.equal(section.split('\n').length,4);assert.match(section,/PORTAAL_APP_ORIGIN=/);assert.match(section,/PORTAAL_DATA_MODE=supabase/);assert.match(section,/NEXT_PUBLIC_SUPABASE_URL=/);assert.match(section,/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/);assert.ok(!section.includes('SERVICE_ROLE'));
  }
});

test('unknown provider outcome requires reconciliation and cannot be blindly retried',()=>{
  for(const outcome of ['timeout','unknown','connection_lost'])assert.deepEqual(reconcileProviderOutcome({dispatched:true,outcome,retrySafe:true}),{status:'reconcile_required',retryAllowed:false,nextAction:'Geautoriseerde alleen-lezen controle van de externe uitkomst.'});
  assert.equal(reconcileProviderOutcome({dispatched:false,outcome:'failed',retrySafe:true}).retryAllowed,true);
});

test('audit is append-only at SQLite boundary and request payloads are absent',async t=>{
  const f=await fixture(t);await create(f);
  const event=(await f.request('/api/audit')).body.items[0];assert.equal(event.action,'integration.create');assert.ok(!JSON.stringify(event).includes('fixture-account'));assert.ok(!JSON.stringify(event).includes('Fixture 20i'));
  assert.throws(()=>f.app.db.prepare('UPDATE audit_events SET outcome=? WHERE id=?').run('tampered',event.id),/append-only/);
  assert.throws(()=>f.app.db.prepare('DELETE FROM audit_events WHERE id=?').run(event.id),/append-only/);
});
