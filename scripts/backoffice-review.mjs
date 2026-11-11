// Explicit local fixture process. It is never imported by a website route.
import {resolve,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';
import {createBackofficeServer} from '../backoffice/fixture/server/index.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const port=Number(process.env.DG_BACKOFFICE_PORT||4187);
const directory=process.env.DG_BACKOFFICE_DATA_DIR||resolve(root,'.backoffice-review');
if(!isAbsolute(directory)||!Number.isInteger(port)||port<1024||port>65535)throw new Error('Kies een absoluut eigen reviewdatapad en vrije loopbackpoort.');
await mkdir(directory,{recursive:true,mode:0o700});
const app=createBackofficeServer({mode:'fixture',host:'127.0.0.1',publicDir:resolve(root,'public/admin'),dbPath:resolve(directory,'review.sqlite')});
await app.listen(port);
console.log(`Afzonderlijke fixture-API op 127.0.0.1:${port}; geen productieauth of externe writes.`);
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await app.close();process.exit(0);});
