import express from 'express'
import request from 'supertest'
import { afterEach, expect, it, vi } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadConfig } from '../src/config.js'
import { createApp } from '../src/app.js'
import { mountFrontend } from '../src/static.js'

afterEach(() => vi.unstubAllEnvs())
const staging = { NODE_ENV: 'production', DEMO_MODE: 'true', STAGING_DEMO: 'true', ADMIN_API_TOKEN: 'unit-only-staging-token-longer-than-32-characters' }
it('keeps ordinary production fail-closed and permits only isolated explicit staging demo', () => {
  expect(loadConfig(staging)).toMatchObject({ STAGING_DEMO: 'true', SERVE_FRONTEND: 'false' })
  for (const env of [
    { ...staging, STAGING_DEMO: 'false' }, { ...staging, DEMO_MODE: 'false' },
    { ...staging, NODE_ENV: 'test' }, { ...staging, ADMIN_API_TOKEN: '' },
    { ...staging, SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'unit-only' },
  ]) expect(() => loadConfig(env)).toThrow()
})
it('staging returns demo config, refuses real QR and never upgrades references into payment proof', async () => {
  for (const [key, value] of Object.entries(staging)) vi.stubEnv(key, value)
  vi.stubEnv('SUPABASE_URL', ''); vi.stubEnv('SUPABASE_SECRET_KEY', ''); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
  const app = createApp()
  expect((await request(app).get('/api/public-config')).body.data).toMatchObject({ mode: 'demo', demo: true, recipient: { enabled: false, upiId: '' } })
  expect((await request(app).get('/api/payment-qr')).status).toBe(404)
  const result = await request(app).post('/api/contributions').send({ amount: 21, utr: 'DEMOONLY123' })
  expect(result.body.data).toMatchObject({ demo: true, status: 'pending_verification' })
  expect((await request(app).get('/api/admin/records')).status).toBe(401)
})
it('serves bounded public assets/ranges and HTML fallback without swallowing API, private or missing assets', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'banaras-static-test-'))
  try {
    for (const folder of ['assets', 'audio', 'gallery']) mkdirSync(join(directory, folder))
    writeFileSync(join(directory, 'index.html'), '<!doctype html><title>Test mela</title>')
    writeFileSync(join(directory, 'assets', 'index-hash.js'), 'console.log("public")')
    writeFileSync(join(directory, 'assets', 'index-hash.js.map'), 'private source map')
    writeFileSync(join(directory, 'audio', 'sample.mp3'), Buffer.alloc(2048))
    writeFileSync(join(directory, '.env'), 'must not serve')
    const app = express()
    app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok' } }))
    mountFrontend(app, pathToFileURL(directory), ['https://staging.example'], true)
    app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND' } }))
    for (const path of ['/', '/?room=ABCDEF1234', '/index.html', '/future-route']) {
      const response = await request(app).get(path).set('Accept', 'text/html')
      expect(response.status).toBe(200); expect(response.text).toContain('Test mela')
      expect(response.headers['content-security-policy']).toContain('wss://staging.example')
      expect(response.headers['x-robots-tag']).toBe('noindex, nofollow')
      expect(response.headers['cache-control']).toBe('no-cache')
    }
    expect((await request(app).get('/api/health')).body).toEqual({ data: { status: 'ok' } })
    for (const path of ['/api/missing', '/assets/missing.js', '/audio/missing.mp3', '/gallery/missing.png', '/.env', '/assets/index-hash.js.map', '/backend/.env']) expect((await request(app).get(path).set('Accept', 'text/html')).status).toBe(404)
    const asset = await request(app).get('/assets/index-hash.js')
    expect(asset.headers['cache-control']).toContain('immutable')
    expect(asset.headers['content-type']).toContain('javascript')
    const audio = await request(app).get('/audio/sample.mp3').set('Range', 'bytes=0-127')
    expect(audio.status).toBe(206); expect(audio.headers['content-type']).toContain('audio/mpeg')
    expect(audio.headers['content-range']).toBe('bytes 0-127/2048')
    expect((await request(app).post('/future-route')).status).toBe(404)
    expect((await request(app).head('/')).status).toBe(200)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
it('refuses static mode when the production frontend is absent', () => {
  expect(() => mountFrontend(express(), pathToFileURL(join(tmpdir(), 'not-built-banaras')), [], true)).toThrow('Build the frontend')
})
