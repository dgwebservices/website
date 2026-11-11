import { createServer } from 'node:http';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { createStore, hash } from './store.mjs';
import { createCustomerImport } from './customer-import.mjs';
import { createSupportService } from './support.mjs';
import { describeFixtureIntegration } from './integration-status.mjs';
import { ApiError, fail, rejectSecrets, validateWizardState, validateInfrastructureState, integrationKinds, integrationValues } from './validation.mjs';

const keys = new Set(['support','services','management','account','commerce','infrastructure','vaults','maildesk','infra-wizards'].map(module => `dg-midnight-${module}-v1`));
const adminKeys = new Set(['management','infrastructure','vaults','maildesk','infra-wizards'].map(module => `dg-midnight-${module}-v1`));
const supportPublicPermissions=['support.ticket.read','support.ticket.create','support.ticket.reply','support.ticket.status','support.draft.read','support.draft.write'];
const supportStaffPermissions=[...supportPublicPermissions,'support.ticket.manage','support.ticket.internal_note'];
const allPermissions = ['fixture.state.read','fixture.state.write','integrations.read','integrations.manage','integrations.test','integrations.preview','integrations.activate','integrations.pause','audit.read','jobs.read','customer.read','customer.import.preview','customer.import.commit',...supportStaffPermissions];
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.ico':'image/x-icon','.json':'application/json' };
const blocked = ['Geen geautoriseerde live connector aangesloten.', 'Geen server-only geheimbinding geverifieerd.', 'Account, resourcescope en doelomgeving zijn niet onafhankelijk geverifieerd.', 'Deze fixture-runtime staat geen providerwrites toe.'];
const equal = (a, b) => {
  if(typeof a!=='string'||typeof b!=='string')return false;
  const first=Buffer.from(a),second=Buffer.from(b);
  return first.length===second.length&&timingSafeEqual(first,second);
};
const now = () => new Date().toISOString();
const parse = row => row ? { ...JSON.parse(row.data), id: row.id, revision: row.revision, updatedAt: row.updated_at } : null;
const connectionValues = values => Object.fromEntries(Object.entries(values || {}).filter(([key])=>!['wizardStep','wizardCompleted'].includes(key)));

