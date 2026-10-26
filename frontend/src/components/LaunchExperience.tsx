import { useState } from 'react'
import { PORTAL_URL } from './sharing'

export function SceneLoading() {
  return <section className="scene-loading" role="status" aria-live="polite" aria-label="Loading riverfront">
    <span className="eyebrow">A little light is on its way</span>
    <h2>Preparing the riverfront…</h2>
    <progress aria-label="Preparing scene; total progress unavailable" />
    <p>Loading the 3D scene and preparing its first frame.</p>
    <small>Dev Deepawali celebrates the ghats with countless lamps. Take a moment by the Ganga.</small>
  </section>
}

export function SceneFallback({ unsupported = false, retry }: { unsupported?: boolean; retry: () => void }) {
  const [status, setStatus] = useState('')
  async function share() {
    const url = new URL('/', window.location.href).href
    try {
      if (navigator.share) { await navigator.share({ title: 'Banaras Diwali Mela', url }); setStatus('Share request completed by your device.') }
      else { await navigator.clipboard.writeText(url); setStatus('Website link copied.') }
    } catch { setStatus('Sharing unavailable. Copy the page address from your browser.') }
  }
  return <section className="scene-fallback" aria-label="3D compatibility help">
    <h2>{unsupported ? 'This browser cannot start the 3D mela.' : 'The riverfront could not finish loading.'}</h2>
    <p role="alert">{unsupported ? 'Try an up-to-date Chrome, Edge, Firefox or Safari with WebGL 2 and hardware acceleration enabled.' : 'Your connection or graphics context may have been interrupted. Close other graphics-heavy tabs and retry when ready.'}</p>
    <div className="fallback-gallery"><img src={`${import.meta.env.BASE_URL}gallery/riverfront.png`} alt="Project screenshot of illuminated Banaras ghats and Ganga" /><img src={`${import.meta.env.BASE_URL}gallery/temple-court.png`} alt="Project screenshot of the temple forecourt" /></div>
    <p>These are existing project screenshots, not a live 3D view.</p>
    <div className="invite-actions"><button onClick={retry}>Retry scene</button><button onClick={() => void share()}>Share website</button><a href={PORTAL_URL}>Visit main website</a></div>
    <p role="status">{status}</p>
    <p>No automatic retries. If this device cannot run WebGL 2, use the main website or another compatible device.</p>
  </section>
}

export function ActivityHighlights() {
  return <ul className="activity-highlights">{[
    ['Ganga Aarti', 'M4 17h16M7 14c-3-4 3-4 2-9 6 4 7 7 4 9M5 21h14'],
    ['Diya offerings', 'M3 14h18c-1 8-17 8-18 0ZM12 12c-5-2-1-6 0-9 4 4 4 7 0 9Z'],
    ['Festival rides', 'M12 2v20M2 12h20M5 5l14 14M19 5 5 19M6 22l6-10 6 10M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'],
    ['Interactive stalls', 'M3 10h18L19 3H5l-2 7ZM5 10v11h14V10M9 21v-7h6v7'],
  ].map(([label, path]) => <li key={label}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={path} /></svg><span>{label}</span></li>)}</ul>
}
