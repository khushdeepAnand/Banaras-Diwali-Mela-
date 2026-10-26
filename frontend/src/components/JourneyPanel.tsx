import { useEffect, useRef, useState } from 'react'
import { ACTIVITIES } from './journey'
import type { useJourney } from './useJourney'
export function JourneyPanel({ journey, close, photo, rangoli }: { journey: ReturnType<typeof useJourney>; close: () => void; photo: () => void; rangoli: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), [confirm, setConfirm] = useState(false)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  const count = journey.state.completed.length
  return <dialog ref={dialog} className="visitor-panel journey-panel" aria-label="Kashi Journey" onCancel={e => { e.preventDefault(); close() }}>
    <header className="panel-header"><span className="eyebrow">Your evening, at your pace</span><button onClick={close} aria-label="Close Kashi Journey">×</button></header><h2>Kashi Journey</h2>
    <p>Five little moments by the Ganga. Free, optional and never a competition.</p>
    <progress max={5} value={count} aria-label="Journey progress" /><p role="status">{count} / 5 stamps</p>
    <ol className="journey-stamps">{ACTIVITIES.map(a => <li key={a.id} data-complete={journey.state.completed.includes(a.id)}><span aria-hidden="true">{a.icon}</span><strong>{a.name}</strong><small>{journey.state.completed.includes(a.id) ? 'Complete ✓' : 'Still to explore'}</small></li>)}</ol>
    <p className="journey-next">{ACTIVITIES.find(a => !journey.state.completed.includes(a.id))?.next ?? 'Your evening is complete. Thank you for bringing your light to Kashi. Make a souvenir, or keep exploring.'}</p>
    <p>Saved only in this browser, not a server-verified achievement. Inventory remains session-only. Edited or cleared browser storage can change stamps.</p>
    {!journey.available && <p role="status">Browser storage is unavailable. Your journey stays in memory until you leave this page.</p>}
    <div className="visitor-actions"><button onClick={photo}>My Kashi Evening souvenir</button><button onClick={rangoli}>Make a rangoli</button><button className="visitor-primary" onClick={close}>Continue exploring</button></div>
    {confirm ? <div role="group" aria-label="Confirm journey reset"><p>Reset these five local stamps? Session gifts and other settings stay unchanged.</p><button onClick={() => { journey.reset(); setConfirm(false) }}>Confirm reset journey</button><button onClick={() => setConfirm(false)}>Keep stamps</button></div> : <button onClick={() => setConfirm(true)}>Reset journey</button>}
  </dialog>
}