export function createBackofficeServer(options = {}) {
  const mode = options.mode ?? process.env.DG_MODE;
  const host = options.host || '127.0.0.1';
  if (mode !== 'fixture') throw new Error('Live runtime is geblokkeerd: geverifieerde identiteit, doelrepo en productieconnector ontbreken. Kies expliciet DG_MODE=fixture voor geïsoleerde beoordeling.');
  if (!['127.0.0.1','::1','localhost'].includes(host)) throw new Error('Fixture runtime mag uitsluitend op loopback luisteren.');
  const fixtureParity = options.fixtureParity === true;
  const configuredPrincipal = options.fixturePrincipal || {};
  const role = configuredPrincipal.role || 'admin';
  if (!['admin','client','support','operations','finance'].includes(role)) throw new Error('Ongeldige fixture-principal.');
  const actor = Object.freeze({ id: configuredPrincipal.id || `fixture-${role}`, role, workspaceId: configuredPrincipal.workspaceId || 'fixture-workspace', organizationId: configuredPrincipal.organizationId || (role === 'client' ? 'fixture-client-organization' : null), permissions: Object.freeze(configuredPrincipal.permissions || (role === 'admin' ? allPermissions : ['fixture.state.read','fixture.state.write',...(role==='client'?supportPublicPermissions:role==='support'?supportStaffPermissions:[])])) });
  if (!actor.id || !actor.workspaceId) throw new Error('Een fixture-principal vereist stabiele scopes.');
  const statePrincipal = actor.organizationId ? JSON.stringify([actor.id,actor.organizationId]) : actor.id;
  const { db, tx, audit } = createStore(options.dbPath || ':memory:');
  const sessions = new Map();
  const publicDir = resolve(options.publicDir || new URL('../public', import.meta.url).pathname);
  let inlineScriptHashes = '';
  try { inlineScriptHashes = [...readFileSync(resolve(publicDir,'index.html'),'utf8').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].filter(match=>match[1].trim()).map(match=>` 'sha256-${Buffer.from(hash(match[1]),'hex').toString('base64')}'`).join(''); } catch {}
  const permission = name => { if (!actor.permissions.includes(name)) fail(403, 'FORBIDDEN', 'Deze serversessie heeft geen bevoegdheid voor deze actie.'); };
  const requireAdmin = () => { if (actor.role !== 'admin') fail(403, 'FORBIDDEN', 'Deze gegevens zijn uitsluitend beschikbaar voor de bevoegde beheersessie.'); };
  const enrichIntegration=item=>item?{...item,...describeFixtureIntegration(item)}:item;
  const integration = id => { const row = db.prepare('SELECT * FROM integrations WHERE id=? AND workspace_id=?').get(id, actor.workspaceId); if (!row) fail(404,'NOT_FOUND','Installatie niet gevonden.'); return enrichIntegration(parse(row)); };
  const customerImport=createCustomerImport({db,tx,audit,actor,permission,integration});
  const support=createSupportService({db,tx,audit,actor});
  const legacySupport=key=>{if(!fixtureParity&&key==='dg-midnight-support-v1')fail(403,'LEGACY_SUPPORT_DISABLED','Support gebruikt de genormaliseerde support-API. De oorspronkelijke bucket is uitsluitend beschikbaar voor parity-fixtures.');};
  const snapshot = data => ({ ...data, environment: 'fixture', requestedEnvironment:data.values?.environment||'fixture', configured: false, simulated: true, capabilities: { read: false, write: false, test: 'fixture', preview: true, activate: false },...describeFixtureIntegration(data) });
  function updateIntegration(data) {
    const updated = snapshot({ ...data, revision: data.revision + 1, updatedAt: now() });
    db.prepare('UPDATE integrations SET name=?,data=?,revision=?,updated_at=? WHERE id=? AND workspace_id=? AND revision=?').run(updated.name,JSON.stringify(updated), updated.revision, updated.updatedAt, updated.id, actor.workspaceId, data.revision);
    return updated;
  }
  function revision(body, data) {
    if (!Number.isInteger(body.revision) || body.revision !== data.revision) fail(409, 'REVISION_CONFLICT', 'De gegevens zijn gewijzigd. Laad de actuele revisie.', { current: data });
  }
  async function body(request) {
    if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] || '')) fail(415,'CONTENT_TYPE','Gebruik application/json.');
    let size = 0; const parts = [];
    for await (const part of request) { size += part.length; if (size > 1024 * 1024) fail(413,'TOO_LARGE','De aanvraag is te groot.'); parts.push(part); }
    try { const data = JSON.parse(Buffer.concat(parts).toString()); if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(); return data; } catch { fail(400,'INVALID_JSON','Ongeldige JSON-aanvraag.'); }
  }
  function respond(response, status, value, extra = {}) { response.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', ...extra }); response.end(JSON.stringify(value)); }
  const server = createServer(async (request, response) => {
    const requestId = randomUUID();
    response.setHeader('Cache-Control','no-store'); response.setHeader('X-Content-Type-Options','nosniff'); response.setHeader('Referrer-Policy','same-origin'); response.setHeader('X-Frame-Options','SAMEORIGIN'); response.setHeader('X-Request-ID',requestId);
    response.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self'${inlineScriptHashes}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'`);
    try {
      const remote = request.socket.remoteAddress;
      if (!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote)) fail(403,'LOOPBACK_REQUIRED','Fixture alleen beschikbaar via loopback.');
      const address = server.address();
      const expectedHosts = [`127.0.0.1:${address.port}`,`localhost:${address.port}`,`[::1]:${address.port}`];
      if (!expectedHosts.includes(request.headers.host)) fail(403,'INVALID_HOST','Onbekende fixture-host.');
      const origin = `http://${request.headers.host}`;
      const url = new URL(request.url, origin), path = decodeURIComponent(url.pathname);
      if (request.method === 'GET' && path === '/healthz') { respond(response,200,{status:'ok',mode:'fixture',providerWrites:false}); return; }
      if (request.method === 'GET' && path === '/runtime.js') { response.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'}); response.end(`globalThis.DG_RUNTIME=${JSON.stringify({mode,fixtureParity})};`); return; }
      const cookie = (request.headers.cookie || '').split(';').map(part=>part.trim()).find(part=>part.startsWith('dg_fixture_session='))?.slice('dg_fixture_session='.length);
      let session = sessions.get(cookie);
      if (session && session.expiresAt < Date.now()) { sessions.delete(cookie); session = undefined; }
      if (request.method === 'GET' && path === '/api/session') {
        if (request.headers['sec-fetch-site'] === 'cross-site' || (request.headers.origin && request.headers.origin !== origin)) fail(403,'ORIGIN_REJECTED','Deze origin heeft geen toegang.');
        if (!session) { const token = randomBytes(32).toString('hex'); session = { csrf:randomBytes(32).toString('hex'), expiresAt:Date.now()+8*60*60*1000 }; sessions.set(token, session); response.setHeader('Set-Cookie',`dg_fixture_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`); }
        respond(response,200,{actor,csrf:session.csrf,mode,fixtureParity,providerWrites:false,authentication:'loopback-fixture',expiresAt:new Date(session.expiresAt).toISOString()}); return;
      }
      if (path.startsWith('/api/')) {
        if (!session) fail(401,'UNAUTHENTICATED','Een geauthenticeerde fixturesessie is vereist.');
        if(request.headers['sec-fetch-site']==='cross-site'||request.headers.origin&&request.headers.origin!==origin)fail(403,'ORIGIN_REJECTED','Deze origin heeft geen toegang tot de serversessie.');
        if (!['GET','HEAD'].includes(request.method)) {
          if (request.headers.origin !== origin || request.headers['sec-fetch-site'] === 'cross-site') fail(403,'ORIGIN_REJECTED','Deze origin mag geen wijzigingen uitvoeren.');
          if (!equal(request.headers['x-csrf-token'], session.csrf)) fail(403,'CSRF_REJECTED','Ongeldig CSRF-token.');
        }
        if (request.method === 'POST' && path === '/api/logout') { if (cookie) sessions.delete(cookie); response.setHeader('Set-Cookie','dg_fixture_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); respond(response,200,{ok:true}); return; }
        if(request.method==='GET'&&path==='/api/support/catalog'){respond(response,200,support.catalog());return;}
        if(path==='/api/support/tickets'){
          if(request.method==='GET'){respond(response,200,support.list());return;}
          if(request.method==='POST'){const result=support.create(await body(request),request.headers['idempotency-key'],requestId);respond(response,result.status,result.value);return;}
        }
        if(path==='/api/support/drafts'){
          if(request.method==='GET'){respond(response,200,support.drafts());return;}
          if(request.method==='PUT'){respond(response,200,support.saveDraft(await body(request),requestId));return;}
        }
        const supportMatch=path.match(/^\/api\/support\/tickets\/([^/]+)(?:\/(messages))?$/);
        if(supportMatch){
          if(request.method==='GET'&&!supportMatch[2]){respond(response,200,support.detail(supportMatch[1]));return;}
          if(request.method==='POST'&&supportMatch[2]){const result=support.message(supportMatch[1],await body(request),request.headers['idempotency-key'],requestId);respond(response,result.status,result.value);return;}
          if(['PATCH','PUT'].includes(request.method)&&!supportMatch[2]){const result=support.update(supportMatch[1],await body(request),request.headers['idempotency-key'],requestId);respond(response,result.status,result.value);return;}
        }
        if (request.method === 'GET' && path === '/api/capabilities') { permission('integrations.read'); respond(response,200,{mode,providerWrites:false,kinds:integrationKinds,capabilities:{test:'fixture',preview:true,activate:false},missingRequirements:blocked}); return; }
        if (request.method === 'PUT' && path === '/api/state') {
          permission('fixture.state.write');
          const data=await body(request);
          if(!Array.isArray(data.changes)||!data.changes.length||data.changes.length>keys.size)fail(422,'INVALID_BATCH','Een opslagtransactie bevat één tot negen gegevensonderdelen.');
          const seen=new Set();
          for(const change of data.changes){
            if(!change||!keys.has(change.key)||seen.has(change.key))fail(422,'INVALID_BATCH','Onbekend of dubbel gegevensonderdeel.');
            legacySupport(change.key);
            seen.add(change.key);if(adminKeys.has(change.key))requireAdmin();
            if(!Object.hasOwn(change,'value'))fail(422,'VALUE_REQUIRED','De gegevens ontbreken.');
            rejectSecrets(change.value);
          }
          const changes=tx(()=>{
            const prepared=data.changes.map(change=>{
            const current=db.prepare('SELECT * FROM fixture_state WHERE workspace_id=? AND principal_id=? AND key=?').get(actor.workspaceId,statePrincipal,change.key);
            if(!Number.isInteger(change.revision)||change.revision!==(current?.revision||0))fail(409,'REVISION_CONFLICT','De opgeslagen gegevens zijn gewijzigd.',{key:change.key,current:{value:current?JSON.parse(current.value):null,revision:current?.revision||0}});
            const value=change.key==='dg-midnight-infra-wizards-v1'?validateWizardState(change.value,current&&JSON.parse(current.value)):change.value;
            return{change,current,value};
            });
            const wizardChange=prepared.find(item=>item.change.key==='dg-midnight-infra-wizards-v1');
            const savedWizard=db.prepare('SELECT value FROM fixture_state WHERE workspace_id=? AND principal_id=? AND key=?').get(actor.workspaceId,statePrincipal,'dg-midnight-infra-wizards-v1');
            const wizardState=wizardChange?wizardChange.value:savedWizard?JSON.parse(savedWizard.value):[];
            return prepared.map(({change,current,value:rawValue})=>{
            const value=change.key==='dg-midnight-infrastructure-v1'?validateInfrastructureState(rawValue,current&&JSON.parse(current.value),wizardState,actor):rawValue;
            const next=(current?.revision||0)+1;
            db.prepare('INSERT INTO fixture_state VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id,principal_id,key) DO UPDATE SET value=excluded.value,revision=excluded.revision,updated_at=excluded.updated_at').run(actor.workspaceId,statePrincipal,change.key,JSON.stringify(value),next,now());
            audit(actor,'fixture.state.write',change.key,'saved',requestId,{revision:next,payloadDigest:hash(value),atomicBatch:true});
            return{key:change.key,value,revision:next};
            });
          });respond(response,200,{changes});return;
        }
        if (path.startsWith('/api/state/')) {
          const key = path.slice('/api/state/'.length);
          if (!keys.has(key)) fail(404,'NOT_FOUND','Onbekend gegevensonderdeel.');
          legacySupport(key);
          if (adminKeys.has(key)) requireAdmin();
          const existing = db.prepare('SELECT * FROM fixture_state WHERE workspace_id=? AND principal_id=? AND key=?').get(actor.workspaceId,statePrincipal,key);
          if (request.method === 'GET') { permission('fixture.state.read'); respond(response,200,{value:existing ? JSON.parse(existing.value) : null, revision:existing?.revision || 0}); return; }
          if (request.method === 'PUT') {
            permission('fixture.state.write'); const data = await body(request); rejectSecrets(data.value);
            const result = tx(()=>{
              const current = db.prepare('SELECT * FROM fixture_state WHERE workspace_id=? AND principal_id=? AND key=?').get(actor.workspaceId,statePrincipal,key);
              if (!Number.isInteger(data.revision) || data.revision !== (current?.revision || 0)) fail(409,'REVISION_CONFLICT','De opgeslagen gegevens zijn gewijzigd.',{current:{value:current ? JSON.parse(current.value) : null,revision:current?.revision || 0}});
              if (!Object.hasOwn(data,'value')) fail(422,'VALUE_REQUIRED','De gegevens ontbreken.');
              let value = key === 'dg-midnight-infra-wizards-v1' ? validateWizardState(data.value,current && JSON.parse(current.value)) : data.value;
              if(key==='dg-midnight-infrastructure-v1'){
                const wizard=db.prepare('SELECT value FROM fixture_state WHERE workspace_id=? AND principal_id=? AND key=?').get(actor.workspaceId,statePrincipal,'dg-midnight-infra-wizards-v1');
                value=validateInfrastructureState(value,current&&JSON.parse(current.value),wizard?JSON.parse(wizard.value):[],actor);
              }
              const next = (current?.revision || 0) + 1;
              db.prepare('INSERT INTO fixture_state VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id,principal_id,key) DO UPDATE SET value=excluded.value,revision=excluded.revision,updated_at=excluded.updated_at').run(actor.workspaceId,statePrincipal,key,JSON.stringify(value),next,now());
              audit(actor,'fixture.state.write',key,'saved',requestId,{revision:next,payloadDigest:hash(value)});
              return {value,revision:next};
            }); respond(response,200,result); return;
          }
        }
        if (path === '/api/integrations') {
          if (request.method === 'GET') { permission('integrations.read'); respond(response,200,{items:db.prepare('SELECT * FROM integrations WHERE workspace_id=? ORDER BY updated_at DESC,id').all(actor.workspaceId).map(parse).map(enrichIntegration)}); return; }
          if (request.method === 'POST') {
            permission('integrations.manage'); const data=await body(request); rejectSecrets(data);
            if (!integrationKinds.includes(data.kind) || typeof data.name !== 'string' || !data.name.trim() || data.name.length>120) fail(422,'INVALID_INTEGRATION','Kies een installatie en vul een naam van maximaal 120 tekens in.');
            const values = integrationValues(data.values || {},data.kind), id=randomUUID(), updatedAt=now();
            const item=snapshot({id,kind:data.kind,name:data.name.trim(),values,revision:1,status:'draft',testHistory:[],createdAt:updatedAt,updatedAt});
            tx(()=>{db.prepare('INSERT INTO integrations VALUES(?,?,?,?,?,?,?)').run(id,actor.workspaceId,item.kind,item.name,JSON.stringify(item),1,updatedAt);audit(actor,'integration.create',id,'draft',requestId,{kind:item.kind,revision:1});});
            respond(response,201,{integration:item});return;
          }
        }
        if(path==='/api/customer-registry'&&request.method==='GET'){respond(response,200,customerImport.list());return;}
        const importMatch=path.match(/^\/api\/integrations\/([^/]+)\/customer-import\/(preview|commit)$/);
        if(importMatch&&request.method==='POST'){
          const data=await body(request),result=customerImport[importMatch[2]](importMatch[1],data,request.headers['idempotency-key'],requestId);respond(response,result.status,result.value);return;
        }
        const match = path.match(/^\/api\/integrations\/([^/]+)(?:\/(test|preview|activate|pause))?$/);
        if(match){
          const [,id,action]=match; permission('integrations.read'); const item=integration(id);
          if(!action && request.method==='GET'){respond(response,200,{integration:item});return;}
          if(!action && request.method==='PUT'){
            permission('integrations.manage');const data=await body(request);rejectSecrets(data);const values=integrationValues(data.values,item.kind);
            if(data.name!==undefined&&(typeof data.name!=='string'||!data.name.trim()||data.name.length>120))fail(422,'INVALID_INTEGRATION','Vul een naam van maximaal 120 tekens in.');
            const result=tx(()=>{const current=integration(id);revision(data,current);const changed=hash(connectionValues(values))!==hash(connectionValues(current.values));const next=updateIntegration({...current,name:data.name?.trim()||current.name,values,...(changed?{status:'draft',lastTest:null,lastSuccessfulTestAt:null}:{}),missingRequirements:blocked});audit(actor,'integration.update',id,next.status,requestId,{revision:next.revision,kind:next.kind});return next;});respond(response,200,{integration:result});return;
          }
          if(action && request.method==='POST'){
            permission(`integrations.${action}`);const data=await body(request);rejectSecrets(data);
            const idem=request.headers['idempotency-key'];if(typeof idem!=='string'||!/^[A-Za-z0-9_.:-]{8,128}$/.test(idem))fail(422,'IDEMPOTENCY_REQUIRED','Gebruik een unieke Idempotency-Key van 8 tot 128 tekens.');
            const fingerprint=hash({method:request.method,path,data});
            const result=tx(()=>{
              const old=db.prepare('SELECT * FROM idempotency WHERE workspace_id=? AND actor_id=? AND key=?').get(actor.workspaceId,actor.id,idem);
              if(old){if(old.fingerprint!==fingerprint)fail(409,'IDEMPOTENCY_CONFLICT','Deze Idempotency-Key hoort bij andere gegevens.');return{status:old.status,value:JSON.parse(old.response)};}
              const current=integration(id);revision(data,current);
              let next=current,job,plan,status=200;
              if(action==='test'){
                const timestamp=now(); const test={id:randomUUID(),status:'blocked',simulated:true,mode:'dry_run',revision:current.revision,testedRevision:current.revision,createdAt:timestamp,summary:'Fixturecontrole: geen providerverbinding gemaakt; live voorwaarden blijven open.',checks:[{name:'metadata',status:'pass',source:'fixture'},{name:'provider-authentication',status:'open',source:'not-connected'},{name:'scope-and-environment',status:'open',source:'not-verified'}]};
                next=updateIntegration({...current,status:'blocked',lastTest:test,testHistory:[...(current.testHistory||[]),test].slice(-20),lastTestAt:timestamp,lastSuccessfulTestAt:null,missingRequirements:blocked});
                job={id:randomUUID(),integrationId:id,action,status:'blocked',mode:'dry_run',simulated:true,createdAt:timestamp,summary:test.summary,retryAllowed:false};
                db.prepare('INSERT INTO jobs VALUES(?,?,?,?,?,?,?)').run(job.id,actor.workspaceId,id,action,job.status,JSON.stringify(job),timestamp);
              }else if(action==='preview'){
                plan={id:randomUUID(),integrationId:id,revision:current.revision,mode:'dry_run',environment:current.environment,status:'blocked',noExternalWrites:true,simulated:true,changes:[],missingRequirements:blocked,createdAt:now()};
              }else if(action==='activate'){
                // Even a fully filled-in browser plan cannot grant connector rights.
                next=updateIntegration({...current,status:'blocked',missingRequirements:blocked});status=409;
              }else if(action==='pause'){next=updateIntegration({...current,status:'paused'});}
              const auditId=audit(actor,`integration.${action}`,id,action==='activate'?'blocked':next.status,requestId,{revision:next.revision,simulated:true});
              const value={integration:next,...(job?{job}:{}),...(plan?{plan}:{}),auditId,...(action==='activate'?{code:'ACTIVATION_BLOCKED',message:'Activeren is geblokkeerd: live prerequisites ontbreken.',missingRequirements:blocked}:{})};
              db.prepare('INSERT INTO idempotency VALUES(?,?,?,?,?,?,?)').run(actor.workspaceId,actor.id,idem,fingerprint,status,JSON.stringify(value),now());return{status,value};
            });respond(response,result.status,result.value);return;
          }
        }
        if(path==='/api/jobs' && request.method==='GET'){permission('jobs.read');respond(response,200,{items:db.prepare('SELECT data FROM jobs WHERE workspace_id=? ORDER BY created_at DESC,id LIMIT 200').all(actor.workspaceId).map(row=>JSON.parse(row.data))});return;}
        if(path==='/api/audit' && request.method==='GET'){permission('audit.read');respond(response,200,{items:db.prepare('SELECT * FROM audit_events WHERE workspace_id=? ORDER BY created_at DESC,id LIMIT 500').all(actor.workspaceId).map(row=>({id:row.id,actorId:row.actor_id,action:row.action,targetId:row.target_id,outcome:row.outcome,createdAt:row.created_at,...JSON.parse(row.data)}))});return;}
        fail(404,'NOT_FOUND','API-route niet gevonden.');
      }
      if (!['GET','HEAD'].includes(request.method)) fail(405,'METHOD_NOT_ALLOWED','Deze methode wordt niet ondersteund.');
      const requested = resolve(publicDir, `.${path === '/' ? '/index.html' : path}`);
      if (!requested.startsWith(publicDir+sep)) fail(404,'NOT_FOUND','Bestand niet gevonden.');
      let absolute;
      try { absolute=await realpath(requested); if(!absolute.startsWith(publicDir+sep)||!(await stat(absolute)).isFile())fail(404,'NOT_FOUND','Bestand niet gevonden.'); }
      catch { fail(404,'NOT_FOUND','Bestand niet gevonden.'); }
      const content=await readFile(absolute);response.writeHead(200,{'Content-Type':mime[extname(absolute)]||'application/octet-stream'});response.end(request.method==='HEAD'?undefined:content);
    } catch(error) {
      if(response.headersSent){response.end();return;}
      if(error instanceof ApiError)respond(response,error.status,{code:error.code,message:error.message,requestId,...error.details});
      else respond(response,500,{code:'INTERNAL_ERROR',message:'De server kon deze aanvraag niet veilig verwerken.',requestId});
    }
  });
  // Prevent accidental network exposure even when callers use server.listen directly.
  const nativeListen=server.listen.bind(server);
  server.listen=(...args)=>{const arg=args[0];if(typeof arg==='object' && arg!==null){if(arg.path||arg.fd||!['127.0.0.1','::1','localhost'].includes(arg.host))throw new Error('Fixture listen vereist expliciete loopback-host.');}else if(!['127.0.0.1','::1','localhost'].includes(args[1]))throw new Error('Fixture listen vereist expliciete loopback-host.');return nativeListen(...args);};
  return { server, db, actor, listen:port=>new Promise((resolveListen,reject)=>{server.once('error',reject);server.listen({port:port??0,host},()=>{server.removeListener('error',reject);resolveListen(server.address());});}), close:async()=>{sessions.clear();if(server.listening)await new Promise((resolveClose,reject)=>{server.close(error=>error?reject(error):resolveClose());server.closeAllConnections();});db.close();} };
}
