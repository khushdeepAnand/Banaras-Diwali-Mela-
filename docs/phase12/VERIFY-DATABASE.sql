-- Run as the migration owner on STAGING after 001 and 002.
-- Everything is rolled back. Success is NOT evidence of real payment settlement.
begin;
do $$
declare
  table_id regclass;
  suffix text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  contribution_id uuid := gen_random_uuid();
begin
  foreach table_id in array array['public.mela_settings'::regclass, 'public.mela_contributions'::regclass, 'public.mela_applications'::regclass, 'public.mela_audit_events'::regclass] loop
    if not (select relrowsecurity from pg_class where oid = table_id) then raise exception 'RLS missing: %', table_id; end if;
    if has_table_privilege('anon', table_id, 'SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('authenticated', table_id, 'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'Browser role has table access: %', table_id;
    end if;
  end loop;
  if has_table_privilege('service_role', 'public.mela_contributions', 'DELETE') then raise exception 'Unexpected service DELETE privilege'; end if;
  if not has_table_privilege('service_role', 'public.mela_contributions', 'INSERT') then raise exception 'Service INSERT missing'; end if;
  if has_table_privilege('service_role', 'public.mela_audit_events', 'UPDATE,DELETE,INSERT') then raise exception 'Audit is writable by API role'; end if;

  insert into public.mela_contributions(id, reference, amount, utr)
  values (contribution_id, 'BDMC-' || suffix, 21, 'QA-' || suffix);
  begin
    insert into public.mela_contributions(id, reference, amount, utr)
    values (gen_random_uuid(), 'BDMC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)), 31, lower('QA-' || suffix));
    raise exception 'Duplicate UTR was accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.mela_contributions(id, reference, amount, utr)
    values (gen_random_uuid(), 'BDMC-' || suffix, 99, 'BAD-' || suffix);
    raise exception 'Invalid amount was accepted';
  exception when check_violation then null;
  end;
  update public.mela_contributions set status = 'verified' where id = contribution_id;
  if not exists (select 1 from public.mela_audit_events where record_id = contribution_id::text and changed_fields @> array['status']) then
    raise exception 'Audit trigger failed';
  end if;
end $$;
rollback;
