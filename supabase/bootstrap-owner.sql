-- MANUAL, SEPARATE FROM MIGRATIONS. Do not run during deployment/signup.
-- User-authorized initial administrator: info@dgwebservices.nl.
-- First inspect/confirm the exact Auth UUID independently. In the SAME trusted
-- SQL session set dg_bo.bootstrap_user_id to that UUID before running this file.
-- No email/invite, password, automatic first-user grant or service credential.
begin;
do $bootstrap$
<<bootstrap_owner>>
declare
 expected_id uuid:=nullif(current_setting('dg_bo.bootstrap_user_id',true),'')::uuid;
 expected_email constant text:='info@dgwebservices.nl';
 workspace_id constant uuid:='6f559bdd-d59c-44e2-8e99-88805af7e701';
 workspace_name constant text:='DG Webservices';
 permissions constant text[]:=array['state.read','state.write','integrations.read','integrations.manage','integrations.test','integrations.preview','integrations.activate','integrations.pause','customer.read','customer.import.preview','customer.import.commit','support.ticket.read','support.ticket.create','support.ticket.reply','support.ticket.manage','support.ticket.internal_note','support.ticket.status','support.draft.read','support.draft.write','jobs.read','audit.read'];
 actual_id uuid;
 existing public.dg_bo_memberships;
begin
 if expected_id is null then raise exception 'Bootstrap vereist een onafhankelijk bevestigde Auth UUID via dg_bo.bootstrap_user_id.';end if;
 if (select count(*) from auth.users u where lower(u.email)=expected_email)<>1 then raise exception 'Bootstrap vereist precies één bestaande Auth-gebruiker voor het bevestigde adres.';end if;
 select u.id into actual_id from auth.users u where lower(u.email)=expected_email and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now());
 if actual_id is distinct from expected_id then raise exception 'De bevestigde UUID, e-mailbevestiging of gebruikersstatus wijkt af; er zijn geen rechten toegewezen.';end if;
 perform pg_advisory_xact_lock(hashtextextended('dg_bo:owner-bootstrap',0));
 if exists(select 1 from public.dg_bo_workspaces w where w.id=bootstrap_owner.workspace_id and (w.name<>workspace_name or w.environment<>'production')) then raise exception 'Bestaande workspaceconfiguratie wijkt af.';end if;
 if exists(select 1 from public.dg_bo_memberships m where m.user_id=expected_id and m.workspace_id<>bootstrap_owner.workspace_id) then raise exception 'Deze gebruiker heeft al een ander lidmaatschap; handmatige beoordeling vereist.';end if;
 select * into existing from public.dg_bo_memberships m where m.user_id=expected_id and m.workspace_id=bootstrap_owner.workspace_id;
 if existing.id is not null then
 if existing.role<>'admin' or existing.organization_id is not null or not existing.active or not(existing.permissions @> permissions and existing.permissions <@ permissions) then raise exception 'Bestaande rechten wijken af; bootstrap overschrijft geen lidmaatschap.';end if;
 else
 insert into public.dg_bo_workspaces(id,name,environment) values(workspace_id,workspace_name,'production') on conflict(id) do nothing;
 insert into public.dg_bo_memberships(user_id,workspace_id,role,permissions) values(expected_id,workspace_id,'admin',permissions);
 end if;
end $bootstrap$;
commit;
