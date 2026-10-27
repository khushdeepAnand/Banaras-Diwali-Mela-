import { expect, test } from '@playwright/test'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { capRaster } from '../e2e/raster'
const require = createRequire(new URL('../../backend/package.json', import.meta.url))
const { WebSocket } = require('ws')

test('compiled same-origin HTTPS frontend, secure headers, media ranges and safe errors', async ({ page, request }) => {
  const health = await request.get('/api/health')
  expect(health.status()).toBe(200); expect(await health.json()).toEqual({ data: { status: 'ok' } })
  const homepage = await request.get('/')
  expect(homepage.headers()['content-security-policy']).toContain("script-src 'self'")
  expect(homepage.headers()['x-robots-tag']).toBe('noindex, nofollow')
  expect((await request.get('/?room=ABCDEF1234')).status()).toBe(200)
  expect((await request.get('/future-route', { headers: { Accept: 'text/html' } })).headers()['content-type']).toContain('text/html')
  for (const path of ['/api/missing', '/assets/missing.js', '/.env', '/backend/.env', '/assets/index.js.map']) expect((await request.get(path)).status()).toBe(404)
  const audio = await request.get('/audio/temple-deeparadhana.mp3', { headers: { Range: 'bytes=0-127' } })
  expect(audio.status()).toBe(206); expect(audio.headers()['content-type']).toContain('audio/mpeg')
  expect((await request.get('/audio/river-loop.wav')).headers()['content-type']).toMatch(/audio\/(wav|wave|x-wav)/)
  expect((await request.get('/gallery/riverfront.png')).headers()['content-type']).toContain('image/png')
  expect((await request.get('/api/payment-qr')).status()).toBe(404)
  expect((await (await request.get('/api/public-config')).json()).data).toMatchObject({ demo: true, mode: 'demo', recipient: { enabled: false } })
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  await page.addInitScript(capRaster); await page.goto('/')
  await page.getByRole('button', { name: 'Enter Silently' }).click(); await page.getByLabel('Graphics').selectOption('low')
  await expect(page.locator('.viewport canvas')).toHaveAttribute('data-camera-mode', 'third')
  const timings = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return { environment: 'local self-signed HTTPS / Edge SwiftShader, not public staging', responseEndMs: navigation.responseEnd, domContentLoadedMs: navigation.domContentLoadedEventEnd, loadEventEndMs: navigation.loadEventEnd, sceneObservedAfterEntryMs: performance.now() }
  })
  mkdirSync('test-results/phase8', { recursive: true }); writeFileSync('test-results/phase8/load-metrics.json', JSON.stringify(timings, null, 2))
  await page.getByRole('button', { name: 'Visitor tools', exact: true }).click(); await page.getByRole('button', { name: /Kashi Journey/ }).click()
  await expect(page.getByRole('heading', { name: 'Kashi Journey', exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/phase8/compiled-https-journey.png' })
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Visitor tools', exact: true }).click(); await page.getByRole('button', { name: 'Photo mode', exact: true }).click()
  await page.getByLabel('My Kashi Evening souvenir (local journey summary)').check()
  await page.getByRole('button', { name: 'Capture PNG preview', exact: true }).click()
  await expect(page.getByAltText('Captured actual mela scene')).toBeVisible()
  await page.getByRole('button', { name: 'Back from photo mode', exact: true }).click()
  await page.getByRole('button', { name: 'Visitor tools', exact: true }).click(); await page.getByRole('button', { name: 'Make a rangoli', exact: true }).click()
  await page.getByRole('button', { name: 'Add symmetric petal', exact: true }).click()
  await page.getByRole('button', { name: 'Preview rangoli PNG', exact: true }).click()
  await expect(page.getByAltText('Your exported rangoli preview')).toBeVisible()
  await page.getByRole('button', { name: 'Back to mela', exact: true }).click()
  await page.getByRole('button', { name: 'Music +', exact: true }).click(); await page.getByRole('button', { name: 'Play audio', exact: true }).click()
  await expect.poll(() => page.getByTestId('aarti-audio').evaluate((audio: HTMLAudioElement) => !audio.paused && audio.duration > 20)).toBe(true)
  await page.getByRole('button', { name: 'Pause audio', exact: true }).click()
  expect(errors).toEqual([])
})

test('compiled service accepts WSS, caps four clients, isolates rooms and rejects foreign origins', async ({ page }) => {
  await page.addInitScript(capRaster); await page.goto('/')
  await page.getByRole('button', { name: 'Enter Silently' }).click(); await page.getByLabel('Graphics').selectOption('low')
  await page.getByRole('button', { name: 'Multiplayer', exact: true }).click()
  await page.getByRole('button', { name: 'Create room', exact: true }).click()
  const code = page.getByTestId('room-code'); await expect(code).toHaveText(/^[A-F0-9]{10}$/)
  const room = (await code.textContent())!
  const clients: InstanceType<typeof WebSocket>[] = []
  async function connect(message: object, origin = 'https://127.0.0.1:5176') {
    const ws = new WebSocket('wss://127.0.0.1:5176/api/room-socket', { origin, rejectUnauthorized: false }); clients.push(ws)
    ws.on('error', () => {})
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WSS verification timeout')), 5000)
      ws.once('unexpected-response', (_req: unknown, response: { statusCode: number }) => { clearTimeout(timer); ws.terminate(); resolve({ rejected: response.statusCode }) })
      ws.once('open', () => ws.send(JSON.stringify(message)))
      ws.once('message', (raw: Buffer) => { clearTimeout(timer); resolve(JSON.parse(raw.toString())) })
    })
  }
  try {
    const first = await connect({ type: 'join', code: room }); expect(first.type).toBe('welcome')
    await expect(page.getByTestId('multiplayer')).toHaveAttribute('data-count', '2')
    for (let i = 0; i < 2; i++) expect((await connect({ type: 'join', code: room })).type).toBe('welcome')
    await expect(page.getByTestId('multiplayer')).toHaveAttribute('data-count', '4')
    await expect(page.getByTestId('room-status')).toHaveText('Connected')
    expect((await connect({ type: 'join', code: room })).code).toBe('ROOM_FULL')
    const isolated = await connect({ type: 'create' }); expect(isolated.room).not.toBe(room)
    const closed = new Promise<void>(resolve => clients[0].once('close', () => resolve()))
    clients[0].close(); await closed
    expect((await connect({ type: 'resume', code: room, token: first.token })).type).toBe('welcome')
    expect((await connect({ type: 'create' }, 'https://foreign.example')).rejected).toBe(403)
    expect(await page.evaluate(() => performance.getEntriesByType('resource').some(e => e.name.includes('localhost:5174')))).toBe(false)
  } finally { for (const ws of clients) ws.terminate() }
})
