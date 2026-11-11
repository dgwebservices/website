import test from 'node:test';
import assert from 'node:assert/strict';
import { describeFixtureIntegration, fixtureInstallationKinds } from '../server/integration-status.mjs';
import { installationDefinitions, installationTestEvidence } from '../../../public/admin/installations.js';

test('all fifteen fixture kinds have concrete metadata outcomes, requirements and a next action',()=>{
 assert.deepEqual([...fixtureInstallationKinds].sort(),Object.keys(installationDefinitions).sort());
 for(const kind of fixtureInstallationKinds){
  const result=describeFixtureIntegration({kind,status:'draft',values:{}});
  assert.ok(result.savedOutcome.length>60,kind);assert.ok(result.nextAction.length>60,kind);assert.ok(result.missingRequirements.length>=3,kind);
  assert.equal(result.providerWrites,false);assert.equal(result.verificationLevel,'not_checked');assert.equal(result.status,undefined);assert.equal(result.lastSuccessfulTestAt,undefined);
  assert.match(result.missingRequirements.at(-1),/geen externe providerwrites/);
 }
});

test('metadata-only workflows do not require a generic connector secret or claim applied effects',()=>{
 for(const kind of ['vps','project','vaultref','staff','webmail','customers-import']){
  const result=describeFixtureIntegration({kind});assert.ok(!result.missingRequirements.some(text=>/server-only geheimbinding/.test(text)),kind);assert.match(result.savedOutcome,/dossier|referentiedossier/i);
 }
 assert.match(describeFixtureIntegration({kind:'vps'}).savedOutcome,/geen VPS besteld, apart inventarisrecord aangemaakt/);
 assert.match(describeFixtureIntegration({kind:'staff'}).savedOutcome,/geen uitnodiging verstuurd/);
 assert.match(describeFixtureIntegration({kind:'webmail'}).savedOutcome,/geen DNS, providerbranding, SSO of mailboxlogin gewijzigd of getest/);
 const external=describeFixtureIntegration({kind:'resource-link',values:{operation:'external-record'}});assert.match(external.nextAction,/geen 20i-bestelling/);assert.ok(!external.missingRequirements.some(text=>/kostensnapshot/.test(text)));
});

test('fixture evidence remains unverified and descriptions cannot be mutated between calls',()=>{
 const first=describeFixtureIntegration({kind:'20i',lastTest:{simulated:true}});assert.equal(first.verificationLevel,'simulated');assert.equal(first.providerWrites,false);first.missingRequirements.splice(0);
 assert.ok(describeFixtureIntegration({kind:'20i'}).missingRequirements.length>0);
 const unknown=describeFixtureIntegration({kind:'unimplemented',status:'active',lastTest:{simulated:false}});assert.equal(unknown.verificationLevel,'not_checked');assert.equal(unknown.providerWrites,false);assert.equal(unknown.status,undefined);
});

test('a historical test is never presented as proof for the changed configuration',()=>{
 const historical={revision:2,testedRevision:2,createdAt:'2026-11-11T10:00:00Z',simulated:true,summary:'Fixturecontrole'},record={revision:3,lastTest:null,lastTestAt:historical.createdAt,testHistory:[historical]};
 const evidence=installationTestEvidence(record);assert.equal(evidence.state,'historical');assert.equal(evidence.current,false);assert.equal(evidence.testedRevision,2);assert.match(evidence.title,/ongeldig voor huidige configuratie/);assert.equal(evidence.at,historical.createdAt);
 const current=installationTestEvidence({...record,lastTest:historical});assert.equal(current.state,'current');assert.equal(current.testedRevision,2);assert.match(current.title,/huidige configuratie/);
 assert.equal(installationTestEvidence({revision:1}).state,'none');assert.equal(installationTestEvidence({lastTestAt:historical.createdAt}).testedRevision,null);
});
