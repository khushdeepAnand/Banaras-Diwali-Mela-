import { expect, test, type Page, type CDPSession } from '@playwright/test'
import { capRaster } from './raster'
import { installAudioProbe } from './audioProbe'

async function position(page: Page) {
  const text = await page.getByTestId('coordinates').textContent() || ''
  return { x: Number(text.match(/X (-?[\d.]+)/)?.[1]), z: Number(text.match(/Z (-?[\d.]+)/)?.[1]) }
}
async function enter(page: Page) {
  await page.goto('/'); await page.getByRole('button', { name: /Enter Silently/i }).click()
  await page.getByLabel('Graphics').selectOption('low')
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-mode', 'third')
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
}
async function move(page: Page, axis: 'x' | 'z', target: number, cdp?: CDPSession) {
  const initial = (await position(page))[axis], direction = Math.sign(target - initial)
  if (Math.abs(target - initial) < .3) return
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  const key = axis === 'x' ? direction > 0 ? 'd' : 'a' : direction > 0 ? 's' : 'w'
  if (cdp) {
    const box = (await page.getByRole('group', { name: 'Movement joystick' }).boundingBox())!
    const origin = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...origin, x: origin.x + (axis === 'x' ? direction * 42 : 0), y: origin.y + (axis === 'z' ? direction * 42 : 0) }] })
  } else await page.keyboard.down(key)
  try {
    await expect.poll(async () => direction * ((await position(page))[axis] - target), { timeout: 25_000, intervals: [60] }).toBeGreaterThanOrEqual(-.3)
  } finally {
    if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    else await page.keyboard.up(key)
  }
  // Let the existing movement damping settle before the next axis.
  await page.waitForTimeout(300)
}
async function stall(page: Page, x: number, cdp?: CDPSession) {
  await move(page, 'x', x, cdp); await move(page, 'z', 14.6, cdp)
  if (cdp) await page.locator('.stall-prompt').tap()
  else await page.keyboard.press('e')
  await expect(page.getByRole('dialog')).toBeVisible()
}

