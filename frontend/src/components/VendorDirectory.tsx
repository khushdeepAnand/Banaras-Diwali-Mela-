import { useEffect, useRef } from 'react'
import type { PublicApplication } from './commerceApi'

export function VendorDirectory({ listings, close }: { listings: readonly PublicApplication[]; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal(); return () => { if (dialog.current?.open) dialog.current.close() } }, [])
  return <dialog ref={dialog} className="commerce-dialog" aria-label="Published vendor directory" onCancel={event => { event.preventDefault(); close() }}>
    <header className="commerce-heading"><div><span className="eyebrow">The bazaar</span><h2>Published vendors</h2></div><button aria-label="Close" onClick={close}>×</button></header>
    <p>These are organiser-approved, manually payment-verified listings. The six original demonstration stalls and two sample craft kiosks are illustrative only. Two vendor stalls appear as 3D kiosks at the edges of the market; every published listing appears here.</p>
    {listings.length === 0 && <p>No verified vendor listings have been published yet.</p>}
    {listings.map(item => <article className="admin-record" key={item.reference}><strong>{item.stallName} · {item.category}</strong><p>{item.description}</p><p>{item.products.length ? item.products.join(' · ') : 'Products not listed'}</p><small>Rental listing through {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'organiser withdrawal'} · Ask vendor for prices. No in-app checkout.</small></article>)}
  </dialog>
}
