alter function public.library_statistics(boolean) set schema private;
create function public.library_statistics(p_last_30_days boolean default false)
 returns table(template_id text,documents_count bigint,professionals_count bigint)
 language sql security invoker set search_path='' as $$ select * from private.library_statistics(p_last_30_days); $$;
revoke all on function public.library_statistics(boolean) from public,anon;
grant execute on function public.library_statistics(boolean) to authenticated;
