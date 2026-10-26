import type { DonationConfig } from '../../../backend/src/shared/donation'
export type PublicConfig = { mode: 'demo' | 'supabase' | 'unavailable'; accepting: boolean; applicationsOpen: boolean; demo: boolean; donation?: DonationConfig; donationReferenceAvailable?: boolean; recipient: { name: string; upiId: string; paymentUrl: string; qrUrl: string; enabled: boolean }; fees: { threeDays: number; sevenDays: number; customPerDay: number } }
export type PublicApplication = { reference: string; stallName: string; category: string; description: string; products: string[]; durationDays: number; fee: number; status: 'pending' | 'approved' | 'rejected' | 'expired'; paymentStatus: 'pending_payment' | 'pending_verification' | 'verified'; published: boolean; expiresAt: string | null }
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
export async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  let response: Response
  try { response = await fetch(`${API_BASE}/api${path}`, { ...options, signal: options.signal ?? AbortSignal.timeout(15_000), headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } }) }
  catch { throw new Error('Network unavailable. Check the backend and retry.') }
  const body = await response.json().catch(() => ({})) as { data?: T; error?: { message?: string } }
  if (!body || typeof body !== 'object') throw new Error('Invalid server response; please retry.')
  if (!response.ok) throw new Error(body.error?.message || `Request failed (${response.status}); please retry.`)
  if (!Object.hasOwn(body, 'data')) throw new Error('Invalid server response; please retry.')
  return body.data as T
}
export const assetUrl = (path: string) => path.startsWith('/api/') ? `${API_BASE}${path}` : path
export const upiLink = (recipient: PublicConfig['recipient'], amount: number) => recipient.name && recipient.upiId
  ? `upi://pay?${new URLSearchParams({ pa: recipient.upiId, pn: recipient.name, am: amount.toFixed(2), cu: 'INR', tn: 'Banaras Diwali Mela contribution' })}` : null
export const rentalFee = (days: number, fees: PublicConfig['fees']) => days === 3 ? fees.threeDays : days === 7 ? fees.sevenDays : days * fees.customPerDay
