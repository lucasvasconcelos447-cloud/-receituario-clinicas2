-- Dedicated receituario-clinicas project only. Never apply to Agendamento Turbo.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles(id uuid primary key references auth.users(id) on delete cascade, name text not null default '', created_at timestamptz not null default now());
create table public.organizations(id uuid primary key default gen_random_uuid(),owner_id uuid not null unique references auth.users(id),name text not null check(length(name) between 2 and 250),legal_name text not null default '',cnpj text not null default '',phone text not null default '',email text not null default '',address text not null default '',city text not null default '',state text not null default '',created_at timestamptz not null default now());
create table public.organization_members(organization_id uuid not null references public.organizations(id),user_id uuid not null references auth.users(id),role text not null check(role='owner'),primary key(organization_id,user_id));
create table public.professional_profiles(organization_id uuid primary key references public.organizations(id),name text not null default '',category text not null default 'Enfermeira(o)',council text not null default 'COREN',registration text not null default '',state text not null default 'AM',specialty text not null default '',identifier text not null default '');
create table public.document_branding(organization_id uuid primary key references public.organizations(id),primary_color text not null default '#155E63',secondary_color text not null default '#BE9A68',template text not null default 'minimalista' check(template in ('minimalista','classico','floral')),paper text not null default 'A4' check(paper in ('A4','A5')),font text not null default 'classica' check(font in ('classica','moderna')),logo_width integer not null default 76 check(logo_width between 35 and 130),logo_path text,ruled boolean not null default true,phrase text not null default '',show_address boolean not null default true,show_contact boolean not null default true,bleed_mm numeric not null default 0 check(bleed_mm between 0 and 10),crop_marks boolean not null default false);
create table public.patients(id uuid not null default gen_random_uuid(),organization_id uuid not null references public.organizations(id),name text not null check(length(name) between 2 and 250),birth_date date,phone text not null default '',identifier text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(id),unique(organization_id,id));
create table public.text_templates(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),name text not null check(length(name) between 2 and 250),type text not null check(type in ('receituario','exames','orientacoes')),content text not null check(length(content)<=40000),created_at timestamptz not null default now());
create table public.documents(id uuid not null default gen_random_uuid(),organization_id uuid not null references public.organizations(id),patient_id uuid,type text not null check(type in ('receituario','exames','orientacoes')),title text not null check(length(title)<=150),content text not null default '' check(length(content)<=40000),issue_date date not null,protocol text not null default '',protocol_year text not null default '',protocol_institution text not null default '',justification text not null default '',medication_mode boolean not null default false,status text not null default 'draft' check(status in ('draft','generated')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(id),unique(organization_id,id),foreign key(organization_id,patient_id) references public.patients(organization_id,id));
create table public.document_versions(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),document_id uuid not null,version integer not null check(version>0),snapshot jsonb not null,file_path text not null,created_at timestamptz not null default now(),unique(document_id,version),foreign key(organization_id,document_id) references public.documents(organization_id,id));
create table public.audit_events(id bigint generated always as identity primary key,organization_id uuid not null references public.organizations(id),actor_id uuid references auth.users(id),action text not null,entity_id text not null,created_at timestamptz not null default now());
create index patients_org_name on public.patients(organization_id,lower(name));
create index documents_org_updated on public.documents(organization_id,updated_at desc);
create index templates_org on public.text_templates(organization_id);
create index versions_org_doc on public.document_versions(organization_id,document_id);
create index members_user on public.organization_members(user_id);
create index audit_org on public.audit_events(organization_id,created_at desc);

-- MVP authorizes the owner from a server-controlled FK, never editable JWT metadata.
create function private.owns_org(org uuid) returns boolean language sql stable security invoker set search_path='' as $$select exists(select 1 from public.organizations where id=org and owner_id=(select auth.uid()))$$;
revoke all on function private.owns_org(uuid) from public;
grant execute on function private.owns_org(uuid) to authenticated;
create function private.owns_path(path text) returns boolean language sql stable security invoker set search_path='' as $$select exists(select 1 from public.organizations where id::text=split_part(path,'/',1) and owner_id=(select auth.uid()))$$;
revoke all on function private.owns_path(text) from public;
grant execute on function private.owns_path(text) to authenticated;

