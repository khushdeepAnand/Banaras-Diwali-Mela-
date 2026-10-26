import { expect, test, type Page } from '@playwright/test'

async function coords(page: Page) {
  const text = await page.getByTestId('coordinates').textContent()
  return { x: Number(text?.match(/X (-?\d+\.\d+)/)?.[1]), z: Number(text?.match(/Z (-?\d+\.\d+)/)?.[1]) }
}

test('the riverside Aarti animates, can be approached and left, and plays local radio audio', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  await page.getByLabel('Graphics').selectOption('low')
  await expect.poll(() => canvas.getAttribute('data-aarti-motion'), { timeout: 12_000 }).not.toBeNull()
  const first = await canvas.getAttribute('data-aarti-motion')
  await expect.poll(() => canvas.getAttribute('data-aarti-motion')).not.toBe(first)
  await page.screenshot({ path: 'test-results/aarti-desktop-overall.png' })
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('a')
  await expect.poll(async () => (await coords(page)).x, { timeout: 12_000, intervals: [50] }).toBeLessThan(-5.5)
  await page.keyboard.up('a')
  // Software WebGL can skip several telemetry updates and overshoot the approach.
  if ((await coords(page)).x < -8) {
    await page.keyboard.down('d')
    await expect.poll(async () => (await coords(page)).x, { timeout: 12_000 }).toBeGreaterThan(-8)
    await page.keyboard.up('d')
  }
  await page.keyboard.down('w')
  await expect.poll(async () => (await coords(page)).z, { timeout: 12_000 }).toBeLessThan(4.4)
  await page.keyboard.up('w')
  await expect(page.getByTestId('aarti-notice')).toBeVisible()
  await page.screenshot({ path: 'test-results/aarti-desktop-approach.png' })
  await page.keyboard.down('w')
  await page.waitForTimeout(1250)
  await page.keyboard.up('w')
  expect((await coords(page)).z).toBeGreaterThanOrEqual(2.8)
  await page.screenshot({ path: 'test-results/aarti-desktop-river.png' })

  const track = page.getByTestId('aarti-audio')
  await expect(page.getByRole('button', { name: 'Play audio' })).toBeHidden()
  await page.getByRole('button', { name: 'Music +' }).click()
  await page.getByRole('button', { name: 'Play audio' }).click()
  await expect.poll(() => track.evaluate((element: HTMLAudioElement) => !element.paused)).toBe(true)
  const elapsedBeforeQualityChange = await track.evaluate((element: HTMLAudioElement) => element.currentTime)
  await page.getByLabel('Graphics').selectOption('high')
  await expect.poll(() => track.evaluate((element: HTMLAudioElement) => !element.paused)).toBe(true)
  await page.getByLabel('Graphics').selectOption('low')
  // SwiftShader can stall media while compiling a high-quality scene; once the
  // renderer settles, the same looping audio element must keep advancing.
  await expect.poll(() => track.evaluate((element: HTMLAudioElement, before: number) => Math.abs(element.currentTime - before), elapsedBeforeQualityChange), { timeout: 20_000, intervals: [100] }).toBeGreaterThan(0.08)
  await page.getByRole('slider', { name: 'Audio volume' }).fill('0.25')
  await expect.poll(() => track.evaluate((element: HTMLAudioElement) => element.volume)).toBeCloseTo(0.25)
  await page.getByRole('button', { name: 'Mute audio' }).click()
  await expect.poll(() => track.evaluate((element: HTMLAudioElement) => element.muted)).toBe(true)
  await page.getByRole('button', { name: 'Unmute audio' }).click()
  await page.getByRole('button', { name: 'Pause audio' }).click()
  await expect.poll(() => track.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true)
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('s')
  await expect.poll(async () => (await coords(page)).z).toBeGreaterThan(6.9)
  await page.keyboard.up('s')
  await expect(page.getByTestId('aarti-notice')).not.toBeVisible()
  expect(errors).toEqual([])
})

test('an uncleared recording stays unavailable without disabling the 3D experience', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  await page.getByRole('button', { name: 'Music +' }).click()
  await page.getByLabel('Music track').selectOption({ label: 'Ganga Aarti — authorised recording needed' })
  await expect(page.locator('.audio-caption')).toContainText(/recording not supplied/i)
  await expect(page.locator('canvas')).toBeVisible()
})

test('mobile visitors can reach the ceremony and keep their controls accessible', async ({ browser }) => {
  test.setTimeout(180_000)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  const joystick = page.getByRole('group', { name: 'Movement joystick' })
  await expect(joystick).toBeVisible()
  await expect.poll(() => page.locator('canvas').getAttribute('data-aarti-motion'), { timeout: 12_000 }).not.toBeNull()
  await page.waitForTimeout(350)
  const rect = await joystick.boundingBox()
  expect(rect).not.toBeNull()
  const x = rect!.x + rect!.width / 2, y = rect!.y + rect!.height / 2
  const cdp = await context.newCDPSession(page)
  async function nudge(dx: number, dy: number) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx, y: y + dy, id: 1 }] })
    try { await page.waitForTimeout(180) }
    finally { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
  }
  // Telemetry is rounded: keep moving at equality to satisfy the strict arrival assertion.
  for (let i = 0; i < 50 && (await coords(page)).x >= -2.3; i++) await nudge(-18, 0)
  expect((await coords(page)).x).toBeLessThan(-2.3)
  await page.screenshot({ path: 'test-results/aarti-mobile-overall.png' })
  for (let i = 0; i < 55 && Math.abs((await coords(page)).x + 6) >= 0.85; i++) await nudge((await coords(page)).x < -6 ? 18 : -18, 0)
  expect(Math.abs((await coords(page)).x + 6)).toBeLessThan(0.85)
  for (let i = 0; i < 55 && (await coords(page)).z >= 4.5; i++) await nudge(0, -18)
  expect((await coords(page)).z).toBeLessThan(4.5)
  await expect(page.getByTestId('aarti-notice')).toBeVisible()
  await page.getByRole('button', { name: 'Music +' }).click()
  const notice = await page.getByTestId('aarti-notice').boundingBox()
  expect(notice).not.toBeNull()
  expect(notice!.y + notice!.height).toBeLessThan(rect!.y)
  await expect(page.getByRole('button', { name: 'Play audio' })).toBeVisible()
  await expect(page.getByRole('slider', { name: 'Audio volume' })).toBeVisible()
  await page.screenshot({ path: 'test-results/aarti-mobile-ceremony.png' })
  expect(errors).toEqual([])
  await context.close()
})
