import { randomUUID } from 'node:crypto';
import { hash } from './store.mjs';
import { fail, integrationValues, rejectSecrets } from './validation.mjs';

const utc=()=>new Date().toISOString();
const normalizedName=value=>value.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('nl-NL');

export function createCustomerImport({db,tx,audit,actor,permission,integration}){
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS integrations_workspace_id ON integrations(workspace_id,id);
    CREATE TABLE IF NOT EXISTS customer_registry_revision(workspace_id TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS local_customer_orgs(
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, name TEXT NOT NULL, normalized_name TEXT NOT NULL,
      billing_email TEXT NOT NULL, country TEXT NOT NULL, billing_paused INTEGER NOT NULL DEFAULT 1 CHECK(billing_paused=1),
      revision INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL,
      UNIQUE(workspace_id,normalized_name),UNIQUE(workspace_id,id)
    );
    CREATE TABLE IF NOT EXISTS local_customer_sources(
      workspace_id TEXT NOT NULL,source_type TEXT NOT NULL,customer_reference TEXT NOT NULL,organization_id TEXT NOT NULL,
      PRIMARY KEY(workspace_id,source_type,customer_reference),
      FOREIGN KEY(workspace_id,organization_id) REFERENCES local_customer_orgs(workspace_id,id)
    );
    CREATE TABLE IF NOT EXISTS local_customer_imports(
      id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,integration_id TEXT NOT NULL,
      data TEXT NOT NULL CHECK(json_valid(data)),created_at TEXT NOT NULL,UNIQUE(workspace_id,id),
      FOREIGN KEY(workspace_id,integration_id) REFERENCES integrations(workspace_id,id)
    );
    CREATE TABLE IF NOT EXISTS local_customer_source_lines(
      id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,source_type TEXT NOT NULL,batch_reference TEXT NOT NULL,
      line_reference TEXT NOT NULL,organization_id TEXT NOT NULL,payload_digest TEXT NOT NULL,import_id TEXT NOT NULL,
      UNIQUE(workspace_id,source_type,batch_reference,line_reference),
      FOREIGN KEY(workspace_id,organization_id) REFERENCES local_customer_orgs(workspace_id,id),
      FOREIGN KEY(workspace_id,import_id) REFERENCES local_customer_imports(workspace_id,id)
    );
    CREATE TABLE IF NOT EXISTS local_customer_import_plans(
      id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,actor_id TEXT NOT NULL,integration_id TEXT NOT NULL,
      digest TEXT NOT NULL,data TEXT NOT NULL CHECK(json_valid(data)),expires_at TEXT NOT NULL,status TEXT NOT NULL,import_id TEXT,
      FOREIGN KEY(workspace_id,integration_id) REFERENCES integrations(workspace_id,id)
    );
  `);
  const registryRevision=()=>db.prepare('SELECT revision FROM customer_registry_revision WHERE workspace_id=?').get(actor.workspaceId)?.revision||0;
  const sourceLine=row=>db.prepare('SELECT * FROM local_customer_source_lines WHERE workspace_id=? AND source_type=? AND batch_reference=? AND line_reference=?').get(actor.workspaceId,row.sourceType,row.batchReference,row.lineReference);
  const sourceOrg=row=>db.prepare('SELECT o.* FROM local_customer_sources s JOIN local_customer_orgs o ON o.id=s.organization_id AND o.workspace_id=s.workspace_id WHERE s.workspace_id=? AND s.source_type=? AND s.customer_reference=?').get(actor.workspaceId,row.sourceType,row.customerReference);
  function dossier(id,revision){
    permission('integrations.read');const record=integration(id);
    if(record.kind!=='customers-import')fail(422,'WRONG_IMPORT_KIND','Alleen een klantimportdossier kan lokale klantrecords importeren.');
    if(revision!==record.revision)fail(409,'REVISION_CONFLICT','Het importdossier is gewijzigd.',{current:record});
    if(record.values.wizardCompleted!=='true')fail(422,'IMPORT_DOSSIER_INCOMPLETE','Rond eerst alle velden van het klantimportdossier af.');
    integrationValues(record.values,record.kind);return record;
  }
  function operation(path,body,key,requestId,action){
    if(typeof key!=='string'||!/^[A-Za-z0-9_.:-]{8,128}$/.test(key))fail(422,'IDEMPOTENCY_REQUIRED','Gebruik een unieke Idempotency-Key van 8 tot 128 tekens.');
    rejectSecrets(body);const fingerprint=hash({method:'POST',path,body});
    return tx(()=>{
      const saved=db.prepare('SELECT * FROM idempotency WHERE workspace_id=? AND actor_id=? AND key=?').get(actor.workspaceId,actor.id,key);
      if(saved){if(saved.fingerprint!==fingerprint)fail(409,'IDEMPOTENCY_CONFLICT','Deze Idempotency-Key hoort bij andere gegevens.');return{status:saved.status,value:JSON.parse(saved.response)};}
      const result=action();db.prepare('INSERT INTO idempotency VALUES(?,?,?,?,?,?,?)').run(actor.workspaceId,actor.id,key,fingerprint,result.status,JSON.stringify(result.value),utc());return result;
    });
  }
  function preview(id,body,key,requestId){
    permission('customer.import.preview');permission('integrations.read');integration(id);
    return operation(`/api/integrations/${id}/customer-import/preview`,body,key,requestId,()=>{
      const record=dossier(id,body.revision),v=record.values;
      const input={sourceType:v.sourceType,batchReference:v.batchReference,lineReference:v.customerReference,customerReference:v.customerReference,organizationName:v.organizationName,billingEmail:v.billingEmail,country:v.country,productVersion:v.productVersion,paidThrough:v.paidThrough,nextInvoiceDate:v.nextInvoiceDate,requestedResourceReference:v.resourceReference};
      const payloadDigest=hash(input),oldLine=sourceLine(input),oldOrg=sourceOrg(input);
      const sameName=db.prepare('SELECT id FROM local_customer_orgs WHERE workspace_id=? AND normalized_name=?').get(actor.workspaceId,normalizedName(v.organizationName));
      let classification=oldOrg?'existing':'new',reason=oldOrg?'De stabiele bronreferentie verwijst al naar deze lokale organisatie.':'Nieuwe lokale organisatie op basis van de stabiele bronreferentie.';
      if(oldLine&&oldLine.payload_digest!==payloadDigest){classification='conflict';reason='Dezelfde bronbatch en regelreferentie bevatten afwijkende gegevens.';}
      else if(oldOrg&&(oldOrg.normalized_name!==normalizedName(v.organizationName)||oldOrg.billing_email!==v.billingEmail||oldOrg.country!==v.country)){classification='conflict';reason='De bestaande bronreferentie heeft afwijkende organisatiegegevens; eerst handmatig beoordelen.';}
      else if(!oldOrg&&sameName){classification='conflict';reason='Deze organisatienaam bestaat al onder een andere bronreferentie; geen automatische samenvoeging.';}
      const warnings=['Facturatie blijft gepauzeerd. Er wordt geen uitnodiging verstuurd.','Dienstreferentie is uitsluitend een voorstel en blijft ongekoppeld.'];
      if(v.nextInvoiceDate<utc().slice(0,10))warnings.push('De voorgestelde factuurdatum ligt in het verleden; handmatige contractcontrole vereist. Er wordt niets nagefactureerd.');
      if(v.nextInvoiceDate<=v.paidThrough){classification='conflict';reason='De volgende factuurdatum moet na de vastgelegde betaalde periode liggen.';}
      const row={...input,payloadDigest,classification,reason,warnings,billingPaused:true,serviceStatus:'unlinked',...(oldOrg?{organizationId:oldOrg.id}:{})};
      const plan={id:randomUUID(),integrationId:id,integrationRevision:record.revision,configurationDigest:hash(record.values),registryRevision:registryRevision(),expiresAt:new Date(Date.now()+15*60*1000).toISOString(),mode:'local_fixture',status:classification==='conflict'?'blocked':'ready',billingPaused:true,noExternalWrites:true,noInvitations:true,rows:[row],blockers:classification==='conflict'?[reason]:[],createdAt:utc()};
      plan.digest=hash(plan);
      db.prepare('INSERT INTO local_customer_import_plans VALUES(?,?,?,?,?,?,?,?,?)').run(plan.id,actor.workspaceId,actor.id,id,plan.digest,JSON.stringify(plan),plan.expiresAt,'pending',null);
      audit(actor,'customer.import.preview',plan.id,plan.status,requestId,{integrationId:id,revision:record.revision,planDigest:plan.digest});
      return{status:200,value:{plan}};
    });
  }
  function commit(id,body,key,requestId){
    permission('customer.import.commit');permission('integrations.read');integration(id);
    if(typeof body.planId!=='string'||body.planId.length>100)fail(422,'IMPORT_PLAN_REQUIRED','Een exact importplan is vereist.');
    return operation(`/api/integrations/${id}/customer-import/commit`,body,key,requestId,()=>{
      const record=dossier(id,body.revision);
      const stored=db.prepare('SELECT * FROM local_customer_import_plans WHERE id=? AND workspace_id=? AND actor_id=? AND integration_id=?').get(body.planId,actor.workspaceId,actor.id,id);
      if(!stored)fail(404,'NOT_FOUND','Importplan niet gevonden.');
      const plan=JSON.parse(stored.data);
      const {digest:planDigest,...unsignedPlan}=plan;
      if(planDigest!==stored.digest||hash(unsignedPlan)!==stored.digest)fail(409,'IMPORT_PLAN_CHANGED','De opgeslagen preview komt niet meer overeen met de exacte planinhoud.');
      if(typeof body.digest!=='string'||body.digest!==stored.digest||body.revision!==plan.integrationRevision)fail(409,'IMPORT_PLAN_CHANGED','Het importplan of de configuratierevisie wijkt af.');
      if(typeof plan.configurationDigest!=='string'||plan.configurationDigest!==hash(record.values))fail(409,'IMPORT_PLAN_CHANGED','De configuratie komt niet meer overeen met het exacte importplan. Maak een nieuwe preview.');
      if(stored.status==='committed')return{status:200,value:{import:JSON.parse(db.prepare('SELECT data FROM local_customer_imports WHERE id=? AND workspace_id=?').get(stored.import_id,actor.workspaceId).data),plan}};
      if(Date.parse(stored.expires_at)<=Date.now())fail(409,'IMPORT_PLAN_EXPIRED','Het importplan is verlopen. Maak een nieuwe preview.');
      if(plan.status!=='ready'||plan.registryRevision!==registryRevision())fail(409,'IMPORT_PLAN_BLOCKED','Het plan bevat conflicten of de lokale klantregistratie is gewijzigd. Maak een nieuwe preview.');
      const row=plan.rows[0],oldLine=sourceLine(row);
      if(oldLine){
        if(oldLine.payload_digest!==row.payloadDigest)fail(409,'IMPORT_LINE_CONFLICT','De bronregel is al met andere gegevens verwerkt.');
        const receipt=JSON.parse(db.prepare('SELECT data FROM local_customer_imports WHERE id=? AND workspace_id=?').get(oldLine.import_id,actor.workspaceId).data);
        db.prepare('UPDATE local_customer_import_plans SET status=?,import_id=? WHERE id=?').run('committed',receipt.id,plan.id);
        audit(actor,'customer.import.commit',receipt.id,'already_imported',requestId,{planId:plan.id});return{status:200,value:{import:receipt,plan}};
      }
      let org=sourceOrg(row);const timestamp=utc(),importId=randomUUID(),lineId=randomUUID();
      if(!org){const orgId=randomUUID();db.prepare('INSERT INTO local_customer_orgs VALUES(?,?,?,?,?,?,?,?,?)').run(orgId,actor.workspaceId,row.organizationName,normalizedName(row.organizationName),row.billingEmail,row.country,1,1,timestamp);db.prepare('INSERT INTO local_customer_sources VALUES(?,?,?,?)').run(actor.workspaceId,row.sourceType,row.customerReference,orgId);org={id:orgId};}
      const receipt={id:importId,integrationId:id,integrationRevision:plan.integrationRevision,configurationDigest:plan.configurationDigest,planId:plan.id,status:'imported_locally',mode:'local_fixture',billingPaused:true,noInvitations:true,noExternalWrites:true,organizationIds:[org.id],sourceLineIds:[lineId],createdAt:timestamp};
      db.prepare('INSERT INTO local_customer_imports VALUES(?,?,?,?,?)').run(importId,actor.workspaceId,id,JSON.stringify(receipt),timestamp);
      db.prepare('INSERT INTO local_customer_source_lines VALUES(?,?,?,?,?,?,?,?)').run(lineId,actor.workspaceId,row.sourceType,row.batchReference,row.lineReference,org.id,row.payloadDigest,importId);
      db.prepare('INSERT INTO customer_registry_revision VALUES(?,1) ON CONFLICT(workspace_id) DO UPDATE SET revision=revision+1').run(actor.workspaceId);
      db.prepare('UPDATE local_customer_import_plans SET status=?,import_id=? WHERE id=?').run('committed',importId,plan.id);
      const job={id:randomUUID(),integrationId:id,action:'customer.import',status:'completed_locally',mode:'local_fixture',createdAt:timestamp,importId,billingPaused:true,noExternalWrites:true,noInvitations:true,summary:'Lokale fixtureklant geregistreerd. Facturatie gepauzeerd; dienst ongekoppeld.'};
      db.prepare('INSERT INTO jobs VALUES(?,?,?,?,?,?,?)').run(job.id,actor.workspaceId,id,job.action,job.status,JSON.stringify(job),timestamp);
      audit(actor,'customer.import.commit',importId,'imported_locally',requestId,{planId:plan.id,organizationId:org.id,sourceLineId:lineId,registryRevision:registryRevision()});
      return{status:200,value:{import:receipt,plan,job}};
    });
  }
  function list(){
    permission('customer.read');
    const items=db.prepare('SELECT * FROM local_customer_orgs WHERE workspace_id=? ORDER BY created_at DESC,id LIMIT 500').all(actor.workspaceId).map(row=>{
      const sources=db.prepare('SELECT source_type AS sourceType,customer_reference AS customerReference FROM local_customer_sources WHERE workspace_id=? AND organization_id=?').all(actor.workspaceId,row.id);
      return{id:row.id,name:row.name,billingEmail:row.billing_email,country:row.country,billingPaused:true,status:'imported_locally',serviceStatus:'unlinked',revision:row.revision,createdAt:row.created_at,sources,sourceType:sources[0]?.sourceType,customerReference:sources[0]?.customerReference};
    });
    const imports=db.prepare('SELECT data FROM local_customer_imports WHERE workspace_id=? ORDER BY created_at DESC,id LIMIT 200').all(actor.workspaceId).map(row=>{const receipt=JSON.parse(row.data),current=integration(receipt.integrationId);return{...receipt,currentConfigurationMatch:receipt.integrationRevision===current.revision&&typeof receipt.configurationDigest==='string'&&receipt.configurationDigest===hash(current.values)};});
    return{items,imports,revision:registryRevision(),mode:'local_fixture'};
  }
  return{preview,commit,list};
}
