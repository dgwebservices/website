import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('backoffice/provenance/preserved-files.json',root),'utf8'));
for(const file of manifest.files){
 if(!file.path.startsWith('public/admin/')||file.path.includes('..'))throw new Error('Ongeldig bronpad.');
 const digest=createHash('sha256').update(await readFile(new URL(file.path,root))).digest('hex');
 if(digest!==file.sha256)throw new Error('Gepinde v8-bron gewijzigd: '+file.path);
}
console.log(`${manifest.files.length} oorspronkelijke CSS/assets/fonts/wizardbestanden bytegelijk.`);
