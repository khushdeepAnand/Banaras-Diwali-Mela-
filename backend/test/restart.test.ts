import { createServer } from 'node:http'
import { once } from 'node:events'
import { WebSocket } from 'ws'
import { expect, it } from 'vitest'
import { attachRooms } from '../src/rooms.js'

it('server replacement discards rooms and rejects resume instead of pretending session persistence', async () => {
  const origin = 'https://staging.example'
  async function owner() {
    const server = createServer((_req, res) => res.end('test'))
    const rooms = attachRooms(server, [origin])
    server.listen(0, '127.0.0.1'); await once(server, 'listening')
    const address = `ws://127.0.0.1:${(server.address() as { port: number }).port}/api/room-socket`
    return { address, close: async () => { rooms.close(); await new Promise<void>(resolve => server.close(() => resolve())) } }
  }
  async function action(address: string, payload: object) {
    const ws = new WebSocket(address, { origin }); ws.on('error', () => {})
    await once(ws, 'open')
    const packet = once(ws, 'message'); ws.send(JSON.stringify(payload))
    const [data] = await packet
    ws.terminate()
    return JSON.parse(data.toString())
  }
  const first = await owner()
  let welcome: { room: string; token: string }
  try { welcome = await action(first.address, { type: 'create' }) }
  finally { await first.close() }
  const replacement = await owner()
  try {
    expect(await action(replacement.address, { type: 'resume', code: welcome!.room, token: welcome!.token })).toMatchObject({ type: 'error', code: 'ROOM_UNAVAILABLE' })
  } finally { await replacement.close() }
})
