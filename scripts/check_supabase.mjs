// Read-only diagnostics. Build backend first; run from project root:
// node --env-file=backend/.env scripts/check_supabase.mjs
// Never logs credentials, project URL, business records, or raw database errors.
import { loadConfig } from '../backend/dist/config.js'
import { createApp } from '../backend/dist/app.js'
import { once } from 'node:events'

let server
try {
  const config = loadConfig()
  const key = config.SUPABASE_SECRET_KEY || config.SUPABASE_SERVICE_ROLE_KEY
  if (!config.SUPABASE_URL || !key || config.DEMO_MODE !== 'false') throw new Error('Configuration incomplete')
  console.log(JSON.stringify({ configurationValid: true, serverKey: config.SUPABASE_SECRET_KEY ? 'secret' : 'legacy', demo: false }))
  let ready = true
  for (const table of ['mela_settings', 'mela_contributions', 'mela_applications', 'mela_audit_events']) {
    const response = await fetch(`${config.SUPABASE_URL}/rest/v1/${table}?select=id&limit=0`, {
      headers: { apikey: key, ...(!key.startsWith('sb_secret_') ? { Authorization: `Bearer ${key}` } : {}), Prefer: 'count=exact' },
      signal: AbortSignal.timeout(10000),
    })
    const body = response.ok ? null : await response.json().catch(() => null)
    const code = typeof body?.code === 'string' && /^[A-Z0-9]{3,16}$/.test(body.code) ? body.code : null
    console.log(JSON.stringify({ table, httpStatus: response.status, rowCount: response.headers.get('content-range'), errorCode: code }))
    if (!response.ok) ready = false
  }
  server = createApp().listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = `http://127.0.0.1:${server.address().port}/api`
  const health = await fetch(`${base}/health`, { signal: AbortSignal.timeout(10000) })
  await health.arrayBuffer()
  const response = await fetch(`${base}/public-config`, { signal: AbortSignal.timeout(10000) })
  const body = await response.json()
  const data = body?.data
  const persistent = response.ok && data?.mode === 'supabase' && data?.demo === false && data?.applicationsOpen === true
  console.log(JSON.stringify({ healthStatus: health.status, readinessStatus: response.status, persistentModeReady: persistent,
    paymentInstructionsEnabled: persistent ? data.recipient?.enabled === true : null }))
  if (!ready || !persistent) process.exitCode = 2
} catch {
  console.error('Supabase diagnostic failed; check configuration/network locally. No private values logged.')
  process.exitCode = 1
} finally {
  if (server) await new Promise(resolve => server.close(resolve))
}
