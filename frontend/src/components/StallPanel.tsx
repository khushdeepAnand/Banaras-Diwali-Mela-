import { useEffect, useRef } from 'react'
import type { BazaarStall } from '../world/bazaar'
import { GOODS, ITEMS, type Inventory, type Item } from '../../../backend/src/shared/gameplay'

export function StallPanel({ stall, onClose, inventory, collect, pending, message }: { stall: BazaarStall; onClose: () => void; inventory?: Inventory; collect?: (item: Item) => void; pending?: boolean; message?: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => { if (element?.open) element.close() }
  }, [])

  return <dialog ref={dialog} className="stall-panel" aria-labelledby="stall-title" onCancel={(event) => { event.preventDefault(); onClose() }}>
    <div className="panel-header"><span className="eyebrow">{stall.listing === 'vendor' ? 'Published vendor listing · payment verified' : 'The bazaar · demonstration display'}</span><button className="panel-close" onClick={onClose} aria-label="Close stall panel">×</button></div>
    <h2 id="stall-title">{stall.name}</h2>
    <p className="panel-category">{stall.category}</p>
    <p>{stall.description}</p>
    {stall.id === 'flowers-001' && <p>“Namaste! A few marigolds for your evening? Offer them gently at the central Ganga steps.”</p>}
    {stall.id === 'diya-001' && <p>“Welcome. Carry a little light to the river, or enjoy a virtual spark fountain at the marked pad.”</p>}
    {stall.id === 'food-001' && <p>“A taste of Banaras! Imagine warm tamatar chaat, a little crunch and a bright touch of spice.” {inventory?.tasting ? 'Tasting complete. Your local journey remembers this moment.' : 'Collect the free tasting below to complete this imagined visit.'}</p>}
    {collect && inventory && ITEMS.some(item => GOODS[item].stall === stall.id) && <section aria-label="Festival gifts">
      <h3>Free festival gifts</h3><p>Virtual session collection only. No purchase, rupees or payment required.</p>
      {ITEMS.filter(item => GOODS[item].stall === stall.id).map(item => <div className="festival-good" key={item}><h4>{GOODS[item].name}</h4><p>{GOODS[item].description}</p><button disabled={pending || inventory[item] >= GOODS[item].cap} onClick={() => collect(item)}>Collect {GOODS[item].name}</button><small>Collected {inventory[item]} / {GOODS[item].cap}</small></div>)}
      <p role="status">{message}</p>
    </section>}
    <h3>Explore the collection</h3>
    <ul>{stall.products.map((product) => <li key={product.name}><span>{product.name}</span><strong>{product.price}</strong></li>)}</ul>
    <p className="panel-disclaimer">{stall.listing === 'vendor' ? `Published until ${stall.expiresAt ? new Date(stall.expiresAt).toLocaleDateString() : 'organiser withdrawal'}. Contact the vendor independently; no in-app orders or payments.` : 'Illustrative prices only. Festival gifts are free virtual session items, separate from these sample products. No actual offer or bookable rental unit.'}</p>
    <button className="panel-done" onClick={onClose}>Return to the ghat</button>
  </dialog>
}
