import { useEffect, useState, type FormEvent } from 'react'
import { DONATION, referenceAmountSupported, type ReferenceAmount } from '../../../backend/src/shared/donation'
import { assetUrl, type PublicConfig } from './commerceApi'

export type ContributionReceipt = { reference: string; status: string; demo: boolean }
export function donationApproved(config: PublicConfig | null): boolean {
  const proof = config?.donation
  return Boolean(config?.demo === false && DONATION.instructionsEnabled && DONATION.qrVerified && proof?.instructionsEnabled && proof.qrVerified && proof.ownerAuthorised && proof.recipient.name === DONATION.recipient.name && proof.recipient.upiId === DONATION.recipient.upiId && proof.cropSha256 === DONATION.cropSha256 && proof.sourceSha256 === DONATION.sourceSha256 && proof.qrUrl === DONATION.qrUrl)
}
export function donationReferenceAvailable(config: PublicConfig | null): boolean { return Boolean(config && (config.demo ? config.accepting : donationApproved(config) && config.donationReferenceAvailable)) }
export function donationUpiLink(amount: number): string | null {
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 100000 ? `upi://pay?${new URLSearchParams({ pa: DONATION.recipient.upiId, pn: DONATION.recipient.name, am: amount.toFixed(2), cu: 'INR', tn: 'Optional Banaras Diwali Mela support' })}` : null
}

