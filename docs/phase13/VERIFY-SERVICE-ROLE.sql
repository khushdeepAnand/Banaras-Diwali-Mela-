-- Run as migration owner AFTER phase12/VERIFY-DATABASE.sql succeeds.
-- Synthetic writes roll back. Identity-sequence values can still advance.
begin;
do $$
declare t regclass;
begin
  foreach t in array array['public.mela_settings'::regclass, 'public.mela_contributions'::regclass, 'public.mela_applications'::regclass] loop
    if not has_table_privilege('service_role', t, 'SELECT')
      or not has_table_privilege('service_role', t, 'INSERT')
      or not has_table_privilege('service_role', t, 'UPDATE') then
      raise exception 'Required backend grant missing: %', t;
    end if;
    if has_table_privilege('service_role', t, 'DELETE,TRUNCATE,REFERENCES,TRIGGER') then
      raise exception 'Excess backend grants: %', t;
    end if;
  end loop;
  if not has_table_privilege('service_role', 'public.mela_audit_events', 'SELECT') then
    raise exception 'Backend audit SELECT missing';
  end if;
  if has_table_privilege('service_role', 'public.mela_audit_events', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then
    raise exception 'Backend audit grants exceed read-only';
  end if;
end $$;
set local role service_role;
do $$
declare
  suffix text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  application_id uuid := gen_random_uuid();
begin
  insert into public.mela_applications(id, reference, "stallName", "vendorName", email, phone, category,
    description, "durationDays", fee, status, "paymentStatus", "requestHash")
  values (application_id, 'BDMS-' || suffix, 'PHASE13 QA ONLY', 'Synthetic QA',
    'phase13@example.test', '0000000000', 'QA', 'Synthetic release verification; no real booking.',
    3, 900, 'pending', 'pending_payment', repeat(lower(suffix), 5) || 'abcd');
  begin
    update public.mela_applications set "durationDays" = 0 where id = application_id;
    raise exception 'Invalid duration accepted';
  exception when check_violation then null;
  end;
  begin
    update public.mela_applications set "paymentStatus" = 'verified' where id = application_id;
    raise exception 'Verified status without UTR accepted';
  exception when check_violation then null;
  end;
  update public.mela_applications set status = 'rejected' where id = application_id;
  if not exists (select 1 from public.mela_audit_events
    where record_id = application_id::text and database_role = 'service_role' and changed_fields @> array['status']) then
    raise exception 'Service role audit trigger failed';
  end if;
end $$;
rollback;
