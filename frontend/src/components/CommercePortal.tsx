import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, assetUrl, rentalFee, upiLink, type PublicApplication, type PublicConfig } from './commerceApi'
import { DonationAccent, DonationPanel, donationReferenceAvailable } from './DonationPanel'
import type { ReferenceAmount } from '../../../backend/src/shared/donation'

type Section = 'contribute' | 'apply' | 'admin'
type AdminData = { mode: string; settings: { recipient: PublicConfig['recipient']; fees: PublicConfig['fees'] }; applications: (PublicApplication & { vendorName: string; email: string; phone: string; utr: string | null })[]; contributions: { reference: string; amount: number; utr: string; contact: string; status: string }[] }

export function CommercePortal({ section, close, onPublished, beggarCaption = false, supportLine = 'dedo yaawwrr cmon' }: { section: Section; close: () => void; onPublished: () => void; beggarCaption?: boolean; supportLine?: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [config, setConfig] = useState<PublicConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [duration, setDuration] = useState(3)
  const [customDays, setCustomDays] = useState(5)
  const [contribution, setContribution] = useState<{ reference: string; status: string; demo: boolean } | null>(null)
  const [application, setApplication] = useState<PublicApplication | null>(null)
  const [lookup, setLookup] = useState({ reference: '', email: '' })
  const [token, setToken] = useState('')
  const [admin, setAdmin] = useState<AdminData | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    dialog.current?.showModal()
    return () => { if (dialog.current?.open) dialog.current.close() }
  }, [])
  async function refreshConfig() {
    setLoading(true); setError('')
    try {
      const next = await api<PublicConfig>('/public-config')
      setConfig({ ...next, recipient: { ...next.recipient, qrUrl: assetUrl(next.recipient.qrUrl) } })
    }
    catch (cause) { setError((cause as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { void refreshConfig() }, [])
  async function submitContribution(event: FormEvent<HTMLFormElement>, amount: ReferenceAmount) {
    event.preventDefault(); if (!donationReferenceAvailable(config)) return
    setBusy(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      const result = await api<{ reference: string; status: string; demo: boolean }>('/contributions', { method: 'POST', body: JSON.stringify({ amount, utr: String(form.get('utr')).trim(), contact: String(form.get('contact')).trim() }) })
      setContribution(result); setMessage(`Reference ${result.reference} received for manual review. Submitting a UTR is NOT proof of payment.`)
    } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }
  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!config?.applicationsOpen) return
    setBusy(true); setError('')
    const form = new FormData(event.currentTarget)
    const products = String(form.get('products')).split('\n').map(item => item.trim()).filter(Boolean)
    try {
      const record = await api<PublicApplication>('/applications', { method: 'POST', body: JSON.stringify({
        stallName: String(form.get('stallName')), vendorName: String(form.get('vendorName')), email: String(form.get('email')),
        phone: String(form.get('phone')), category: String(form.get('category')), description: String(form.get('description')),
        products, durationDays: duration === 0 ? customDays : duration,
      }) })
      setApplication(record); setLookup({ reference: record.reference, email: String(form.get('email')) }); setMessage(`Application ${record.reference} received · pending payment and organiser review.`)
    } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }
  async function findApplication() {
    setError(''); setBusy(true)
    try { setApplication(await api<PublicApplication>(`/applications/${encodeURIComponent(lookup.reference.trim())}?email=${encodeURIComponent(lookup.email.trim())}`)); setMessage('Application status refreshed.') }
    catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }
  async function submitApplicationPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!application) return
    setBusy(true); setError('')
    try { setApplication(await api<PublicApplication>(`/applications/${encodeURIComponent(application.reference)}/payment`, { method: 'POST', body: JSON.stringify({ email: lookup.email, utr: String(new FormData(event.currentTarget).get('stallUtr')) }) })); setMessage('Payment reference submitted. Verification is pending; this is NOT proof of payment.') }
    catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }
  async function loadAdmin() {
    setBusy(true); setError('')
    try { setAdmin(await api<AdminData>('/admin/records', {}, token)) }
    catch (cause) { setError((cause as Error).message); setAdmin(null) } finally { setBusy(false) }
  }
  async function adminAction(path: string, data: object) {
    setBusy(true); setError(''); setMessage('')
    try { await api(path, { method: 'PATCH', body: JSON.stringify(data) }, token); await loadAdmin(); onPublished(); setMessage('Change saved on server.') }
    catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }
  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!admin) return
    const form = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try {
      await api('/admin/settings', { method: 'PUT', body: JSON.stringify({ recipient: { name: String(form.get('name')).trim(), upiId: String(form.get('upiId')).trim(), qrUrl: String(form.get('qrUrl')).trim(), paymentUrl: String(form.get('paymentUrl')).trim(), enabled: form.has('enabled') }, fees: { threeDays: Number(form.get('threeDays')), sevenDays: Number(form.get('sevenDays')), customPerDay: Number(form.get('customPerDay')) } }) }, token)
      await loadAdmin(); await refreshConfig(); setMessage('Organiser configuration saved on server.')
    } catch (cause) { setError((cause as Error).message) } finally { setBusy(false) }
  }
  const days = duration === 0 ? customDays : duration
  return <dialog ref={dialog} className={`commerce-dialog${section === 'contribute' ? ' donation-dialog' : ''}`} aria-label={section === 'contribute' ? 'Contribute to the festival' : section === 'apply' ? 'Apply for a temporary stall' : 'Organiser administration'} onCancel={event => { event.preventDefault(); close() }}>
    {section === 'contribute' ? <header className="donation-header">
      <button className="donation-close" aria-label="Close" onClick={close}>×</button>
      <DonationAccent /><span className="donation-eyebrow">A small act of seva</span>
      <h2>Support Banaras<br /><em>Diwali Mela</em></h2>
      <p>Keep the spirit of the ghats glowing. Your support is optional, and the mela is always yours to explore.</p>
      {beggarCaption && <p className="beggar-caption" data-testid="beggar-caption">{supportLine}</p>}
    </header> : <header className="commerce-heading"><div><span className="eyebrow">Banaras Diwali Mela</span><h2>{section === 'apply' ? 'Bring your stall' : 'Organiser desk'}</h2></div><button aria-label="Close" onClick={close}>×</button></header>}
    {loading && <p role="status">Loading server configuration…</p>}
    {!loading && config?.demo && <p className="commerce-warning" role="status">LOCAL DEMO ONLY · records disappear when the backend restarts. No real payment instructions or payment collection.</p>}
    {!loading && config?.mode === 'unavailable' && <p className="commerce-warning">Applications and contributions are unavailable until production storage and organiser details are configured. No payment should be sent.</p>}
    {error && <p role="alert" className="commerce-error">{error} <button onClick={() => { void refreshConfig(); if (admin) void loadAdmin() }}>Retry</button></p>}
    {message && <p role="status" className="commerce-success">{message}</p>}
    {section === 'contribute' && <DonationPanel config={config} busy={busy} contribution={contribution} onSubmit={(event, amount) => void submitContribution(event, amount)} close={close} />}
    {section === 'apply' && config && <section>
      <p>Apply to operate a temporary stall. Submitting is not an approval, booking or proof of rental payment.</p>
      <div className="duration-choices"><label>Rental duration<select aria-label="Rental duration" value={duration} onChange={event => setDuration(Number(event.target.value))}><option value={3}>3 days</option><option value={7}>7 days</option><option value={0}>Custom days</option></select></label>{duration === 0 && <label>Number of days<input aria-label="Custom days" type="number" min={1} max={30} value={customDays} onChange={event => setCustomDays(Number(event.target.value))} /></label>}</div>
      <p className="payment-summary"><strong>{days} days · ₹{rentalFee(days, config.fees)}</strong><small>Fee schedule set by the organiser. In demo, do NOT send money. A payment reference can be submitted after application; organiser approval and payment verification are separate.</small></p>
      {!application && <form onSubmit={event => void submitApplication(event)} className="vendor-form"><label>Stall name<input name="stallName" required minLength={2} maxLength={80} /></label><label>Vendor name<input name="vendorName" required minLength={2} maxLength={80} /></label><label>Email<input name="email" type="email" required /></label><label>Phone<input name="phone" type="tel" required minLength={7} /></label><label>Category<input name="category" required minLength={2} maxLength={60} /></label><label>Short description<textarea name="description" required minLength={15} maxLength={600} /></label><label>Optional products (one per line; maximum six)<textarea name="products" /></label><p className="privacy">Contact details are stored privately for review; only approved, verified and published stall information appears publicly. Never send credentials or banking secrets.</p><button className="portal-primary" disabled={busy || !config.applicationsOpen}>Submit stall application</button></form>}
      {application && <div className="application-result"><p className="result-reference">{application.reference} · {application.status} · {application.paymentStatus}</p><p>₹{application.fee} for {application.durationDays} days. {application.published ? 'Published in the mela.' : 'Not yet published.'}</p>
        {!config.demo && config.accepting && <div className="payment-summary"><strong>Rental fee ₹{application.fee} · {config.recipient.name}</strong><span>Organiser UPI alias: {config.recipient.upiId}. Confirm payee and fee before paying.</span>{upiLink(config.recipient, application.fee) && <a href={upiLink(config.recipient, application.fee)!}>Open UPI app for ₹{application.fee}</a>}{config.recipient.qrUrl && <figure><img src={config.recipient.qrUrl} alt="Organiser-supplied rental QR; verify payee and enter the rental fee in your payment app" /><figcaption>Enter ₹{application.fee} manually; the QR does not contain the amount.</figcaption></figure>}</div>}
        {!config.demo && !config.accepting && <p>Rental payment details have not yet been enabled. Do not send funds until confirmed by the organiser.</p>}
        {application.paymentStatus !== 'verified' && application.status !== 'rejected' && <form onSubmit={event => void submitApplicationPayment(event)}><label>Optional rental payment UTR<input name="stallUtr" minLength={6} maxLength={40} required pattern="[A-Za-z0-9-]{6,40}" /></label><button disabled={busy}>Submit UTR for manual review</button></form>}</div>}
      <fieldset><legend>Check an existing application</legend><label>Application reference<input value={lookup.reference} onChange={event => setLookup({ ...lookup, reference: event.target.value })} /></label><label>Application email<input type="email" value={lookup.email} onChange={event => setLookup({ ...lookup, email: event.target.value })} /></label><button type="button" disabled={busy || !lookup.reference || !lookup.email} onClick={() => void findApplication()}>Check status</button></fieldset>
    </section>}
    {section === 'admin' && <section><p>Organiser access requires a server-configured bearer token. Enter it only on a trusted HTTPS deployment. It stays in this tab’s memory, not browser storage.</p><label>Organiser API token<input type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} /></label><button disabled={busy || !token} onClick={() => void loadAdmin()}>Load protected records</button>
      {admin && <><p className="commerce-warning">{admin.mode === 'demo' ? 'LOCAL DEMO: no persistent records or real payments' : 'Verify payments independently before marking records verified.'}</p>
        <form className="admin-settings" key={JSON.stringify(admin.settings)} onSubmit={event => void saveSettings(event)}><h3>Recipient and fee schedule</h3><label>Recipient name<input name="name" defaultValue={admin.settings.recipient.name} /></label><label>UPI ID or public alias<input name="upiId" defaultValue={admin.settings.recipient.upiId} /></label><label>Organiser-supplied QR asset path / HTTPS URL<input name="qrUrl" defaultValue={admin.settings.recipient.qrUrl} /></label><label>Optional HTTPS payment link<input name="paymentUrl" type="url" defaultValue={admin.settings.recipient.paymentUrl} /></label><label className="check"><input name="enabled" type="checkbox" defaultChecked={admin.settings.recipient.enabled} />Enable live payment instructions after verifying recipient and storage</label><label>3-day fee (₹)<input name="threeDays" type="number" min={1} defaultValue={admin.settings.fees.threeDays} /></label><label>7-day fee (₹)<input name="sevenDays" type="number" min={1} defaultValue={admin.settings.fees.sevenDays} /></label><label>Custom daily fee (₹)<input name="customPerDay" type="number" min={1} defaultValue={admin.settings.fees.customPerDay} /></label><button disabled={busy}>Save organiser settings</button></form>
        <h3>Vendor applications ({admin.applications.length})</h3>{admin.applications.map(item => <article className="admin-record" key={item.reference}><strong>{item.stallName} · {item.reference}</strong><p>{item.vendorName} · {item.email} · {item.phone}</p><p>{item.category}: {item.description}</p><p>₹{item.fee} · {item.durationDays} days · {item.status} / {item.paymentStatus} · UTR {item.utr || 'not provided'} · {item.published ? 'Published' : 'Not published'}</p><div><button disabled={busy} onClick={() => void adminAction(`/admin/applications/${item.reference}`, { status: 'approved' })}>Approve</button><button disabled={busy} onClick={() => void adminAction(`/admin/applications/${item.reference}`, { status: 'rejected' })}>Reject</button><button disabled={busy || !item.utr} onClick={() => void adminAction(`/admin/applications/${item.reference}`, { paymentVerified: true })}>Mark payment verified</button><button disabled={busy} onClick={() => void adminAction(`/admin/applications/${item.reference}`, { published: !item.published })}>{item.published ? 'Unpublish' : 'Publish'}</button></div></article>)}
        <h3>Contributions ({admin.contributions.length})</h3>{admin.contributions.map(item => <article className="admin-record" key={item.reference}><strong>{item.reference} · ₹{item.amount} · {item.status}</strong><p>UTR {item.utr} · {item.contact || 'No contact'}</p><button disabled={busy} onClick={() => void adminAction(`/admin/contributions/${item.reference}`, { status: 'verified' })}>Mark manually verified</button><button disabled={busy} onClick={() => void adminAction(`/admin/contributions/${item.reference}`, { status: 'rejected' })}>Reject</button></article>)}</>}
    </section>}
  </dialog>
}
