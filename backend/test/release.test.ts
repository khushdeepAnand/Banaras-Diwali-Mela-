import request from 'supertest'
import { afterEach, expect, it, vi } from 'vitest'
import { loadConfig } from '../src/config.js'
import { createApp } from '../src/app.js'
import { DEFAULT_SETTINGS } from '../src/commerce.js'
import { SupabaseStore } from '../src/store.js'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })
const base = { NODE_ENV: 'production', SUPABASE_URL: 'https://project.supabase.co', ADMIN_API_TOKEN: 'test-only-organiser-token-with-at-least-32-characters' }

it('supports secret and legacy keys, identical aliases, and rejects conflicting or public keys', () => {
  expect(loadConfig({ ...base, SUPABASE_SECRET_KEY: 'sb_secret_test-only' }).DEMO_MODE).toBe('false')
  expect(loadConfig({ ...base, SUPABASE_SERVICE_ROLE_KEY: 'legacy-test-only' }).SUPABASE_SECRET_KEY).toBe('')
  expect(() => loadConfig({ ...base, SUPABASE_SECRET_KEY: 'sb_secret_test-only', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test-only' })).not.toThrow()
  for (const keys of [
    { SUPABASE_SECRET_KEY: 'sb_secret_one', SUPABASE_SERVICE_ROLE_KEY: 'other' },
    { SUPABASE_SECRET_KEY: 'sb_publishable_test-only' },
    { SUPABASE_SERVICE_ROLE_KEY: 'sb_publishable_test-only' },
    { SUPABASE_SERVICE_ROLE_KEY: `eyJhbGciOiJIUzI1NiJ9.${Buffer.from('{"role":"anon"}').toString('base64url')}.test` },
    { SUPABASE_SECRET_KEY: 'not-a-secret-key' },
  ]) expect(() => loadConfig({ ...base, ...keys })).toThrow()
  expect(() => loadConfig({ SUPABASE_SECRET_KEY: 'sb_secret_test-only' })).toThrow()
})

it('wires secret-only configuration to the HTTPS adapter without sending a non-JWT bearer', async () => {
  vi.stubEnv('SUPABASE_URL', base.SUPABASE_URL)
  vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test-only')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([{ value: DEFAULT_SETTINGS }])))
  const response = await request(createApp()).get('/api/public-config')
  expect(response.status).toBe(200)
  expect(response.body.data).toMatchObject({ mode: 'supabase', accepting: false, applicationsOpen: true })
  const headers = fetcher.mock.calls[0][1]!.headers as Record<string, string>
  expect(headers.apikey).toBe('sb_secret_test-only')
  expect(headers).not.toHaveProperty('Authorization')
  expect(JSON.stringify(response.body)).not.toContain('sb_secret_')
})

it('retains the legacy bearer mechanism', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([{ value: DEFAULT_SETTINGS }])))
  await new SupabaseStore(base.SUPABASE_URL, 'legacy-test-only').getSettings()
  expect(fetcher.mock.calls[0][1]!.headers).toMatchObject({ apikey: 'legacy-test-only', Authorization: 'Bearer legacy-test-only' })
})
