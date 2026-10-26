import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, Server } from 'node:http'
import type { Duplex } from 'node:stream'
import { WebSocket, WebSocketServer } from 'ws'
import { z } from 'zod'
import { clearSegment, groundHeight, SPAWN, walkable, WORLD_VERSION } from './shared/world.js'
import { RECONNECT_MS, RIDE_ENTRY, RIDE_EXIT, ROOM_CAPACITY, ROOM_CODE_PATTERN, SNAPSHOT_MS, type RideKind, type Visitor } from './shared/network.js'
import { ACCESSORIES, DEFAULT_APPEARANCE, HAIR, KURTAS, OUTFITS } from './shared/appearance.js'
import { applyGameplay, eventAlive, ITEMS, newGameplay, type GameplayEvent, type GameplayState } from './shared/gameplay.js'
import { EMOTES, EMOTE_COOLDOWN, EMOTE_LIFE, GROUP_LIFE, groupDiya, newDiyaWindow, type SocialEvent, type DiyaWindow } from './shared/social.js'

const seq = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
const number = z.number().finite()
const kind = z.enum(['wheel', 'pendulum', 'ferry', 'cruise'])
const code = z.string().regex(new RegExp(ROOM_CODE_PATTERN))
const message = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('create') }),
  z.strictObject({ type: z.literal('join'), code }),
  z.strictObject({ type: z.literal('resume'), code, token: z.string().regex(/^[a-f0-9]{64}$/) }),
  z.strictObject({ type: z.literal('move'), seq, x: number, z: number, heading: number.min(-Math.PI).max(Math.PI), moving: z.boolean() }),
  z.strictObject({ type: z.literal('ridePose'), seq, x: number, y: number, z: number, heading: number.min(-Math.PI).max(Math.PI) }),
  z.strictObject({ type: z.literal('ride'), seq, kind }),
  z.strictObject({ type: z.literal('walk'), seq }),
  z.strictObject({ type: z.literal('reset'), seq }),
  z.strictObject({ type: z.literal('appearance'), seq, appearance: z.strictObject({ kurta: z.enum(KURTAS), outfit: z.enum(OUTFITS), hair: z.enum(HAIR), accessory: z.enum(ACCESSORIES) }) }),
  z.strictObject({ type: z.literal('leave') }),
  z.strictObject({ type: z.literal('emote'), seq, emote: z.enum(Object.keys(EMOTES) as [keyof typeof EMOTES, ...(keyof typeof EMOTES)[]]) }),
  z.strictObject({ type: z.literal('gameplay'), seq, request: seq, action: z.enum(['collect', 'offer', 'light']), item: z.enum(ITEMS) }),
])
type Guest = { visitor: Visitor; tokenHash: string; socket: WebSocket | null; until: number; seq: number; last: number; credit: number; lastPose: number; gameplay: GameplayState; emoteAt: number; wheelStamp: boolean }
type Room = { code: string; guests: Map<string, Guest>; events: GameplayEvent[]; social: SocialEvent[]; diya: DiyaWindow }
const hash = (token: string) => createHash('sha256').update(token).digest('hex')
function send(socket: WebSocket, value: unknown) {
  if (socket.readyState !== WebSocket.OPEN) return
  if (socket.bufferedAmount > 64_000) { socket.close(1013, 'Slow connection'); return }
  socket.send(JSON.stringify(value))
}
function ridePoseAllowed(ride: RideKind, p: { x: number; y: number; z: number }) {
  const y = p.y + 0.7 // existing local character's feet sit below its ride anchor
  if (ride === 'wheel') return Math.abs(Math.hypot(p.x - 15.5, y - 7.25) - 5.1) < 0.3 && Math.abs(p.z - 3.73) < 0.3
  if (ride === 'pendulum') return Math.abs(Math.hypot(p.x + 16.5, y - 0.5 - 8.1) - 5.1) < 0.3 && Math.abs(p.z - 5.18) < 0.3 && p.x >= -20.5 && p.x <= -12.5
  const a = ride === 'ferry' ? { x: 4, z: -4.22 } : { x: 17, z: -7.82 }
  const b = ride === 'ferry' ? { x: 15, z: -21.82 } : { x: -10, z: -30.82 }
  const dx = b.x - a.x, dz = b.z - a.z
  const t = ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz)
  return t >= -0.01 && t <= 1.01 && Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz) < 0.3 && Math.abs(p.y - 0.1) < 0.15
}

export function parseRoomOrigins(raw: string, production: boolean): string[] {
  const origins = raw.split(',').map(value => value.trim())
  for (const value of origins) {
    const url = new URL(value)
    if (url.origin !== value || !['http:', 'https:'].includes(url.protocol) || production && url.protocol !== 'https:') throw new Error('Exact HTTPS origins required in production')
  }
  return origins
}

