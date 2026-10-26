import { randomUUID, createHash } from 'node:crypto'
import { z } from 'zod'
import { DONATION } from './shared/donation.js'

const text = (max: number) => z.string().trim().min(2).max(max)
export const utrSchema = z.string().trim().regex(/^[A-Za-z0-9-]{6,40}$/, 'Enter a 6–40 character UTR/reference (letters, numbers or hyphens)')
export const recipientSchema = z.object({
  name: z.string().trim().max(100).default(''),
  upiId: z.union([z.literal(''), z.string().trim().regex(/^[\w.+-]{2,100}@[\w.-]{2,80}$/)]).default(''),
  paymentUrl: z.union([z.literal(''), z.url().refine(value => value.startsWith('https://'), 'HTTPS required')]).default(''),
  qrUrl: z.union([z.literal(''), z.literal('/api/payment-qr'), z.url().refine(value => value.startsWith('https://'), 'HTTPS required')]).default(''),
  enabled: z.boolean().default(false),
})
export const settingsSchema = z.object({
  recipient: recipientSchema,
  fees: z.object({ threeDays: z.number().int().min(1).max(100000), sevenDays: z.number().int().min(1).max(100000), customPerDay: z.number().int().min(1).max(100000) }),
}).strict()
export type Settings = z.infer<typeof settingsSchema>
export const DEFAULT_SETTINGS: Settings = { recipient: { ...DONATION.recipient, paymentUrl: '', qrUrl: DONATION.qrUrl, enabled: false }, fees: { threeDays: 900, sevenDays: 1800, customPerDay: 350 } }

export const contributionSchema = z.object({ amount: z.union([z.literal(21), z.literal(31), z.literal(51)]), utr: utrSchema,
  contact: z.union([z.literal(''), z.email().max(254), z.string().regex(/^\+?[0-9 -]{7,20}$/)]).default('') }).strict()
export const applicationSchema = z.object({
  stallName: text(80), vendorName: text(80), email: z.email().max(150), phone: z.string().trim().regex(/^\+?[0-9 -]{7,20}$/),
  category: text(60), description: z.string().trim().min(15).max(600), products: z.array(text(80)).max(6).default([]),
  durationDays: z.number().int().min(1).max(30),
}).strict()
export const applicationPaymentSchema = z.object({ email: z.email(), utr: utrSchema }).strict()
export const applicationUpdateSchema = z.object({ status: z.enum(['pending', 'approved', 'rejected']).optional(), paymentVerified: z.boolean().optional(), published: z.boolean().optional() }).strict().refine(value => Object.keys(value).length > 0)
export const contributionUpdateSchema = z.object({ status: z.enum(['verified', 'rejected']) }).strict()

export type Contribution = z.infer<typeof contributionSchema> & { id: string; reference: string; status: 'pending_verification' | 'verified' | 'rejected'; createdAt: string }
export type Application = z.infer<typeof applicationSchema> & { id: string; reference: string; fee: number; utr: string | null; status: 'pending' | 'approved' | 'rejected' | 'expired'; paymentStatus: 'pending_payment' | 'pending_verification' | 'verified'; published: boolean; createdAt: string; approvedAt: string | null; expiresAt: string | null; requestHash: string }
export const reference = (prefix: string) => `${prefix}-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`
export function calculateFee(days: number, settings: Settings) { return days === 3 ? settings.fees.threeDays : days === 7 ? settings.fees.sevenDays : days * settings.fees.customPerDay }
export function applicationHash(input: z.infer<typeof applicationSchema>, now = new Date()) {
  return createHash('sha256').update(`${now.toISOString().slice(0, 10)}|${input.email.toLowerCase()}|${input.stallName.toLowerCase()}|${input.durationDays}`).digest('hex')
}
export function publicApplication(app: Application, now = new Date()) {
  const expired = Boolean(app.expiresAt && new Date(app.expiresAt) <= now)
  return { reference: app.reference, stallName: app.stallName, category: app.category, description: app.description,
    products: app.products, durationDays: app.durationDays, fee: app.fee, status: expired ? 'expired' : app.status,
    paymentStatus: app.paymentStatus, published: app.published && !expired && app.status === 'approved' && app.paymentStatus === 'verified', expiresAt: app.expiresAt }
}
export function paymentUri(recipient: Settings['recipient'], amount: number, reference: string) {
  if (!recipient.name || !recipient.upiId) return null
  return `upi://pay?${new URLSearchParams({ pa: recipient.upiId, pn: recipient.name, am: amount.toFixed(2), cu: 'INR', tn: reference }).toString()}`
}
