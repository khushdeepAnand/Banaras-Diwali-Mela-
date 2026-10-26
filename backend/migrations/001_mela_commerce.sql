-- Apply using the Supabase SQL editor. Public clients never access these tables directly.
create table if not exists public.mela_settings (
  id text primary key check (id = 'main'),
  value jsonb not null
);
insert into public.mela_settings(id, value) values ('main', '{"recipient":{"name":"Khushdeep Anand","upiId":"bhejdeyr@ptyes","paymentUrl":"","qrUrl":"/api/payment-qr","enabled":false},"fees":{"threeDays":900,"sevenDays":1800,"customPerDay":350}}') on conflict (id) do nothing;

create table if not exists public.mela_contributions (
  id uuid primary key, reference text not null unique, amount integer not null check (amount in (21,31,51)),
  utr text not null, contact text not null default '', status text not null default 'pending_verification' check (status in ('pending_verification','verified','rejected')),
  "createdAt" timestamptz not null default now()
);
create unique index if not exists mela_contributions_utr_unique on public.mela_contributions(lower(utr));

create table if not exists public.mela_applications (
  id uuid primary key, reference text not null unique, "stallName" text not null, "vendorName" text not null,
  email text not null, phone text not null, category text not null, description text not null,
  products jsonb not null default '[]'::jsonb, "durationDays" integer not null check ("durationDays" between 1 and 30),
  fee integer not null check (fee > 0), utr text, status text not null check (status in ('pending','approved','rejected','expired')),
  "paymentStatus" text not null check ("paymentStatus" in ('pending_payment','pending_verification','verified')),
  published boolean not null default false, "createdAt" timestamptz not null default now(), "approvedAt" timestamptz,
  "expiresAt" timestamptz, "requestHash" text not null unique
);
create unique index if not exists mela_applications_utr_unique on public.mela_applications(lower(utr)) where utr is not null;

alter table public.mela_settings enable row level security;
alter table public.mela_contributions enable row level security;
alter table public.mela_applications enable row level security;
revoke all on public.mela_settings, public.mela_contributions, public.mela_applications from anon, authenticated;
grant all on public.mela_settings, public.mela_contributions, public.mela_applications to service_role;
-- Do not add permissive public RLS policies. The Express backend mediates all access.