alter table public.profiles enable row level security;
create policy own_profile on public.profiles for all to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
alter table public.organizations enable row level security;
create policy owner_read on public.organizations for select to authenticated using(owner_id=(select auth.uid()));
create policy owner_create on public.organizations for insert to authenticated with check(owner_id=(select auth.uid()));
create policy owner_update on public.organizations for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
alter table public.organization_members enable row level security;
create policy member_read on public.organization_members for select to authenticated using(user_id=(select auth.uid()));

do $$declare tab text;begin
foreach tab in array array['professional_profiles','document_branding','patients','text_templates','documents'] loop
execute format('alter table public.%I enable row level security',tab);
execute format('create policy owner_access on public.%I for all to authenticated using(private.owns_org(organization_id)) with check(private.owns_org(organization_id))',tab);
end loop;end$$;
alter table public.document_versions enable row level security;
create policy read_version on public.document_versions for select to authenticated using(private.owns_org(organization_id));
create policy insert_version on public.document_versions for insert to authenticated with check(private.owns_org(organization_id) and private.owns_path(file_path) and split_part(file_path,'/',2)='pdfs');
alter table public.audit_events enable row level security;
create policy read_audit on public.audit_events for select to authenticated using(private.owns_org(organization_id));

revoke all on all tables in schema public from anon,authenticated;
grant select,insert,update on public.profiles,public.organizations,public.professional_profiles,public.document_branding,public.patients,public.documents to authenticated;
grant select,insert,update,delete on public.text_templates to authenticated;
grant select on public.organization_members,public.audit_events to authenticated;
grant select,insert on public.document_versions to authenticated;

-- Triggers run privileged only to create the owner's initial records and append audit metadata.
create function private.initialize_org() returns trigger language plpgsql security definer set search_path='' as $$begin
if new.owner_id is distinct from auth.uid() then raise exception 'Unauthorized owner';end if;
insert into public.organization_members(organization_id,user_id,role) values(new.id,new.owner_id,'owner');
insert into public.professional_profiles(organization_id) values(new.id);
insert into public.document_branding(organization_id) values(new.id);
return new;end$$;
revoke all on function private.initialize_org() from public,anon,authenticated;
create trigger initialize_org after insert on public.organizations for each row execute function private.initialize_org();
create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$begin new.updated_at=clock_timestamp();return new;end$$;
revoke all on function private.touch_updated_at() from public,anon,authenticated;
create trigger touch_document before update on public.documents for each row execute function private.touch_updated_at();
create trigger touch_patient before update on public.patients for each row execute function private.touch_updated_at();
create function private.log_change() returns trigger language plpgsql security definer set search_path='' as $$begin
insert into public.audit_events(organization_id,actor_id,action,entity_id) values(new.organization_id,auth.uid(),tg_table_name||':'||lower(tg_op),new.id::text);return new;end$$;
revoke all on function private.log_change() from public,anon,authenticated;
create trigger audit_document after insert or update on public.documents for each row execute function private.log_change();
create trigger audit_version after insert on public.document_versions for each row execute function private.log_change();
create trigger audit_patient after insert or update on public.patients for each row execute function private.log_change();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('clinical-private','clinical-private',false,10485760,array['image/png','image/jpeg','image/webp','application/pdf']);
create policy clinical_read on storage.objects for select to authenticated using(bucket_id='clinical-private' and private.owns_path(name));
create policy clinical_insert on storage.objects for insert to authenticated with check(bucket_id='clinical-private' and private.owns_path(name) and split_part(name,'/',2) in ('logos','pdfs'));
-- No UPDATE/DELETE policies: uploads use unique paths; historical assets cannot be overwritten.

