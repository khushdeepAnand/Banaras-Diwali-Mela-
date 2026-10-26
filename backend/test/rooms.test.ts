import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { WebSocket } from 'ws'
import { attachRooms, parseRoomOrigins } from '../src/rooms.js'
import type { Visitor } from '../src/shared/network.js'
import { clearSegment, walkable } from '../src/shared/world.js'
import { GOODS, OFFER_POINT, type GameplayEvent, type GameplayState } from '../src/shared/gameplay.js'

type Packet = { type: string; code?: string; room: string; token: string; id: string; visitor: Visitor; visitors: Visitor[]; state: GameplayState; events: GameplayEvent[]; gameplay: GameplayState; request: number; ok: boolean; social: { id: string; player: string; emote: string }[] }
const origin = 'http://127.0.0.1:5174'
let server: Server, rooms: ReturnType<typeof attachRooms>, address: string, clock: number
const clients: WebSocket[] = []
beforeEach(async () => {
  clock = 10_000; server = createServer((_req, res) => { res.writeHead(404); res.end() })
  rooms = attachRooms(server, [origin], () => clock)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  address = `ws://127.0.0.1:${(server.address() as { port: number }).port}/api/room-socket`
})
afterEach(async () => { for (const ws of clients.splice(0)) ws.terminate(); rooms.close(); await new Promise<void>(resolve => server.close(() => resolve())) })
async function client() {
  const ws = new WebSocket(address, { origin }); clients.push(ws)
  const packets: Packet[] = []; ws.on('error', () => {}); ws.on('message', data => packets.push(JSON.parse(data.toString())))
  await new Promise<void>(resolve => ws.once('open', resolve))
  return { ws, packets, send: (data: unknown) => ws.send(JSON.stringify(data)),
    wait: async (type: string) => { await expect.poll(() => packets.find(p => p.type === type), { timeout: 3000 }).toBeTruthy(); return packets.find(p => p.type === type)! } }
}
describe('real WebSocket room authority', () => {
  it('confirms a wheel stamp only after a valid ride pose, once per ride, and allows a later genuine ride', async () => {
    const c = await client(); c.send({ type: 'create' }); const welcome = await c.wait('welcome')
    let seq = 0, position = { x: 0, z: 10.5 }
    for (const target of [{ x: 15.5, z: 10.5 }, { x: 15.5, z: 8.35 }]) {
      while (Math.hypot(target.x - position.x, target.z - position.z) > .01) {
        const scale = Math.min(1, 1.4 / Math.hypot(target.x - position.x, target.z - position.z))
        position = { x: position.x + (target.x - position.x) * scale, z: position.z + (target.z - position.z) * scale }
        clock += 500; c.send({ type: 'move', seq: seq++, ...position, heading: 0, moving: true })
        await expect.poll(() => c.packets.filter(p => p.type === 'snapshot').at(-1)?.visitors.find(v => v.id === welcome.id)).toMatchObject(position)
      }
    }
    c.send({ type: 'ride', seq: seq++, kind: 'wheel' })
    for (let i = 0; i < 2; i++) c.send({ type: 'ridePose', seq: seq++, x: 15.5, y: 1.45, z: 3.73, heading: 0 })
    await expect.poll(() => c.packets.filter(p => p.type === 'activity').length).toBe(1)
    c.send({ type: 'walk', seq: seq++ }); c.send({ type: 'ride', seq: seq++, kind: 'wheel' })
    c.send({ type: 'ridePose', seq: seq++, x: 15.5, y: 1.45, z: 3.73, heading: 0 })
    await expect.poll(() => c.packets.filter(p => p.type === 'activity').length).toBe(2)
  }, 15_000)
  it('allowlists and rate limits greetings, isolates rooms and expires cues', async () => {
    const c = await client(); c.send({ type: 'create' }); const welcome = await c.wait('welcome')
    const peer = await client(); peer.send({ type: 'join', code: welcome.room }); await peer.wait('welcome')
    const isolated = await client(); isolated.send({ type: 'create' }); await isolated.wait('welcome')
    c.send({ type: 'emote', seq: 0, emote: 'namaste' }); c.send({ type: 'emote', seq: 1, emote: 'wave' })
    await expect.poll(() => peer.packets.filter(p => p.type === 'snapshot').at(-1)?.social).toMatchObject([{ player: welcome.id, emote: 'namaste' }])
    await expect.poll(() => isolated.packets.filter(p => p.type === 'snapshot').at(-1)?.social).toEqual([])
    clock += 4000
    await expect.poll(() => peer.packets.filter(p => p.type === 'snapshot').at(-1)?.social).toEqual([])
    c.send({ type: 'emote', seq: 2, emote: 'https://evil.example/animation.js' })
    expect((await c.wait('error')).code).toBe('INVALID_MESSAGE')
  })
  it('broadcasts one group event only after three authoritative diya successes; replay and resume cannot duplicate it', async () => {
    const host = await client(); host.send({ type: 'create' }); const first = await host.wait('welcome')
    const peers = [host, await client(), await client()]
    const welcomes = [first]
    for (const peer of peers.slice(1)) { peer.send({ type: 'join', code: first.room }); welcomes.push(await peer.wait('welcome')) }
    const isolated = await client(); isolated.send({ type: 'create' }); await isolated.wait('welcome')
    const seqs = [0, 0, 0]
    async function travel(index: number, target: { x: number; z: number }) {
      const peer = peers[index], id = welcomes[index].id
      await expect.poll(() => peer.packets.filter(p => p.type === 'snapshot').at(-1)?.visitors.find(v => v.id === id)).toBeTruthy()
      let p = peer.packets.filter(p => p.type === 'snapshot').at(-1)!.visitors.find(v => v.id === id)!
      while (Math.hypot(target.x - p.x, target.z - p.z) > .01) {
        const scale = Math.min(1, 1.4 / Math.hypot(target.x - p.x, target.z - p.z))
        const next = { x: p.x + (target.x - p.x) * scale, z: p.z + (target.z - p.z) * scale }
        clock += 350; peer.send({ type: 'move', seq: seqs[index]++, ...next, heading: 0, moving: true })
        await expect.poll(() => peer.packets.filter(p => p.type === 'snapshot').at(-1)?.visitors.find(v => v.id === id)).toMatchObject(next)
        p = peer.packets.filter(p => p.type === 'snapshot').at(-1)!.visitors.find(v => v.id === id)!
      }
    }
    for (let i = 0; i < 3; i++) {
      await travel(i, { x: -9.6, z: 10.5 }); await travel(i, { x: -9.6, z: 14.5 })
      peers[i].send({ type: 'gameplay', seq: seqs[i]++, request: 0, action: 'collect', item: 'diya' })
      expect((await peers[i].wait('gameplay')).ok).toBe(true)
      await travel(i, { x: -9.6, z: 10.5 }); await travel(i, { x: 0, z: 10.5 }); await travel(i, OFFER_POINT)
    }
    for (let i = 0; i < 3; i++) {
      peers[i].packets.splice(0)
      peers[i].send({ type: 'gameplay', seq: seqs[i]++, request: 1, action: 'offer', item: 'diya' })
      expect((await peers[i].wait('gameplay')).ok).toBe(true)
    }
    await expect.poll(() => peers[0].packets.filter(p => p.type === 'snapshot').at(-1)?.social.filter(e => e.emote === 'group').length).toBe(1)
    for (let i = 0; i < 3; i++) { peers[i].packets.splice(0); peers[i].send({ type: 'gameplay', seq: seqs[i]++, request: 1, action: 'offer', item: 'diya' }); expect((await peers[i].wait('gameplay')).ok).toBe(false) }
    await expect.poll(() => isolated.packets.filter(p => p.type === 'snapshot').at(-1)?.social).toEqual([])
    host.ws.close(); await expect.poll(() => rooms.stats().connections).toBe(3)
    const resumed = await client(); resumed.send({ type: 'resume', code: first.room, token: first.token }); await resumed.wait('welcome')
    resumed.send({ type: 'gameplay', seq: 0, request: 1, action: 'offer', item: 'diya' }); expect((await resumed.wait('gameplay')).ok).toBe(false)
    await expect.poll(() => resumed.packets.filter(p => p.type === 'snapshot').at(-1)?.social.filter(e => e.emote === 'group').length).toBe(1)
    clock += 6001
    await expect.poll(() => resumed.packets.filter(p => p.type === 'snapshot').at(-1)?.social).toEqual([])
  }, 30_000)
  it('owns session gifts, deduplicates consumption, shares bounded events only within a room and resumes inventory', async () => {
    const c = await client(); c.send({ type: 'create' }); const welcome = await c.wait('welcome')
    const peer = await client(); peer.send({ type: 'join', code: welcome.room }); await peer.wait('welcome')
    const isolated = await client(); isolated.send({ type: 'create' }); await isolated.wait('welcome')
    let seq = 0, position = { x: 0, z: 10.5 }
    async function move(x: number, z: number) {
      while (Math.hypot(x - position.x, z - position.z) > .01) {
        const distance = Math.hypot(x - position.x, z - position.z), scale = Math.min(1, 1 / distance)
        position = { x: position.x + (x - position.x) * scale, z: position.z + (z - position.z) * scale }
        clock += 500
        c.send({ type: 'move', seq: seq++, ...position, heading: 0, moving: true })
        await expect.poll(() => c.packets.filter(p => p.type === 'snapshot').at(-1)?.visitors.find(v => v.id === welcome.id)?.x === position.x && c.packets.filter(p => p.type === 'snapshot').at(-1)?.visitors.find(v => v.id === welcome.id)?.z === position.z).toBe(true)
      }
    }
    async function act(request: number, action: string, item: string) {
      c.packets.splice(0, c.packets.length)
      c.send({ type: 'gameplay', seq: seq++, request, action, item })
      return c.wait('gameplay')
    }
    expect((await act(0, 'collect', 'flower')).ok).toBe(false)
    await move(GOODS.flower.x, 10.5); await move(GOODS.flower.x, 14.5)
    expect((await act(1, 'collect', 'flower')).state.inventory.flower).toBe(1)
    await move(GOODS.flower.x, 10.5); await move(OFFER_POINT.x, 10.5); await move(OFFER_POINT.x, OFFER_POINT.z)
    expect((await act(2, 'offer', 'flower')).state.inventory.flower).toBe(0)
    expect((await act(2, 'offer', 'flower')).ok).toBe(false)
    await expect.poll(() => peer.packets.filter(p => p.type === 'snapshot').at(-1)?.events.length).toBe(1)
    expect(peer.packets.filter(p => p.type === 'snapshot').at(-1)?.events[0].item).toBe('flower')
    await expect.poll(() => isolated.packets.filter(p => p.type === 'snapshot').at(-1)?.events.length).toBe(0)
    expect(JSON.stringify(peer.packets.filter(p => p.type === 'snapshot').at(-1))).not.toContain('inventory')
    c.ws.close(); await expect.poll(() => rooms.stats().connections).toBe(2)
    const resumed = await client(); resumed.send({ type: 'resume', code: welcome.room, token: welcome.token })
    expect((await resumed.wait('welcome')).gameplay).toMatchObject({ inventory: { flower: 0 }, lastRequest: 2 })
    resumed.send({ type: 'gameplay', seq: 0, request: 3, action: 'offer', item: 'unknown' })
    expect((await resumed.wait('error')).code).toBe('INVALID_MESSAGE')
  }, 30_000)
  it('broadcasts only allowlisted appearances without accepting asset URLs or arbitrary fields', async () => {
    const c = await client(); c.send({ type: 'create' }); await c.wait('welcome')
    const appearance = { kurta: 'teal', outfit: 'waistcoat', hair: 'bun', accessory: 'mala' }
    c.send({ type: 'appearance', seq: 0, appearance })
    await expect.poll(() => c.packets.filter(p => p.type === 'snapshot').at(-1)?.visitors[0].appearance).toEqual(appearance)
    c.send({ type: 'appearance', seq: 1, appearance: { ...appearance, model: 'https://evil.example/a.glb' } })
    expect((await c.wait('error')).code).toBe('INVALID_MESSAGE')
  })
  it('requires exact HTTPS origins in production without weakening commerce config', () => {
    expect(parseRoomOrigins('https://mela.example', true)).toEqual(['https://mela.example'])
    for (const value of ['', '*', 'null', 'http://mela.example', 'https://mela.example/path', 'https://mela.example/']) expect(() => parseRoomOrigins(value, true)).toThrow()
    expect(parseRoomOrigins(origin, false)).toEqual([origin])
  })
  it('atomically admits four, rejects a racing fifth and isolates a second room', async () => {
    const first = await client(); first.send({ type: 'create' }); const welcome = await first.wait('welcome')
    const others = await Promise.all(Array.from({ length: 4 }, client))
    for (const other of others) other.send({ type: 'join', code: welcome.room })
    await expect.poll(() => others.filter(c => c.packets.some(p => p.type === 'welcome')).length).toBe(3)
    await expect.poll(() => others.filter(c => c.packets.some(p => p.code === 'ROOM_FULL')).length).toBe(1)
    const different = await client(); different.send({ type: 'create' }); const otherRoom = await different.wait('welcome')
    expect(otherRoom.room).not.toBe(welcome.room)
    await expect.poll(() => first.packets.filter(p => p.type === 'snapshot').at(-1)?.visitors.length).toBe(4)
    const snapshot = first.packets.filter(p => p.type === 'snapshot').at(-1)!
    expect(JSON.stringify(snapshot)).not.toContain(welcome.token)
    for (const visitor of snapshot.visitors) expect(walkable(visitor)).toBe(true)
    await expect.poll(() => different.packets.filter(p => p.type === 'snapshot').at(-1)?.visitors.length).toBe(1)
    expect(rooms.stats()).toMatchObject({ rooms: 2, guests: 5 })
  })
  it('validates speed, finite values, full collision segments, replay and claimed identities', async () => {
    const c = await client(); c.send({ type: 'create' }); const joined = await c.wait('welcome')
    c.send({ type: 'move', seq: 0, x: 0.5, z: 10.5, heading: -1, moving: true })
    await expect.poll(() => c.packets.filter(p => p.type === 'snapshot').at(-1)?.visitors[0].x).toBe(0.5)
    c.send({ type: 'move', seq: 1, x: 29, z: 10.5, heading: 0, moving: true })
    const corrected = (await c.wait('correct')).visitor
    expect(corrected.x).toBe(0.5)
    expect(corrected.moving).toBe(false)
    c.send({ type: 'move', seq: 2, x: 0.5, z: 10.5, heading: 0, moving: false, id: joined.id })
    expect((await c.wait('error')).code).toBe('INVALID_MESSAGE')
    const replay = await client(); replay.send({ type: 'create' }); await replay.wait('welcome')
    replay.send({ type: 'move', seq: 0, x: 0, z: 10.5, heading: 0, moving: false }); replay.send({ type: 'reset', seq: 0 })
    expect((await replay.wait('error')).code).toBe('REPLAYED_MESSAGE')
  })
  it('hides disconnected visitors immediately, reserves the slot, resumes with a secret token, and expires empty rooms', async () => {
    const c = await client(); c.send({ type: 'create' }); const joined = await c.wait('welcome')
    c.ws.close(); await expect.poll(() => rooms.stats().connections).toBe(0)
    expect(rooms.stats().guests).toBe(1)
    const resumed = await client(); resumed.send({ type: 'resume', code: joined.room, token: joined.token })
    expect((await resumed.wait('welcome')).id).toBe(joined.id)
    const impostor = await client(); impostor.send({ type: 'resume', code: joined.room, token: 'a'.repeat(64) })
    expect((await impostor.wait('error')).code).toBe('RESUME_EXPIRED')
    resumed.ws.close(); await expect.poll(() => rooms.stats().connections).toBe(0)
    clock += 20_001; rooms.sweep(); expect(rooms.stats()).toMatchObject({ guests: 0, rooms: 0 })
  })
  it('rejects before-join actions, malformed JSON, nonfinite values, oversize and excessive messages', async () => {
    const unauthorised = await client(); unauthorised.send({ type: 'move', seq: 0, x: 0, z: 10.5, heading: 0, moving: false })
    expect((await unauthorised.wait('error')).code).toBe('JOIN_REQUIRED')
    const malformed = await client(); malformed.ws.send('{'); expect((await malformed.wait('error')).code).toBe('INVALID_MESSAGE')
    const nonfinite = await client(); nonfinite.ws.send('{"type":"move","seq":0,"x":1e999,"z":10,"heading":0,"moving":false}')
    expect((await nonfinite.wait('error')).code).toBe('INVALID_MESSAGE')
    const excessive = await client(); excessive.send({ type: 'create' }); await excessive.wait('welcome')
    for (let seq = 0; seq < 24; seq++) excessive.send({ type: 'move', seq, x: 0, z: 10.5, heading: 0, moving: false })
    expect((await excessive.wait('error')).code).toBe('RATE_LIMITED')
    const large = await client(); const closed = new Promise<number>(resolve => large.ws.once('close', resolve)); large.ws.send('x'.repeat(2048)); expect(await closed).toBe(1009)
  })
  it('releases explicit leaves, rejects active-session token reuse, and guards the upgrade origin', async () => {
    const c = await client(); c.send({ type: 'create' }); const joined = await c.wait('welcome')
    const duplicate = await client(); duplicate.send({ type: 'resume', code: joined.room, token: joined.token })
    expect((await duplicate.wait('error')).code).toBe('RESUME_EXPIRED')
    c.send({ type: 'leave' }); await expect.poll(() => rooms.stats().guests).toBe(0)
    const badOrigin = new WebSocket(address, { origin: 'https://untrusted.example' }); clients.push(badOrigin); badOrigin.on('error', () => {})
    const status = await new Promise<number>(resolve => badOrigin.on('unexpected-response', (_req, res) => { res.resume(); resolve(res.statusCode || 0); badOrigin.terminate() }))
    expect(status).toBe(403)
  })
  it('prevents forged ride entry and disallowed ride poses', async () => {
    const c = await client(); c.send({ type: 'create' }); await c.wait('welcome')
    c.send({ type: 'ride', seq: 0, kind: 'wheel' }); expect((await c.wait('correct')).visitor.ride).toBe(null)
    c.packets.length = 0; c.send({ type: 'ridePose', seq: 1, x: 15, y: 8, z: 4, heading: 0 })
    expect((await c.wait('correct')).visitor.ride).toBe(null)
  })
  it('checks complete paths rather than accepting two safe endpoints through a pillar', () => {
    const a = { x: 7.4, z: 12.7 }, b = { x: 8.6, z: 12.7 }
    expect(walkable(a)).toBe(true); expect(walkable(b)).toBe(true)
    expect(clearSegment(a, b)).toBe(false)
  })
})
