import { useEffect, useRef, useState } from 'react'
import { EMOTES, EMOTE_COOLDOWN, EMOTE_LIFE, GROUP_LIFE, type Emote, type SocialEvent } from '../../../backend/src/shared/social'
import type { useRoom } from './useRoom'
export function SocialPanel({ room, close }: { room: ReturnType<typeof useRoom>; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [solo, setSolo] = useState(''), [locked, setLocked] = useState(false)
  const last = useRef(0)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  useEffect(() => { if (!locked) return; const timer = setTimeout(() => { setLocked(false); setSolo('') }, EMOTE_COOLDOWN); return () => clearTimeout(timer) }, [locked])
  function send(id: Emote) {
    if (Date.now() < last.current) return
    if (room.link.current.self && !room.link.current.self.connected) { setSolo('Reconnect to greet your room.'); return }
    last.current = Date.now() + EMOTE_COOLDOWN; setLocked(true)
    if (room.link.current.self) room.link.current.send({ type: 'emote', emote: id })
    setSolo(`${EMOTES[id]}${room.link.current.self ? ' · sent to your room' : ' · solo greeting'}`)
  }
  return <dialog ref={dialog} className="visitor-panel" aria-label="Festival greetings" onCancel={e => { e.preventDefault(); close() }}><span className="eyebrow">A little togetherness</span><h2>Festival greetings</h2><p>Choose a greeting with touch, or Tab and Enter. Short visual cues, no chat. One greeting every four seconds.</p><div className="visitor-actions">{Object.entries(EMOTES).map(([id, label]) => <button key={id} disabled={locked} onClick={() => send(id as Emote)}>{label}</button>)}</div><p role="status">{solo}</p><button onClick={close}>Back to mela</button></dialog>
}
export function SocialCues({ events, offset, self }: { events: SocialEvent[]; offset: number; self?: string }) {
  const [clock, setClock] = useState(Date.now())
  useEffect(() => { if (!events.length) return; setClock(Date.now()); const timer = setInterval(() => setClock(Date.now()), 250); return () => clearInterval(timer) }, [events])
  const live = events.filter(e => clock + offset - e.at >= -1000 && clock + offset - e.at < (e.emote === 'group' ? GROUP_LIFE : EMOTE_LIFE))
  return <aside className="social-cues" aria-label="Room celebration" aria-live="polite">{live.map(e => <p key={e.id} className={e.emote === 'group' ? 'diya-celebration' : ''}>{e.emote === 'group' ? '🪔 Together, our diyas light the Ganga. Thank you for sharing this moment.' : `${e.player === self ? 'You' : 'A fellow visitor'} · ${EMOTES[e.emote]}`}</p>)}</aside>
}
