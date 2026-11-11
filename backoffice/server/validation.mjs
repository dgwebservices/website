import { deployWizard } from '../../public/admin/deploy-wizard.js';
import { hardeningWizard } from '../../public/admin/hardening-wizard.js';
import { installationDefinitions, validateInstallationField } from '../../public/admin/installations.js';
const randomUUID=()=>globalThis.crypto.randomUUID();

export class ApiError extends Error {
  constructor(status, code, message, details = {}) { super(message); Object.assign(this, { status, code, details }); }
}
export const fail = (status, code, message, details) => { throw new ApiError(status, code, message, details); };
const h = { escape: value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) };
export const wizardDefinitions = { deploy: deployWizard(h), hardening: hardeningWizard(h) };
const secretPattern = /-----BEGIN [A-Z ]*PRIVATE KEY-----|github_pat_[\w]{16,}|gh[pousr]_[\w]{16,}|sb_secret_[\w-]{8,}|sk-(?:proj-)?[\w-]{16,}|(?:https?|postgres(?:ql)?|ssh):\/\/[^\s/@:]+:[^\s/@]+@|\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|\b(?:password|passwd|api[_ -]?key|access[_ -]?token|secret[_ -]?key|service[_ -]?role)\s*[:=]\s*\S+/i;
const secretField = /(?:password|passwd|passphrase|access[_-]?token|refresh[_-]?token|api[_-]?key|private[_-]?key|secret[_-]?value|credentials?|service[_-]?role|authorization)$|^(?:token|secret)$/i;

export function rejectSecrets(value, depth = 0) {
  if (depth > 24) fail(422, 'INVALID_DATA', 'De gegevens zijn te diep genest.');
  if (typeof value === 'string' && secretPattern.test(value)) fail(422, 'SECRET_NOT_ALLOWED', 'Bewaar hier uitsluitend metadata en verwijzingen, geen geheime waarden.');
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) { for (const item of value) rejectSecrets(item, depth + 1); return; }
  for (const [key, item] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) fail(422, 'INVALID_FIELD', 'Dit veld is niet toegestaan.');
    if (secretField.test(key) && item !== '' && item !== null && item !== false) fail(422, 'SECRET_NOT_ALLOWED', 'Geheime velden zijn niet toegestaan.');
    rejectSecrets(item, depth + 1);
  }
}

const fields = (step, values) => typeof step.fields === 'function' ? step.fields(values) : step.fields || [];
const string = value => String(value ?? '').trim();

export function validateWizardRecord(record, previous) {
  if (!record || typeof record !== 'object' || !wizardDefinitions[record.kind] || typeof record.id !== 'string' || !record.id || record.id.length > 100) fail(422, 'INVALID_WIZARD', 'Ongeldig wizarddossier.');
  const def = wizardDefinitions[record.kind];
  if (!Number.isInteger(record.step) || record.step < 0 || record.step >= def.steps.length || !record.values || typeof record.values !== 'object' || Array.isArray(record.values)) fail(422, 'INVALID_WIZARD', 'Ongeldige wizardstap of velden.');
  rejectSecrets(record);
  const allowed = new Map(def.steps.flatMap(step => fields(step, record.values).map(field => [field.name, field])));
  // Conditional production fields may remain on a draft after the scope changes.
  for (const step of def.steps) for (const field of fields(step, { ...record.values, scope: 'production' })) allowed.set(field.name, field);
  for (const [key, value] of Object.entries(record.values)) {
    const field = allowed.get(key);
    if (!field) fail(422, 'UNKNOWN_WIZARD_FIELD', 'Een wizardveld wordt niet herkend.', { fieldErrors: { [key]: 'Onbekend veld' } });
    if (field.type === 'checkbox') { if (typeof value !== 'boolean') fail(422, 'INVALID_WIZARD_FIELD', 'Controlevelden moeten booleans zijn.'); }
    else {
      if (typeof value !== 'string' || value.length > Math.min(2000, Number(field.maxLength) || 300)) fail(422, 'INVALID_WIZARD_FIELD', 'Een wizardveld is te lang of ongeldig.', { fieldErrors: { [key]: 'Ongeldige waarde' } });
      if (value && field.pattern && !new RegExp(`^(?:${field.pattern})$`).test(value)) fail(422, 'INVALID_WIZARD_FIELD', 'Een wizardveld heeft een onjuist formaat.', { fieldErrors: { [key]: field.label } });
      if (value && field.options && !field.options.some(option => option.value === value)) fail(422, 'INVALID_WIZARD_FIELD', 'Kies een geldige veldoptie.', { fieldErrors: { [key]: field.label } });
    }
  }
  if (previous?.kind === record.kind) {
    let earliest = Infinity;
    const identityFields = new Set(['hostName','providerId','sourceSha','acceptedSha']);
    let identityChanged = false;
    for (let index = 0; index < def.steps.length; index++) for (const field of fields(def.steps[index], record.values)) {
      if (field.type !== 'checkbox' && previous.values?.[field.name] !== record.values[field.name]) { earliest = Math.min(earliest, index); if(identityFields.has(field.name))identityChanged=true; }
    }
    if (Number.isFinite(earliest)) for (let index = earliest; index < def.steps.length; index++) for (const field of fields(def.steps[index], record.values)) {
      if (field.type === 'checkbox' && field.name !== 'registerInDg' && (index>earliest||identityChanged)) record.values[field.name] = false;
    }
  }
  // Every custom cross-field guard runs on drafts too: an unchecked claim is fine,
  // but a checked safety claim without its prerequisites is never persisted.
  for (let index = 0; index < def.steps.length; index++) {
    const step = def.steps[index];
    const message = step.validate?.(record.values);
    // Intake validation expects required data; incomplete drafts may be saved.
    const emptyIntake = index === 0 && !record.done && record.step === 0;
    if (message && !emptyIntake) fail(422, 'WIZARD_GUARD', message, { fieldErrors: { [step.id]: message } });
    if (record.done || index < record.step) for (const field of fields(step, record.values)) {
      if (field.required && !string(record.values[field.name])) fail(422, 'WIZARD_REQUIRED', 'Vul de vereiste wizardvelden in.', { fieldErrors: { [field.name]: field.label } });
    }
  }
  return record;
}

