/* Keep the backoffice below /admin without changing the logical API contract or
   the original hash routes. The marketing site's /api routes remain separate. */
export function backofficeApiPath(path){
 if(typeof path!=='string'||!path.startsWith('/api/')||path.includes('://')||/[\\#\u0000-\u0020\u007f]/.test(path))throw new Error('Ongeldige API-route.');
 let segments;try{segments=path.split('?')[0].split('/').map(decodeURIComponent);}catch{throw new Error('Ongeldige API-route.');}
 if(segments.some(segment=>segment==='.'||segment==='..'||/[\\/\u0000-\u0020\u007f]/.test(segment)))throw new Error('Ongeldige API-route.');
 return '/admin'+path;
}
export function defaultBackofficeRole({fixtureParity=false,actorRole,requestedRole}={}){
 if(fixtureParity)return requestedRole==='admin'?'admin':'client';
 if(!isBackofficeStaffRole(actorRole))return 'client';
 return actorRole==='admin'&&requestedRole==='client'?'client':'admin';
}

// Presentation follows the authenticated actor; this never grants server rights.
export const isBackofficeStaffRole=role=>['admin','support','operations','finance'].includes(role);
export const hasBackofficePermission=(actor,permission)=>Array.isArray(actor?.permissions)&&actor.permissions.includes(permission);
export function backofficePageAllowed(page,actor){
 if(!isBackofficeStaffRole(actor?.role))return false;
 const can=permission=>hasBackofficePermission(actor,permission),supportStaff=['admin','support'].includes(actor.role);
 if(page==='overview')return true;
 if(page==='support')return can('support.ticket.read');
 if(page==='infrastructure')return can('state.read');
 if(page==='installations')return supportStaff&&can('integrations.read');
 if(page==='customers')return supportStaff&&can('customer.read');
 if(page==='automation')return can('jobs.read');
 if(page==='settings')return can('audit.read');
 if(['invoices','subscriptions','reports'].includes(page))return actor.role==='finance'||actor.role==='admin'&&can('state.read');
 return actor.role==='admin'&&can('state.read');
}
export function defaultBackofficePage({fixtureParity=false,actor={}}={}){
 if(fixtureParity||actor.role==='admin'||actor.role==='client')return 'overview';
 const preferred=actor.role==='support'?['support','installations','customers']:actor.role==='operations'?['infrastructure','support','automation','settings']:actor.role==='finance'?['invoices','support','settings']:[];
 return preferred.find(page=>backofficePageAllowed(page,actor))||'overview';
}