export function DonationAccent() {
  return <svg viewBox="0 0 64 56" aria-hidden="true" className="donation-accent"><path d="M32 4c9 10 10 17 0 23-10-6-9-13 0-23Z" fill="currentColor" /><path d="M9 32h46c-3 12-12 18-23 18S12 44 9 32Z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M18 54h28M4 26l8 2m48-2-8 2M15 11l5 6m29-6-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

export function DonationPanel({ config, busy, contribution, onSubmit, close }: { config: PublicConfig | null; busy: boolean; contribution: ContributionReceipt | null; onSubmit: (event: FormEvent<HTMLFormElement>, amount: ReferenceAmount) => void; close: () => void }) {
  const [amount, setAmount] = useState<number>(21)
  const approved = donationApproved(config)
  const [qr, setQr] = useState(''), [qrStatus, setQrStatus] = useState(''), [copyStatus, setCopyStatus] = useState('')
  useEffect(() => {
    setQr(''); setCopyStatus('')
    if (!approved) { setQrStatus('QR temporarily unavailable. Verification is required; local demo mode never shows real payment instructions.'); return }
    const controller = new AbortController(); let disposed = false, url = ''
    const timer = setTimeout(() => controller.abort(), 15000)
    setQrStatus('Checking the approved QR image…')
    void (async () => {
      const response = await fetch(assetUrl(DONATION.qrUrl), { signal: controller.signal, cache: 'no-store' })
      if (!response.ok) throw new Error('QR unavailable')
      const bytes = await response.arrayBuffer()
      if (bytes.byteLength > 256000) throw new Error('Unexpected QR size')
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('')
      if (hash !== DONATION.cropSha256) throw new Error('QR image mismatch')
      if (disposed || controller.signal.aborted) return
      url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' })); setQr(url)
      setQrStatus('QR payload and image match the intended UPI ID; owner-authorised. Check the payee in your UPI app.')
    })().catch(() => { if (!disposed) { setQr(''); setQrStatus('Approved QR could not be verified or loaded. Payment controls remain disabled; please retry later.') } }).finally(() => clearTimeout(timer))
    return () => { disposed = true; controller.abort(); clearTimeout(timer); if (url) URL.revokeObjectURL(url) }
  }, [approved])
  // An enabled legacy config alone is never approval. Require matching proof AND
  // verified image bytes; demo mode remains a no-money reference-testing flow.
  const proof = DONATION
  const ready = approved && Boolean(qr)
  const supported = referenceAmountSupported(amount)
  const canRecord = donationReferenceAvailable(config) && supported && (config?.demo === true || ready)
  const link = donationUpiLink(amount)
  async function copy() {
    if (!ready) return
    try { if (!navigator.clipboard) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(proof.recipient.upiId); setCopyStatus('UPI ID copied.') }
    catch { setCopyStatus('Could not copy. Select the UPI ID text below and copy it manually.') }
  }
  return <section className="donation-content">
    <section className="donation-amounts" aria-labelledby="donation-amount-title">
      <h3 id="donation-amount-title">A little light goes a long way.</h3>
      <p>Choose an optional contribution. Nothing is paid until you authorise it in your own UPI app.</p>
      <div className="amounts donation-choices" role="group" aria-label="Contribution amount">
        {proof.suggestedAmounts.map(value => <button type="button" key={value} aria-pressed={amount === value} disabled={Boolean(contribution)} onClick={() => setAmount(value)}>₹{value}</button>)}
      </div>
      <p className="donation-amount-note">{supported ? ready ? 'Your UPI app will ask you to confirm the payee and amount.' : 'Suggestions only — no payment request is active.' : ready ? '₹101 can be sent in your UPI app, but this reference service only records ₹21, ₹31 and ₹51. No ₹101 receipt is offered here.' : '₹101 is a suggestion only. The current reference service supports ₹21, ₹31 and ₹51; ₹101 cannot be recorded.'}</p>
    </section>

    <div className="donation-qr-card" aria-labelledby="donation-qr-title">
      <div className="donation-card-top"><span className="donation-status-dot" aria-hidden="true" /> {ready ? 'UPI details matched · manual payment review' : 'Payment instructions unavailable'}</div>
      <h3 id="donation-qr-title">One offering. A brighter mela.</h3>
      {ready ? <figure className="donation-qr-approved"><img src={qr} width="240" height="241" alt="Owner-authorised Paytm donation QR for shreeramdiwalimela@ptyes" onError={() => { setQr(''); setQrStatus('QR display failed. Payment controls remain disabled.') }} /></figure> : <div className="donation-qr-unavailable" data-testid="qr-unavailable">
        <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="12" y="21" width="24" height="20" rx="4" /><path d="M17 21v-7a7 7 0 0 1 14 0v7m-7 7v6" /></svg>
        <strong>{approved ? 'Verifying payment QR' : 'QR temporarily unavailable'}</strong>
        <span>{qrStatus}</span>
      </div>}
      <p className="donation-scan-label">{ready ? `The QR has no fixed amount. Enter ₹${amount} in your UPI app, or use the amount-prefilled link below.` : 'Scanning requires a matching owner-approved QR. Local demo mode never enables real payments.'}</p>
      <p className="donation-recipient" data-testid="donation-privacy">{ready ? <><strong>{proof.recipient.name}</strong><br /><span className="donation-upi-id">{proof.recipient.upiId}</span></> : 'Personal payment details are not printed here. When a QR is approved, your UPI app will show its encoded payee before you decide whether to pay.'}</p>
      <button type="button" className="donation-copy" disabled={!ready} aria-describedby="donation-copy-status" onClick={() => void copy()}>Copy UPI ID</button>
      {ready && link && <a className="donation-open-upi" href={link}>Open UPI app for ₹{amount}</a>}
      <small id="donation-copy-status" role="status">{copyStatus || (ready ? 'Only continue if the UPI app shows the intended payee.' : 'Copy is disabled until the QR and intended payee match.')}</small>
      <p className="donation-qr-note">{ready ? 'Owner-authorised, decoded payee match. This is not independent bank ownership or settlement certification. Never share a UPI PIN or OTP here.' : qrStatus}</p>
    </div>

    <div className="payment-summary donation-summary"><strong>₹{amount} · {config?.demo ? 'DEMO · no payment' : ready ? 'Optional direct UPI support' : 'Payments disabled'}</strong><small>A scan, a click or a reference submission never confirms payment.</small></div>
    {config && <details className="donation-reference" open={config.demo}>
      <summary>Reference recording · manual review only</summary>
      <p>Existing references remain supported without changing the backend or database amount rules.</p>
      <label>Reference amount<select aria-label="Reference amount" value={supported ? amount : ''} disabled={Boolean(contribution)} onChange={event => setAmount(Number(event.target.value))}><option value="" disabled>Select a supported amount</option>{proof.referenceAmounts.map(value => <option key={value} value={value}>₹{value}</option>)}</select></label>
      {!config.demo && <p>{canRecord ? 'Already completed a payment? Submit its reference for manual reconciliation only.' : 'Reference recording is unavailable for this amount or session. No receipt is claimed.'}</p>}
      {!contribution ? <form onSubmit={event => { event.preventDefault(); if (canRecord && referenceAmountSupported(amount)) onSubmit(event, amount) }}>
        <label>UTR / transaction reference<input name="utr" required minLength={6} maxLength={40} pattern="[A-Za-z0-9-]{6,40}" placeholder="From your UPI app" /></label>
        <label>Optional email or phone<input name="contact" placeholder="For manual follow-up" /></label>
        <p className="privacy">Stored for manual review only. Never enter a UPI PIN, password or bank credentials.</p>
        <button className="portal-primary" disabled={busy || !canRecord}>Submit reference for manual verification</button>
      </form> : <p className="result-reference">{contribution.reference} · {contribution.status}{contribution.demo ? ' · TEMPORARY DEMO' : ''}</p>}
    </details>}
    <footer className="donation-footer"><p>Your visit is always free. Optional support is intended to help sustain the festival experience; no donation is needed to keep exploring.</p><button type="button" onClick={close}>Back to Mela <span aria-hidden="true">→</span></button></footer>
  </section>
}
