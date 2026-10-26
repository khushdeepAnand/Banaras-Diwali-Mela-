// Public payload evidence + explicit owner approval. No bank ownership/settlement claim.
// Only the lossless approved QR crop is public; full posters/reports remain private.
export const DONATION = {
  recipient: { name: 'Khushdeep Anand', upiId: 'shreeramdiwalimela@ptyes' },
  qrStatus: 'payee-match-owner-authorised',
  qrVerified: true,
  instructionsEnabled: true,
  ownerAuthorised: true,
  bankOwnershipVerified: false,
  qrUrl: '/api/payment-qr',
  encodedCurrency: null,
  fixedAmount: null,
  currency: 'INR',
  suggestedAmounts: [21, 51, 101],
  referenceAmounts: [21, 31, 51],
  sourceSha256: 'f2947b53820ba1b3a6ccfcef7406d004453d8f5440da816983a529d8ba8dc162',
  cropSha256: '3d0887baef035c36ad1fb8ca4a404a96975abd4c81e393ee6a2a6e35d8776f14',
} as const
export type DonationConfig = { recipient: { name: string; upiId: string }; qrStatus: string; qrVerified: boolean; instructionsEnabled: boolean; ownerAuthorised?: boolean; bankOwnershipVerified?: boolean; qrUrl?: string; fixedAmount: number | null; currency: string; suggestedAmounts: readonly number[]; referenceAmounts: readonly number[]; sourceSha256: string; cropSha256: string }
export type ReferenceAmount = 21 | 31 | 51
export const referenceAmountSupported = (amount: number): amount is ReferenceAmount => amount === 21 || amount === 31 || amount === 51
