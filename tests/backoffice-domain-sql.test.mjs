import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const configured=process.env.DG_BO_TEST_DATABASE_URL;
const sql=value=>"'"+String(value).replaceAll("'","''")+"'";
const ids={admin:'10000000-0000-0000-0000-000000000001',client:'10000000-0000-0000-0000-000000000002',other:'10000000-0000-0000-0000-000000000003',foreign:'10000000-0000-0000-0000-000000000004',w:'30000000-0000-0000-0000-000000000001',w2:'30000000-0000-0000-0000-000000000002',org:'40000000-0000-0000-0000-000000000001',org2:'40000000-0000-0000-0000-000000000002'};
const session=user=>user.replace(/^1/,'2');
const factor=user=>user.replace(/^1/,'5');
const claims=(user,overrides={})=>({sub:user,session_id:session(user),aal:'aal2',exp:Math.floor(Date.now()/1000)+3600,...overrides});
const permissions=['state.read','state.write','integrations.read','integrations.manage','integrations.test','integrations.preview','integrations.activate','integrations.pause','customer.read','customer.import.preview','customer.import.commit','support.ticket.read','support.ticket.create','support.ticket.reply','support.ticket.manage','support.ticket.internal_note','support.ticket.status','support.draft.read','support.draft.write','jobs.read','audit.read'];

