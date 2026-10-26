import { useEffect, useRef } from 'react'
import { GOODS, ITEMS } from '../../../backend/src/shared/gameplay'
import type { useGameplay } from './useGameplay'

export function CollectionPanel({ game, offering, lighting, close }: { game: ReturnType<typeof useGameplay>; offering: boolean; lighting: boolean; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => { if (element?.open) element.close() } }, [])
  return <dialog ref={dialog} className="stall-panel" aria-labelledby="collection-title" onCancel={event => { event.preventDefault(); close() }}>
    <div className="panel-header"><span className="eyebrow">Festival collection · no real money</span><button className="panel-close" aria-label="Close collection" onClick={close}>×</button></div>
    <h2 id="collection-title">Your festival gifts</h2>
    <p>Visit Phool Gali for flowers, Deep Jyoti for diyas and a virtual spark fountain, or Ghat Chaat for a tasting stamp.</p>
    <ul>{ITEMS.map(item => <li key={item}><span>{GOODS[item].name}</span><strong data-testid={`count-${item}`}>{game.state.inventory[item]}</strong></li>)}</ul>
    <p>Offer flowers and diyas at the central river steps (X 0, Z 1.2). Light a fountain at the central celebration pad (X 0, Z 7).</p>
    {offering && <section aria-label="Ganga offering"><h3>Offer to the Ganga</h3>{(['flower', 'diya'] as const).map(item => <button key={item} disabled={game.pending || !game.state.inventory[item]} onClick={() => game.act('offer', item)}>Offer {GOODS[item].name}</button>)}</section>}
    {lighting && <section aria-label="Spark fountain"><h3>Light your virtual spark fountain</h3><p>Ignition, then a short warm shower of sparks. Eight-second cooldown; no real-world instructions.</p><button disabled={game.pending || !game.state.inventory.firecracker} onClick={() => game.act('light', 'firecracker')}>Light spark fountain</button></section>}
    <p role="status" data-testid="gameplay-status">{game.message}</p>
    <p className="panel-disclaimer">Session only. Reload, leaving a room or server restart loses that collection. Room reconnect retains items during its existing twenty-second reservation. Solo collection stays separate.</p>
    <button className="panel-done" onClick={close}>Return to the ghat</button>
  </dialog>
}
