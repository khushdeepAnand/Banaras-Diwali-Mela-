import { expect, test } from '@playwright/test'
import { capRaster } from './raster'

test('real room group celebration and emote cues agree, expire and respect reduced motion', async ({ page }) => {
  test.setTimeout(120_000)
  await page.addInitScript(capRaster)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/'); await page.getByRole('button', { name: 'Enter Silently' }).click()
  await page.getByLabel('Graphics').selectOption('low')
  // Three independent protocol clients exercise real proximity/inventory validation.
  // The rendered browser joins as the fourth, observing server-authoritative cues.
  const code = await page.evaluate(async () => {
    const clients: { ws: WebSocket; seq: number; x: number; z: number; packets: Record<string, unknown>[] }[] = []
    async function connect(code?: string) {
      const ws = new WebSocket(`ws://${location.host}/api/room-socket`)
      const c = { ws, seq: 0, x: 0, z: 0, packets: [] as Record<string, unknown>[] }
      ws.addEventListener('message', e => c.packets.push(JSON.parse(e.data)))
      await new Promise<void>(resolve => ws.addEventListener('open', () => resolve(), { once: true }))
      ws.send(JSON.stringify(code ? { type: 'join', code } : { type: 'create' }))
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Room welcome missing')), 5000)
        ws.addEventListener('message', e => { const value = JSON.parse(e.data); if (value.type === 'welcome') { c.x = value.visitor.x; c.z = value.visitor.z; clearTimeout(timeout); resolve() } }, { once: true })
      })
      clients.push(c)
      return c.packets.find(p => p.type === 'welcome')!.room as string
    }
    const code = await connect(); await connect(code); await connect(code)
    Object.assign(window, { phase7Clients: clients })
    return code
  })
  await page.getByRole('button', { name: 'Multiplayer', exact: true }).click()
  await page.getByRole('textbox', { name: 'Room code' }).fill(code)
  await page.getByRole('button', { name: 'Join room', exact: true }).click()
  await expect(page.getByTestId('room-status')).toHaveText('Connected')
  await page.getByRole('button', { name: 'Back to mela', exact: true }).click()
  await page.evaluate(async () => {
    type Client = { ws: WebSocket; seq: number; x: number; z: number; packets: { type: string; request?: number; ok?: boolean }[] }
    const clients = (window as unknown as { phase7Clients: Client[] }).phase7Clients
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    async function travel(c: Client, x: number, z: number) {
      while (Math.hypot(c.x - x, c.z - z) > .01) {
        const scale = Math.min(1, 1.2 / Math.hypot(c.x - x, c.z - z))
        c.x += (x - c.x) * scale; c.z += (z - c.z) * scale
        c.ws.send(JSON.stringify({ type: 'move', seq: c.seq++, x: c.x, z: c.z, heading: 0, moving: true }))
        await sleep(350)
      }
    }
    async function action(c: Client, request: number, action: string) {
      c.ws.send(JSON.stringify({ type: 'gameplay', seq: c.seq++, request, action, item: 'diya' }))
      for (let i = 0; i < 40; i++) { const result = c.packets.find(p => p.type === 'gameplay' && p.request === request); if (result) { if (!result.ok) throw new Error('Validated diya action rejected'); return }; await sleep(50) }
      throw new Error('Gameplay acknowledgement missing')
    }
    await Promise.all(clients.map(async c => {
      await travel(c, -9.6, 10.5); await travel(c, -9.6, 14.5); await action(c, 0, 'collect')
      await travel(c, -9.6, 10.5); await travel(c, 0, 10.5); await travel(c, 0, 1.15)
    }))
    for (const c of clients) await action(c, 1, 'offer')
    clients[0].ws.send(JSON.stringify({ type: 'emote', seq: clients[0].seq++, emote: 'namaste' }))
  })
  const cue = page.getByLabel('Room celebration')
  await expect(cue).toContainText('Together, our diyas light the Ganga')
  await expect(cue).toContainText('A fellow visitor · 🙏 Namaste')
  await expect(page.locator('.diya-celebration')).toHaveCount(1)
  expect(await page.locator('.diya-celebration').evaluate(e => getComputedStyle(e).boxShadow)).toBe('none')
  await page.screenshot({ path: 'test-results/phase7/group-celebration.png' })
  await expect(page.locator('.diya-celebration')).toHaveCount(0, { timeout: 10_000 })
})

test('chaat tasting genuinely succeeds once and persists only its local stamp', async ({ page }) => {
  await page.addInitScript(capRaster)
  await page.goto('/'); await page.getByRole('button', { name: 'Enter Silently' }).click()
  await page.getByLabel('Graphics').selectOption('low')
  await expect(page.locator('.viewport canvas')).toHaveAttribute('data-camera-mode', 'third')
  const axis = async (key: string, expression: RegExp, target: number) => {
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
    await page.keyboard.down(key)
    try { await expect.poll(async () => Number((await page.getByTestId('coordinates').textContent())?.match(expression)?.[1])).toBeGreaterThan(target) }
    finally { await page.keyboard.up(key) }
  }
  await axis('d', /X (-?[\d.]+)/, 2.8); await axis('s', /Z (-?[\d.]+)/, 14)
  await page.keyboard.press('e'); await expect(page.getByRole('dialog')).toContainText('Ghat Chaat')
  const taste = page.getByRole('button', { name: 'Collect Banarasi tasting stamp', exact: true })
  await taste.click(); await expect(page.getByRole('dialog')).toContainText('Tasting complete')
  await expect(taste).toBeDisabled()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('banaras-kashi-journey')!).completed)).toEqual(['chaat'])
  await page.reload(); await page.getByRole('button', { name: 'Enter Silently' }).click()
  await page.getByTestId('collection').click(); await expect(page.getByTestId('count-tasting')).toHaveText('0')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('banaras-kashi-journey')!).completed)).toEqual(['chaat'])
})
