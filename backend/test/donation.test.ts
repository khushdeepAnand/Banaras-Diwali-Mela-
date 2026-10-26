import request from 'supertest'
import { expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createApp } from '../src/app.js'
import { DemoStore } from '../src/store.js'
import { DONATION } from '../src/shared/donation.js'
vi.mock('node:fs/promises', async importOriginal => { const actual = await importOriginal<typeof import('node:fs/promises')>(); return { ...actual, readFile: vi.fn(actual.readFile) } })

it('reports only public payload evidence and keeps real payments unavailable in demo mode', async () => {
  const app = createApp({ mode: 'demo', store: new DemoStore() })
  const config = await request(app).get('/api/public-config')
  expect(config.body.data.donation).toEqual(DONATION)
  expect(config.body.data.donation).not.toHaveProperty('payload')
  expect(config.body.data.donation).not.toHaveProperty('decodedPayee')
  expect(JSON.stringify(config.body)).not.toContain('upi://pay?')
  expect((await request(app).get('/api/payment-qr')).status).toBe(404)
})
it('serves only the approved byte-verified image without requiring a database or enabling fake records', async () => {
  const app = createApp({ mode: 'unavailable' })
  const qr = await request(app).get('/api/payment-qr')
  expect(qr.status).toBe(200); expect(qr.headers['content-type']).toMatch(/image\/png/)
  expect(createHash('sha256').update(qr.body).digest('hex')).toBe(DONATION.cropSha256)
  const config = (await request(app).get('/api/public-config')).body.data
  expect(config.donationReferenceAvailable).toBe(false)
  expect((await request(app).post('/api/contributions').send({ amount: 21, utr: 'NOFAKERECORD' })).status).toBe(503)
  vi.mocked(readFile).mockResolvedValueOnce(Buffer.from('tampered QR'))
  expect((await request(app).get('/api/payment-qr')).status).toBe(404)
})
it('records owner-authorised non-demo donation references as pending without enabling rentals', async () => {
  const store = new DemoStore(), app = createApp({ mode: 'supabase', store })
  const config = (await request(app).get('/api/public-config')).body.data
  expect(config.accepting).toBe(false); expect(config.donationReferenceAvailable).toBe(true)
  const created = await request(app).post('/api/contributions').send({ amount: 51, utr: 'OWNERDONATION51' })
  expect(created.status).toBe(201); expect(created.body.data).toMatchObject({ status: 'pending_verification', demo: false })
  expect((await store.listContributions())[0].status).toBe('pending_verification')
  expect((await request(app).post('/api/contributions').send({ amount: 51, utr: 'ownerdonation51' })).status).toBe(409)
})
it('does not silently extend the stored contribution schema for a suggested ₹101', async () => {
  const app = createApp({ mode: 'demo', store: new DemoStore() })
  expect((await request(app).post('/api/contributions').send({ amount: 101, utr: 'DONATION101' })).status).toBe(400)
  const supported = await request(app).post('/api/contributions').send({ amount: 31, utr: 'DONATION031' })
  expect(supported.status).toBe(201)
  expect(supported.body.data.status).toBe('pending_verification')
})
