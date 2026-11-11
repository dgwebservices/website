import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleDomain} from '../backoffice/server/domain.mjs';
import {wizardDefinitions} from '../backoffice/server/validation.mjs';
import {installationDefinitions} from '../public/admin/installations.js';
const accessToken='fixture.payload.signature';
const config={url:'https://example.supabase.co',publishableKey:'sb_publishable_nonsecret',mode:'production'};
const ok=(value,status=200)=>new Response(JSON.stringify({status,value}),{headers:{'Content-Type':'application/json'}});
const request=(args,fetchImpl)=>handleDomain({path:'/api/integrations',method:'GET',accessToken,config:{...config,fetchImpl},...args});
test('domain transport forwards user token plus publishable key, never browser actor claims',async()=>{
 let sent;const response=await request({actor:{role:'admin',workspaceId:'forged'}},async(url,options)=>{sent={url,options};return ok({items:[]});});
 assert.equal(response.status,200);assert.equal(sent.url,config.url+'/rest/v1/rpc/dg_bo_domain');assert.equal(sent.options.headers.Authorization,'Bearer '+accessToken);assert.equal(sent.options.headers.apikey,config.publishableKey);assert.equal(sent.options.redirect,'error');const body=JSON.parse(sent.options.body);assert.equal(body.p_path,'/api/integrations');assert.equal(body.actor,undefined);assert.equal(body.p_body.actor,undefined);
});
test('invalid config, untrusted path, methods and secrets fail before network',async()=>{
 let calls=0;const transport=async()=>{calls++;throw Error();};
 for(const args of[{config:{...config,url:'http://localhost'}},{config:{...config,publishableKey:'sb_secret_hidden'}},{accessToken:'bad'},{path:'https://attacker.invalid/api/integrations'},{path:'/api/state?organizationId=foreign'},{method:'DELETE'},{method:'POST',body:{kind:'20i',name:'Secret',values:{apiKey:'hidden'}}}]){const result=await request({...args,config:{...config,fetchImpl:transport,...args.config}},transport);assert.ok(result.status>=400);}
 assert.equal(calls,0);
});
test('installation format/completion validation precedes server RPC and environment metadata is authoritative',async()=>{
 let calls=0,payload;const transport=async(_url,options)=>{calls++;payload=JSON.parse(options.body);return ok({integration:{kind:'20i',id:'id',values:payload.p_body.values}},201);};
 const invalid=await request({method:'POST',body:{kind:'20i',name:'Invalid',values:{wizardStep:'5',wizardCompleted:'true'}},idempotencyKey:'create-dossier'},transport);assert.equal(invalid.status,422);assert.equal(calls,0);
 const valid=await request({method:'POST',body:{kind:'20i',name:'Draft',values:{environment:'fixture',mode:'live'}},idempotencyKey:'create-dossier'},transport);assert.equal(valid.status,201);assert.equal(payload.p_body.values.environment,'production');assert.equal(payload.p_idempotency_key,'create-dossier');assert.equal(valid.value.integration.providerWrites,false);
});
test('wizard batch checks previous scoped state and rejects stale/forged guards without mutation RPC',async()=>{
 const calls=[];const transport=async(_url,options)=>{const body=JSON.parse(options.body);calls.push(body);return ok({value:[],revision:1});};
 const result=await request({path:'/api/state',method:'PUT',body:{changes:[{key:'dg-midnight-infra-wizards-v1',revision:1,value:[{id:'forged',kind:'hardening',step:0,values:{publicSshClosed:true}}]}]}},transport);assert.equal(result.status,422);assert.equal(calls.length,1);assert.equal(calls[0].p_method,'GET');
 const duplicate=await request({path:'/api/state',method:'PUT',body:{changes:[{key:'dg-midnight-infra-wizards-v1',revision:1,value:[]},{key:'dg-midnight-infra-wizards-v1',revision:1,value:[]}]}},transport);assert.equal(duplicate.status,422);
});
test('transport failures redact provider/database details and preserve uncertain write status',async()=>{
 for(const transport of[async()=>{throw Error('secret database internal');},async()=>new Response('secret error',{status:500}),async()=>new Response('malformed secret'),async()=>ok({})]){
 const result=await request({},transport);if(result.status===200)continue;assert.equal(result.status,503);assert.equal(JSON.stringify(result).includes('secret'),false);
 }
 const missing=await request({},async()=>new Response('{}',{status:404}));assert.equal(missing.status,503);assert.equal(missing.value.code,'BACKEND_SCHEMA_REQUIRED');
 const conflict=await request({},async()=>ok({code:'REVISION_CONFLICT',current:{kind:'20i',id:'safe',values:{}}},409));assert.equal(conflict.status,409);assert.equal(conflict.value.current.providerWrites,false);
});
test('SQL authoritative field schemas match all 15 installation and original 8+8 definitions',()=>{
 const migration=readFileSync(new URL('../supabase/migrations/20261111155319_dg_bo_foundation.sql',import.meta.url),'utf8');
 const schemas=JSON.parse(migration.match(/select \$json\$([\s\S]+?)\$json\$::jsonb/)[1]);
 const simplify=f=>({name:f.name,type:f.type,required:f.required===true,maxLength:f.maxLength||1000,min:f.min,max:f.max,pattern:f.pattern,options:f.options?.map(v=>v[0])});
 for(const[k,definition]of Object.entries(installationDefinitions))assert.deepEqual(schemas[k],JSON.parse(JSON.stringify({steps:definition.steps.map(s=>({fields:s.fields.map(simplify)}))})));
 for(const[k,definition]of Object.entries(wizardDefinitions)){assert.equal(definition.steps.length,8);for(const[index,step]of definition.steps.entries()){const fields=typeof step.fields==='function'?step.fields({scope:'production'}):step.fields||[];assert.deepEqual(schemas['wizard:'+k].steps[index].fields.map(f=>f.name),fields.map(f=>f.name));}}
});
