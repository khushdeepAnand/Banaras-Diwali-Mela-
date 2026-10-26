import request from 'supertest'
import { gzipSync } from 'node:zlib'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'
import { DEFAULT_SETTINGS, type Application } from '../src/commerce.js'
import { DemoStore, StoreUnavailableError, SupabaseStore } from '../src/store.js'

const token = 'test-only-organiser-token-with-at-least-32-characters'
const vendor = { stallName: 'Test stall', vendorName: 'Test vendor', email: 'test@example.test', phone: '+919876543210', category: 'Crafts', description: 'Demonstration handmade crafts.', products: ['Sample'], durationDays: 3 }
afterEach(() => vi.restoreAllMocks())

describe('production boundaries', () => {
  it('accepts bounded gzip JSON but rejects malformed trailing bytes and oversized inflated bodies', async () => {
    const server = createApp({ mode: 'demo', store: new DemoStore() }).listen(0, '127.0.0.1')
    await once(server, 'listening')
    try {
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/contributions`
      const valid = gzipSync(JSON.stringify({ amount: 21, utr: 'GZIPREF123' }))
      const cases: [Buffer, number][] = [[valid, 201], [Buffer.concat([valid, Buffer.from('invalid trailing bytes')]), 400], [gzipSync(JSON.stringify({ text: 'x'.repeat(17000) })), 413]]
      for (const [body, status] of cases) {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }, body: Uint8Array.from(body).buffer, signal: AbortSignal.timeout(5000) })
        expect(response.status).toBe(status)
        await response.arrayBuffer()
      }
    } finally { await new Promise<void>(resolve => server.close(() => resolve())) }
  })
  it('fails closed on missing, partial, insecure or demo production configuration', () => {
    for (const env of [{ NODE_ENV: 'production' }, { SUPABASE_URL: 'https://project.supabase.co' }, { ADMIN_API_TOKEN: 'short' }, { SUPABASE_URL: 'http://remote.test', SUPABASE_SERVICE_ROLE_KEY: 'test' }, { TRUST_PROXY_HOPS: '-1' }]) expect(() => loadConfig(env)).toThrow()
    const env = { NODE_ENV: 'production', SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-only', ADMIN_API_TOKEN: token }
    expect(loadConfig(env).DEMO_MODE).toBe('false')
    expect(() => loadConfig({ ...env, DEMO_MODE: 'true' })).toThrow()
    expect(() => loadConfig({ ...env, SUPABASE_URL: 'http://localhost:54321' })).toThrow()
    expect(() => loadConfig({ ...env, SUPABASE_URL: 'https://user:password@project.supabase.co' })).toThrow()
  })
  it('protects every organiser operation with absent, incorrect and short credentials', async () => {
    const app = createApp({ mode: 'demo', store: new DemoStore(), adminToken: token })
    for (const [method, path] of [['get', '/api/admin/records'], ['put', '/api/admin/settings'], ['patch', '/api/admin/applications/BDMS-012345ABCDEF'], ['patch', '/api/admin/contributions/BDMC-012345ABCDEF']] as const) {
      expect((await request(app)[method](path).send({})).status).toBe(401)
      expect((await request(app)[method](path).set('Authorization', 'Bearer wrong').send({})).status).toBe(401)
    }
    expect((await request(createApp({ adminToken: 'short' })).get('/api/admin/records')).status).toBe(503)
  })
  it('rejects malformed, oversized and client-privileged payloads; private responses are not cacheable', async () => {
    const app = createApp({ mode: 'demo', store: new DemoStore(), adminToken: token })
    expect((await request(app).post('/api/applications').send({ ...vendor, published: true })).status).toBe(400)
    expect((await request(app).post('/api/contributions').send({ amount: 21, utr: 'ABC12345', status: 'verified' })).status).toBe(400)
    expect((await request(app).post('/api/applications').set('Content-Type', 'application/json').send('{')).status).toBe(400)
    expect((await request(app).post('/api/applications').send({ text: 'x'.repeat(17000) })).status).toBe(413)
    const admin = await request(app).get('/api/admin/records').set('Authorization', `Bearer ${token}`)
    expect(admin.headers['cache-control']).toBe('no-store')
    expect(admin.headers['access-control-allow-origin']).toBeUndefined()
    expect((await request(app).get('/api/applications/not-a-reference?email=test@example.test')).status).toBe(400)
  })
  it('throttles submission paths together, ignoring spoofed forwarding headers', async () => {
    const app = createApp({ mode: 'demo', store: new DemoStore() })
    for (let i = 0; i < 12; i++) await request(app).post('/api/contributions').set('X-Forwarded-For', `192.0.2.${i}`).send({ amount: 9 })
    const result = await request(app).post('/api/applications/BDMS-012345ABCDEF/payment').send({ email: vendor.email, utr: 'REF12345' })
    expect(result.status).toBe(429)
    expect(Number(result.headers['retry-after'])).toBeGreaterThan(0)
  })
  it('does not claim persistence after database writes fail, and keeps applicant contacts private', async () => {
    const store = new DemoStore()
    const app = createApp({ mode: 'demo', store, adminToken: token })
    vi.spyOn(store, 'addApplication').mockRejectedValueOnce(new StoreUnavailableError('private database details'))
    const failed = await request(app).post('/api/applications').send(vendor)
    expect(failed.status).toBe(503)
    expect(JSON.stringify(failed.body)).not.toContain('private database')
    vi.spyOn(store, 'addContribution').mockRejectedValueOnce(new StoreUnavailableError('private database details'))
    expect((await request(app).post('/api/contributions').send({ amount: 21, utr: 'REF12345' })).status).toBe(503)
    const created = await request(app).post('/api/applications').send(vendor)
    const ref = created.body.data.reference
    const lookup = await request(app).get(`/api/applications/${ref}?email=${vendor.email}`)
    for (const field of ['email', 'phone', 'vendorName', 'utr', 'requestHash']) expect(lookup.body.data).not.toHaveProperty(field)
    expect((await request(app).get('/api/stalls')).body.data).toEqual([])
  })
  it('prevents duplicate stall UTRs and stale public updates after organiser verification', async () => {
    const store = new DemoStore()
    const app = createApp({ mode: 'demo', store })
    const one = (await request(app).post('/api/applications').send(vendor)).body.data.reference
    const two = (await request(app).post('/api/applications').send({ ...vendor, stallName: 'Other stall' })).body.data.reference
    expect((await request(app).post(`/api/applications/${one}/payment`).send({ email: vendor.email, utr: 'UNIQUE123' })).status).toBe(200)
    expect((await request(app).post(`/api/applications/${two}/payment`).send({ email: vendor.email, utr: 'unique123' })).status).toBe(409)
    const stale = (await store.getApplication(one))!
    await store.updateApplication({ ...stale, paymentStatus: 'verified' })
    await expect(store.updateApplication({ ...stale, utr: 'REPLACE123' }, true)).rejects.toBeInstanceOf(StoreUnavailableError)
  })
})

describe('PostgREST adapter (mock transport, not live Supabase)', () => {
  it('continues past a server row cap instead of silently omitting older records', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('[{"reference":"first"}]'))
      .mockResolvedValueOnce(new Response('[{"reference":"second"}]'))
      .mockResolvedValueOnce(new Response('[]'))
    const records = await new SupabaseStore('https://project.supabase.co', 'test-only').listContributions()
    expect(records.map(item => item.reference)).toEqual(['first', 'second'])
    expect(fetcher.mock.calls[1][0]).toContain('&offset=1')
    expect(fetcher.mock.calls[2][0]).toContain('&offset=2')
  })
  it('uses only server credentials and rejects zero-row updates or missing settings', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]', { status: 200 }))
    const store = new SupabaseStore('https://project.supabase.co', 'server-test-key')
    await expect(store.saveSettings(DEFAULT_SETTINGS)).rejects.toBeInstanceOf(StoreUnavailableError)
    const [url, options] = fetcher.mock.calls[0]
    expect(url).toBe('https://project.supabase.co/rest/v1/mela_settings?id=eq.main')
    expect(options?.headers).toMatchObject({ Authorization: 'Bearer server-test-key', Prefer: 'return=representation' })
    await expect(store.getSettings()).rejects.toBeInstanceOf(StoreUnavailableError)
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify([{ value: DEFAULT_SETTINGS }])))
    expect(await store.getSettings()).toEqual(DEFAULT_SETTINGS)
  })
  it('maps conflict, network, malformed and database errors without details', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch')
    const app = createApp({ mode: 'supabase', store: new SupabaseStore('https://project.supabase.co', 'secret-test-only') })
    for (const status of [409, 401, 500]) {
      fetcher.mockResolvedValueOnce(new Response('sensitive database detail', { status }))
      const result = await request(app).post('/api/applications').send(vendor)
      expect(result.status).toBe(status === 409 ? 409 : 503)
      expect(JSON.stringify(result.body)).not.toMatch(/sensitive|secret-test-only/)
    }
    fetcher.mockRejectedValueOnce(new Error('network details'))
    expect((await request(app).get('/api/public-config')).status).toBe(503)
    fetcher.mockResolvedValueOnce(new Response('not json'))
    expect((await request(app).get('/api/public-config')).status).toBe(503)
  })
  it('writes pending records and limits public payment patches to guarded payment fields', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch')
    const store = new SupabaseStore('https://project.supabase.co', 'server-test-key')
    const app = createApp({ mode: 'supabase', store })
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify([{ value: DEFAULT_SETTINGS }]))).mockResolvedValueOnce(new Response(null, { status: 201 }))
    expect((await request(app).post('/api/applications').send(vendor)).status).toBe(201)
    const sent = JSON.parse(fetcher.mock.calls[1][1]!.body as string) as Application
    expect(sent).toMatchObject({ status: 'pending', paymentStatus: 'pending_payment', published: false, fee: 900 })
    fetcher.mockResolvedValueOnce(new Response('[{}]'))
    await store.updateApplication({ ...sent, utr: 'PAYREF123', paymentStatus: 'pending_verification' }, true)
    expect(fetcher.mock.calls[2][0]).toContain('&paymentStatus=neq.verified&status=neq.rejected')
    expect(JSON.parse(fetcher.mock.calls[2][1]!.body as string)).toEqual({ utr: 'PAYREF123', paymentStatus: 'pending_verification' })
  })
})
