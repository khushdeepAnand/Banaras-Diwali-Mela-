import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { attachRooms, parseRoomOrigins } from './rooms.js'

try {
  const { PORT, TRUST_PROXY_HOPS, REALTIME_ORIGINS, NODE_ENV, GROUP_DIYA_THRESHOLD, GROUP_DIYA_WINDOW_MS } = loadConfig()
  const origins = parseRoomOrigins(REALTIME_ORIGINS, NODE_ENV === 'production')
  const app = createApp()
  app.set('trust proxy', TRUST_PROXY_HOPS)
  const server = app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`))
  const rooms = attachRooms(server, origins, Date.now, { threshold: GROUP_DIYA_THRESHOLD, windowMs: GROUP_DIYA_WINDOW_MS })
  server.on('error', () => { console.error('Backend could not start; check port and host configuration.'); process.exitCode = 1 })
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => {
    rooms.close()
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10_000).unref()
  })
} catch {
  console.error('Invalid backend configuration. Check environment variables against .env.example; no server started.')
  process.exitCode = 1
}
