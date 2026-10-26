-- Apply AFTER 001. Non-destructive and repeatable; use a backup and staging first.
begin;

-- RLS remains deny-by-default for browser roles; service_role is backend-only.
revoke all on public.mela_settings, public.mela_contributions, public.mela_applications from public, anon, authenticated;
revoke all on public.mela_settings, public.mela_contributions, public.mela_applications from service_role;
grant select, insert, update on public.mela_settings, public.mela_contributions, public.mela_applications to service_role;

-- NOT VALID preserves legacy rows, while enforcing these checks on new writes.
-- Review existing violations before separately running VALIDATE CONSTRAINT.
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.mela_contributions'::regclass and conname = 'mela_contribution_input') then
    alter table public.mela_contributions add constraint mela_contribution_input check (
      reference ~ '^BDMC-[A-F0-9]{12}$' and utr ~ '^[A-Za-z0-9-]{6,40}$' and length(contact) <= 254
    ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.mela_applications'::regclass and conname = 'mela_application_input') then
    alter table public.mela_applications add constraint mela_application_input check (
      reference ~ '^BDMS-[A-F0-9]{12}$'
      and length(btrim("stallName")) between 2 and 80 and length(btrim("vendorName")) between 2 and 80
      and length(email) between 3 and 150 and phone ~ '^\+?[0-9 -]{7,20}$'
      and length(btrim(category)) between 2 and 60 and length(btrim(description)) between 15 and 600
      and jsonb_typeof(products) = 'array' and jsonb_array_length(products) <= 6
      and (utr is null or utr ~ '^[A-Za-z0-9-]{6,40}$')
      and ("paymentStatus" = 'pending_payment' or utr is not null)
      and "requestHash" ~ '^[a-f0-9]{64}$'
    ) not valid;
  end if;
end $$;

create index if not exists mela_contributions_created on public.mela_contributions("createdAt" desc);
create index if not exists mela_applications_created on public.mela_applications("createdAt" desc);

-- Minimal state-change audit, without contacts, UTRs, secrets or copied payloads.
-- Shared organiser bearer authentication identifies the backend, not a person.
create table if not exists public.mela_audit_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  table_name text not null,
  record_id text not null,
  database_role text not null,
  changed_fields text[] not null
);
alter table public.mela_audit_events enable row level security;
revoke all on public.mela_audit_events from public, anon, authenticated, service_role;
grant select on public.mela_audit_events to service_role;

create or replace function public.mela_audit_change() returns trigger
language plpgsql security definer set search_path = pg_catalog, public as $$
declare fields text[];
begin
  select array_agg(key order by key) into fields from jsonb_each(to_jsonb(new))
  where value is distinct from to_jsonb(old) -> key;
  if fields is not null then
    insert into public.mela_audit_events(table_name, record_id, database_role, changed_fields)
    values (tg_table_name, new.id::text, current_setting('role'), fields);
  end if;
  return new;
end $$;
revoke all on function public.mela_audit_change() from public, anon, authenticated, service_role;

drop trigger if exists mela_audit_update on public.mela_settings;
create trigger mela_audit_update after update on public.mela_settings for each row execute function public.mela_audit_change();
drop trigger if exists mela_audit_update on public.mela_contributions;
create trigger mela_audit_update after update on public.mela_contributions for each row execute function public.mela_audit_change();
drop trigger if exists mela_audit_update on public.mela_applications;
create trigger mela_audit_update after update on public.mela_applications for each row execute function public.mela_audit_change();

commit;
