-- Catalog publication is explicit; references never become executable layouts automatically.
set local lock_timeout = '5s';
create table private.library_admins (user_id uuid primary key references auth.users(id));
alter table private.library_admins enable row level security;
revoke all on private.library_admins from public,anon,authenticated;
create function private.is_library_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.library_admins where user_id=(select auth.uid()));
$$;
revoke all on function private.is_library_admin() from public,anon;
grant execute on function private.is_library_admin() to authenticated;
create function public.is_library_admin() returns boolean language sql stable security invoker set search_path='' as $$ select private.is_library_admin(); $$;
revoke all on function public.is_library_admin() from public,anon;
grant execute on function public.is_library_admin() to authenticated;
create table public.visual_templates (
 id text primary key check(id in ('minimalista','classico','floral','botanico','geometrico','institucional')),
 name text not null check(length(name) between 2 and 80),
 description text not null default '' check(length(description)<=250),
 thumbnail text not null check(thumbnail ~ '^/templates/[a-z0-9-]+\.png$' or thumbnail ~ '^data:image/png;base64,[A-Za-z0-9+/=]+$'),
 sort_order integer not null default 0 check(sort_order between 0 and 10000),
 published boolean not null default false,
 updated_at timestamptz not null default now(),
 check(length(thumbnail)<=280000)
);
alter table public.visual_templates enable row level security;
grant select,insert,update on public.visual_templates to authenticated;
revoke all on public.visual_templates from anon;
create policy "Published catalog or administrator" on public.visual_templates for select to authenticated using (published or private.is_library_admin());
create policy "Only library administrator inserts" on public.visual_templates for insert to authenticated with check (private.is_library_admin());
create policy "Only library administrator updates" on public.visual_templates for update to authenticated using (private.is_library_admin()) with check (private.is_library_admin());
insert into public.visual_templates(id,name,description,thumbnail,sort_order,published) values
 ('minimalista','Minimalista','Branco, respiro e linhas discretas.','/templates/minimalista.png',10,true),
 ('classico','Clássico','Serifa elegante e detalhes sóbrios.','/templates/classico.png',20,true),
 ('floral','Floral suave','Pétalas delicadas e traços leves.','/templates/floral.png',30,true),
 ('botanico','Botânico','Ramos desenhados nos cantos da folha.','/templates/botanico.png',40,true),
 ('geometrico','Geométrico','Formas sutis, desenho contemporâneo.','/templates/geometrico.png',50,true),
 ('institucional','Institucional','Composição objetiva e profissional.','/templates/institucional.png',60,true);
alter table public.documents add column visual_template text check(visual_template in ('minimalista','classico','floral','botanico','geometrico','institucional'));
create table private.layout_first_uses (
 document_id uuid primary key,
 professional_id uuid not null,
 template_id text not null,
 issued_at timestamptz not null
);
alter table private.layout_first_uses enable row level security;
revoke all on private.layout_first_uses from public,anon,authenticated;
create table private.library_test_accounts(user_id uuid primary key);
alter table private.library_test_accounts enable row level security;
revoke all on private.library_test_accounts from public,anon,authenticated;
insert into private.library_test_accounts values('89dd2064-c7ae-413a-9c48-2786663f9cc2');
create function private.capture_first_layout_use() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into private.layout_first_uses(document_id,professional_id,template_id,issued_at)
 select new.document_id,o.owner_id,coalesce(new.snapshot->'branding'->>'template','minimalista'),new.created_at
 from public.organizations o where o.id=new.organization_id
 on conflict(document_id) do nothing;
 return new;
end $$;
revoke all on function private.capture_first_layout_use() from public,anon,authenticated;
create trigger capture_first_layout_use after insert on public.document_versions for each row execute function private.capture_first_layout_use();
insert into private.layout_first_uses(document_id,professional_id,template_id,issued_at)
 select distinct on(v.document_id) v.document_id,o.owner_id,coalesce(v.snapshot->'branding'->>'template','minimalista'),v.created_at
 from public.document_versions v join public.organizations o on o.id=v.organization_id
 order by v.document_id,v.version,v.created_at
 on conflict(document_id) do nothing;
create index layout_first_uses_period_idx on private.layout_first_uses(issued_at,template_id);
create function public.library_statistics(p_last_30_days boolean default false)
 returns table(template_id text,documents_count bigint,professionals_count bigint)
 language plpgsql security definer set search_path='' as $$
begin
 if not private.is_library_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 return query select u.template_id,count(*)::bigint,count(distinct u.professional_id)::bigint
 from private.layout_first_uses u
 where (not p_last_30_days or u.issued_at>=now()-interval '30 days')
 and not exists(select 1 from private.library_test_accounts t where t.user_id=u.professional_id)
 group by u.template_id order by count(*) desc,u.template_id;
end $$;
revoke all on function public.library_statistics(boolean) from public,anon;
grant execute on function public.library_statistics(boolean) to authenticated;
