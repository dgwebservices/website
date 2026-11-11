// Native Next binds to loopback and builds Request.url from that bind address;
// NextURL also rewrites 127.0.0.1 to localhost. Reconstruct only the explicitly
// configured origin after exact Host/protocol checks. Caddy owns forwarded
// protocol and the application listener remains bound to loopback.
const loopback=new Set(['127.0.0.1','localhost','[::1]']);
export function normalizeTrustedProxyRequest(request,config){
 const original=new URL(request.url),target=new URL(config.appOrigin);
 if(!loopback.has(original.hostname))return request;
 const host=request.headers.get('host');
 if(host!==target.host||/[\u0000-\u0020\u007f,]/.test(host||''))return request;
 if(config.mode==='fixture'){
  if(target.protocol!=='http:'||original.protocol!=='http:'||!loopback.has(target.hostname)||original.port!==target.port)return request;
 }else if(config.mode==='supabase'){
  if(target.protocol!=='https:'||original.protocol!=='https:'||request.headers.get('x-forwarded-proto')!=='https')return request;
 }else return request;
 const canonical=new URL(target.origin);
 canonical.pathname=original.pathname;canonical.search=original.search;
 if(canonical.origin===original.origin)return request;
 return new Request(canonical,request);
}
