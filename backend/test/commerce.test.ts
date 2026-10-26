import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { DemoStore, SupabaseStore } from '../src/store.js'
import { applicationHash, calculateFee, DEFAULT_SETTINGS, paymentUri, publicApplication } from '../src/commerce.js'

const token = 'local-test-token-only-do-not-use-in-production-123456'
const vendor = { stallName: 'Kashi Weaves', vendorName: 'Ravi Kumar', email: 'ravi@example.test', phone: '+919876543210', category: 'Textiles', description: 'Handwoven textile samples with festive borders.', products: ['Silk stole'], durationDays: 3 }
describe('commerce API', () => {
  it('accepts only valid ₹21/31/51 reference submissions as pending, prevents duplicate UTR', async () => {
    const app = createApp({ mode: 'demo', store: new DemoStore() })
    expect((await request(app).post('/api/contributions').send({ amount: 9, utr: 'ABC12345' })).status).toBe(400)
    expect((await request(app).post('/api/contributions').send({ amount: 21, utr: 'no' })).status).toBe(400)
    const result = await request(app).post('/api/contributions').send({ amount: 31, utr: 'ABC12345' })
    expect(result.status).toBe(201)
    expect(result.body.data.status).toBe('pending_verification')
    expect(result.body.data.demo).toBe(true)
    expect(result.body.data.message).toMatch(/not proof of payment/)
    expect((await request(app).post('/api/contributions').send({ amount: 31, utr: 'abc12345' })).status).toBe(409)
  })
  it('never lets a public visitor mark a contribution verified', async () => {
    const app = createApp({ mode: 'demo', store: new DemoStore(), adminToken: token })
    const created = await request(app).post('/api/contributions').send({ amount: 51, utr: 'MANUAL12345' })
    const ref = created.body.data.reference
    expect((await request(app).patch(`/api/admin/contributions/${ref}`).send({ status: 'verified' })).status).toBe(401)
    expect((await request(app).get('/api/admin/records').set('Authorization', `Bearer ${token}`)).body.data.contributions[0].status).toBe('pending_verification')
    expect((await request(app).patch(`/api/admin/contributions/${ref}`).set('Authorization', `Bearer ${token}`).send({ status: 'verified' })).body.data.status).toBe('verified')
  })
  it('validates vendors, computes server fee, checks status ownership and duplicate applications', async () => {
    const app = createApp({ mode: 'demo', store: new DemoStore() })
    expect((await request(app).post('/api/applications').send({ ...vendor, phone: '000' })).status).toBe(400)
    const result = await request(app).post('/api/applications').send(vendor)
    expect(result.status).toBe(201)
    expect(result.body.data).toMatchObject({ fee: 900, status: 'pending', paymentStatus: 'pending_payment', published: false })
    const ref = result.body.data.reference
    expect((await request(app).post('/api/applications').send(vendor)).status).toBe(409)
    expect((await request(app).get(`/api/applications/${ref}?email=other@example.test`)).status).toBe(404)
    expect((await request(app).get(`/api/applications/${ref}?email=${vendor.email}`)).body.data.status).toBe('pending')
    const payment = await request(app).post(`/api/applications/${ref}/payment`).send({ email: vendor.email, utr: 'STL123456' })
    expect(payment.body.data.paymentStatus).toBe('pending_verification')
    expect(payment.body.data.published).toBe(false)
  })
  it('protects administration server-side; approves only verified published stalls and hides expired ones', async () => {
    const app = createApp({ mode: 'demo', store: new DemoStore(), adminToken: token })
    const created = await request(app).post('/api/applications').send(vendor)
    const ref = created.body.data.reference
    expect((await request(app).get('/api/admin/records')).status).toBe(401)
    expect((await request(app).get('/api/payment-qr')).status).toBe(404)
    expect((await request(app).patch(`/api/admin/applications/${ref}`).send({ status: 'approved', published: true })).status).toBe(401)
    const auth = { Authorization: `Bearer ${token}` }
    const approved = await request(app).patch(`/api/admin/applications/${ref}`).set(auth).send({ status: 'approved', published: true })
    expect(approved.body.data.published).toBe(false)
    expect((await request(app).patch(`/api/admin/applications/${ref}`).set(auth).send({ paymentVerified: true })).status).toBe(400)
    expect((await request(app).post(`/api/applications/${ref}/payment`).send({ email: vendor.email, utr: 'PAID123456' })).status).toBe(200)
    const verified = await request(app).patch(`/api/admin/applications/${ref}`).set(auth).send({ paymentVerified: true })
    expect(verified.body.data.published).toBe(true)
    expect((await request(app).get('/api/stalls')).body.data).toHaveLength(1)
    const old = (await request(app).get('/api/admin/records').set(auth)).body.data.applications[0]
    expect(publicApplication({ ...old, expiresAt: '2000-01-01T00:00:00Z' }).published).toBe(false)
    expect(publicApplication({ ...old, expiresAt: '2000-01-01T00:00:00Z' }).status).toBe('expired')
    expect((await request(app).put('/api/admin/settings').set(auth).send({ ...DEFAULT_SETTINGS, fees: { threeDays: 1200, sevenDays: 2100, customPerDay: 400 } })).status).toBe(200)
  })
  it('rejects unconfigured persistence and admin, supplies no fake payment recipient', async () => {
    const app = createApp({ mode: 'unavailable' })
    expect((await request(app).get('/api/public-config')).body.data.accepting).toBe(false)
    expect((await request(app).post('/api/contributions').send({ amount: 21, utr: 'ABC12345' })).status).toBe(503)
    expect((await request(app).post('/api/applications').send(vendor)).status).toBe(503)
    expect((await request(app).get('/api/admin/records')).status).toBe(503)
    expect(paymentUri({ ...DEFAULT_SETTINGS.recipient, upiId: '' }, 21, 'ref')).toBeNull()
    expect(calculateFee(7, DEFAULT_SETTINGS)).toBe(1800)
    expect(applicationHash(vendor)).toHaveLength(64)
  })
  it('returns a safe retryable response when the configured database is offline', async () => {
    const app = createApp({ mode: 'supabase', store: new SupabaseStore('http://127.0.0.1:9', 'test-key') })
    const result = await request(app).post('/api/contributions').send({ amount: 21, utr: 'OFFLINE123' })
    expect(result.status).toBe(503)
    expect(result.body.error.code).toBe('DATABASE_UNAVAILABLE')
    expect(JSON.stringify(result.body)).not.toContain('test-key')
  })
  it('serves only the newly approved QR, and prevents changing its recipient through legacy settings', async () => {
    const app = createApp({ mode: 'supabase', store: new DemoStore(), adminToken: token })
    expect((await request(app).get('/api/public-config')).body.data.accepting).toBe(false)
    expect((await request(app).get('/api/payment-qr')).status).toBe(200)
    const settings = { ...DEFAULT_SETTINGS, recipient: { ...DEFAULT_SETTINGS.recipient, enabled: true } }
    expect((await request(app).put('/api/admin/settings').set('Authorization', `Bearer ${token}`).send({ ...settings, recipient: { ...settings.recipient, upiId: 'another@upi' } })).status).toBe(400)
    expect((await request(app).put('/api/admin/settings').set('Authorization', `Bearer ${token}`).send(settings)).status).toBe(200)
    expect((await request(app).get('/api/public-config')).body.data.accepting).toBe(true)
    const qr = await request(app).get('/api/payment-qr')
    expect(qr.status).toBe(200)
    expect(qr.headers['content-type']).toMatch(/image\/png/)
    const config = (await request(app).get('/api/public-config')).body.data
    expect(config.donation).toMatchObject({ qrVerified: true, instructionsEnabled: true, bankOwnershipVerified: false, qrStatus: 'payee-match-owner-authorised', recipient: { upiId: 'shreeramdiwalimela@ptyes' } })
  })
})
