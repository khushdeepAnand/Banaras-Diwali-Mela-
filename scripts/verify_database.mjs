// Verification only. Never applies migrations or modifies existing business rows.
// Synthetic SQL checks roll back; identity sequence gaps are expected.
// node --env-file=backend/.env scripts/verify_database.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

try {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const url = new URL(process.env.SUPABASE_URL)
  assert.equal(url.protocol, 'https:')
  assert.match(url.hostname, /^[a-z]{20}\.supabase\.co$/)
  const ref = url.hostname.split('.')[0]
  assert.ok(token)
  async function request(path, query, readOnly = false) {
    const response = await fetch(`https://api.supabase.com/v1${path}`, {
      method: query ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, ...(query ? { 'Content-Type': 'application/json' } : {}) },
      ...(query ? { body: JSON.stringify({ query, read_only: readOnly }) } : {}), signal: AbortSignal.timeout(60000),
    })
    if (!response.ok) { console.log(JSON.stringify({ managementHttpStatus: response.status })); throw new Error('Management request failed') }
    return response.json()
  }
  const projects = await request('/projects')
  const project = projects.find(item => item.id === ref)
  assert.equal(project?.name?.trim().toLowerCase(), 'diwali mela')
  console.log('PASS: configured URL matches the existing Diwali Mela project')
  const sql = (query, readOnly = false) => request(`/projects/${ref}/database/query`, query, readOnly)
  const preflight = await sql(await readFile(new URL('../docs/phase13/PREFLIGHT-DATABASE.sql', import.meta.url), 'utf8'), true)
  console.log(JSON.stringify({ preflightExecuted: true, returnedGrantRows: preflight.length }))
  for (const file of ['docs/phase12/VERIFY-DATABASE.sql', 'docs/phase13/VERIFY-SERVICE-ROLE.sql']) {
    await sql(await readFile(new URL('../' + file, import.meta.url), 'utf8'))
    console.log(`PASS: ${file} executed against the intended database; synthetic rows rolled back`)
  }
  for (const role of ['anon', 'authenticated']) {
    await sql(`begin; set local role ${role}; do $$
declare t text; statement text;
begin
  foreach t in array array['mela_settings','mela_contributions','mela_applications','mela_audit_events'] loop
    foreach statement in array array[
      format('select id from public.%I limit 1', t),
      format('insert into public.%I default values', t),
      format('update public.%I set %I=%I where false', t,
        case when t='mela_audit_events' then 'occurred_at' else 'id' end,
        case when t='mela_audit_events' then 'occurred_at' else 'id' end),
      format('delete from public.%I where false', t)
    ] loop
      begin
        execute statement;
        raise exception 'Browser role unexpectedly accessed private table';
      exception when insufficient_privilege then null;
      end;
    end loop;
  end loop;
end $$; rollback;`)
    console.log(`PASS: ${role} SELECT/INSERT/UPDATE/DELETE denied on all four private tables (actual SQL role)`)
  }
  const tables = await sql(`select c.relname as table_name,c.relrowsecurity as rls_enabled
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('mela_settings','mela_contributions','mela_applications','mela_audit_events') and c.relkind='r'
    order by c.relname`, true)
  assert.equal(tables.length, 4)
  assert.ok(tables.every(table => table.rls_enabled))
  const constraints = await sql(`select conname,convalidated from pg_constraint
    where conrelid in ('public.mela_contributions'::regclass,'public.mela_applications'::regclass)
    and conname in ('mela_contribution_input','mela_application_input') order by conname`, true)
  assert.equal(constraints.length, 2)
  assert.ok(constraints.every(value => value.convalidated))
  const roles = await sql(`select rolname,rolbypassrls from pg_roles where rolname in ('anon','authenticated')`, true)
  assert.equal(roles.length, 2)
  assert.ok(roles.every(role => !role.rolbypassrls))
  console.log(JSON.stringify({ rlsTables: tables, inputConstraints: constraints, browserRoleBypassRls: false, verificationPassed: true }, null, 2))
} catch {
  console.error('Database verification stopped; configuration, SQL or access check failed. Private details suppressed; no automatic repair attempted.')
  process.exitCode = 1
}
