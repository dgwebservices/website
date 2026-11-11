const $=id=>document.getElementById(id);
let csrf='',busy=false;
async function api(action,body){
 const response=await fetch('/admin/auth/'+action,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:{Accept:'application/json',...(body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':csrf})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const value=await response.json();if(!response.ok)throw new Error(value.message||'De aanmelding kon niet worden afgerond.');if(value.csrf)csrf=value.csrf;return value;
}
function showError(error){$('auth-error').textContent=error?.message||'De aanmelding kon niet worden afgerond. Probeer later opnieuw.';$('auth-error').hidden=false;$('auth-error').focus();}
async function task(action){if(busy)return;busy=true;$('auth-error').hidden=true;document.querySelectorAll('button').forEach(button=>button.disabled=true);try{await action();}catch(error){showError(error);}finally{busy=false;document.querySelectorAll('button').forEach(button=>button.disabled=false);}}
async function refresh(){
 const state=await api('session');$('auth-progress').hidden=true;$('auth-login').hidden=state.state!=='signed_out';$('auth-mfa').hidden=state.state!=='mfa_required';$('auth-membership').hidden=state.state!=='membership_required';$('auth-logout').hidden=state.state==='signed_out';
 if(state.state==='ready'){location.replace('/admin'+(state.actor?.role==='client'?'#/client/overview':'#/admin/overview'));return;}
 if(state.state==='mfa_required'){
  const factors=state.factors||[],select=$('auth-verify').elements.factorId;select.replaceChildren();for(const factor of factors)select.add(new Option(factor.name||'Authenticator',factor.id));
  $('auth-enroll').hidden=factors.length>0;$('auth-verify').hidden=!factors.length;
 }
}
$('auth-login').addEventListener('submit',event=>{event.preventDefault();task(async()=>{const form=event.currentTarget;await api('login',{email:form.elements.email.value,password:form.elements.password.value});form.elements.password.value='';await refresh();});});
$('auth-verify').addEventListener('submit',event=>{event.preventDefault();task(async()=>{const form=event.currentTarget;await api('verify',{factorId:form.elements.factorId.value,code:form.elements.code.value});form.elements.code.value='';$('auth-secret').textContent='';$('auth-qr').removeAttribute('src');await refresh();});});
$('auth-enroll').addEventListener('click',()=>task(async()=>{const result=await api('enroll',{}),select=$('auth-verify').elements.factorId;select.replaceChildren(new Option('Nieuwe authenticator',result.factorId));$('auth-enrollment').hidden=false;$('auth-verify').hidden=false;$('auth-enroll').hidden=true;$('auth-secret').textContent=result.secret;if(result.qrCode.startsWith('<svg')||result.qrCode.startsWith('<?xml')){$('auth-qr').src='data:image/svg+xml;base64,'+btoa(String.fromCharCode(...new TextEncoder().encode(result.qrCode)));}else{$('auth-qr').hidden=true;}}));
$('auth-logout').addEventListener('click',()=>task(async()=>{await api('logout',{});$('auth-secret').textContent='';location.replace('/admin');}));
refresh().catch(error=>{$('auth-progress').hidden=true;showError(error);});