// One authoritative in-memory room owner. No DB, commerce data, global room list or client IDs.
export function attachRooms(server: Server, origins: readonly string[], now = Date.now, group = { threshold: 3, windowMs: 30_000 }) {
  if (!Number.isInteger(group.threshold) || group.threshold < 2 || group.threshold > ROOM_CAPACITY || !Number.isFinite(group.windowMs) || group.windowMs < 1000 || group.windowMs > 120_000) throw new Error('Invalid group celebration configuration')
  const rooms = new Map<string, Room>(), connections = new Set<WebSocket>()
  const attempts = new Map<string, { count: number; until: number }>()
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024, perMessageDeflate: false })
  function sweep() {
    for (const [name, room] of rooms) {
      for (const [id, guest] of room.guests) if (!guest.socket && guest.until <= now()) room.guests.delete(id)
      if (!room.guests.size) rooms.delete(name)
    }
    for (const [ip, bucket] of attempts) if (bucket.until <= now()) attempts.delete(ip)
  }
  const upgrade = (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    sweep()
    const ip = request.socket.remoteAddress || 'unknown'
    const previous = attempts.get(ip), time = now()
    if (!previous && attempts.size >= 2048) { socket.end('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n'); return }
    const bucket = !previous || previous.until <= time ? { count: 0, until: time + 60_000 } : previous
    bucket.count++; attempts.set(ip, bucket)
    if (request.url !== '/api/room-socket' || !request.headers.origin || !origins.includes(request.headers.origin) || connections.size >= 128 || bucket.count > 30 || attempts.size > 2048) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return
    }
    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws))
  }
  server.on('upgrade', upgrade)
  wss.on('connection', socket => {
    connections.add(socket)
    let room: Room | undefined, guest: Guest | undefined, joined = false
    let count = 0, windowAt = now(), alive = true
    const fail = (code: string) => { send(socket, { type: 'error', code }); socket.close(1008, code) }
    const authTimer = setTimeout(() => { if (!joined) fail('JOIN_TIMEOUT') }, 5000).unref()
    const heartbeat = setInterval(() => {
      if (socket.readyState !== WebSocket.OPEN) { socket.terminate(); return }
      if (!alive) { socket.terminate(); return }
      alive = false; socket.ping()
    }, 5000).unref()
    socket.on('pong', () => { alive = true })
    socket.on('error', () => {}) // no raw messages, tokens or connection errors logged
    socket.on('message', (raw, binary) => {
      if (socket.readyState !== WebSocket.OPEN) return
      if (now() - windowAt >= 1000) { count = 0; windowAt = now() }
      if (++count > 20) { fail('RATE_LIMITED'); return }
      let parsed: z.infer<typeof message>
      try { if (binary) throw new Error(); parsed = message.parse(JSON.parse(raw.toString())) } catch { fail('INVALID_MESSAGE'); return }
      sweep()
      if (parsed.type === 'create' || parsed.type === 'join' || parsed.type === 'resume') {
        if (joined) { fail('ALREADY_JOINED'); return }
        if (parsed.type === 'create') {
          if (rooms.size >= 32) { fail('SERVICE_FULL'); return }
          let name: string
          do { name = randomBytes(5).toString('hex').toUpperCase() } while (rooms.has(name))
          room = { code: name, guests: new Map(), events: [], social: [], diya: newDiyaWindow() }; rooms.set(name, room)
        } else room = rooms.get(parsed.code)
        if (!room) { fail('ROOM_UNAVAILABLE'); return }
        let token: string
        if (parsed.type === 'resume') {
          const supplied = Buffer.from(hash(parsed.token), 'hex')
          guest = [...room.guests.values()].find(g => timingSafeEqual(Buffer.from(g.tokenHash, 'hex'), supplied))
          if (!guest || guest.socket || guest.until <= now()) { fail('RESUME_EXPIRED'); return }
          token = parsed.token
        } else {
          if (room.guests.size >= ROOM_CAPACITY) { fail('ROOM_FULL'); return }
          const occupied = [...room.guests.values()].map(g => g.visitor)
          const spawn = [0, 1.3, -1.3, 2.6, -2.6, 3.9, -3.9].map(x => ({ x, z: SPAWN.z })).find(p => walkable(p) && occupied.every(o => Math.hypot(o.x - p.x, o.z - p.z) > 0.8)) || { ...SPAWN }
          token = randomBytes(32).toString('hex')
          const visitor: Visitor = { ...spawn, id: randomUUID(), y: groundHeight(spawn.z), heading: 0, moving: false, ride: null, appearance: { ...DEFAULT_APPEARANCE } }
          guest = { visitor, tokenHash: hash(token), socket, until: 0, seq: -1, last: now(), credit: 1.2, lastPose: 0, gameplay: newGameplay(), emoteAt: 0, wheelStamp: false }
          room.guests.set(visitor.id, guest)
        }
        guest.socket = socket; guest.until = 0; guest.seq = -1; guest.last = now(); guest.credit = 1.2
        joined = true; clearTimeout(authTimer)
        send(socket, { type: 'welcome', room: room.code, id: guest.visitor.id, token, visitor: guest.visitor, world: WORLD_VERSION, gameplay: guest.gameplay })
        return
      }
      if (!guest || !room || guest.socket !== socket) { fail('JOIN_REQUIRED'); return }
      if (parsed.type === 'leave') { room.guests.delete(guest.visitor.id); guest = undefined; socket.close(1000, 'Left room'); sweep(); return }
      if (parsed.seq <= guest.seq) { fail('REPLAYED_MESSAGE'); return }
      guest.seq = parsed.seq
      const visitor = guest.visitor
      if (parsed.type === 'gameplay') {
        room.events = room.events.filter(event => eventAlive(event, now()))
        const result = applyGameplay(guest.gameplay, parsed, visitor, visitor.ride !== null, now(), room.events, randomUUID())
        guest.gameplay = result.state
        if (result.event) room.events.push(result.event)
        if (result.ok && result.event?.item === 'diya' && groupDiya(room.diya, visitor.id, now(), group.threshold, group.windowMs)) {
          room.social.push({ id: randomUUID(), at: now(), player: '', emote: 'group' }); room.social = room.social.slice(-8)
        }
        send(socket, { type: 'gameplay', ...result })
        return
      }
      if (parsed.type === 'emote') {
        if (now() < guest.emoteAt) return
        guest.emoteAt = now() + EMOTE_COOLDOWN
        room.social = room.social.filter(event => now() - event.at < (event.emote === 'group' ? GROUP_LIFE : EMOTE_LIFE))
        room.social.push({ id: randomUUID(), at: now(), player: visitor.id, emote: parsed.emote }); room.social = room.social.slice(-8)
        return
      }
      if (parsed.type === 'appearance') { visitor.appearance = parsed.appearance; return }
      if (parsed.type === 'reset') {
        Object.assign(visitor, SPAWN, { y: groundHeight(SPAWN.z), moving: false, ride: null, heading: 0 })
        guest.credit = 0; guest.last = now(); send(socket, { type: 'correct', visitor }); return
      }
      if (parsed.type === 'ride') {
        if (visitor.ride || Math.hypot(visitor.x - RIDE_ENTRY[parsed.kind].x, visitor.z - RIDE_ENTRY[parsed.kind].z) > 2.4) { send(socket, { type: 'correct', visitor }); return }
        visitor.ride = parsed.kind; visitor.moving = false; guest.lastPose = 0; guest.wheelStamp = false; return
      }
      if (parsed.type === 'walk') {
        if (visitor.ride) Object.assign(visitor, RIDE_EXIT[visitor.ride], { y: groundHeight(RIDE_EXIT[visitor.ride].z), ride: null, moving: false })
        guest.credit = 1.2; guest.last = now(); return
      }
      if (parsed.type === 'ridePose') {
        const distance = Math.hypot(parsed.x - visitor.x, parsed.z - visitor.z, parsed.y - visitor.y)
        if (!visitor.ride || !ridePoseAllowed(visitor.ride, parsed) || guest.lastPose && distance > Math.min(2, (now() - guest.lastPose) / 1000) * 12 + 0.5) { send(socket, { type: 'correct', visitor }); return }
        Object.assign(visitor, { x: parsed.x, y: parsed.y, z: parsed.z, heading: parsed.heading, moving: false })
        if (visitor.ride === 'wheel' && !guest.wheelStamp) { guest.wheelStamp = true; send(socket, { type: 'activity', activity: 'wheel' }) }
        guest.lastPose = now(); return
      }
      if (visitor.ride) return
      guest.credit = Math.min(1.5, guest.credit + Math.min(2, (now() - guest.last) / 1000) * 4.5); guest.last = now()
      const distance = Math.hypot(parsed.x - visitor.x, parsed.z - visitor.z)
      if (distance > guest.credit || !walkable(parsed) || !clearSegment(visitor, parsed)) { visitor.moving = false; send(socket, { type: 'correct', visitor }); return }
      guest.credit -= distance
      Object.assign(visitor, { x: parsed.x, z: parsed.z, y: groundHeight(parsed.z), heading: parsed.heading, moving: parsed.moving && distance > 0.01 })
    })
    socket.on('close', () => {
      clearInterval(heartbeat); clearTimeout(authTimer); connections.delete(socket)
      if (guest?.socket === socket) { guest.socket = null; guest.until = now() + RECONNECT_MS; guest.visitor.moving = false }
    })
  })
  const timer = setInterval(() => {
    sweep()
    for (const room of rooms.values()) {
      room.events = room.events.filter(event => eventAlive(event, now()))
      for (const guest of room.guests.values()) if (now() - guest.last > 600) guest.visitor.moving = false
      const visitors = [...room.guests.values()].filter(g => g.socket).map(g => g.visitor)
      room.social = room.social.filter(event => now() - event.at < (event.emote === 'group' ? GROUP_LIFE : EMOTE_LIFE))
      const snapshot = { type: 'snapshot', room: room.code, visitors, events: room.events, social: room.social, serverTime: now() }
      for (const guest of room.guests.values()) if (guest.socket) send(guest.socket, snapshot)
    }
  }, SNAPSHOT_MS).unref()
  return { stats: () => ({ rooms: rooms.size, connections: connections.size, guests: [...rooms.values()].reduce((sum, r) => sum + r.guests.size, 0) }), sweep,
    close: () => { clearInterval(timer); server.off('upgrade', upgrade); for (const socket of connections) socket.terminate(); wss.close(); rooms.clear(); attempts.clear() } }
}
