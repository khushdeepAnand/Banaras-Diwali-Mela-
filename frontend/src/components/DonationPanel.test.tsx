import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { DonationPanel, donationApproved, donationReferenceAvailable, donationUpiLink } from './DonationPanel'
import { DONATION, referenceAmountSupported } from '../../../backend/src/shared/donation'
import type { PublicConfig } from './commerceApi'

const config: PublicConfig = { mode: 'supabase', demo: false, accepting: true, applicationsOpen: true, recipient: { name: 'Legacy recipient', upiId: 'legacy@upi', paymentUrl: 'https://example.test/pay', qrUrl: '/api/payment-qr', enabled: true }, fees: { threeDays: 900, sevenDays: 1800, customPerDay: 350 } }
it('never turns an enabled legacy configuration into a verified QR/payment/copy instruction', () => {
  const html = renderToStaticMarkup(<DonationPanel config={config} busy={false} contribution={null} onSubmit={() => {}} close={() => {}} />)
  expect(html).not.toContain('shreeramdiwalimela@ptyes')
  expect(html).not.toContain('Khushdeep Anand')
  expect(html).toContain('Personal payment details are not printed here')
  expect(html).toContain('QR temporarily unavailable')
  expect(html).not.toContain('<img')
  expect(html).not.toContain('upi://')
  expect(html).not.toContain('legacy@upi')
  expect(html).toMatch(/disabled=""[^>]*>Copy UPI ID/)
})
it('preserves reference amount restrictions while exposing only honest suggestions', () => {
  expect(DONATION.suggestedAmounts).toEqual([21, 51, 101])
  expect(DONATION.referenceAmounts).toEqual([21, 31, 51])
  expect(referenceAmountSupported(101)).toBe(false)
  expect(referenceAmountSupported(31)).toBe(true)
  expect(DONATION.qrVerified).toBe(true)
  expect(DONATION.instructionsEnabled).toBe(true)
})
it('requires matching current proof, never legacy flags alone, and builds only the approved UPI target', () => {
  const live: PublicConfig = { ...config, donation: DONATION, donationReferenceAvailable: true }
  expect(donationApproved(live)).toBe(true); expect(donationReferenceAvailable(live)).toBe(true)
  expect(donationApproved({ ...live, demo: true })).toBe(false)
  expect(donationApproved({ ...live, donation: { ...DONATION, cropSha256: 'wrong' } })).toBe(false)
  expect(donationApproved({ ...live, donation: { ...DONATION, recipient: { ...DONATION.recipient, upiId: 'another@upi' } } })).toBe(false)
  expect(donationApproved(config)).toBe(false)
  const link = new URL(donationUpiLink(101)!)
  expect(link.searchParams.get('pa')).toBe(DONATION.recipient.upiId)
  expect(link.searchParams.get('am')).toBe('101.00'); expect(link.searchParams.get('cu')).toBe('INR')
  expect(donationUpiLink(NaN)).toBeNull(); expect(donationUpiLink(-1)).toBeNull()
})
