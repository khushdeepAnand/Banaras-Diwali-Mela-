import { useEffect, useRef, useState } from 'react'
import { ACCESSORIES, DEFAULT_APPEARANCE, HAIR, KURTAS, OUTFITS, type Appearance } from '../../../backend/src/shared/appearance'
import { PHOTO_PRESETS, type CaptureQueue, type PhotoPreset, type VisitorView } from '../world/visitorView'
import { finishPhoto } from './photoFinish'
import { ACTIVITIES } from './journey'
import type { Activity } from '../../../backend/src/shared/gameplay'

export function WardrobePanel({ draft, change, apply, cancel, view, heading }: { draft: Appearance; change: (next: Appearance) => void; apply: () => void; cancel: () => void; view: React.RefObject<VisitorView>; heading: number }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close() }, [])
  return <dialog ref={dialog} className="visitor-panel wardrobe-panel" aria-label="Festival wardrobe" onCancel={event => { event.preventDefault(); cancel() }}>
    <header><span className="eyebrow">Apna festive look</span><h2>Festival wardrobe</h2><p>Preview on your actual visitor in the mela. Apply shares the supported look with your room.</p></header>
    <div className="preview-angles" role="group" aria-label="Avatar preview angle">{[['Front', Math.PI], ['Side', Math.PI / 2], ['Three-quarter', Math.PI * .75]].map(([label, angle]) => <button key={label} onClick={() => { view.current.yaw = heading + Number(angle) }}>{label}</button>)}</div>
    <label>Kurta colour<select aria-label="Kurta colour" value={draft.kurta} onChange={event => change({ ...draft, kurta: event.target.value as Appearance['kurta'] })}>{KURTAS.map(id => <option key={id}>{id}</option>)}</select></label>
    <label>Outfit<select aria-label="Outfit" value={draft.outfit} onChange={event => change({ ...draft, outfit: event.target.value as Appearance['outfit'] })}>{OUTFITS.map(id => <option key={id}>{id}</option>)}</select></label>
    <label>Hairstyle<select aria-label="Hairstyle" value={draft.hair} onChange={event => change({ ...draft, hair: event.target.value as Appearance['hair'] })}>{HAIR.map(id => <option key={id}>{id}</option>)}</select></label>
    <label>Accessory<select aria-label="Accessory" value={draft.accessory} onChange={event => change({ ...draft, accessory: event.target.value as Appearance['accessory'] })}>{ACCESSORIES.map(id => <option key={id}>{id}</option>)}</select></label>
    <div className="visitor-actions"><button onClick={() => change({ ...DEFAULT_APPEARANCE })}>Reset preview</button><button onClick={cancel}>Cancel wardrobe</button><button className="visitor-primary" onClick={apply}>Apply outfit</button></div>
  </dialog>
}

