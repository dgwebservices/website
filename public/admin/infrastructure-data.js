// Explicitly fictional scenarios. Never an inventory of Danny's real VPS hosts.
export const sampleTime = '4 nov 2026 · 09:42 CET';
export const demoHosts = [
 {id:'web01',name:'demo-web-01',role:'Web',env:'Productie',location:'Falkenstein',cpu:34,ram:62,disk:93,inodes:48,size:160,freeRam:'3,0 GB',network:'18,2 Mb/s',io:'4,8 MB/s',updates:3,reboot:false,projects:['portal','club'],runner:'Online · idle',release:'good',backup:'good',stale:false},
 {id:'app01',name:'demo-app-01',role:'Applicatie',env:'Productie',location:'Helsinki',cpu:23,ram:44,disk:54,inodes:22,size:160,freeRam:'4,5 GB',network:'8,4 Mb/s',io:'1,2 MB/s',updates:0,reboot:false,projects:['planning'],runner:'Online · idle',release:'good',backup:'good',stale:false},
 {id:'stage01',name:'demo-staging-01',role:'Staging',env:'Staging',location:'Falkenstein',cpu:12,ram:38,disk:67,inodes:32,size:80,freeRam:'2,5 GB',network:'2,1 Mb/s',io:'0,4 MB/s',updates:2,reboot:false,projects:['portal','club','planning'],runner:'Offline',release:'bad',backup:'good',stale:false},
 {id:'data01',name:'demo-data-01',role:'Data',env:'Productie',location:'Helsinki',cpu:41,ram:71,disk:72,inodes:18,size:240,freeRam:'4,6 GB',network:'12,1 Mb/s',io:'9,4 MB/s',updates:1,reboot:false,projects:['planning'],runner:'Geen runner',release:'good',backup:'warn',stale:false},
 {id:'build01',name:'demo-build-01',role:'Build',env:'Development',location:'Nuremberg',cpu:68,ram:58,disk:61,inodes:29,size:160,freeRam:'6,7 GB',network:'42,3 Mb/s',io:'18,1 MB/s',updates:4,reboot:true,projects:['portal','club','planning'],runner:'Online · busy',release:'good',backup:'good',stale:false},
 {id:'edge01',name:'demo-edge-01',role:'Web',env:'Productie',location:'Falkenstein',cpu:18,ram:31,disk:42,inodes:14,size:80,freeRam:'2,8 GB',network:'3,2 Mb/s',io:'0,3 MB/s',updates:0,reboot:false,projects:['club'],runner:'Online · idle',release:'unknown',backup:'unknown',stale:true},
 {id:'mon01',name:'demo-monitor-01',role:'Monitoring',env:'Beheer',location:'Helsinki',cpu:9,ram:36,disk:29,inodes:9,size:80,freeRam:'2,6 GB',network:'1,6 Mb/s',io:'0,8 MB/s',updates:0,reboot:false,projects:[],runner:'Geen runner',release:'good',backup:'good',stale:false}
];
const sha = {a:'a94c27e83d014db5ab892f6f73b45c0c4e6d0128',b:'7e19b5c2a84db035c8d21f409a17f0513e42c6ad',c:'c23a0946f718d30a7158b094c667a36d1e8f92b0',d:'b816d4a2748a1f3e56a905bdc1f2478d92e3140a'};
export const demoProjects = [
 {id:'portal',name:'Klantportaal',label:'Voorbeeldproject',repo:'demo/klantportaal',backend:'Afzonderlijke database',owner:'DG Webservices',production:'web01',staging:'stage01',expected:sha.a,accepted:sha.a,active:sha.a,previous:sha.b,run:'1048',status:'good'},
 {id:'club',name:'Clubwebsite',label:'Voorbeeldproject',repo:'demo/clubwebsite',backend:'Content & formulieren',owner:'DG Webservices',production:'edge01',staging:'stage01',expected:sha.c,accepted:sha.c,active:sha.b,previous:sha.d,run:'1047',status:'unknown'},
 {id:'planning',name:'Planning',label:'Voorbeeldproject',repo:'demo/planning',backend:'Database · Auth · worker',owner:'DG Webservices',production:'app01',staging:'stage01',expected:sha.d,accepted:sha.a,active:sha.a,previous:sha.b,run:'1046',status:'good'}
];
export const demoReleases = [
 {id:'1048',project:'portal',env:'Productie',host:'web01',status:'good',label:'Uitrol bevestigd',time:'Vandaag · 09:32',duration:'1m 48s',sha:sha.a,previous:sha.b,steps:['Geaccepteerde SHA gecontroleerd','Release geplaatst door deploywrapper','Readiness bevestigd','Actieve SHA komt overeen']},
 {id:'1049',project:'planning',env:'Staging',host:'stage01',status:'bad',label:'Deploy mislukt',time:'Vandaag · 09:28',duration:'3m 12s',sha:sha.d,previous:sha.a,steps:['Build en checks geslaagd','Releaseoverdracht gestart','Readiness-timeout','Vorige release blijft actief']},
 {id:'1047',project:'club',env:'Productie',host:'edge01',status:'warn',label:'Runtime niet bevestigd',time:'Vandaag · 09:06',duration:'1m 35s',sha:sha.c,previous:sha.b,steps:['SHA geaccepteerd','Workflow geslaagd','Runtimecollector verouderd','Actieve SHA nog niet geverifieerd']},
 {id:'1046',project:'planning',env:'Productie',host:'app01',status:'good',label:'Uitrol bevestigd',time:'Gisteren · 16:41',duration:'2m 06s',sha:sha.a,previous:sha.b,steps:['Geaccepteerde SHA gecontroleerd','Migratie compatibel','Readiness bevestigd','Actieve SHA komt overeen']}
];
export const integrations = [
 {id:'hetzner',name:'Hetzner',icon:'server',purpose:'Providerinventaris en providerstatus',scope:'Read-token per Hetzner-project',boundary:'Geen RAM- of vrije-schijfruimtemeting vanuit de guest.',url:'https://console.hetzner.cloud/'},
 {id:'prometheus',name:'Prometheus',icon:'chart',purpose:'Hostmetingen en tijdreeksen',scope:'Server-side vaste querytemplates',boundary:'Privé meetpad via Tailscale; geen vrije PromQL of probe-URL.',url:''},
 {id:'github',name:'GitHub',icon:'layers',purpose:'Runs, releases en runnerinventaris',scope:'GitHub App met geselecteerde repositories',boundary:'Leesrechten in V1. Workflow-dispatch later via een aparte beperkte integratie.',url:'https://github.com/'},
 {id:'alertmanager',name:'Alertmanager',icon:'bell',purpose:'Groepering, onderhoud en herstelmeldingen',scope:'Afgeschermde alertintegratie',boundary:'Monitoruitval moet via een onafhankelijke externe check zichtbaar blijven.',url:''},
 {id:'vault',name:'VPS- & projectkluizen',icon:'lock',purpose:'Afzonderlijke credentialverzameling per VPS en project',scope:'Kluisrechten per eigenaar en omgeving',boundary:'Het prototype gebruikt uitsluitend gegenereerde voorbeeldgeheimen. Beveiligde opslag en echte toegangscontrole worden later aangesloten.',url:''},
 {id:'supabase',name:'Supabase',icon:'shield',purpose:'Inventaris, rechten en audit in de productieblauwdruk',scope:'Eigen project en expliciete beheerders',boundary:'MFA en server-side rechten worden bij implementatie afgedwongen.',url:'https://supabase.com/dashboard'},
 {id:'resend',name:'Resend',icon:'mail',purpose:'Verwijzing naar verzend- en domeinbeheer',scope:'Projectreferentie',boundary:'Geen echte e-mails of verzendcredentials in de demo.',url:'https://resend.com/'}
];
