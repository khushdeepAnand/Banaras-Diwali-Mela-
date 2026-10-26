import { useEffect, useRef, useState } from 'react'
import type { useRoom } from './useRoom'
import { invitation, inviteFromSearch, whatsappInvite } from './sharing'

export function RoomPanel({ room, close }: { room: ReturnType<typeof useRoom>; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
   const [initial] = useState(() => inviteFromSearch(window.location.search))
   const [code, setCode] = useState(initial.code)
   const [feedback, setFeedback] = useState(initial.invalid ? 'Invalid invitation. Ask your friend for a new link, or explore solo.' : initial.code ? 'Invitation ready. Press Join room to connect; no room is created automatically.' : '')
   const url = room.code ? invitation(room.code, window.location.href) : ''
   async function copy() {
     try { await navigator.clipboard.writeText(url); setFeedback('Invite link copied.') }
     catch { setFeedback('Copy unavailable. Select and copy the invite link below.') }
   }
   async function share() {
     if (!navigator.share) { setFeedback('Native sharing unavailable. Copy the link or use WhatsApp.'); return }
     try { await navigator.share({ title: 'Banaras Diwali Mela', text: 'Banaras mein milte hain! Mela free hai.', url }); setFeedback('Share request completed by your device.') }
     catch { setFeedback('Sharing cancelled or unavailable. Copy the link instead.') }
   }
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close() }, [])
  return <dialog ref={dialog} className="commerce-dialog room-panel" aria-label="Explore together" onCancel={event => { event.preventDefault(); close() }}>
    <header className="commerce-heading"><h2>Explore together</h2><button aria-label="Close multiplayer" onClick={close}>×</button></header>
    <p role="status" data-testid="room-status">{room.status}</p>
    {room.code && <p>Room <strong data-testid="room-code">{room.code}</strong> · <span data-testid="room-count">{room.count}</span>/4 connected</p>}
    <p>Four real visitors per room. Share the code privately. Ordinary NPCs do not use visitor slots. Playing solo is always available.</p>
    {!room.code ? <>
      <button onClick={() => room.join()}>Create room</button>
      <form onSubmit={event => { event.preventDefault(); room.join(code.trim().toUpperCase()) }}>
        <label>Room code<input aria-label="Room code" maxLength={10} pattern="[A-Fa-f0-9]{10}" required value={code} onChange={event => setCode(event.target.value.toUpperCase())} autoComplete="off" /></label>
        <button type="submit">Join room</button>
      </form>
     </> : <><section aria-label="Room invitation"><label>Invite link<input aria-label="Invite link" readOnly value={url} onFocus={event => event.currentTarget.select()} /></label><div className="invite-actions"><button onClick={() => void copy()}>Copy invite link</button><button onClick={() => void share()}>Share invite</button><a href={whatsappInvite(url)} target="_blank" rel="noopener noreferrer">WhatsApp invite</a></div></section><button onClick={room.leave}>Leave room</button></>}
     <p role="status">{feedback}</p>
    <p className="privacy">Room state is temporary and resets if the server restarts. Disconnected slots are reserved for20 seconds; reconnect works in the same open tab. No payments or account login required.</p>
    <button onClick={close}>Back to mela</button>
  </dialog>
}
