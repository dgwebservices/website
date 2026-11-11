/* A missing production bucket is empty data. The v8 examples are available only
   in the separate fixture runtime; they are never a production initialization. */
export const isRealDataRuntime=(runtime=globalThis.DG_RUNTIME)=>runtime?.mode==='supabase'&&runtime?.fixtureParity!==true;
export const realDataMode=isRealDataRuntime();
const empty={
 services:()=>({version:1,domains:{},hosts:{},mail:[],intake:[]}),
 management:()=>({customers:{},products:{},templates:{},jobs:{},settings:{},notes:{},orders:[],audit:[]}),
 account:()=>({org:{name:'',contact:'',email:'',address:'',postcode:'',city:'',phone:''},members:[],invites:[],preferences:{services:false,invoices:false,support:false,news:false},security:{recoveryEmail:'',recoveryRequested:'',otherSessions:false},payment:{requestMandate:false},cancellations:{}}),
 commerce:()=>({paid:{},orders:[],drafts:[],next:1}),
 infrastructure:()=>({inventory:{},notes:{},acks:[],maintenance:{},audit:[],scenario:'normal'}),
 vaults:()=>({version:1,items:[],activity:[]}),
 maildesk:()=>({version:1,brands:{},threads:[]}),
 'infra-wizards':()=>[]
};
export const realBusinessKeys=Object.freeze(Object.keys(empty).map(key=>`dg-midnight-${key}-v1`));
export function emptyRealBusinessState(key){const name=key.replace(/^dg-midnight-/,'').replace(/-v1$/,'');if(!Object.hasOwn(empty,name))throw new Error('Onbekende gegevensbron.');return empty[name]();}
const pages={
 overview:['Cockpit','Er zijn nog geen geverifieerde bedrijfsmetingen voor dit overzicht. Open Support of bereid een gecontroleerde installatie voor.'],
 customers:['Klanten','Het actuele klantregister staat hieronder. Importeer klanten via een beoordeeld importplan; voorbeeldklanten worden niet aan de administratie toegevoegd.'],
 orders:['Bestellingen','Er is nog geen gekoppelde orderadministratie voor deze weergave. Een providerbestelling vereist een eigen plan, kostencontrole en vrijgave.'],
 domains:['Domeinen','Er zijn nog geen geverifieerde domeinen aan deze weergave gekoppeld. Begin met de domeinwizard; registrar en DNS blijven afzonderlijke controles.'],
 hosting:['Hosting','Er zijn nog geen geverifieerde hostingdiensten aan deze weergave gekoppeld. Beoordeel een bestaande resourcebinding of maak een hostingdossier.'],
 email:['E-mail','Er zijn nog geen geverifieerde mailboxen aan deze weergave gekoppeld. De mailboxwizard bewaart een dossier en haalt geen mailinhoud op.'],
 webmail:['Webmail','Er is nog geen bevestigde webmailroute voor deze organisatie. Laat eerst providerhost, DNS/TLS en testmailbox controleren.'],
 products:['Producten & prijzen','Er is nog geen gepubliceerde productcatalogus voor deze weergave. Gebruik productmapping om een versie, prijs en providerreferentie voor te bereiden.'],
 subscriptions:['Abonnementen','Er is nog geen gekoppelde contractadministratie voor deze weergave. Een klantimport activeert geen facturatie of incasso.'],
 invoices:['Facturen & betalingen','Er zijn nog geen uitgegeven facturen of geverifieerde betalingen voor deze weergave. Een betaalverbinding of browseractie is geen betaalbewijs.'],
 maildesk:['Projectinbox','Er zijn nog geen bevoegde projectmailboxen aangesloten. Gebruik Inbox toevoegen; demo-gesprekken en voorbeeldmerken worden niet geïmporteerd.'],
 communication:['Communicatie','Er is nog geen vrijgegeven verzendprofiel of template gekoppeld. Bereid een afzender voor en beoordeel een afzonderlijke rooktest.'],
 automation:['Automatisering','Er zijn nog geen aangesloten externe workers voor deze weergave. Installatietaken en hun controlebewijs staan in het installatiecentrum.'],
 reports:['Rapportages','Er is nog geen gekoppelde financiële rapportagebron. Voorbeeldomzet en fictieve betaalstatussen worden niet getoond.'],
 settings:['Instellingen & audit','Beheer verbindingen en voorbereidingen via Integraties & installatie. Teamtoegang en geheime runtimebindingen vereisen afzonderlijke bevoegdheden.'],
 account:['Organisatie & account','Organisatieprofiel, teamrollen en MFA-status worden niet uit voorbeeldgegevens afgeleid. Gebruik je geverifieerde account en vraag de scope-eigenaar om ontbrekende rechten.'],
 new:['Nieuwe dienst','Een nieuwe dienst begint met een geverifieerd aanbod en een beoordeeld wijzigingsplan. Er is geen demo-checkout beschikbaar in de echte administratie.'],
 vaults:['Kluizen','Er is nog geen beveiligde secretstore gekoppeld. Alleen niet-geheime referentiedossiers kunnen worden voorbereid; onthullen, roteren en grants blijven geblokkeerd.']
};
export function renderRealEmptyPage(role,page,h){const target=role==='admin'&&h.canGo?.('installations')!==false?'installations':h.canGo?.('support')!==false?'support':null;const [title,description]=pages[page]||['Gegevens nog niet gekoppeld','Deze gegevensbron is nog niet aangesloten.'];return `<section class="adm-root" data-real-empty="${h.escape(page)}"><header class="adm-page-head"><div><span class="eyebrow">${role==='admin'?'DG-BEHEER':'JOUW OMGEVING'} · SERVERGEGEVENS</span><h1>${h.escape(title)}.</h1><p>${h.escape(description)}</p></div></header><section class="panel"><span class="pill blue">Niet gekoppeld</span><h2>Geen voorbeeldgegevens in de administratie</h2><p>Alleen bevoegde servergegevens worden gebruikt. Externe uitvoering en providerwrites blijven uit tot de vereiste controles en vrijgave.</p>${target?`<div class="modal-actions"><button class="btn primary" type="button" data-go="${target}">${target==='installations'?'Integraties & installatie':'Open Support'}</button></div>`:'<p>Vraag de werkruimtebeheerder om de ontbrekende bron of bevoegdheid te beoordelen.</p>'}</section></section>`;}
const modulePages={services:['domains','hosting','email','webmail'],management:['customers','orders','products','communication'],account:['account','subscriptions'],commerce:['invoices'],maildesk:['maildesk'],vaults:[]};
export function createEmptyLegacyModule(ctx,key){return{render(role,page){if(modulePages[key]?.includes(page))return renderRealEmptyPage(role,page,ctx.h);},overview(){return renderRealEmptyPage('admin','vaults',ctx.h);},summary(){return '';},action(name){if(key==='vaults'&&name.startsWith('vault-')){ctx.toast('Secretstore nog niet gekoppeld. Bereid een kluisreferentiedossier voor.');return true;}return false;},submit(){return false;},decorate(){},input(){return false;},change(){return false;},openTotal(){return 0;},openCount(){return 0;},invoiceStatus(){return 'Onbekend';}};}
