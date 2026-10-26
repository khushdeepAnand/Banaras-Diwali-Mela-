-- READ ONLY. Confirm dashboard project name "Diwali mela" and URL/reference FIRST.
-- Does not prove project identity, migrate, or expose business rows.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
  pg_total_relation_size(c.oid) as total_bytes
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- Exact row counts only for existing mela tables; never outputs applicant data.
do $$
declare t text; total bigint;
begin
  foreach t in array array['mela_settings','mela_contributions','mela_applications','mela_audit_events'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into total;
      raise notice '%: % rows', t, total;
    else
      raise notice '%: absent', t;
    end if;
  end loop;
end $$;

select c.relname as table_name, con.conname, con.convalidated,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname like 'mela_%'
order by c.relname, con.conname;

select tablename, indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename like 'mela_%';
select event_object_table, trigger_name, action_statement from information_schema.triggers
where trigger_schema = 'public' and event_object_table like 'mela_%';
select tablename, roles, cmd, qual, with_check from pg_policies
where schemaname = 'public' and tablename like 'mela_%';
select table_name, grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and table_name like 'mela_%'
order by table_name, grantee, privilege_type;