export function PhotoPanel({ view, queue, close, hud, setHud, fireworks, completed = [] }: { view: React.RefObject<VisitorView>; queue: React.RefObject<CaptureQueue>; close: () => void; hud: boolean; setHud: (value: boolean) => void; fireworks: boolean; completed?: Activity[] }) {
  const [preset, setPreset] = useState<PhotoPreset>('orbit'), [zoom, setZoom] = useState(6)
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('Drag the open scene to look. Saved PNGs contain the actual scene, not interface controls.')
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [frame, setFrame] = useState(false)
  const [souvenir, setSouvenir] = useState(false)
  const [filename, setFilename] = useState('banaras-mela.png')
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url) }, [photo])
  async function save() {
    if (busy || queue.current.job) return
    setBusy(true); setStatus('Capturing the next rendered frame…')
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        const timeout = setTimeout(() => { queue.current.job = null; reject(new Error('Capture timed out. Keep the scene visible and retry.')) }, 10_000)
        queue.current.job = { resolve: image => { clearTimeout(timeout); resolve(image) }, reject: error => { clearTimeout(timeout); reject(error) } }
      })
      if (!mounted.current) return
      const finished = await finishPhoto(blob, frame || souvenir, souvenir ? completed : undefined)
      if (!mounted.current) return
      const url = URL.createObjectURL(finished); setPhoto({ blob: finished, url })
      setFilename(`banaras-dev-deepawali-2026-${new Date().toISOString().replace(/[:.]/g, '-')}.png`)
      setStatus('Photo preview ready with website watermark. Review below, then download or share. No multiplayer position was changed.')
    } catch (cause) { if (mounted.current) setStatus(cause instanceof Error ? cause.message : 'Capture failed. Retry or leave photo mode.') }
    finally { if (mounted.current) setBusy(false) }
  }
  async function share() {
    if (!photo) return
    const file = new File([photo.blob], filename, { type: 'image/png' })
    try {
      if (!navigator.canShare?.({ files: [file] }) || !navigator.share) { setStatus('Native sharing is unavailable. Download the PNG instead.'); return }
      await navigator.share({ title: 'Banaras Diwali Mela', files: [file] }); setStatus('Share request completed; delivery is handled by your device.')
    }
    catch { setStatus('Sharing cancelled or unavailable. Your photo can still be downloaded.') }
  }
  return <section className="visitor-panel photo-panel" aria-label="Photo mode controls">
    <header><span className="eyebrow">Yaadein le jao</span><h2>Photo mode</h2></header>
    <label>Scenic preset<select aria-label="Scenic preset" value={preset} onChange={event => {
      const next = event.target.value as PhotoPreset; setPreset(next); view.current.preset = next; setZoom(6); view.current.distance = 6
      if (next !== 'orbit') { view.current.yaw = 0; view.current.pitch = 0 }
    }}><option value="orbit">Orbit your visitor</option>{Object.entries(PHOTO_PRESETS).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}</select></label>
    <label>Camera distance<input aria-label="Photo zoom" type="range" min="3.8" max="10" step="0.1" value={zoom} onChange={event => { const distance = Number(event.target.value); setZoom(distance); view.current.distance = distance }} /></label>
    <label className="visitor-check"><input type="checkbox" checked={hud} onChange={event => setHud(event.target.checked)} />Show HUD in preview (not saved)</label>
    <label className="visitor-check"><input type="checkbox" checked={frame} onChange={event => setFrame(event.target.checked)} />Dev Deepawali 2026 frame (next capture)</label>
    <label className="visitor-check"><input type="checkbox" checked={souvenir} onChange={event => setSouvenir(event.target.checked)} />My Kashi Evening souvenir (local journey summary)</label>
    {souvenir && <section aria-label="My Kashi Evening"><h3>My Kashi Evening</h3><p>{completed.length}/5 local stamps · optional souvenir</p><ul>{ACTIVITIES.filter(a => completed.includes(a.id)).map(a => <li key={a.id}>{a.name}</li>)}</ul><p>Only activity names, world photo and public website branding enter this PNG.</p></section>}
    {preset === 'fireworks' && !fireworks && <p>Fireworks are off. This view does not override your effects or reduced-motion setting.</p>}
    <div className="visitor-actions"><button className="visitor-primary" disabled={busy} onClick={() => void save()}>Capture PNG preview</button><button onClick={close}>Back from photo mode</button></div>
    <p role="status" data-testid="photo-status">{status}</p>
    {photo && <div className="photo-result"><img src={photo.url} alt="Captured actual mela scene" /><a href={photo.url} download={filename} onClick={() => setStatus('Download requested. Check your browser downloads.')}>Download photo</a><button onClick={() => void share()}>Share photo</button></div>}
  </section>
}

export function HelpPanel({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close() }, [])
  return <dialog ref={dialog} className="visitor-panel help-panel" aria-label="Mela controls" onCancel={event => { event.preventDefault(); close() }}>
    <h2>Namaste, mela explorer!</h2><p>Mela free hai. Support optional hai.</p>
    <ul><li>WASD/arrows or the touch joystick: move.</li><li>Drag the scene: look. Camera button: first/third person.</li><li>E or a contextual tap: talk, inspect a stall, board or exit a ride.</li><li>Visitor tools: wardrobe preview and real photo capture.</li><li>The map shows your location, facing, paths and four activity shortcuts. Follow highlighted points using normal movement; walk around obstacles.</li><li>Music controls always let you pause or mute. Reset returns to spawn.</li><li>Four real guests can join one room using Together. NPCs are separate. Invitation links require Join confirmation.</li><li>Collect free virtual gifts at stalls. Use Gifts near the river for offerings or at the marked pad for your spark fountain.</li></ul>
    <p>Photos preview before download. Graphics Auto only reduces quality after sustained poor performance; select a manual tier any time.</p>
    <p>Virtual gifts are session-only. Donation references remain pending manual review, never proof of payment.</p>
    <button className="visitor-primary" onClick={close}>Back to Mela</button>
  </dialog>
}
