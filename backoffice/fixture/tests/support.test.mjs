import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBackofficeServer } from '../server/index.mjs';

const org='fixture-client-organization',otherOrg='fixture-org-studio-noord';
const publicPermissions=['support.ticket.read','support.ticket.create','support.ticket.reply','support.ticket.status','support.draft.read','support.draft.write'];
const staffPermissions=[...publicPermissions,'support.ticket.manage','support.ticket.internal_note'];
async function workspace(t){const directory=await mkdtemp(join(tmpdir(),'dg-support-'));t.after(()=>rm(directory,{recursive:true,force:true}));return join(directory,'support.sqlite');}
async function session(t,dbPath,fixturePrincipal={role:'admin'},options={}){
  const app=createBackofficeServer({mode:'fixture',dbPath,fixturePrincipal,...options});const address=await app.listen(),origin=`http://127.0.0.1:${address.port}`;t.after(()=>app.close());
  const response=await fetch(origin+'/api/session'),cookie=response.headers.get('set-cookie').split(';')[0],identity=await response.json();
  let intent=0;
  const request=async(path,{method='GET',body,key,headers={}}={})=>{
    const result=await fetch(origin+path,{method,headers:{Cookie:cookie,...(body!==undefined?{Origin:origin,'Content-Type':'application/json','X-CSRF-Token':identity.csrf,'Idempotency-Key':key||`${identity.actor.id}-intent-${++intent}`}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
    return{status:result.status,body:await result.json(),headers:result.headers};
  };
  return{app,request,identity};
}
const payload=(extra={})=>({organizationId:org,service:'Algemene vraag',subject:'Lokale supportvraag',category:'Algemene vraag',priority:'normal',body:'Een publieke vraag voor DG.',...extra});
async function create(user,extra={},key){const result=await user.request('/api/support/tickets',{method:'POST',body:payload(extra),key});assert.equal(result.status,201,JSON.stringify(result.body));return result.body.ticket;}
const message=(user,ticket,body,visibility='public',key)=>user.request(`/api/support/tickets/${ticket.id}/messages`,{method:'POST',body:{revision:ticket.revision,body,visibility},key});
const details=(user,ticket,changes,key)=>user.request(`/api/support/tickets/${ticket.id}`,{method:'PATCH',body:{revision:ticket.revision,...changes},key});

test('normalized support creates shared staff/client tickets without mail, uploads or automatic fixture tickets',async t=>{
  const dbPath=await workspace(t),admin=await session(t,dbPath),client=await session(t,dbPath,{role:'client'});
  assert.equal((await admin.request('/api/support/tickets')).body.items.length,0);
  const catalog=(await client.request('/api/support/catalog')).body;assert.equal(catalog.items.length,1);assert.equal(catalog.items[0].id,org);assert.equal(catalog.items[0].fixture,true);assert.equal(catalog.capabilities.attachments,false);assert.equal(catalog.capabilities.email,false);
  const ticket=await create(client);const staff=(await admin.request(`/api/support/tickets/${ticket.id}`)).body.ticket;
  assert.equal(staff.organizationId,org);assert.equal(staff.client,'Duindorp SV');assert.equal(staff.messages[0].body,payload().body);assert.equal(ticket.status,'new');assert.equal(ticket.mode,'local_fixture');assert.equal(ticket.messageCount,1);assert.deepEqual(ticket.messages[0].attachments,[]);
  assert.equal((await admin.request('/api/jobs')).body.items.length,0);
});

test('internal notes and assignment never change client payload, public revision, history, counters or timestamps',async t=>{
  const dbPath=await workspace(t),admin=await session(t,dbPath),client=await session(t,dbPath,{role:'client'});const ticket=await create(client);
  const beforeDetail=(await client.request(`/api/support/tickets/${ticket.id}`)).body,beforeList=(await client.request('/api/support/tickets')).body;
  let staff=(await admin.request(`/api/support/tickets/${ticket.id}`)).body.ticket;
  staff=(await message(admin,staff,'PRIVATE_NOTE_NEVER_PUBLIC','internal')).body.ticket;assert.equal(staff.revision,2);assert.equal(staff.messageCount,2);
  staff=(await details(admin,staff,{assignee:'DG Techniek'})).body.ticket;assert.equal(staff.assignee,'DG Techniek');assert.equal(staff.revision,3);
  assert.deepEqual((await client.request(`/api/support/tickets/${ticket.id}`)).body,beforeDetail);assert.deepEqual((await client.request('/api/support/tickets')).body,beforeList);
  const reply=await message(client,ticket,'Klantreactie ondanks interne wijzigingen.');assert.equal(reply.status,200);assert.equal(reply.body.ticket.revision,2);assert.ok(!JSON.stringify(reply.body).includes('PRIVATE_NOTE_NEVER_PUBLIC'));
  const staffAfter=(await admin.request(`/api/support/tickets/${ticket.id}`)).body.ticket;assert.equal(staffAfter.revision,4);assert.equal(staffAfter.messages.filter(item=>item.visibility==='internal').length,2);
});

test('a full private channel cannot consume the public reply capacity',async t=>{
  const dbPath=await workspace(t),admin=await session(t,dbPath),client=await session(t,dbPath,{role:'client'}),ticket=await create(client);
  const before=(await client.request(`/api/support/tickets/${ticket.id}`)).body;
  const insert=admin.app.db.prepare('INSERT INTO support_internal_notes VALUES(?,?,?,?,?,?,?,?)');
  admin.app.db.exec('BEGIN');for(let index=0;index<500;index++)insert.run(`private-limit-${index}`,'fixture-workspace',ticket.id,'DG Support','private capacity fixture',new Date().toISOString(),'message',index+2);admin.app.db.exec('COMMIT');
  assert.deepEqual((await client.request(`/api/support/tickets/${ticket.id}`)).body,before);
  const staff=(await admin.request(`/api/support/tickets/${ticket.id}`)).body.ticket;assert.equal((await message(admin,staff,'Another private note','internal')).body.code,'SUPPORT_THREAD_LIMIT');
  assert.equal((await message(client,ticket,'Public response still allowed')).status,200);
});

test('foreign organization/workspace ticket IDs, forged identities and unregistered organizations cannot grant access',async t=>{
  const dbPath=await workspace(t),admin=await session(t,dbPath),client=await session(t,dbPath,{role:'client'}),foreign=await session(t,dbPath,{id:'client-b',role:'client',organizationId:otherOrg}),otherWorkspace=await session(t,dbPath,{role:'admin',workspaceId:'foreign-workspace'});
  const ticket=await create(client);
  for(const user of [foreign,otherWorkspace]){
    assert.equal((await user.request(`/api/support/tickets/${ticket.id}`)).status,404);assert.equal((await message(user,ticket,'forged')).status,404);assert.equal((await details(user,ticket,{status:'resolved'})).status,404);
  }
  assert.equal((await foreign.request('/api/support/tickets')).body.counters.total,0);
  assert.equal((await client.request('/api/support/tickets',{method:'POST',body:payload({organizationId:otherOrg})})).status,404);
  assert.equal((await client.request('/api/support/tickets',{method:'POST',body:payload({role:'admin',workspaceId:'foreign-workspace'})})).status,422);
  assert.equal((await admin.request('/api/support/tickets',{method:'POST',body:payload({organizationId:'guessed-organization'})})).status,404);
  assert.equal((await foreign.request('/api/support/drafts',{method:'PUT',body:{key:`${ticket.id}:public`,revision:0,value:{body:'foreign'}}})).status,404);
});

test('staff role and explicit permissions both apply; readers without internal permission receive public DTOs',async t=>{
  const dbPath=await workspace(t),admin=await session(t,dbPath),client=await session(t,dbPath,{role:'client'}),reader=await session(t,dbPath,{id:'limited-reader',role:'support',permissions:['support.ticket.read']});
  const ticket=await create(client),before=(await reader.request(`/api/support/tickets/${ticket.id}`)).body;
  await message(admin,ticket,'ONLY_AUTHORIZED_STAFF_NOTE','internal');assert.deepEqual((await reader.request(`/api/support/tickets/${ticket.id}`)).body,before);
  const operations=await session(t,dbPath,{role:'operations',permissions:staffPermissions});assert.equal((await operations.request('/api/support/catalog')).status,403);
  const privilegedClient=await session(t,dbPath,{id:'client-with-extra-permissions',role:'client',permissions:staffPermissions});assert.equal((await message(privilegedClient,ticket,'private','internal')).status,403);assert.equal((await details(privilegedClient,ticket,{assignee:'DG Techniek'})).status,403);
});

test('support replies use CAS and idempotency without duplicate public messages or status events',async t=>{
  const dbPath=await workspace(t),client=await session(t,dbPath,{role:'client'}),ticket=await create(client);
  const first=await message(client,ticket,'Exactly once','public','same-reply-intent');assert.equal(first.status,200);
  const repeated=await message(client,ticket,'Exactly once','public','same-reply-intent');assert.deepEqual(repeated.body,first.body);
  const stale=await message(client,ticket,'Stale reply','public','stale-reply-intent');assert.equal(stale.status,409);assert.equal(stale.body.current.revision,2);assert.ok(!Object.hasOwn(stale.body.current,'staffRevision'));
  const changed=await message(client,ticket,'Different content','public','same-reply-intent');assert.equal(changed.status,409);assert.equal(changed.body.code,'IDEMPOTENCY_CONFLICT');
  assert.equal(client.app.db.prepare('SELECT COUNT(*) AS n FROM support_public_messages WHERE ticket_id=?').get(ticket.id).n,3);
});

test('cached command DTO cannot leak prior internal data after internal permission revocation',async t=>{
  const dbPath=await workspace(t),staff=await session(t,dbPath,{id:'same-staff',role:'support',permissions:staffPermissions});let ticket=await create(staff);
  ticket=(await message(staff,ticket,'PRIVATE_REVOKED_PERMISSION','internal','private-note-intent')).body.ticket;
  const oldRevision=ticket.revision,first=await message(staff,ticket,'Public staff reply','public','public-reply-intent');assert.equal(first.status,200);assert.ok(JSON.stringify(first.body).includes('PRIVATE_REVOKED_PERMISSION'));
  const restricted=await session(t,dbPath,{id:'same-staff',role:'support',permissions:publicPermissions});
  const replay=await message(restricted,{id:ticket.id,revision:oldRevision},'Public staff reply','public','public-reply-intent');assert.equal(replay.status,409);assert.equal(replay.body.code,'IDEMPOTENCY_CONFLICT');assert.ok(!JSON.stringify(replay.body).includes('PRIVATE_REVOKED_PERMISSION'));
  assert.ok(!JSON.stringify((await restricted.request(`/api/support/tickets/${ticket.id}`)).body).includes('PRIVATE_REVOKED_PERMISSION'));
});

test('resolved tickets require explicit reopening and customers cannot edit staff fields or workflow states',async t=>{
  const dbPath=await workspace(t),client=await session(t,dbPath,{role:'client'}),admin=await session(t,dbPath);let ticket=await create(client);
  ticket=(await details(client,ticket,{status:'resolved'})).body.ticket;assert.equal(ticket.status,'resolved');assert.equal((await message(client,ticket,'Should not post')).body.code,'TICKET_RESOLVED');
  assert.equal((await details(admin,ticket,{status:'waiting'})).status,422);
  ticket=(await details(client,ticket,{status:'open'})).body.ticket;assert.equal(ticket.status,'open');assert.equal((await details(client,ticket,{status:'waiting'})).status,403);assert.equal((await details(client,ticket,{priority:'urgent'})).status,403);
  assert.equal((await message(client,ticket,'Now allowed')).status,200);
});

test('drafts are server-persistent, principal/mode scoped, CAS checked and atomically cleared with submission',async t=>{
  const dbPath=await workspace(t),client=await session(t,dbPath,{role:'client'}),peer=await session(t,dbPath,{id:'peer',role:'client'});
  const saved=await client.request('/api/support/drafts',{method:'PUT',body:{key:'create',revision:0,value:payload()}});assert.equal(saved.status,200);assert.equal(saved.body.draft.revision,1);assert.equal((await peer.request('/api/support/drafts')).body.items.length,0);
  const stale=await client.request('/api/support/drafts',{method:'PUT',body:{key:'create',revision:0,value:{body:'stale'}}});assert.equal(stale.status,409);assert.equal(stale.body.current.key,'create');assert.equal(stale.body.current.revision,1);
  const created=await client.request('/api/support/tickets',{method:'POST',body:payload({draftRevision:1})});assert.equal(created.status,201);assert.deepEqual(created.body.clearedDraft,{key:'create',value:{},revision:2});
  const ticket=created.body.ticket,key=`${ticket.id}:public`;
  await client.request('/api/support/drafts',{method:'PUT',body:{key,revision:0,value:{body:'Draft reply'}}});
  const reply=await client.request(`/api/support/tickets/${ticket.id}/messages`,{method:'POST',body:{revision:1,body:'Draft reply',visibility:'public',draftRevision:1}});assert.equal(reply.status,200);assert.equal(reply.body.clearedDraft.revision,2);
  assert.equal((await client.request('/api/support/drafts',{method:'PUT',body:{key:`${ticket.id}:internal`,revision:0,value:{body:'private'}}})).status,403);
  await client.request('/api/support/drafts',{method:'PUT',body:{key:'create',revision:2,value:payload({body:'Newer tab draft'})}});
  const draftConflict=await client.request('/api/support/tickets',{method:'POST',body:payload({draftRevision:2})});assert.equal(draftConflict.status,409);assert.equal(draftConflict.body.code,'DRAFT_CONFLICT');assert.equal((await client.request('/api/support/tickets')).body.items.length,1);
});

test('support storage failure rolls back ticket, message, cleared draft, audit and idempotency result',async t=>{
  const dbPath=await workspace(t),client=await session(t,dbPath,{role:'client'});
  await client.request('/api/support/drafts',{method:'PUT',body:{key:'create',revision:0,value:payload()}});
  const before=client.app.db.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n;
  client.app.db.exec("CREATE TRIGGER support_fault BEFORE INSERT ON support_public_messages BEGIN SELECT RAISE(ABORT,'private fixture failure'); END");
  const failed=await client.request('/api/support/tickets',{method:'POST',body:payload({draftRevision:1}),key:'failed-create-intent'});assert.equal(failed.status,500);assert.ok(!JSON.stringify(failed.body).includes('private fixture failure'));
  assert.equal(client.app.db.prepare('SELECT COUNT(*) AS n FROM support_tickets').get().n,0);assert.equal(client.app.db.prepare('SELECT COUNT(*) AS n FROM audit_events').get().n,before);assert.equal((await client.request('/api/support/drafts')).body.items[0].revision,1);
  client.app.db.exec('DROP TRIGGER support_fault');assert.equal((await client.request('/api/support/tickets',{method:'POST',body:payload({draftRevision:1}),key:'failed-create-intent'})).status,201);
});

test('support rejects secrets, attachments and control characters; plaintext remains text and audit omits bodies',async t=>{
  const dbPath=await workspace(t),admin=await session(t,dbPath),marker='sk-proj-TEST_SECRET_NEVER_LOGGED_1234567890';
  for(const changes of [{body:marker},{body:'password=private'},{subject:'line\nbreak'},{body:'bad\u0000body'},{attachments:[{name:'private.txt'}]}])assert.equal((await admin.request('/api/support/tickets',{method:'POST',body:payload(changes)})).status,422);
  const html='<img src=x onerror="alert(1)"> literal support text';const ticket=await create(admin,{body:html});assert.equal(ticket.messages[0].body,html);assert.equal(ticket.messages[0].visibility,'public');
  const audit=JSON.stringify((await admin.request('/api/audit')).body);assert.ok(!audit.includes(html));assert.ok(!audit.includes(marker));assert.ok(!audit.includes(payload().subject));assert.equal((await admin.request('/api/support/tickets')).body.items.length,1);
  assert.throws(()=>admin.app.db.prepare('UPDATE support_public_messages SET body=? WHERE ticket_id=?').run('tampered',ticket.id),/append-only/);
  assert.throws(()=>admin.app.db.prepare('INSERT INTO support_public_messages VALUES(?,?,?,?,?,?,?,?)').run('foreign-message','foreign-workspace',ticket.id,'x','x',new Date().toISOString(),'message',2),/FOREIGN KEY/);
});

test('support accepts an existing normalized organization only in its own workspace',async t=>{
  const dbPath=await workspace(t),admin=await session(t,dbPath);
  admin.app.db.prepare('INSERT INTO local_customer_orgs VALUES(?,?,?,?,?,?,?,?,?)').run('local-org-1','fixture-workspace','Imported local org','imported local org','billing@example.invalid','NL',1,1,new Date().toISOString());
  const ticket=await create(admin,{organizationId:'local-org-1'});assert.equal(ticket.client,'Imported local org');assert.equal(ticket.fixture,false);
  const client=await session(t,dbPath,{role:'client',organizationId:'local-org-1'});assert.equal((await client.request(`/api/support/tickets/${ticket.id}`)).status,200);
  const foreign=await session(t,dbPath,{role:'admin',workspaceId:'other-workspace'});assert.equal((await foreign.request('/api/support/tickets',{method:'POST',body:payload({organizationId:'local-org-1'})})).status,404);
});

test('normal runtime refuses the old support blob while isolated parity retains original fixture storage',async t=>{
  const dbPath=await workspace(t),normal=await session(t,dbPath),parity=await session(t,dbPath,{role:'admin'},{fixtureParity:true});const path='/api/state/dg-midnight-support-v1';
  assert.equal((await normal.request(path)).status,403);assert.equal((await normal.request(path,{method:'PUT',body:{value:{tickets:[]},revision:0}})).status,403);
  assert.equal((await normal.request('/api/state',{method:'PUT',body:{changes:[{key:'dg-midnight-support-v1',value:{tickets:[]},revision:0}]}})).status,403);
  assert.equal((await parity.request(path,{method:'PUT',body:{value:{tickets:[]},revision:0}})).status,200);assert.deepEqual((await parity.request(path)).body.value,{tickets:[]});assert.equal((await normal.request(path)).status,403);
});
