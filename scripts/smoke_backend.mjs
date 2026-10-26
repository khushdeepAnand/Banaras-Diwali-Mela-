// Run from repository root after backend build. Uses no real credentials.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'

const cwd = fileURLToPath(new URL('../backend/', import.meta.url))
const env = { ...process.env, SUPABASE_URL: '', SUPABASE_SECRET_KEY: '', SUPABASE_SERVICE_ROLE_KEY: '', ADMIN_API_TOKEN: '', DEMO_MODE: 'false', TRUST_PROXY_HOPS: '0' }
const invalid = spawnSync(process.execPath, ['dist/server.js'], { cwd, env: { ...env, NODE_ENV: 'production', ADMIN_API_TOKEN: 'redaction-test-only' }, encoding: 'utf8' })
assert.equal(invalid.status, 1)
assert.match(invalid.stderr, /Invalid backend configuration/)
assert.doesNotMatch(invalid.stderr, /redaction-test-only/)

const probe = createServer().listen(0, '127.0.0.1')
await once(probe, 'listening')
const port = probe.address().port
await new Promise(resolve => probe.close(resolve))
const server = spawn(process.execPath, ['dist/server.js'], { cwd, env: { ...env, NODE_ENV: 'development', PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] })
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Backend startup timed out')), 10_000)
    server.once('error', reject)
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Unexpected backend exit: ${code}`)) })
    server.stdout.on('data', data => {
      if (String(data).includes('Backend listening')) { clearTimeout(timeout); resolve() }
    })
  })
  const base = `http://127.0.0.1:${port}/api`
  assert.deepEqual(await (await fetch(`${base}/health`)).json(), { data: { status: 'ok' } })
  assert.equal((await (await fetch(`${base}/public-config`)).json()).data.accepting, false)
  assert.equal((await fetch(`${base}/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 503)
  assert.equal((await fetch(`${base}/admin/records`)).status, 503)
  assert.equal((await fetch(`${base}/missing`)).status, 404)
  console.log('PASS: compiled backend liveness, unavailable persistence, organiser fail-closed, API 404 and redacted invalid-production startup')
} finally {
  server.kill('SIGTERM')
  await once(server, 'exit')
}