test('isolated PostgreSQL contracts: current MFA/session, roles, CAS, idempotency and private support', {skip:!configured},async t=>{
 const base=new URL(configured);const host=base.searchParams.get('host')||base.hostname||'';
 assert.ok(['127.0.0.1','localhost','[::1]'].includes(host)||host.startsWith('/'),'Only an explicitly configured local disposable PostgreSQL server is allowed');
 const database='dg_bo_test_'+randomUUID().replaceAll('-','');
 const run=(url,input,expectSuccess=true)=>{const result=spawnSync('psql',[url,'-X','-q','-A','-t','-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',maxBuffer:16*1024*1024});if(expectSuccess)assert.equal(result.status,0,result.stderr);return result;};
 run(base.href,`create database ${database};`);const target=new URL(base);target.pathname='/'+database;
 const execute=query=>run(target.href,query).stdout.trim().split('\n').at(-1);
 const rpc=(user,path,method='GET',body={},key=null,overrides={})=>{
 const query=`select set_config('request.jwt.claims',${sql(JSON.stringify(claims(user,overrides)))},false);set role authenticated;select public.dg_bo_domain(${sql(path)},${sql(method)},${sql(JSON.stringify(body))}::jsonb,${key?sql(key):'null'},'70000000-0000-0000-0000-000000000001');`;
 const result=JSON.parse(execute(query));
 if(result.status===500){const diagnostic=run(target.href,`select set_config('request.jwt.claims',${sql(JSON.stringify(claims(user,overrides)))},false);select dg_bo_private.dispatch(dg_bo_private.context(),${sql(path)},${sql(method)},${sql(JSON.stringify(body))}::jsonb,'debug');`,false);assert.fail('SQL internal error: '+diagnostic.stderr);}
 return result;
 };
 const expect=(response,status,code)=>{assert.equal(response.status,status,JSON.stringify(response));if(code)assert.equal(response.value.code,code);return response.value;};
 try{
 const bootstrap=`do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin;end if;end$$;
 create schema auth;create table auth.users(id uuid primary key,is_anonymous boolean default false,deleted_at timestamptz,banned_until timestamptz,email text,email_confirmed_at timestamptz default now());create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),aal text,not_after timestamptz,factor_id uuid);
 create table auth.mfa_factors(id uuid primary key,user_id uuid references auth.users(id),factor_type text,status text);
 create function auth.uid() returns uuid language sql stable as $$select (current_setting('request.jwt.claims',true)::jsonb->>'sub')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;`;
 run(target.href,bootstrap);run(target.href,readFileSync(new URL('../supabase/migrations/20261111155319_dg_bo_foundation.sql',import.meta.url),'utf8'));
 execute(`insert into auth.users(id) values${[ids.admin,ids.client,ids.other,ids.foreign].map(id=>'('+sql(id)+')').join(',')};insert into auth.mfa_factors(id,user_id,factor_type,status) values${[ids.admin,ids.client,ids.other,ids.foreign].map(id=>`(${sql(factor(id))},${sql(id)},'totp','verified')`).join(',')};
 insert into auth.sessions(id,user_id,aal,factor_id) values${[ids.admin,ids.client,ids.other,ids.foreign].map(id=>`(${sql(session(id))},${sql(id)},'aal2',${sql(factor(id))})`).join(',')};
 insert into public.dg_bo_workspaces(id,name,environment) values(${sql(ids.w)},'Acceptance workspace','development'),(${sql(ids.w2)},'Foreign workspace','staging');
 insert into public.dg_bo_organizations(id,workspace_id,name) values(${sql(ids.org)},${sql(ids.w)},'First customer'),(${sql(ids.org2)},${sql(ids.w)},'Second customer');
 insert into public.dg_bo_memberships(user_id,workspace_id,role,permissions) values(${sql(ids.admin)},${sql(ids.w)},'admin',array[${permissions.map(sql).join(',')}]),(${sql(ids.foreign)},${sql(ids.w2)},'admin',array[${permissions.map(sql).join(',')}]);
 insert into public.dg_bo_memberships(user_id,workspace_id,organization_id,role,permissions) values(${sql(ids.client)},${sql(ids.w)},${sql(ids.org)},'client',array[${permissions.filter(p=>p==='state.read'||p.startsWith('support.')&&!['support.ticket.manage','support.ticket.internal_note'].includes(p)).map(sql).join(',')}]),(${sql(ids.other)},${sql(ids.w)},${sql(ids.org2)},'client',array[${permissions.filter(p=>p.startsWith('support.')&&!['support.ticket.manage','support.ticket.internal_note'].includes(p)).map(sql).join(',')}]);`);
 await t.test('RLS/direct-table deny, MFA, expired and revoked sessions, immutable database membership',()=>{
 assert.notEqual(run(target.href,'set role authenticated; select * from public.dg_bo_memberships;',false).status,0);
 assert.notEqual(run(target.href,'set role anon; select public.dg_bo_context();',false).status,0);
 expect(rpc(ids.admin,'/api/integrations','GET',{},null,{aal:'aal1'}),401,'MFA_REQUIRED');
 expect(rpc(ids.admin,'/api/integrations','GET',{},null,{aal:undefined}),401,'MFA_REQUIRED');
 execute(`update auth.users set email_confirmed_at=null where id=${sql(ids.admin)};`);expect(rpc(ids.admin,'/api/integrations'),401,'SESSION_REVOKED');execute(`update auth.users set email_confirmed_at=now() where id=${sql(ids.admin)};`);
 expect(rpc(ids.admin,'/api/integrations','GET',{},null,{exp:1}),401,'MFA_REQUIRED');
 execute(`update auth.mfa_factors set status='unverified' where id=${sql(factor(ids.admin))};`);expect(rpc(ids.admin,'/api/integrations'),401,'SESSION_REVOKED');execute(`update auth.mfa_factors set status='verified' where id=${sql(factor(ids.admin))};`);
 execute(`update auth.sessions set factor_id=${sql(factor(ids.client))} where user_id=${sql(ids.admin)};`);expect(rpc(ids.admin,'/api/integrations'),401,'SESSION_REVOKED');execute(`update auth.sessions set factor_id=${sql(factor(ids.admin))} where user_id=${sql(ids.admin)};`);
 execute(`delete from auth.mfa_factors where id=${sql(factor(ids.admin))};`);expect(rpc(ids.admin,'/api/integrations'),401,'SESSION_REVOKED');execute(`insert into auth.mfa_factors(id,user_id,factor_type,status) values(${sql(factor(ids.admin))},${sql(ids.admin)},'totp','verified');`);
 for(const type of ['phone','webauthn']){execute(`update auth.mfa_factors set factor_type=${sql(type)} where id=${sql(factor(ids.admin))};`);expect(rpc(ids.admin,'/api/integrations'),200);}execute(`update auth.mfa_factors set factor_type='totp' where id=${sql(factor(ids.admin))};`);

 execute(`update auth.sessions set not_after=now()-interval '1 second' where user_id=${sql(ids.admin)};`);expect(rpc(ids.admin,'/api/integrations'),401,'SESSION_REVOKED');execute(`update auth.sessions set not_after=null where user_id=${sql(ids.admin)};`);
 execute(`update public.dg_bo_memberships set active=false where user_id=${sql(ids.admin)};`);expect(rpc(ids.admin,'/api/integrations'),403,'MEMBERSHIP_REQUIRED');execute(`update public.dg_bo_memberships set active=true where user_id=${sql(ids.admin)};`);
 expect(rpc(ids.client,'/api/integrations'),403,'FORBIDDEN');
 });
 let integration;
 await t.test('schema validation, secret rejection, environment derivation and fail-closed provider commands',()=>{
 expect(rpc(ids.admin,'/api/integrations','POST',{kind:'20i',name:'Invalid completion',values:{wizardStep:'5',wizardCompleted:'true'}},'incomplete-dossier'),422,'WIZARD_REQUIRED');
 expect(rpc(ids.admin,'/api/integrations','POST',{kind:'20i',name:'Secret',values:{accessToken:'unsafe'}},'forbidden-secret'),422,'SECRET_NOT_ALLOWED');
 expect(rpc(ids.admin,'/api/integrations','POST',{kind:'20i',name:'Actor override',values:{},role:'admin'},'forged-extra'),422,'UNKNOWN_FIELD');
 integration=expect(rpc(ids.admin,'/api/integrations','POST',{kind:'20i',name:'Provider dossier',values:{environment:'production',mode:'live'}},'provider-dossier'),201).integration;
 assert.equal(integration.environment,'development');assert.equal(integration.values.mode,'metadata_only');
 assert.deepEqual(expect(rpc(ids.admin,'/api/integrations','POST',{kind:'20i',name:'Provider dossier',values:{environment:'production',mode:'live'}},'provider-dossier'),201).integration,integration);
 expect(rpc(ids.admin,'/api/integrations','POST',{kind:'20i',name:'Changed',values:{}},'provider-dossier'),409,'IDEMPOTENCY_CONFLICT');
 expect(rpc(ids.foreign,'/api/integrations/'+integration.id),404);
 integration=expect(rpc(ids.admin,'/api/integrations/'+integration.id+'/test','POST',{revision:1},'provider-test'),200).integration;assert.equal(integration.lastTest.simulated,true);assert.equal(integration.status,'blocked');
 const activated=expect(rpc(ids.admin,'/api/integrations/'+integration.id+'/activate','POST',{revision:integration.revision},'provider-activate'),409,'ACTIVATION_BLOCKED');assert.equal(activated.integration.status,'blocked');assert.equal(activated.integration.providerWrites,false);
 expect(rpc(ids.admin,'/api/integrations/'+integration.id,'PUT',{revision:1,values:{}}),409,'REVISION_CONFLICT');
 });
 await t.test('8+8 wizard validation, incomplete drafts, atomic inventory batch rollback and example prohibition',()=>{
 const key='dg-midnight-infra-wizards-v1';
 let state=expect(rpc(ids.admin,'/api/state/'+key,'PUT',{revision:0,value:[{id:'draft',kind:'hardening',step:0,done:false,values:{}}]}),200);assert.equal(state.revision,1);
 expect(rpc(ids.admin,'/api/state/'+key,'PUT',{revision:1,value:[{id:'bad',kind:'hardening',step:0,values:{publicSshClosed:true}}]}),422,'WIZARD_GUARD');
 expect(rpc(ids.admin,'/api/state/'+key,'PUT',{revision:1,value:[{id:'forged',kind:'deploy',step:7,done:true,values:{}}]}),422,'WIZARD_REQUIRED');
 expect(rpc(ids.admin,'/api/state','PUT',{changes:[{key,value:[],revision:1},{key:'dg-midnight-infrastructure-v1',value:{inventory:{0:{name:'fake.example',example:true}}},revision:0}]}),422,'EXAMPLE_INVENTORY_FORBIDDEN');
 assert.equal(expect(rpc(ids.admin,'/api/state/'+key),200).revision,1);
 expect(rpc(ids.admin,'/api/state/dg-midnight-commerce-v1','PUT',{revision:0,value:{paid:true}}),409,'LEGACY_MUTATION_UNAVAILABLE');
 expect(rpc(ids.client,'/api/state/'+key),403);expect(rpc(ids.admin,'/api/state/dg-midnight-support-v1'),403,'STATE_UNAVAILABLE');
 });
 let ticket;
 await t.test('normalized support drafts CAS and atomic create/replay',()=>{
 const draft={organizationId:ids.org,subject:'Support acceptance',body:'Public question',service:'Algemene vraag',category:'Algemene vraag',priority:'normal'};
 const saved=expect(rpc(ids.admin,'/api/support/drafts','PUT',{key:'create',value:draft,revision:0}),200).draft;assert.equal(saved.revision,1);
 expect(rpc(ids.admin,'/api/support/tickets','POST',{...draft,draftRevision:0},'draft-conflict'),409,'DRAFT_CONFLICT');assert.equal(expect(rpc(ids.admin,'/api/support/tickets'),200).items.length,0);
 const created=expect(rpc(ids.admin,'/api/support/tickets','POST',{...draft,draftRevision:1},'support-create'),201);ticket=created.ticket;assert.equal(created.clearedDraft.revision,2);
 assert.deepEqual(expect(rpc(ids.admin,'/api/support/tickets','POST',{...draft,draftRevision:1},'support-create'),201).ticket,ticket);
 expect(rpc(ids.client,'/api/support/tickets','POST',{...draft,organizationId:ids.org2},'client-other-org'),404);
 expect(rpc(ids.admin,'/api/support/tickets','POST',{...draft,role:'admin'},'support-forged'),422,'UNKNOWN_FIELD');
 });
 await t.test('private notes do not change any client DTO, list, timestamps or counters; cross-org and workspace IDOR',()=>{
 const before=expect(rpc(ids.client,'/api/support/tickets/'+ticket.id),200);const listBefore=expect(rpc(ids.client,'/api/support/tickets'),200);
 ticket=expect(rpc(ids.admin,'/api/support/tickets/'+ticket.id+'/messages','POST',{revision:ticket.revision,body:'Private staff context',visibility:'internal'},'private-note'),200).ticket;
 assert.ok(ticket.messages.some(m=>m.visibility==='internal'));
 assert.deepEqual(expect(rpc(ids.client,'/api/support/tickets/'+ticket.id),200),before);assert.deepEqual(expect(rpc(ids.client,'/api/support/tickets'),200),listBefore);
 expect(rpc(ids.other,'/api/support/tickets/'+ticket.id),404);expect(rpc(ids.foreign,'/api/support/tickets/'+ticket.id),404);
 expect(rpc(ids.client,'/api/support/tickets/'+ticket.id+'/messages','POST',{revision:1,body:'Forbidden',visibility:'internal'},'client-internal'),403);
 expect(rpc(ids.admin,'/api/support/tickets/'+ticket.id+'/messages','POST',{revision:1,body:'Stale'},'stale-message'),409,'REVISION_CONFLICT');
 const response=expect(rpc(ids.client,'/api/support/tickets/'+ticket.id+'/messages','POST',{revision:1,body:'Customer public reply'},'client-public-reply'),200);assert.equal(response.ticket.messages.some(m=>m.visibility==='internal'),false);assert.equal(response.ticket.revision,2);
 });
 await t.test('idempotent receipt cannot replay internal content after visibility permission revoked',()=>{
 ticket=expect(rpc(ids.admin,'/api/support/tickets/'+ticket.id),200).ticket;
 const payload={revision:ticket.revision,body:'Staff public response',visibility:'public'};
 const first=expect(rpc(ids.admin,'/api/support/tickets/'+ticket.id+'/messages','POST',payload,'receipt-visibility'),200);assert.ok(first.ticket.messages.some(m=>m.visibility==='internal'));
 execute(`update public.dg_bo_memberships set permissions=array_remove(permissions,'support.ticket.internal_note') where user_id=${sql(ids.admin)};`);
 expect(rpc(ids.admin,'/api/support/tickets/'+ticket.id+'/messages','POST',payload,'receipt-visibility'),409,'IDEMPOTENCY_CONFLICT');
 assert.equal(expect(rpc(ids.admin,'/api/support/tickets/'+ticket.id),200).ticket.messages.some(m=>m.visibility==='internal'),false);
 execute(`update public.dg_bo_memberships set permissions=array_append(permissions,'support.ticket.internal_note') where user_id=${sql(ids.admin)};`);
 });
 let importRecord,importValues;
 await t.test('manual customer import exact preview, config binding, replay, no billing and no email merge',()=>{
 const values={configurationName:'Manual import',sourceType:'manual',batchReference:'batch-1',customerReference:'customer-1',organizationName:'Imported customer',billingEmail:'billing@example.test',country:'NL',resourceReference:'unlinked',productVersion:'manual-contract-v1',paidThrough:'2026-11-30',nextInvoiceDate:'2026-12-01',billingPolicy:'paused-review',owner:'DG test',wizardStep:'4',wizardCompleted:'true'};
 const incomplete=expect(rpc(ids.admin,'/api/integrations','POST',{kind:'customers-import',name:'Unfinished',values:{...values,wizardStep:'0',wizardCompleted:undefined}},'import-incomplete'),201).integration;
 expect(rpc(ids.admin,`/api/integrations/${incomplete.id}/customer-import/preview`,'POST',{revision:1},'incomplete-preview'),422,'IMPORT_DOSSIER_INCOMPLETE');
 importValues=values;
 importRecord=expect(rpc(ids.admin,'/api/integrations','POST',{kind:'customers-import',name:'Manual import',values},'import-dossier'),201).integration;
 const plan=expect(rpc(ids.admin,`/api/integrations/${importRecord.id}/customer-import/preview`,'POST',{revision:1},'import-preview'),200).plan;assert.equal(plan.status,'ready');assert.equal(plan.noExternalWrites,true);
 const payload={revision:1,planId:plan.id,digest:plan.digest};const result=expect(rpc(ids.admin,`/api/integrations/${importRecord.id}/customer-import/commit`,'POST',payload,'import-commit'),200);assert.equal(result.import.billingPaused,true);assert.equal(result.import.integrationRevision,1);assert.equal(result.import.configurationDigest,plan.configurationDigest);
 assert.deepEqual(expect(rpc(ids.admin,`/api/integrations/${importRecord.id}/customer-import/commit`,'POST',payload,'import-commit'),200),result);
 const repeat=expect(rpc(ids.admin,`/api/integrations/${importRecord.id}/customer-import/preview`,'POST',{revision:1},'import-preview-again'),200).plan;const repeatReceipt=expect(rpc(ids.admin,`/api/integrations/${importRecord.id}/customer-import/commit`,'POST',{revision:1,planId:repeat.id,digest:repeat.digest},'import-commit-again'),200).import;assert.equal(repeatReceipt.id,result.import.id);
 const other=expect(rpc(ids.admin,'/api/integrations','POST',{kind:'customers-import',name:'Other reference',values:{...values,batchReference:'batch-2',customerReference:'customer-2',organizationName:'Other organization'}},'other-dossier'),201).integration;
 const otherPlan=expect(rpc(ids.admin,`/api/integrations/${other.id}/customer-import/preview`,'POST',{revision:1},'other-preview'),200).plan;assert.equal(otherPlan.status,'ready');expect(rpc(ids.admin,`/api/integrations/${other.id}/customer-import/commit`,'POST',{revision:1,planId:otherPlan.id,digest:otherPlan.digest},'other-commit'),200);
 const registry=expect(rpc(ids.admin,'/api/customer-registry'),200);assert.equal(registry.imports.length,2);assert.equal(registry.items.filter(o=>o.billingEmail===values.billingEmail).length,2);assert.ok(registry.items.every(o=>o.billingPaused&&o.serviceStatus==='unlinked'));
 expect(rpc(ids.client,'/api/customer-registry'),403);
 });
 await t.test('import plans reject stale configuration, expired preview, duplicate conflicts and untrusted fixture sources',()=>{
 const create=(suffix,overrides={})=>expect(rpc(ids.admin,'/api/integrations','POST',{kind:'customers-import',name:'Import '+suffix,values:{...importValues,batchReference:'batch-'+suffix,customerReference:'customer-'+suffix,organizationName:'Organization '+suffix,...overrides}},'create-'+suffix),201).integration;
 const preview=(record,key)=>expect(rpc(ids.admin,`/api/integrations/${record.id}/customer-import/preview`,'POST',{revision:record.revision},key),200).plan;
 const commit=(record,plan,key)=>rpc(ids.admin,`/api/integrations/${record.id}/customer-import/commit`,'POST',{revision:record.revision,planId:plan.id,digest:plan.digest},key);
 let record=create('drift'),plan=preview(record,'preview-drift');record=expect(rpc(ids.admin,'/api/integrations/'+record.id,'PUT',{revision:1,values:{...record.values,owner:'Changed operator'}}),200).integration;
 expect(commit(record,plan,'commit-drift'),409,'IMPORT_PLAN_CHANGED');
 record=create('expiry');plan=preview(record,'preview-expiry');execute(`update public.dg_bo_import_plans set expires_at=now()-interval '1 second' where id=${sql(plan.id)};`);expect(commit(record,plan,'commit-expiry'),409,'IMPORT_PLAN_EXPIRED');
 record=create('stale-registry');plan=preview(record,'preview-stale-registry');const other=create('intervening'),otherPlan=preview(other,'preview-intervening');expect(commit(other,otherPlan,'commit-intervening'),200);expect(commit(record,plan,'commit-stale-registry'),409,'IMPORT_PLAN_BLOCKED');
 record=create('same-name',{organizationName:importValues.organizationName});assert.equal(preview(record,'preview-same-name').status,'blocked');
 record=create('fixture-source',{sourceType:'fixture-csv'});assert.equal(preview(record,'preview-fixture-source').status,'blocked');
 record=create('backdated',{nextInvoiceDate:importValues.paidThrough});assert.equal(preview(record,'preview-backdated').status,'blocked');
 record=create('duplicate',{batchReference:importValues.batchReference,customerReference:importValues.customerReference,organizationName:'Changed existing line'});assert.equal(preview(record,'preview-duplicate').status,'blocked');
 });
 await t.test('database exception rolls back organization/source/receipt/job/idempotency together',()=>{
 const record=expect(rpc(ids.admin,'/api/integrations','POST',{kind:'customers-import',name:'Rollback',values:{...importValues,batchReference:'rollback-batch',customerReference:'rollback-source',organizationName:'Rollback organization'}},'create-rollback'),201).integration;
 const plan=expect(rpc(ids.admin,`/api/integrations/${record.id}/customer-import/preview`,'POST',{revision:1},'preview-rollback'),200).plan;
 const counts=()=>execute(`select jsonb_build_array((select count(*) from public.dg_bo_organizations),(select count(*) from public.dg_bo_customer_sources),(select count(*) from public.dg_bo_import_receipts),(select count(*) from public.dg_bo_jobs),(select count(*) from public.dg_bo_idempotency));`);const before=counts();
 execute(`create function public.fixture_fail_commit() returns trigger language plpgsql as $$begin if new.action='customer.import.commit' then raise exception 'injected failure';end if;return new;end$$;create trigger fixture_fail before insert on public.dg_bo_audit for each row execute function public.fixture_fail_commit();`);
 const body={revision:1,planId:plan.id,digest:plan.digest};const result=JSON.parse(execute(`select set_config('request.jwt.claims',${sql(JSON.stringify(claims(ids.admin)))},false);select public.dg_bo_domain(${sql(`/api/integrations/${record.id}/customer-import/commit`)},'POST',${sql(JSON.stringify(body))}::jsonb,'commit-rollback','70000000-0000-0000-0000-000000000001');`));assert.equal(result.status,500);assert.equal(JSON.stringify(result).includes('injected'),false);assert.equal(counts(),before);
 execute('drop trigger fixture_fail on public.dg_bo_audit;drop function public.fixture_fail_commit();');
 expect(rpc(ids.admin,`/api/integrations/${record.id}/customer-import/commit`,'POST',body,'commit-rollback'),200);
 });
 await t.test('separate private channel cap cannot exhaust public replies and list exposes its bounded limit',()=>{
 ticket=expect(rpc(ids.admin,'/api/support/tickets/'+ticket.id),200).ticket;
 execute(`insert into public.dg_bo_support_messages(workspace_id,ticket_id,visibility,author,body) select ${sql(ids.w)},${sql(ticket.id)},'internal','Staff','Bounded private note' from generate_series(1,499);`);
 expect(rpc(ids.admin,'/api/support/tickets/'+ticket.id+'/messages','POST',{revision:ticket.revision,body:'Over private cap',visibility:'internal'},'private-cap'),409,'SUPPORT_THREAD_LIMIT');
 const client=expect(rpc(ids.client,'/api/support/tickets/'+ticket.id),200).ticket;
 expect(rpc(ids.client,'/api/support/tickets/'+ticket.id+'/messages','POST',{revision:client.revision,body:'Public channel still available'},'public-cap-independent'),200);
 execute(`insert into public.dg_bo_support_tickets(workspace_id,organization_id,subject,service,category,priority,status) select ${sql(ids.w)},${sql(ids.org)},'List fixture '||g,'Algemene vraag','Algemene vraag','normal','new' from generate_series(1,201)g;`);
 const list=expect(rpc(ids.client,'/api/support/tickets'),200);assert.equal(list.items.length,200);assert.equal(list.limit,200);assert.equal(list.hasMore,true);assert.ok(list.items.every(item=>item.organizationId===ids.org));
 });
 await t.test('manual owner bootstrap requires exact confirmed UUID and never overwrites other memberships',()=>{
 const owner='10000000-0000-0000-0000-000000000005';
 const bootstrap=readFileSync(new URL('../supabase/bootstrap-owner.sql',import.meta.url),'utf8');
 execute(`insert into auth.users(id,email,email_confirmed_at) values(${sql(owner)},'info@dgwebservices.nl',null);`);
 assert.notEqual(run(target.href,`select set_config('dg_bo.bootstrap_user_id',${sql(owner)},false);`+bootstrap,false).status,0);
 execute(`update auth.users set email_confirmed_at=now() where id=${sql(owner)};`);
 assert.notEqual(run(target.href,`select set_config('dg_bo.bootstrap_user_id',${sql(ids.admin)},false);`+bootstrap,false).status,0);
 run(target.href,`select set_config('dg_bo.bootstrap_user_id',${sql(owner)},false);`+bootstrap);
 run(target.href,`select set_config('dg_bo.bootstrap_user_id',${sql(owner)},false);`+bootstrap);
 assert.equal(execute(`select count(*) from public.dg_bo_memberships where user_id=${sql(owner)};`),'1');
 execute(`update public.dg_bo_memberships set active=false where user_id=${sql(owner)};`);
 assert.notEqual(run(target.href,`select set_config('dg_bo.bootstrap_user_id',${sql(owner)},false);`+bootstrap,false).status,0);
 assert.equal(execute(`select active from public.dg_bo_memberships where user_id=${sql(owner)};`),'f');
 });
 await t.test('audit redaction, direct helper denial and actor supplied fields cannot grant scope',()=>{
 const invalidRequest=JSON.parse(execute(`select set_config('request.jwt.claims',${sql(JSON.stringify(claims(ids.admin)))},false);select public.dg_bo_domain('/api/audit','GET','{}',null,'arbitrary-label');`));assert.equal(invalidRequest.status,422);assert.equal(invalidRequest.value.code,'INVALID_REQUEST_ID');
 const audit=expect(rpc(ids.admin,'/api/audit'),200);assert.equal(JSON.stringify(audit).includes('Private staff context'),false);assert.equal(JSON.stringify(audit).includes('Public question'),false);
 assert.notEqual(run(target.href,'set role authenticated;select dg_bo_private.context();',false).status,0);
 expect(rpc(ids.client,'/api/support/tickets','POST',{organizationId:ids.org,subject:'Forged',body:'Request',workspaceId:ids.w2},'forged-workspace'),422,'UNKNOWN_FIELD');
 });
 }finally{run(base.href,`drop database ${database} with(force);`);}
});
