import { expect, test, type Page } from '@playwright/test'
import { BAZAAR_STALLS } from '../src/world/bazaar'

async function coordinates(page: Page) {
  const text = await page.getByTestId('coordinates').textContent()
  return { x: Number(text?.match(/X (-?\d+\.\d+)/)?.[1]), z: Number(text?.match(/Z (-?\d+\.\d+)/)?.[1]) }
}

async function steerToX(page: Page, target: number) {
  for (let attempt = 0; attempt < 24; attempt++) {
    const difference = target - (await coordinates(page)).x
    if (Math.abs(difference) < 0.7) {
      await page.waitForTimeout(220)
      if (Math.abs(target - (await coordinates(page)).x) < 0.85) return
      continue
    }
    const key = difference < 0 ? 'a' : 'd'
    await page.keyboard.down(key)
    await page.waitForTimeout(Math.min(400, Math.max(140, Math.abs(difference) * 60)))
    await page.keyboard.up(key)
    await page.waitForTimeout(120)
  }
  expect(Math.abs(target - (await coordinates(page)).x)).toBeLessThan(0.85)
}

test('all six market stalls can be approached and opened on the existing ghat', async ({ page }) => {
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  await expect(page.locator('canvas')).toBeVisible()
  await page.getByLabel('Graphics').selectOption('low')
  const targets = [-12.4, -8.4, -0.5, 0.5, 8.4, 12.4]
  const approach = [-14.7, -9.6, -3.2, 3.2, 9.6, 14.7]
  for (const [index, stall] of BAZAAR_STALLS.entries()) {
    await page.getByRole('button', { name: 'Reset' }).click()
    await expect.poll(async () => (await coordinates(page)).z).toBe(10.5)
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
    const target = targets[index]
    await page.keyboard.down(target < 0 ? 'a' : 'd')
    if (target < 0) await expect.poll(async () => (await coordinates(page)).x, { timeout: 15_000 }).toBeLessThanOrEqual(target === -0.5 ? -0.1 : target + 0.5)
    else await expect.poll(async () => (await coordinates(page)).x, { timeout: 15_000 }).toBeGreaterThanOrEqual(target === 0.5 ? 0.1 : target - 0.5)
    await page.keyboard.up(target < 0 ? 'a' : 'd')
    await steerToX(page, approach[index])
    await page.keyboard.down('s')
    const prompt = page.getByRole('button', { name: new RegExp(stall.name) })
    await expect(prompt).toBeVisible({ timeout: 15_000 })
    await page.keyboard.up('s')
    if (index === 0) await page.keyboard.press('e')
    else await prompt.click()
    const panel = page.getByRole('dialog')
    await expect(panel.getByRole('heading', { name: stall.name })).toBeVisible()
    await expect(panel.getByText(stall.category, { exact: true })).toBeVisible()
    await expect(panel.getByText(stall.products[0].name, { exact: true })).toBeVisible()
    await expect(panel.getByText('Illustrative prices only.', { exact: false })).toBeVisible()
    if (index === 0) await page.keyboard.press('Escape')
    else await panel.getByRole('button', { name: 'Close stall panel' }).click()
    await expect(panel).not.toBeVisible()
    // Walking into the counter must stop at its collision boundary.
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
    await page.keyboard.down('s')
    await page.waitForTimeout(1100)
    await page.keyboard.up('s')
    expect((await coordinates(page)).z).toBeLessThanOrEqual(15)
  }
  // Face the market for a real rendered screenshot after approaching the stalls.
  await page.getByLabel('Graphics').selectOption('high')
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('s')
  await expect.poll(async () => (await coordinates(page)).z, { timeout: 15_000 }).toBeGreaterThanOrEqual(13.5)
  await page.keyboard.up('s')
  await page.mouse.move(980, 380)
  await page.mouse.down()
  await page.mouse.move(350, 380, { steps: 18 })
  await page.mouse.up()
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'test-results/bazaar-desktop.png' })
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect.poll(async () => (await coordinates(page)).z).toBe(10.5)
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('w')
  await expect.poll(async () => (await coordinates(page)).z).toBeLessThan(10)
  await page.keyboard.up('w')
  expect(errors).toEqual([])
})

test('a touch visitor reaches a stall and opens its panel', async ({ browser }) => {
  test.setTimeout(60_000)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  const stick = page.getByRole('group', { name: 'Movement joystick' })
  const rect = await stick.boundingBox()
  expect(rect).not.toBeNull()
  const header = await page.locator('.topbar').boundingBox()
  const sound = await page.getByRole('button', { name: 'Music +' }).boundingBox()
  const reset = await page.getByRole('button', { name: 'Reset' }).boundingBox()
  expect(header && sound && reset).toBeTruthy()
  expect(header!.y + header!.height).toBeLessThan(rect!.y)
  expect(sound!.y + sound!.height).toBeLessThan(rect!.y)
  expect(reset!.x).toBeGreaterThan(rect!.x + rect!.width)
  const x = rect!.x + rect!.width / 2, y = rect!.y + rect!.height / 2
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40, y, id: 1 }] })
  await expect.poll(async () => (await coordinates(page)).x, { timeout: 15_000 }).toBeGreaterThanOrEqual(0.5)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  for (let attempt = 0; attempt < 12; attempt++) {
    const difference = 3.2 - (await coordinates(page)).x
    if (Math.abs(difference) < 1.3) break
    const id = attempt + 2
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + Math.sign(difference) * 35, y, id }] })
    await page.waitForTimeout(280)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(120)
  }
  expect(Math.abs(3.2 - (await coordinates(page)).x)).toBeLessThan(1.8)
  const prompt = page.getByRole('button', { name: /Ghat Chaat/ })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 20 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + 40, id: 20 }] })
  await expect(prompt).toBeVisible({ timeout: 15_000 })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const promptBox = await prompt.boundingBox()
  expect(promptBox).not.toBeNull()
  expect(promptBox!.y + promptBox!.height).toBeLessThan(rect!.y)
  for (let i = 0; i < 3; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 310, y: 390, id: 30 + i }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 90, y: 390, id: 30 + i }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  await expect.poll(async () => Number((await page.getByTestId('coordinates').textContent())?.match(/· (-?\d+)°/)?.[1])).toBeGreaterThan(150)
  await page.waitForTimeout(350)
  await page.screenshot({ path: 'test-results/bazaar-mobile.png' })
  await prompt.click()
  const panel = page.getByRole('dialog')
  await expect(panel.getByRole('heading', { name: 'Ghat Chaat' })).toBeVisible()
  await expect(panel.getByText('Tamatar chaat', { exact: true })).toBeVisible()
  await panel.getByRole('button', { name: 'Return to the ghat' }).click()
  await expect(panel).not.toBeVisible()
  expect(errors).toEqual([])
  await context.close()
})