for (const mobile of [false, true]) test(`${mobile ? 'touch' : 'keyboard'} gifts, first/third-person offering, inventory and personal fountain`, async ({ browser }) => {
  test.setTimeout(180_000)
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 }, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: 1, reducedMotion: mobile ? 'reduce' : 'no-preference' })
  await context.addInitScript(capRaster)
  await context.addInitScript(installAudioProbe)
  try {
    const page = await context.newPage(), errors: string[] = []
    const activate = async (name: string) => { const button = page.getByRole('button', { name, exact: true }); if (mobile) await button.tap(); else await button.click() }
    page.on('pageerror', error => errors.push(error.message))
    const cdp = mobile ? await context.newCDPSession(page) : undefined
    await enter(page)
    await page.getByRole('button', { name: 'Music +' }).click()
    await page.getByRole('button', { name: 'Enable festival effects', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Disable festival effects', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByTitle('Minimise Kashi Radio').click()
    if (mobile) await page.getByTestId('camera-toggle').tap()
    await stall(page, -3.2, cdp)
    const collectFlower = page.getByRole('button', { name: 'Collect Marigold offering' })
    if (mobile) await collectFlower.tap(); else await collectFlower.click()
    await expect(page.getByRole('dialog')).toContainText('Marigold offering collected')
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('banaras-kashi-journey') || '{}').completed)).toContain('marigolds')
    await expect.poll(() => page.evaluate(() => (window as unknown as { audioProbe: { started: number } }).audioProbe.started)).toBe(1)
    await collectFlower.click(); await expect(page.getByRole('dialog')).toContainText('Please wait')
    await page.getByRole('button', { name: 'Return to the ghat' }).click()
    await stall(page, -9.6, cdp)
    await page.getByRole('button', { name: 'Collect Clay diya', exact: true }).click()
    await expect(page.getByRole('dialog')).toContainText('Clay diya collected')
    await page.waitForTimeout(1250)
    await page.getByRole('button', { name: 'Collect Festival spark fountain' }).click()
    await expect(page.getByRole('dialog')).toContainText('Festival spark fountain collected')
    await page.getByRole('button', { name: 'Return to the ghat' }).click()
    await move(page, 'z', 10.5, cdp); await move(page, 'x', 0, cdp); await move(page, 'z', 7, cdp)
    if (mobile) await page.getByTestId('gameplay-prompt').tap(); else await page.keyboard.press('e')
    await expect(page.getByTestId('count-firecracker')).toHaveText('1')
    await activate('Light spark fountain')
    await expect(page.getByTestId('count-firecracker')).toHaveText('0')
    await expect(page.getByTestId('gameplay-status')).toContainText('Spark fountain lit!')
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('banaras-kashi-journey') || '{}').completed)).toContain('fountain')
    await expect.poll(() => page.evaluate(() => (window as unknown as { audioProbe: { started: number } }).audioProbe.started)).toBe(4)
    await expect(page.getByRole('button', { name: 'Light spark fountain', exact: true })).toBeDisabled()
    await page.getByRole('button', { name: 'Return to the ghat' }).click()
    await expect(page.locator('canvas')).toHaveAttribute('data-fountains', '1')
    await page.waitForTimeout(1100)
    await page.screenshot({ path: `test-results/phase4/${mobile ? 'mobile' : 'desktop'}-fountain.png` })
    await expect(page.locator('canvas')).toHaveAttribute('data-fountains', '0', { timeout: 10_000 })
    await move(page, 'z', 1.2, cdp)
    if (mobile) await page.getByTestId('gameplay-prompt').tap(); else await page.keyboard.press('e')
    await expect(page.getByTestId('count-flower')).toHaveText('1')
    await activate('Offer Marigold offering')
    await expect(page.getByTestId('count-flower')).toHaveText('0')
    await expect(page.getByRole('button', { name: 'Offer Marigold offering', exact: true })).toBeDisabled()
    await expect(page.getByTestId('gameplay-status')).toContainText('offered to the Ganga')
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('banaras-kashi-journey') || '{}').completed)).toContain('ganga')
    await expect.poll(() => page.evaluate(() => (window as unknown as { audioProbe: { started: number } }).audioProbe.started)).toBe(5)
    await page.getByRole('button', { name: 'Return to the ghat' }).click()
    await expect(page.locator('canvas')).toHaveAttribute('data-offerings', '1')
    await page.getByTestId('camera-toggle').click()
    await expect(page.locator('canvas')).toHaveAttribute('data-camera-mode', mobile ? 'third' : 'first')
    await page.waitForTimeout(600)
    await page.screenshot({ path: `test-results/phase4/${mobile ? 'mobile' : 'desktop'}-offering.png` })
    await page.getByTestId('gameplay-prompt').click()
    await page.waitForTimeout(1250)
    await activate('Offer Clay diya')
    await expect(page.getByTestId('count-diya')).toHaveText('0')
    await page.getByRole('button', { name: 'Return to the ghat' }).click()
    await expect(page.locator('canvas')).toHaveAttribute('data-offerings', '2')
    if (!mobile) { await page.getByLabel('Graphics').selectOption('high'); await expect(page.locator('canvas')).toHaveAttribute('data-offerings', '2'); await page.screenshot({ path: 'test-results/phase4/high-offerings.png' }); await page.getByLabel('Graphics').selectOption('low') }
    expect(errors).toEqual([])
  } finally { await context.close() }
})

