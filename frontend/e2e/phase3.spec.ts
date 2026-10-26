import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { capRaster } from './raster'

async function enter(page: Page) {
  await page.addInitScript(capRaster)
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  await page.getByLabel('Graphics').selectOption('low')
  await expect.poll(() => page.locator('canvas').getAttribute('data-appearance')).not.toBeNull()
}
async function open(page: Page, name: string) {
  await page.getByRole('button', { name: 'Visitor tools', exact: true }).click()
  await page.getByRole('button', { name, exact: true }).click()
}
async function appearance(page: Page) { return JSON.parse(await page.locator('canvas').getAttribute('data-appearance') || '{}') }

test('real wardrobe preview has front/side views, apply/cancel and twenty safe camera switches', async ({ page }) => {
  test.setTimeout(180_000)
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  await enter(page)
  await open(page, 'Wardrobe')
  const panel = page.getByRole('dialog', { name: 'Festival wardrobe' })
  await expect(panel).toBeVisible()
  await expect.poll(() => page.locator('canvas').getAttribute('data-camera-mode')).toBe('wardrobe')
  await page.screenshot({ path: 'test-results/phase3/avatar-front.png' })
  await panel.getByRole('button', { name: 'Side', exact: true }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'test-results/phase3/avatar-side.png' })
  await panel.getByLabel('Kurta colour').selectOption('teal')
  await panel.getByLabel('Outfit', { exact: true }).selectOption('waistcoat')
  await panel.getByLabel('Hairstyle').selectOption('bun')
  await expect.poll(async () => (await appearance(page)).kurta).toBe('teal')
  await panel.getByRole('button', { name: 'Three-quarter' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'test-results/phase3/wardrobe-teal.png' })
  await panel.getByRole('button', { name: 'Apply outfit' }).click()
  await open(page, 'Wardrobe')
  await page.getByLabel('Kurta colour').selectOption('maroon')
  await expect.poll(async () => (await appearance(page)).kurta).toBe('maroon')
  await page.screenshot({ path: 'test-results/phase3/wardrobe-maroon.png' })
  await page.getByRole('button', { name: 'Cancel wardrobe' }).click()
  await expect.poll(async () => (await appearance(page)).kurta).toBe('teal')
  const initial = await page.getByTestId('coordinates').textContent()
  for (let i = 0; i < 20; i++) {
    await page.getByTestId('camera-toggle').click()
    await expect.poll(() => page.locator('canvas').getAttribute('data-camera-mode')).toBe(i % 2 ? 'third' : 'first')
    await expect(page.locator('canvas')).toHaveAttribute('data-avatar-visible', i % 2 ? 'true' : 'false')
  }
  expect(await page.getByTestId('coordinates').textContent()).toBe(initial)
  await page.getByTestId('camera-toggle').click()
  await expect(page.locator('canvas')).toHaveAttribute('data-avatar-visible', 'false')
  await page.screenshot({ path: 'test-results/phase3/first-person.png' })
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('w')
  await expect.poll(async () => Number((await page.getByTestId('coordinates').textContent())?.match(/Z ([\d.]+)/)?.[1])).toBeLessThan(9.5)
  await page.keyboard.up('w')
  expect(errors).toEqual([])
})

