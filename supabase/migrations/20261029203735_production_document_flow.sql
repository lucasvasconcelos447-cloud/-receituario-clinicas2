alter table public.patients add column address text not null default '' check(length(address)<=500), add column sex text not null default '' check(length(sex)<=40);
alter table public.documents add column clinical_reviewed boolean not null default false;
alter table public.document_branding add constraint safe_logo_path check (logo_path is null or logo_path like organization_id::text||'/logos/%');
alter table public.document_branding add constraint safe_colors check(primary_color ~ '^#[0-9a-fA-F]{6}$' and secondary_color ~ '^#[0-9a-fA-F]{6}$');
alter table public.document_versions add constraint version_org_path check(split_part(file_path,'/',1)=organization_id::text and split_part(file_path,'/',2)='pdfs');
create function public.finalize_document_version(p_document_id uuid,p_expected_updated_at timestamptz,p_snapshot jsonb,p_file_path text) returns uuid language plpgsql security invoker set search_path='' as $$
declare d public.documents; v_id uuid; v_number integer;
begin
 select * into d from public.documents where id=p_document_id for update;
 if not found or not private.owns_org(d.organization_id) or d.updated_at<>p_expected_updated_at then raise exception 'Document changed or forbidden';end if;
 if split_part(p_file_path,'/',1)<>d.organization_id::text or split_part(p_file_path,'/',2)<>'pdfs' then raise exception 'Invalid path';end if;
 if (p_snapshot->>'blank')::boolean is distinct from false or p_snapshot->'document'->>'id'<>d.id::text or p_snapshot->'organization'->>'id'<>d.organization_id::text then raise exception 'Invalid snapshot';end if;
 if not exists(select 1 from storage.objects where bucket_id='clinical-private' and name=p_file_path) then raise exception 'Missing file';end if;
 select coalesce(max(version),0)+1 into v_number from public.document_versions where document_id=d.id;
 insert into public.document_versions(organization_id,document_id,version,snapshot,file_path) values(d.organization_id,d.id,v_number,p_snapshot,p_file_path) returning id into v_id;
 update public.documents set status='generated' where id=d.id;
 return v_id;
end $$;
revoke all on function public.finalize_document_version(uuid,timestamptz,jsonb,text) from public,anon;
grant execute on function public.finalize_document_version(uuid,timestamptz,jsonb,text) to authenticated;
-- Distinct versions retain immutable PDF bytes and the full logo data in the snapshot.