test('room visitors see the same offerings and fountain while inventories remain private', async ({ browser }) => {
  test.setTimeout(180_000)
  const contexts = await Promise.all([browser.newContext({ viewport: { width: 800, height: 540 }, deviceScaleFactor: 1 }), browser.newContext({ viewport: { width: 800, height: 540 }, deviceScaleFactor: 1 })])
  await Promise.all(contexts.map(context => context.addInitScript(capRaster)))
  try {
    const [host, peer] = await Promise.all(contexts.map(context => context.newPage()))
    await enter(host); await host.getByRole('button', { name: 'Multiplayer', exact: true }).click()
    await host.getByRole('button', { name: 'Create room', exact: true }).click()
    await expect(host.getByTestId('room-code')).toHaveText(/^[A-F0-9]{10}$/)
    const code = (await host.getByTestId('room-code').textContent())!
    await host.getByRole('button', { name: 'Back to mela' }).click()
    await enter(peer); await peer.getByRole('button', { name: 'Multiplayer', exact: true }).click()
    await peer.getByRole('textbox', { name: 'Room code' }).fill(code)
    await peer.getByRole('button', { name: 'Join room', exact: true }).click()
    await expect(peer.getByTestId('room-status')).toHaveText('Connected')
    await peer.getByRole('button', { name: 'Back to mela' }).click()
    await stall(host, -3.2)
    await host.getByRole('button', { name: 'Collect Marigold offering' }).click()
    await expect(host.getByRole('dialog')).toContainText('Marigold offering collected')
    await host.getByRole('button', { name: 'Return to the ghat' }).click()
    await stall(host, -9.6)
    await host.getByRole('button', { name: 'Collect Festival spark fountain' }).click()
    await expect(host.getByRole('dialog')).toContainText('Festival spark fountain collected')
    await host.getByRole('button', { name: 'Return to the ghat' }).click()
    await move(host, 'z', 10.5); await move(host, 'x', 0); await move(host, 'z', 7)
    await host.getByTestId('gameplay-prompt').click()
    await host.getByRole('button', { name: 'Light spark fountain', exact: true }).click()
    await expect(host.getByTestId('count-firecracker')).toHaveText('0')
    await expect(peer.locator('canvas')).toHaveAttribute('data-fountains', '1')
    await host.getByRole('button', { name: 'Return to the ghat' }).click()
    await move(host, 'z', 1.2); await host.getByTestId('gameplay-prompt').click()
    await host.getByRole('button', { name: 'Offer Marigold offering', exact: true }).click()
    await expect(host.getByTestId('count-flower')).toHaveText('0')
    await expect(peer.locator('canvas')).toHaveAttribute('data-offerings', '1')
    await peer.getByTestId('collection').click(); await expect(peer.getByTestId('count-flower')).toHaveText('0')
  } finally { await Promise.all(contexts.map(context => context.close())) }
})

test('delayed real server acknowledgement locks repeat actions and reconciles once', async ({ browser }) => {
  test.setTimeout(60_000)
  const context = await browser.newContext({ viewport: { width: 800, height: 540 }, deviceScaleFactor: 1 })
  const timers = new Set<ReturnType<typeof setTimeout>>()
  try {
    await context.addInitScript(capRaster)
    const page = await context.newPage()
    await page.routeWebSocket('**/api/room-socket', route => {
      const server = route.connectToServer()
      server.onMessage(message => {
        if (JSON.parse(message.toString()).type === 'gameplay') {
          const timer = setTimeout(() => { timers.delete(timer); route.send(message) }, 6800)
          timers.add(timer)
        } else route.send(message)
      })
    })
    await enter(page); await page.getByRole('button', { name: 'Multiplayer', exact: true }).click()
    await page.getByRole('button', { name: 'Create room', exact: true }).click()
    await expect(page.getByTestId('room-status')).toHaveText('Connected')
    await page.getByRole('button', { name: 'Back to mela' }).click()
    await stall(page, -3.2)
    const collect = page.getByRole('button', { name: 'Collect Marigold offering' })
    await collect.click(); await expect(collect).toBeDisabled()
    await expect(page.getByRole('dialog')).toContainText('Actions stay locked', { timeout: 10_000 })
    await expect(collect).toBeDisabled()
    await expect(page.getByRole('dialog')).toContainText('Marigold offering collected')
    await page.getByRole('button', { name: 'Return to the ghat' }).click()
    await page.getByTestId('collection').click(); await expect(page.getByTestId('count-flower')).toHaveText('1')
  } finally { for (const timer of timers) clearTimeout(timer); await context.close() }
})
