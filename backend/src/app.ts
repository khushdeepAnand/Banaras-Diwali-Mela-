import express, { type ErrorRequestHandler } from 'express'
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import { loadConfig } from './config.js'
import { applicationHash, applicationPaymentSchema, applicationSchema, applicationUpdateSchema, calculateFee, contributionSchema, contributionUpdateSchema, DEFAULT_SETTINGS, paymentUri, publicApplication, reference, settingsSchema, type Application, type Contribution } from './commerce.js'
import { DemoStore, DuplicateError, StoreUnavailableError, SupabaseStore, type CommerceStore } from './store.js'
import { DONATION } from './shared/donation.js'

export type AppOptions = { store?: CommerceStore; mode?: 'demo' | 'supabase' | 'unavailable'; adminToken?: string }
export function createApp(options: AppOptions = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use((_req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' })
    next()
  })
  app.use(express.json({ limit: '16kb' }))
  const config = loadConfig()
  const key = config.SUPABASE_SECRET_KEY || config.SUPABASE_SERVICE_ROLE_KEY
  const configured = Boolean(config.SUPABASE_URL && key)
  const mode = options.mode ?? (configured ? 'supabase' : config.DEMO_MODE === 'true' && config.NODE_ENV !== 'production' ? 'demo' : 'unavailable')
  const store = options.store ?? (mode === 'demo' ? new DemoStore() : mode === 'supabase' && configured ? new SupabaseStore(config.SUPABASE_URL, key) : null)
  const adminToken = options.adminToken ?? config.ADMIN_API_TOKEN
  const enabled = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!store) { res.status(503).json({ error: { code: 'NOT_CONFIGURED', message: 'Records are unavailable; configure Supabase or explicitly enable local demo mode.' } }); return }
    next()
  }
  const admin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!adminToken || adminToken.length < 32) { res.status(503).json({ error: { code: 'ADMIN_NOT_CONFIGURED', message: 'Organiser access not configured' } }); return }
    const supplied = req.header('authorization')?.replace(/^Bearer /i, '') ?? ''
    const left = Buffer.from(supplied), right = Buffer.from(adminToken)
    if (left.length !== right.length || !timingSafeEqual(left, right)) { res.status(401).json({ error: { code: 'UNAUTHORISED', message: 'Organiser authorisation required' } }); return }
    next()
  }
  const attempts = new Map<string, { count: number; until: number }>()
  const throttle = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const bucket = req.originalUrl.startsWith('/api/admin') ? 'admin' : req.method === 'GET' ? 'lookup' : 'submission'
    const limit = bucket === 'admin' ? 120 : bucket === 'lookup' ? 60 : 12
    const now = Date.now(), key = `${req.ip}:${bucket}`
    if (attempts.size >= 2000) {
      for (const [entry, value] of attempts) if (value.until < now) attempts.delete(entry)
      if (attempts.size >= 2000 && !attempts.has(key)) { res.setHeader('Retry-After', '900'); res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Service busy; try again later' } }); return }
    }
    const value = attempts.get(key)
    const current = !value || value.until < now ? { count: 1, until: now + 900_000 } : { count: value.count + 1, until: value.until }
    attempts.set(key, current)
    if (current.count > limit) { res.setHeader('Retry-After', Math.ceil((current.until - now) / 1000)); res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts; try again later' } }); return }
    next()
  }
  const parse = <T>(schema: z.ZodType<T>, body: unknown): T => {
    const result = schema.safeParse(body)
    if (!result.success) throw new InvalidRequest(result.error.issues[0]?.message ?? 'Invalid request')
    return result.data
  }

  app.use('/api/admin', throttle)
  app.param('reference', (_req, _res, next, value: string) => {
    if (!/^BDM[CS]-[A-F0-9]{12}$/.test(value)) { next(new InvalidRequest('Invalid record reference')); return }
    next()
  })

  app.get('/api/health', (req, res) => {
    const query = z.strictObject({}).safeParse(req.query)
    if (!query.success) {
      res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Unexpected query parameters' } })
      return
    }
    res.json({ data: { status: 'ok' } })
  })

  app.get('/api/public-config', async (_req, res) => {
    const settings = store ? await store.getSettings() : DEFAULT_SETTINGS
    const recipient = { ...settings.recipient }
    if (recipient.qrUrl === DONATION.qrUrl && (recipient.name !== DONATION.recipient.name || recipient.upiId !== DONATION.recipient.upiId)) recipient.enabled = false
    res.json({ data: { mode, donation: DONATION, donationReferenceAvailable: Boolean(store && (mode === 'demo' || DONATION.instructionsEnabled && DONATION.qrVerified && DONATION.ownerAuthorised)), recipient: mode === 'demo' ? { name: '', upiId: '', paymentUrl: '', qrUrl: '', enabled: false } : recipient, fees: settings.fees, applicationsOpen: Boolean(store), accepting: Boolean(store && (mode === 'demo' || recipient.enabled && recipient.name && (recipient.upiId || recipient.qrUrl))), demo: mode === 'demo' } })
  })
  app.get('/api/payment-qr', async (_req, res) => {
    if (mode !== 'demo' && DONATION.qrVerified && DONATION.instructionsEnabled && DONATION.ownerAuthorised) {
      try {
        const bytes = await readFile(new URL('../assets/donation-paytm-qr.png', import.meta.url))
        if (createHash('sha256').update(bytes).digest('hex') === DONATION.cropSha256) { res.type('png').send(bytes); return }
      } catch { /* Missing assets fail closed without logging local paths. */ }
    }
    res.status(404).json({ error: { code: 'QR_NOT_VERIFIED', message: 'Verified QR unavailable or local demo mode. No payment QR is served.' } })
  })
  app.post('/api/contributions', throttle, enabled, async (req, res) => {
    const input = parse(contributionSchema, req.body)
    if (mode !== 'demo' && !(DONATION.instructionsEnabled && DONATION.qrVerified && DONATION.ownerAuthorised)) throw new StoreUnavailableError('Donation details not enabled')
    const record: Contribution = { ...input, id: randomUUID(), reference: reference('BDMC'), status: 'pending_verification', createdAt: new Date().toISOString() }
    await store!.addContribution(record)
    res.status(201).json({ data: { reference: record.reference, amount: record.amount, status: record.status, demo: mode === 'demo', message: 'Reference submitted for manual review; this is not proof of payment.' } })
  })
  app.post('/api/applications', throttle, enabled, async (req, res) => {
    const input = parse(applicationSchema, req.body)
    const settings = await store!.getSettings()
    const record: Application = { ...input, id: randomUUID(), reference: reference('BDMS'), fee: calculateFee(input.durationDays, settings),
      utr: null, status: 'pending', paymentStatus: 'pending_payment', published: false, createdAt: new Date().toISOString(), approvedAt: null, expiresAt: null, requestHash: applicationHash(input) }
    await store!.addApplication(record)
    res.status(201).json({ data: { ...publicApplication(record), demo: mode === 'demo', message: 'Application pending. Any payment requires independent manual verification.' } })
  })
  app.get('/api/applications/:reference', throttle, enabled, async (req, res) => {
    const email = z.email().safeParse(req.query.email)
    if (!email.success) throw new InvalidRequest('Valid application email required')
    const item = await store!.getApplication(req.params.reference as string)
    if (!item || item.email.toLowerCase() !== email.data.toLowerCase()) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found' } }); return }
    res.json({ data: publicApplication(item) })
  })
  app.post('/api/applications/:reference/payment', throttle, enabled, async (req, res) => {
    const input = parse(applicationPaymentSchema, req.body)
    const item = await store!.getApplication(req.params.reference as string)
    if (!item || item.email.toLowerCase() !== input.email.toLowerCase()) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found' } }); return }
    if (item.paymentStatus === 'verified' || item.status === 'rejected') throw new InvalidRequest('Application is no longer awaiting payment details')
    const updated: Application = { ...item, utr: input.utr, paymentStatus: 'pending_verification' }
    await store!.updateApplication(updated, true)
    const saved = await store!.getApplication(item.reference)
    if (!saved) throw new StoreUnavailableError('Application unavailable after update')
    res.json({ data: publicApplication(saved) })
  })
  app.get('/api/stalls', async (_req, res) => {
    const applications = store ? await store.listApplications() : []
    res.json({ data: applications.map(item => publicApplication(item)).filter(item => item.published) })
  })
  app.get('/api/admin/records', admin, enabled, async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.json({ data: { applications: await store!.listApplications(), contributions: await store!.listContributions(), settings: await store!.getSettings(), mode } })
  })
  app.put('/api/admin/settings', admin, enabled, async (req, res) => {
    const settings = parse(settingsSchema, req.body)
    if (settings.recipient.qrUrl === DONATION.qrUrl && (settings.recipient.name !== DONATION.recipient.name || settings.recipient.upiId !== DONATION.recipient.upiId)) throw new InvalidRequest('The bundled QR is tied to the approved payee details. Clear its QR path when changing the recipient.')
    await store!.saveSettings(settings)
    res.json({ data: settings })
  })
  app.patch('/api/admin/applications/:reference', admin, enabled, async (req, res) => {
    const changes = parse(applicationUpdateSchema, req.body)
    const item = await store!.getApplication(req.params.reference as string)
    if (!item) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found' } }); return }
    if (changes.paymentVerified && !item.utr) throw new InvalidRequest('A submitted UTR is required before marking payment verified')
    const status = changes.status ?? item.status
    const approvedAt = status === 'approved' ? item.approvedAt ?? new Date().toISOString() : item.approvedAt
    const updated: Application = { ...item, status, paymentStatus: changes.paymentVerified === undefined ? item.paymentStatus : changes.paymentVerified ? 'verified' : 'pending_payment',
      published: changes.published ?? item.published, approvedAt, expiresAt: approvedAt ? new Date(new Date(approvedAt).getTime() + item.durationDays * 86_400_000).toISOString() : null }
    await store!.updateApplication(updated)
    res.json({ data: publicApplication(updated) })
  })
  app.patch('/api/admin/contributions/:reference', admin, enabled, async (req, res) => {
    const { status } = parse(contributionUpdateSchema, req.body)
    const record = (await store!.listContributions()).find(item => item.reference === req.params.reference)
    if (!record) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Contribution not found' } }); return }
    await store!.updateContribution({ ...record, status })
    res.json({ data: { reference: record.reference, status } })
  })

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } })
  })

  const handleError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof InvalidRequest) { res.status(400).json({ error: { code: 'INVALID_REQUEST', message: error.message } }); return }
    if (error instanceof DuplicateError) { res.status(409).json({ error: { code: 'DUPLICATE', message: 'This reference or application was already submitted' } }); return }
    if (error instanceof StoreUnavailableError) { res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Service temporarily unavailable; please retry later' } }); return }
    if (error instanceof SyntaxError && 'body' in error) {
      res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } })
      return
    }
    if (typeof error === 'object' && error && 'type' in error && error.type === 'entity.too.large') {
      res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds 16 KB' } }); return
    }
    if (typeof error === 'object' && error && 'status' in error && (error.status === 400 || error.status === 415)) {
      res.status(error.status).json({ error: { code: 'INVALID_REQUEST', message: 'Invalid request body or unsupported encoding' } }); return
    }
    console.error('Unhandled API error')
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
  }
  app.use(handleError)
  return app
}

class InvalidRequest extends Error {}
