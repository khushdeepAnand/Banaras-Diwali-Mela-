// Synthetic live QA, never a payment certification. Leaves labelled QA records.
// Build backend, then from root:
// node --env-file=backend/.env scripts/verify_live.mjs --confirm-live-test-writes
// Management token is optional after SQL verification; never logged or sent to backend.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { createApp } from '../backend/dist/app.js'
import { loadConfig } from '../backend/dist/config.js'
import { SupabaseStore } from '../backend/dist/store.js'

const report = { syntheticOnly: true, realMoneySent: false, checks: [], testRecords: [] }
const check = label => { report.checks.push(label); console.log(`PASS: ${label}`) }
let backend, harness, failureServer
let config, key, headers, store
async function rows(table, filter) {
  const response = await fetch(`${config.SUPABASE_URL}/rest/v1/${table}?${filter}`, { headers, signal: AbortSignal.timeout(10000) })
  assert.equal(response.status, 200, 'Database read failed')
  return response.json()
}
async function call(base, method, path, body, token) {
  const response = await fetch(`${base}/api${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
  })
  const json = await response.json()
  const text = JSON.stringify(json)
  for (const secret of [key, config.ADMIN_API_TOKEN, process.env.SUPABASE_ACCESS_TOKEN]) {
    if (secret) assert.equal(text.includes(secret), false, 'Response leaked a credential')
  }
  return { status: response.status, json }
}
async function listen(app) {
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  return { server, base: `http://127.0.0.1:${server.address().port}` }
}
async function startBackend() {
  const probe = createServer().listen(0, '127.0.0.1')
  await once(probe, 'listening')
  const port = probe.address().port
  await new Promise(resolve => probe.close(resolve))
  const env = { ...process.env, NODE_ENV: 'production', DEMO_MODE: 'false', PORT: String(port), TRUST_PROXY_HOPS: '0' }
  delete env.SUPABASE_ACCESS_TOKEN
  const child = spawn(process.execPath, ['dist/server.js'], { cwd: fileURLToPath(new URL('../backend/', import.meta.url)), env, stdio: ['ignore', 'pipe', 'pipe'] })
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error('Backend startup timed out')) }, 10000)
    child.once('error', () => { clearTimeout(timer); reject(new Error('Backend spawn failed')) })
    child.once('exit', () => { clearTimeout(timer); reject(new Error('Backend exited during startup')) })
    child.stdout.on('data', data => { if (String(data).includes('Backend listening')) { clearTimeout(timer); resolve() } })
    child.stderr.resume()
  })
  return { child, base: `http://127.0.0.1:${port}` }
}
async function stopBackend(value) {
  if (!value || value.child.exitCode !== null) return
  const exited = once(value.child, 'exit')
  value.child.kill('SIGTERM')
  await exited
}
try {
  config = loadConfig()
  key = config.SUPABASE_SECRET_KEY || config.SUPABASE_SERVICE_ROLE_KEY
  headers = { apikey: key, ...(!key.startsWith('sb_secret_') ? { Authorization: `Bearer ${key}` } : {}) }
  store = new SupabaseStore(config.SUPABASE_URL, key)
  assert.ok(process.argv.includes('--confirm-live-test-writes'), 'Explicit synthetic-write confirmation required')
  assert.equal(config.DEMO_MODE, 'false')
  assert.ok(config.SUPABASE_URL && key && config.ADMIN_API_TOKEN)
  const settings = await store.getSettings()
  assert.equal(settings.recipient.enabled, false, 'QA requires public payment instructions to remain disabled')
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12)
  backend = await startBackend()
  let result = await call(backend.base, 'GET', '/public-config')
  assert.equal(result.status, 200)
  assert.equal(result.json.data.mode, 'supabase')
  assert.equal(result.json.data.demo, false)
  assert.equal(result.json.data.accepting, false)
  assert.equal(result.json.data.applicationsOpen, true)
  check('real production backend reads Supabase settings; payments disabled')

  const input = { stallName: `PHASE13 QA ONLY ${suffix}`, vendorName: 'Synthetic QA', email: `phase13-${suffix}@example.test`,
    phone: '0000000000', category: 'QA only', description: 'Synthetic release verification; not a real stall or payment.', products: ['Synthetic sample'], durationDays: 3 }
  result = await call(backend.base, 'POST', '/applications', input)
  assert.equal(result.status, 201)
  const application = result.json.data
  assert.equal(application.status, 'pending')
  assert.equal(application.paymentStatus, 'pending_payment')
  const persisted = await store.getApplication(application.reference)
  assert.ok(persisted)
  assert.equal(persisted.stallName, input.stallName)
  assert.equal(persisted.fee, settings.fees.threeDays)
  report.testRecords.push({ table: 'mela_applications', reference: application.reference, label: input.stallName })
  check('stall application HTTP 201 confirmed by an independent Supabase read')
  assert.equal((await call(backend.base, 'POST', '/applications', input)).status, 409)
  assert.equal((await call(backend.base, 'POST', '/applications', { ...input, durationDays: 0 })).status, 400)
  assert.equal((await call(backend.base, 'GET', `/applications/${application.reference}?email=wrong@example.test`)).status, 404)
  result = await call(backend.base, 'GET', `/applications/${application.reference}?email=${encodeURIComponent(input.email)}`)
  assert.equal(result.status, 200)
  for (const field of ['email', 'phone', 'vendorName', 'utr', 'requestHash']) assert.equal(Object.hasOwn(result.json.data, field), false)
  check('duplicate/invalid stall submissions rejected; wrong email denied; public response private-field redaction')

  for (const [method, path, body] of [
    ['GET', '/admin/records'], ['PUT', '/admin/settings', {}],
    ['PATCH', `/admin/applications/${application.reference}`, { status: 'approved' }],
    ['PATCH', '/admin/contributions/BDMC-012345ABCDEF', { status: 'verified' }],
  ]) {
    for (const token of [undefined, 'wrong-token']) assert.equal((await call(backend.base, method, path, body, token)).status, 401)
  }
  result = await call(backend.base, 'GET', '/admin/records', undefined, config.ADMIN_API_TOKEN)
  assert.equal(result.status, 200)
  assert.ok(result.json.data.applications.some(item => item.reference === application.reference))
  check('all four organiser routes deny missing/wrong tokens; valid token retrieves live application')

  const contributionInput = { amount: 21, utr: `PHASE13-QA-${suffix}`, contact: `phase13-${suffix}@example.test` }
  assert.equal((await call(backend.base, 'POST', '/contributions', contributionInput)).status, 503)
  // Isolated loopback-only test seam. Override ONLY the settings read in memory so
  // actual contribution HTTP persistence can be exercised without enabling payment
  // instructions in Supabase or exposing a public frontend. No payment is verified.
  class SyntheticContributionStore extends SupabaseStore {
    async getSettings() { const value = await super.getSettings(); return { ...value, recipient: { ...value.recipient, enabled: true } } }
  }
  harness = await listen(createApp({ mode: 'supabase', store: new SyntheticContributionStore(config.SUPABASE_URL, key) }))
  result = await call(harness.base, 'POST', '/contributions', contributionInput)
  assert.equal(result.status, 201)
  const contribution = result.json.data
  assert.equal(contribution.status, 'pending_verification')
  assert.equal(contribution.demo, false)
  let contributions = await rows('mela_contributions', `reference=eq.${contribution.reference}&select=*`)
  assert.equal(contributions.length, 1)
  assert.equal(contributions[0].amount, 21)
  assert.equal(contributions[0].status, 'pending_verification')
  report.testRecords.push({ table: 'mela_contributions', reference: contribution.reference, label: contributionInput.utr })
  assert.equal((await call(harness.base, 'POST', '/contributions', { ...contributionInput, utr: contributionInput.utr.toLowerCase() })).status, 409)
  assert.equal((await call(harness.base, 'POST', '/contributions', { ...contributionInput, amount: 99 })).status, 400)
  check('loopback-only contribution harness: HTTP 201 persisted pending; duplicate 409; invalid amount 400; public backend stays disabled')

  await stopBackend(backend)
  backend = await startBackend()
  result = await call(backend.base, 'GET', `/applications/${application.reference}?email=${encodeURIComponent(input.email)}`)
  assert.equal(result.status, 200)
  assert.equal(result.json.data.paymentStatus, 'pending_payment')
  result = await call(backend.base, 'GET', '/admin/records', undefined, config.ADMIN_API_TOKEN)
  assert.equal(result.status, 200)
  assert.ok(result.json.data.contributions.some(item => item.reference === contribution.reference && item.status === 'pending_verification'))
  assert.ok(await store.getApplication(application.reference))
  contributions = await rows('mela_contributions', `reference=eq.${contribution.reference}&select=id,status`)
  assert.equal(contributions.length, 1)
  assert.equal(contributions[0].status, 'pending_verification')
  check('both records survive a real production backend process stop/restart and independent database reads')

  result = await call(backend.base, 'PATCH', `/admin/applications/${application.reference}`, { status: 'rejected' }, config.ADMIN_API_TOKEN)
  assert.equal(result.status, 200)
  assert.equal(result.json.data.paymentStatus, 'pending_payment')
  const audit = await rows('mela_audit_events', `record_id=eq.${persisted.id}&select=table_name,database_role,changed_fields`)
  assert.ok(audit.some(item => item.database_role === 'service_role' && item.changed_fields.includes('status')))
  assert.equal((await store.getSettings()).recipient.enabled, false)
  result = await call(backend.base, 'GET', '/stalls')
  assert.equal(result.status, 200)
  assert.equal(result.json.data.some(item => item.reference === application.reference), false)
  check('authorised rejection audited without payment verification; synthetic stall never published; payment setting unchanged')

  failureServer = await listen(createApp({ mode: 'supabase', store: new SupabaseStore(config.SUPABASE_URL, 'sb_secret_' + 'invalid_phase13_qa_only') }))
  for (const [method, path, body] of [['GET', '/public-config'], ['POST', '/applications', { ...input, stallName: 'PHASE13 FAILED WRITE' }]]) {
    result = await call(failureServer.base, method, path, body)
    assert.equal(result.status, 503)
    assert.equal(result.json.error.code, 'DATABASE_UNAVAILABLE')
    assert.equal(Object.hasOwn(result.json, 'data'), false)
  }
  check('isolated invalid-key database failure returns generic 503 and no false success receipt')
  console.log(JSON.stringify(report, null, 2))
} catch {
  console.error('Live QA failed; private error details suppressed. Review last completed check; no records automatically deleted.')
  process.exitCode = 1
} finally {
  await stopBackend(backend)
  for (const value of [harness, failureServer]) if (value) await new Promise(resolve => value.server.close(resolve))
}
