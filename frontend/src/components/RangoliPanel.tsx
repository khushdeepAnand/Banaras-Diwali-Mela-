import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { MAX_POINTS, MAX_STROKES, PALETTE, renderRangoli, type Stroke } from './rangoli'
export function RangoliPanel({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Stroke[]>([]), active = useRef<number | null>(null), mounted = useRef(true)
  const [colour, setColour] = useState(PALETTE[0]), [starter, setStarter] = useState<'none' | 'lotus' | 'rings'>('lotus')
  const [revision, setRevision] = useState(0), [status, setStatus] = useState('Draw a petal. Eight matching petals appear around the centre.')
  const [image, setImage] = useState<{ url: string; blob: Blob } | null>(null)
  const redraw = () => { if (canvas.current) renderRangoli(canvas.current, strokes.current, starter, Math.min(1024, Math.max(1, Math.round(canvas.current.clientWidth * Math.min(2, window.devicePixelRatio || 1))))) }
  useEffect(() => { const element = dialog.current; mounted.current = true; element?.showModal(); return () => { mounted.current = false; active.current = null; element?.close(); if (canvas.current) canvas.current.width = canvas.current.height = 1 } }, [])
  useEffect(() => {
    const observer = new ResizeObserver(redraw)
    if (canvas.current) observer.observe(canvas.current)
    redraw()
    return () => observer.disconnect()
  }, [starter, revision])
  useEffect(() => () => { if (image) URL.revokeObjectURL(image.url) }, [image])
  function point(event: PointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    return { x: Math.max(0, Math.min(1, (event.clientX - box.x) / box.width)), y: Math.max(0, Math.min(1, (event.clientY - box.y) / box.height)) }
  }
  function stop(event: PointerEvent<HTMLCanvasElement>) { if (active.current !== event.pointerId) return; active.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); setRevision(n => n + 1) }
  async function exportPng() {
    const target = document.createElement('canvas')
    try {
      renderRangoli(target, strokes.current, starter, 1024)
      const blob = await new Promise<Blob>((resolve, reject) => target.toBlob(b => b ? resolve(b) : reject(new Error('PNG export unavailable. Please retry.')), 'image/png'))
      if (mounted.current) { setImage({ blob, url: URL.createObjectURL(blob) }); setStatus('PNG preview ready. No room or personal data is included.') }
    } catch { if (mounted.current) setStatus('PNG export unavailable. Your drawing is still here; try again.') }
    finally { target.width = target.height = 1 }
  }
  async function share() {
    if (!image) return
    const file = new File([image.blob], 'kashi-rangoli.png', { type: 'image/png' })
    try { if (!navigator.share || !navigator.canShare?.({ files: [file] })) { setStatus('Native sharing unavailable. Download the PNG instead.'); return }; await navigator.share({ files: [file], title: 'My Kashi rangoli' }); setStatus('Share request completed; your device handles delivery.') }
    catch { setStatus('Sharing cancelled or unavailable. Download is still available.') }
  }
  return <dialog ref={dialog} className="visitor-panel rangoli-panel" aria-label="Make a rangoli" onCancel={e => { e.preventDefault(); close() }}>
    <span className="eyebrow">Colour, balance, welcome</span><h2>Rangoli courtyard</h2><p>Draw with mouse, touch or stylus. Or build a design using the keyboard petal button.</p>
    <div role="group" aria-label="Rangoli colours" className="rangoli-palette">{PALETTE.map((c, i) => <button key={c} aria-label={['Marigold', 'Rose', 'River teal', 'Rice white', 'Lilac'][i]} aria-pressed={colour === c} style={{ borderColor: c }} onClick={() => setColour(c)}>{['Gold', 'Rose', 'Teal', 'White', 'Lilac'][i]}</button>)}</div>
    <label>Starting design<select value={starter} onChange={e => setStarter(e.target.value as typeof starter)}><option value="none">Bare courtyard</option><option value="lotus">Lotus petals</option><option value="rings">Welcome rings</option></select></label>
    <canvas ref={canvas} aria-label="Eight-fold symmetric rangoli drawing surface" role="img" onPointerDown={e => { if (active.current !== null || e.button !== 0) return; if (strokes.current.length >= MAX_STROKES) { setStatus('Drawing limit reached. Undo or clear to keep creating.'); return }; active.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); strokes.current.push({ colour, points: [point(e)] }); redraw() }} onPointerMove={e => { if (active.current !== e.pointerId) return; const stroke = strokes.current.at(-1); if (stroke && stroke.points.length < MAX_POINTS) { stroke.points.push(point(e)); redraw() } }} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} />
    <div className="visitor-actions"><button onClick={() => { if (strokes.current.length < MAX_STROKES) { strokes.current.push({ colour, points: [{ x: .5, y: .25 }, { x: .56, y: .32 }, { x: .5, y: .4 }] }); setRevision(n => n + 1) } }}>Add symmetric petal</button><button disabled={!strokes.current.length} onClick={() => { strokes.current.pop(); setRevision(n => n + 1) }}>Undo stroke</button><button onClick={() => { strokes.current = []; setStarter('none'); setRevision(n => n + 1) }}>Clear drawing</button><button onClick={() => { strokes.current = []; setStarter('lotus'); setColour(PALETTE[0]); setRevision(n => n + 1) }}>Reset rangoli</button><button onClick={() => void exportPng()}>Preview rangoli PNG</button></div>
    <p role="status">{status}</p>{image && <div className="photo-result"><img src={image.url} alt="Your exported rangoli preview" /><a href={image.url} download="kashi-rangoli.png">Download rangoli</a><button onClick={() => void share()}>Share rangoli</button></div>}
    <button className="visitor-primary" onClick={close}>Back to mela</button>
  </dialog>
}
