import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WORLD_VERSION } from '../../../backend/src/shared/world'
import { validRoomCode } from '../../../backend/src/shared/network'
import type { Visitor, Welcome } from '../../../backend/src/shared/network'
import { validAppearance } from '../../../backend/src/shared/appearance'
import { EVENT_LIMIT, GOODS, ITEMS, type GameplayEvent, type GameplayResult, type GameplayState } from '../../../backend/src/shared/gameplay'
import { EMOTES, type SocialEvent } from '../../../backend/src/shared/social'

export type RoomLink = {
  self: { id: string; room: string; token: string; connected: boolean } | null
  visitors: Visitor[]; correction: Visitor | null
  events: GameplayEvent[]; serverOffset: number
  send: (value: Record<string, unknown>) => void
}
function validVisitor(value: unknown): value is Visitor {
  if (!value || typeof value !== 'object') return false
  const p = value as Visitor
  return typeof p.id === 'string' && p.id.length <= 40 && [p.x, p.y, p.z, p.heading].every(Number.isFinite) && typeof p.moving === 'boolean' && validAppearance(p.appearance) && (p.ride === null || ['wheel', 'pendulum', 'ferry', 'cruise'].includes(p.ride))
}
export function useRoom() {
  const [social, setSocial] = useState<SocialEvent[]>([]), [wheelStamp, setWheelStamp] = useState(0)
  const [game, setGame] = useState<GameplayState | null>(null)
  const [gameResult, setGameResult] = useState<GameplayResult | null>(null)
  const [status, setStatus] = useState('Solo — multiplayer optional')
  const [code, setCode] = useState(''), [count, setCount] = useState(0)
  const socket = useRef<WebSocket | null>(null), sequence = useRef(0), retry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const handshake = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const desired = useRef(false), deadline = useRef(0), connectRef = useRef<(resume: boolean, code?: string) => void>(() => {})
  const link = useRef<RoomLink>({ self: null, visitors: [], correction: null, events: [], serverOffset: 0, send: () => {} })
  const send = useCallback((value: Record<string, unknown>) => {
    if (socket.current?.readyState === WebSocket.OPEN && link.current.self?.connected) socket.current.send(JSON.stringify({ ...value, seq: sequence.current++ }))
  }, [])
  link.current.send = send
  const leave = useCallback(() => {
    desired.current = false; clearTimeout(retry.current)
    clearTimeout(handshake.current)
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ type: 'leave' }))
    socket.current?.close(); socket.current = null
    link.current.self = null; link.current.visitors = []; link.current.correction = null
    link.current.events = []; setGame(null); setGameResult(null); setSocial([]); setWheelStamp(0)
    setStatus('Solo — multiplayer optional'); setCode(''); setCount(0)
  }, [])
  const connect = useCallback((resume: boolean, roomCode?: string) => {
    clearTimeout(retry.current)
    clearTimeout(handshake.current)
    if (socket.current) { socket.current.onopen = null; socket.current.onmessage = null; socket.current.onclose = null; socket.current.close() }
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/room-socket`)
    handshake.current = setTimeout(() => ws.close(), 8000)
    socket.current = ws; sequence.current = 0
    setStatus(resume ? 'Reconnecting…' : 'Connecting…')
    ws.onopen = () => {
      if (!desired.current) { ws.close(); return }
      const self = link.current.self
      ws.send(JSON.stringify(resume && self ? { type: 'resume', code: self.room, token: self.token } : roomCode ? { type: 'join', code: roomCode } : { type: 'create' }))
    }
    ws.onmessage = event => {
      if (socket.current !== ws) return
      try {
        const value = JSON.parse(event.data)
        if (value.type === 'welcome') {
          const welcome = value as Welcome
           if (welcome.world !== WORLD_VERSION || !validVisitor(welcome.visitor) || !validRoomCode(welcome.room) || !/^[a-f0-9]{64}$/.test(welcome.token)) throw new Error()
          link.current.self = { id: welcome.id, room: welcome.room, token: welcome.token, connected: true }
          clearTimeout(handshake.current)
          link.current.correction = welcome.visitor
          if (!validGame(value.gameplay)) throw new Error()
          setGame(value.gameplay); setGameResult(null)
          setCode(welcome.room); setStatus('Connected'); deadline.current = 0
        } else if (value.type === 'snapshot' && value.room === link.current.self?.room && Array.isArray(value.visitors) && value.visitors.length <= 4 && value.visitors.every(validVisitor)) {
          link.current.visitors = value.visitors
          if (Number.isFinite(value.serverTime) && Array.isArray(value.events) && value.events.length <= EVENT_LIMIT && value.events.every(validEvent)) {
           link.current.events = value.events; link.current.serverOffset = value.serverTime - Date.now()
            if (Array.isArray(value.social) && value.social.length <= 8 && value.social.every((e: SocialEvent) => e && typeof e.id === 'string' && e.id.length <= 64 && typeof e.player === 'string' && e.player.length <= 40 && Number.isSafeInteger(e.at) && (e.emote === 'group' || Object.hasOwn(EMOTES, e.emote)))) {
              setSocial(previous => previous.map(e => e.id).join() === value.social.map((e: SocialEvent) => e.id).join() ? previous : value.social)
            }
          }
          setCount(previous => previous === value.visitors.length ? previous : value.visitors.length)
        } else if (value.type === 'gameplay' && validGame(value.state) && Number.isSafeInteger(value.request) && typeof value.ok === 'boolean' && typeof value.message === 'string' && value.message.length < 240) {
          setGame(value.state); setGameResult(value)
        } else if (value.type === 'activity' && value.activity === 'wheel') setWheelStamp(previous => previous + 1)
        else if (value.type === 'correct' && validVisitor(value.visitor) && value.visitor.id === link.current.self?.id) link.current.correction = value.visitor
        else if (value.type === 'error') {
          desired.current = false
          if (value.code === 'RESUME_EXPIRED' || value.code === 'ROOM_UNAVAILABLE') { link.current.self = null; setCode(''); setCount(0) }
          const labels: Record<string, string> = { ROOM_FULL: 'Room full (four visitors, including reserved reconnect slots)', ROOM_UNAVAILABLE: 'Room unavailable', RESUME_EXPIRED: 'Session expired — join again', RATE_LIMITED: 'Connection rate limited — try later' }
          setStatus(labels[value.code] || 'Room request rejected — explore solo or try again')
        }
      } catch { desired.current = false; setStatus('Incompatible room service — explore solo'); ws.close() }
    }
    ws.onerror = () => {} // browser handles transport errors; never log session payloads
    ws.onclose = () => {
      if (socket.current !== ws) return
      clearTimeout(handshake.current)
      if (link.current.self) link.current.self.connected = false
      link.current.visitors = []; setCount(0); setSocial([])
      if (!desired.current) return
      if (!link.current.self) { desired.current = false; setStatus('Multiplayer unavailable — explore solo'); return }
      deadline.current ||= Date.now() + 18_000
      if (Date.now() >= deadline.current) { desired.current = false; setStatus('Session expired — join again'); return }
      setStatus('Reconnecting… solo controls remain available')
      retry.current = setTimeout(() => connectRef.current(true), 1500)
    }
  }, [])
  connectRef.current = connect
   const join = useCallback((roomCode?: string) => {
     if (roomCode !== undefined && !validRoomCode(roomCode)) { setStatus('Invalid room code — use ten uppercase hexadecimal characters.'); return }
     leave(); desired.current = true; connect(false, roomCode)
   }, [leave, connect])
  useEffect(() => {
    const offline = () => socket.current?.close()
    const online = () => { if (desired.current && link.current.self && !link.current.self.connected) connectRef.current(true) }
    window.addEventListener('offline', offline); window.addEventListener('online', online)
    return () => { desired.current = false; clearTimeout(retry.current); clearTimeout(handshake.current); socket.current?.close(); window.removeEventListener('offline', offline); window.removeEventListener('online', online) }
  }, [])
  return useMemo(() => ({ link, status, code, count, join, leave, game, gameResult, social, wheelStamp }), [status, code, count, join, leave, game, gameResult, social, wheelStamp])
}

function validGame(value: GameplayState): boolean {
  return !!value && !!value.inventory && ITEMS.every(item => Number.isInteger(value.inventory[item]) && value.inventory[item] >= 0 && value.inventory[item] <= GOODS[item].cap) && [value.lastRequest, value.collectAt, value.offerAt, value.lightAt].every(Number.isSafeInteger)
}
function validEvent(value: GameplayEvent): boolean {
  return !!value && typeof value.id === 'string' && value.id.length <= 64 && ['flower', 'diya', 'firecracker'].includes(value.item) && Number.isSafeInteger(value.at)
}