export function validateWizardState(value, oldValue) {
  if (!Array.isArray(value) || value.length > 40) fail(422, 'INVALID_WIZARDS', 'Bewaar maximaal 40 wizarddossiers.');
  const ids = new Set();
  return value.map(record => {
    if (ids.has(record?.id)) fail(422, 'DUPLICATE_WIZARD', 'Een dossier-ID mag maar één keer voorkomen.');
    ids.add(record?.id);
    return validateWizardRecord(structuredClone(record), Array.isArray(oldValue) ? oldValue.find(old => old.id === record.id) : undefined);
  });
}

export function validateInfrastructureState(value, oldValue, wizardState, actor) {
  if(!value || typeof value!=='object' || Array.isArray(value) || !value.inventory || typeof value.inventory!=='object' || Array.isArray(value.inventory)) fail(422,'INVALID_INVENTORY','Een inventaris bevat een metadata-object.');
  const result=structuredClone(value), names=new Set(), providers=new Set(), prior=Object.values(oldValue?.inventory||{});
  if(Object.keys(result.inventory).length>1000)fail(422,'INVALID_INVENTORY','De fixture-inventaris is te groot.');
  for(const [slot,item]of Object.entries(result.inventory)){
    if(!/^\d{1,4}$/.test(slot)||!item||typeof item!=='object'||Array.isArray(item))fail(422,'INVALID_INVENTORY','Een inventarisplaats is ongeldig.');
    const name=String(item.name||'').trim().toLowerCase().replace(/\.$/,'');const provider=String(item.providerId||'').trim();
    if(!name){if(item.hardening)fail(422,'INVALID_INVENTORY','Een hardeningdossier vereist een hostnaam.');continue;}
    if(name.length>100||provider.length>200||names.has(name)||provider&&providers.has(provider))fail(422,'HOST_IDENTITY_CONFLICT','Een hostnaam of provider-ID is dubbel of onjuist.');
    names.add(name);if(provider)providers.add(provider);
    const matches=prior.filter(old=>String(old.name||'').trim().toLowerCase().replace(/\.$/,'')===name||provider&&old.providerId===provider);
    if(matches.length>1||matches.length===1&&(String(matches[0].name||'').trim().toLowerCase().replace(/\.$/,'')!==name||matches[0].providerId&&matches[0].providerId!==provider||Boolean(matches[0].example)!==Boolean(item.example)))fail(422,'HOST_IDENTITY_CONFLICT','De hostidentiteit of voorbeeldstatus wijkt af van de bestaande inventaris.');
    item.hostId=matches[0]?.hostId||randomUUID();
    if(item.hardening){
      const dossier=Array.isArray(wizardState)&&wizardState.find(record=>record.kind==='hardening'&&record.done===true&&record.values?.registerInDg===true&&String(record.values.hostName||'').trim().toLowerCase().replace(/\.$/,'')===name&&record.values.providerId===provider&&Boolean(record.example)===Boolean(item.example));
      if(!dossier)fail(422,'HARDENING_DOSSIER_REQUIRED','Hardeningregistratie vereist een passend bewaard dossier met inventarisopt-in.');
      const metadata=wizardDefinitions.hardening.result(dossier.values).metadata;
      item.hardening={baseline:metadata.baselineVersion,status:metadata.reportedStatus,monitoring:'pending',region:metadata.region,recordedAt:item.hardening.recordedAt||new Date().toISOString(),evidence:{source:'reported_by_actor',actorId:actor.id,dossierId:dossier.id,externallyVerified:false}};
    }
  }
  return result;
}