test('photo mode downloads a real nonblank PNG and restores local position/input/camera', async ({ page }) => {
  test.setTimeout(120_000)
  await enter(page)
  await page.getByTestId('camera-toggle').click()
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-mode', 'first')
  const position = await page.getByTestId('coordinates').textContent()
  await open(page, 'Photo mode')
  await expect(page.getByRole('region', { name: 'Photo mode controls' })).toBeVisible()
  await page.getByLabel('Scenic preset').selectOption('ganga')
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-mode', 'photo')
  const beforeZoom = await page.locator('canvas').getAttribute('data-camera-position')
  await page.getByLabel('Photo zoom').fill('4.5')
  await expect.poll(() => page.locator('canvas').getAttribute('data-camera-position')).not.toBe(beforeZoom)
  await page.screenshot({ path: 'test-results/phase3/photo-mode.png' })
  await page.getByRole('button', { name: 'Capture PNG preview' }).click()
  await expect(page.getByRole('img', { name: 'Captured actual mela scene' })).toBeVisible()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download photo' }).click()
  const download = await downloadEvent
  await download.saveAs('test-results/phase3/actual-captured-photo.png')
  const png = readFileSync('test-results/phase3/actual-captured-photo.png')
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(png.readUInt32BE(16)).toBeGreaterThan(500)
  expect(png.readUInt32BE(20)).toBeGreaterThan(300)
  const compressed: Buffer[] = []
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset), type = png.toString('ascii', offset + 4, offset + 8)
    if (type === 'IDAT') compressed.push(png.subarray(offset + 8, offset + 8 + length))
    offset += length + 12
  }
  expect(new Set(inflateSync(Buffer.concat(compressed))).size).toBeGreaterThan(8)
  await expect(page.getByRole('img', { name: 'Captured actual mela scene' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Download photo' })).toBeVisible()
  expect(await page.getByTestId('coordinates').textContent()).toBe(position)
  for (const preset of ['ghats', 'market', 'wheel', 'fireworks']) {
    await page.getByLabel('Scenic preset').selectOption(preset)
    await page.screenshot({ path: `test-results/phase3/photo-${preset}.png` })
  }
  await page.getByRole('button', { name: 'Back from photo mode' }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-mode', 'first')
  expect(await page.getByTestId('coordinates').textContent()).toBe(position)
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('d')
  await expect.poll(async () => Number((await page.getByTestId('coordinates').textContent())?.match(/X (-?[\d.]+)/)?.[1])).toBeGreaterThan(.5)
  await page.keyboard.up('d')
})

test('mobile visitor tools remain usable, and help/photo close restore the mela', async ({ browser }) => {
  test.setTimeout(120_000)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })
  try {
    const page = await context.newPage(); await enter(page)
    await open(page, 'Wardrobe'); await expect(page.getByLabel('Kurta colour')).toBeVisible()
    await page.getByLabel('Kurta colour').selectOption('indigo')
    await page.screenshot({ path: 'test-results/phase3/mobile-wardrobe.png' })
    await page.getByRole('button', { name: 'Apply outfit' }).tap()
    await open(page, 'Help / controls'); await expect(page.getByRole('dialog', { name: 'Mela controls' })).toContainText('Mela free hai')
    await page.getByRole('button', { name: 'Back to Mela', exact: true }).tap()
    await open(page, 'Photo mode'); await page.getByLabel('Scenic preset').selectOption('wheel')
    await page.screenshot({ path: 'test-results/phase3/mobile-photo.png' })
    await page.getByRole('button', { name: 'Back from photo mode' }).tap()
    await expect(page.getByRole('group', { name: 'Movement joystick' })).toBeVisible()
  } finally { await context.close() }
})

test('support dialogue changes only on a later interaction and respects close cooldown', async ({ page }) => {
  test.setTimeout(90_000)
  await enter(page)
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('a'); await expect(page.getByTestId('beggar-prompt')).toBeVisible({ timeout: 30_000 }); await page.keyboard.up('a')
  for (let i = 0; i < 16; i++) {
    const x = Number((await page.getByTestId('coordinates').textContent())?.match(/X (-?[\d.]+)/)?.[1])
    if (x > -12.7 && x < -11.3) break
    const key = x < -12 ? 'd' : 'a'; await page.keyboard.down(key); await page.waitForTimeout(120); await page.keyboard.up(key); await page.waitForTimeout(250)
  }
  await page.keyboard.press('e')
  await expect(page.getByTestId('beggar-caption')).toHaveText('dedo yaawwrr cmon')
  await page.waitForTimeout(500); await page.keyboard.press('e'); await expect(page.locator('dialog[open]')).toHaveCount(1)
  await expect(page.getByTestId('beggar-caption')).toHaveText('dedo yaawwrr cmon')
  await page.getByRole('button', { name: 'Back to Mela', exact: true }).click()
  await page.keyboard.press('e'); await expect(page.locator('dialog[open]')).toHaveCount(0)
  await page.waitForTimeout(1250); await page.keyboard.press('e')
  await expect(page.getByTestId('beggar-caption')).toHaveText('Mela free hai boss, support optional hai!')
  await expect(page.getByRole('dialog')).not.toContainText('Khushdeep Anand')
  await expect(page.getByRole('dialog').locator('img')).toHaveCount(0)
  await page.screenshot({ path: 'test-results/phase3/hinglish-dialogue.png' })
  await page.keyboard.press('Escape'); await expect(page.locator('dialog[open]')).toHaveCount(0)
})
