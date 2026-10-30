begin;
insert into auth.users(id,email,aud,role) values('11111111-1111-4111-8111-111111111111','qa-a@example.invalid','authenticated','authenticated'),('22222222-2222-4222-8222-222222222222','qa-b@example.invalid','authenticated','authenticated');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
insert into public.organizations(id,owner_id,name) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Clínica Fictícia A');
insert into public.patients(id,organization_id,name) values('aaaaaaaa-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Paciente Fictício A');
insert into public.documents(id,organization_id,patient_id,type,title,issue_date) values('aaaaaaaa-0000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-0000-4000-8000-000000000001','orientacoes','Teste fictício','2026-10-29');
insert into storage.objects(bucket_id,name) values('clinical-private','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/pdfs/teste.pdf');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
insert into public.organizations(id,owner_id,name) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','Clínica Fictícia B');
do $$begin
if exists(select 1 from public.patients where id='aaaaaaaa-0000-4000-8000-000000000001') then raise exception 'RLS leaked patient';end if;
if exists(select 1 from public.documents where id='aaaaaaaa-0000-4000-8000-000000000002') then raise exception 'RLS leaked document';end if;
if exists(select 1 from storage.objects where name='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/pdfs/teste.pdf') then raise exception 'RLS leaked file';end if;
update public.patients set name='ATTACK' where id='aaaaaaaa-0000-4000-8000-000000000001';if found then raise exception 'RLS allowed update';end if;
begin insert into public.patients(organization_id,name) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ATTACK');raise exception 'RLS allowed insert';exception when insufficient_privilege then null;end;
begin insert into public.documents(organization_id,patient_id,type,title,issue_date) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-0000-4000-8000-000000000001','receituario','ATTACK','2026-10-29');raise exception 'Cross-org FK missing';exception when foreign_key_violation then null;end;
begin insert into public.organization_members(organization_id,user_id,role) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','owner');raise exception 'Membership escalation';exception when insufficient_privilege then null;end;
begin insert into storage.objects(bucket_id,name) values('clinical-private','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/logos/attack.png');raise exception 'Storage upload crossed organizations';exception when insufficient_privilege then null;end;
begin update public.document_versions set file_path='attack';raise exception 'Version mutation allowed';exception when insufficient_privilege then null;end;
end $$;
do $$begin
 if public.is_library_admin() then raise exception 'Non-admin gained administrator status';end if;
 update public.visual_templates set name='ATTACK' where id='minimalista';if found then raise exception 'Non-admin changed catalog';end if;
 begin insert into public.visual_templates(id,name,thumbnail,published) values('botanico','ATTACK','/templates/botanico.png',false);raise exception 'Non-admin inserted catalog';exception when insufficient_privilege then null;end;
 begin perform public.library_statistics(false);raise exception 'Non-admin read statistics';exception when insufficient_privilege then null;end;
 begin select count(*) from private.layout_first_uses;raise exception 'Non-admin read raw usage';exception when insufficient_privilege then null;end;
 begin insert into private.library_admins values('22222222-2222-4222-8222-222222222222');raise exception 'Admin escalation allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into private.library_admins values('11111111-1111-4111-8111-111111111111');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$begin
 if not public.is_library_admin() then raise exception 'Admin denied';end if;
 perform public.library_statistics(true);
 update public.visual_templates set name='Teste de administração' where id='minimalista';if not found then raise exception 'Admin catalog update denied';end if;
end $$;
rollback;