export const integrationKinds = ['20i','resource-link','product-mapping','vps','project','vaultref','projectinbox','customers-import','mollie','system-mail','webmail','staff','domain','mailbox','mail-migration','smtp','imap','supabase','github','monitoring','vault','dns'];
export function integrationValues(values, kind) {
  if (!values || typeof values !== 'object' || Array.isArray(values) || Object.keys(values).length > 80) fail(422, 'INVALID_VALUES', 'Gebruik een metadata-object voor de installatie.');
  rejectSecrets(values);
  for (const [key, value] of Object.entries(values)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,79}$/.test(key) || !['string','boolean','number'].includes(typeof value) || (typeof value === 'string' && value.length > 2000) || (typeof value === 'number' && !Number.isFinite(value))) fail(422, 'INVALID_VALUES', 'Een metadata-veld is ongeldig.');
    if (/secretRef|secretPath|credentialRef|credentialPath/i.test(key) && value) fail(422, 'RUNTIME_BINDING_REQUIRED', 'De server bepaalt de geheimbinding uit de runtimeconfiguratie.');
  }
  const result=structuredClone(values),definition=installationDefinitions[kind];
  const requestedStep=Object.hasOwn(values,'wizardStep')?values.wizardStep:0;
  if(!/^(?:0|[1-9][0-9]*)$/.test(String(requestedStep)))fail(422,'INVALID_WIZARD_PROGRESS','De installatiestap is ongeldig.');
  const step=Number(requestedStep);
  const requestedCompleted=values.wizardCompleted??false;
  if(![true,false,'true','false'].includes(requestedCompleted))fail(422,'INVALID_WIZARD_PROGRESS','De voltooiingsstatus is ongeldig.');
  const completed=requestedCompleted===true||requestedCompleted==='true';
  if(!definition){
    if(completed||step!==0)fail(422,'INSTALLATION_SCHEMA_UNAVAILABLE','Voor dit concept is nog geen gecontroleerde installatiewizard beschikbaar.');
  }else{
    if(!Number.isSafeInteger(step)||step>=definition.steps.length||completed&&step!==definition.steps.length-1)fail(422,'INVALID_WIZARD_PROGRESS','Een voltooid dossier vereist de laatste geldige wizardstap.');
    const allowed=new Set([...definition.steps.flatMap(item=>item.fields.map(field=>field.name)),'environment','mode','wizardStep','wizardCompleted']);
    for(const key of Object.keys(values))if(!allowed.has(key))fail(422,'UNKNOWN_INSTALLATION_FIELD','Een installatieveld wordt niet herkend.',{fieldErrors:{[key]:'Onbekend veld'}});
    for(let index=0;index<definition.steps.length;index++)for(const field of definition.steps[index].fields){
      const value=result[field.name];
      if(value!==undefined&&typeof value!=='string')fail(422,'INVALID_INSTALLATION_FIELD','Een installatieveld moet tekst bevatten.',{fieldErrors:{[field.name]:field.label}});
      // Current and future empty fields remain valid drafts. A caller cannot
      // advance over required fields or store malformed nonempty values.
      const required=completed||index<step;
      const message=validateInstallationField({...field,required:required&&field.required},value);
      if(message)fail(422,'INVALID_INSTALLATION_FIELD',message,{fieldErrors:{[field.name]:message}});
      if(value!==undefined)result[field.name]=value.trim();
      if(result[field.name]&&field.type==='date'){
        const normalized=result[field.name],parsed=new Date(`${normalized}T00:00:00.000Z`);
        if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==normalized)fail(422,'INVALID_INSTALLATION_FIELD','Kies een bestaande kalenderdatum.',{fieldErrors:{[field.name]:'Ongeldige kalenderdatum'}});
      }
    }
  }
  result.environment='fixture';result.mode='dry_run';result.wizardStep=String(step);result.wizardCompleted=String(completed);
  return result;
}

export function reconcileProviderOutcome({ dispatched, outcome, retrySafe = false }) {
  if (dispatched && ['unknown', 'timeout', 'connection_lost'].includes(outcome)) return { status: 'reconcile_required', retryAllowed: false, nextAction: 'Geautoriseerde alleen-lezen controle van de externe uitkomst.' };
  if (outcome === 'verified') return { status: 'verified', retryAllowed: false };
  return { status: 'failed', retryAllowed: !dispatched && retrySafe };
}
