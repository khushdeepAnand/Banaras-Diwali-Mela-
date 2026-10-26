import { expect, test, type Page } from '@playwright/test'
import { capRaster } from './raster'
async function enter(page: Page) {
  await page.goto('/'); await page.getByRole('button', { name: 'Enter Silently', exact: true }).click()
  await page.getByLabel('Graphics').selectOption('low')
  await expect(page.locator('.viewport canvas')).toHaveAttribute('data-camera-mode', 'third')
}
async function tool(page: Page, name: RegExp) { await page.getByRole('button', { name: 'Visitor tools', exact: true }).click(); await page.getByRole('button', { name }).click() }
test('journey validates edited storage, survives reload, resets only stamps and handles denied storage', async ({ page }) => {
  await page.addInitScript(capRaster)
  await enter(page)
  await tool(page, /Kashi Journey/)
  await expect(page.getByRole('dialog')).toContainText('0 / 5 stamps')
  await page.getByRole('button', { name: 'Continue exploring' }).click()
  await page.evaluate(() => { localStorage.setItem('banaras-kashi-journey', JSON.stringify({ version: 1, completed: ['marigolds', 'ganga'] })); localStorage.setItem('phase7-unrelated-setting', 'preserve') })
  await page.reload(); await page.getByRole('button', { name: 'Enter Silently' }).click(); await tool(page, /Kashi Journey/)
  await expect(page.getByRole('dialog')).toContainText('2 / 5 stamps')
  for (const [width, height] of [[390, 844], [844, 390], [800, 540]]) {
    await page.setViewportSize({ width, height })
    const box = (await page.getByRole('dialog').boundingBox())!
    await expect(page.getByRole('heading', { name: 'Kashi Journey', exact: true })).toBeInViewport()
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1); expect(box.y + box.height).toBeLessThanOrEqual(height + 1)
    await page.screenshot({ path: `test-results/phase7/journey-${width}x${height}.png` })
  }
  await page.getByRole('button', { name: 'Reset journey', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Confirm reset journey' })).toBeVisible()
  await page.getByRole('button', { name: 'Keep stamps' }).click()
  await expect(page.getByRole('dialog')).toContainText('2 / 5 stamps')
  await page.getByRole('button', { name: 'Reset journey', exact: true }).click(); await page.getByRole('button', { name: 'Confirm reset journey' }).click()
  expect(await page.evaluate(() => localStorage.getItem('phase7-unrelated-setting'))).toBe('preserve')
  await page.getByRole('button', { name: 'Continue exploring' }).click()
  await page.evaluate(() => localStorage.setItem('banaras-kashi-journey', '{"version":999,"completed":["wheel"]}'))
  await page.reload(); await page.getByRole('button', { name: 'Enter Silently' }).click(); await tool(page, /Kashi Journey/)
  await expect(page.getByRole('dialog')).toContainText('0 / 5 stamps')
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new DOMException('Denied', 'SecurityError') }; Storage.prototype.setItem = () => { throw new DOMException('Denied', 'SecurityError') } })
  await page.reload(); await page.getByRole('button', { name: 'Enter Silently' }).click(); await tool(page, /Kashi Journey/)
  await expect(page.getByRole('dialog')).toContainText('stays in memory')
})
for (const mobile of [false, true]) test(`rangoli ${mobile ? 'touch' : 'mouse'} pointer, symmetry, undo, resize, export and cleanup`, async ({ browser }) => {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 800, height: 700 }, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  await context.addInitScript(capRaster)
  const page = await context.newPage(), errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  try {
    await enter(page); await tool(page, /Make a rangoli/)
    await page.screenshot({ path: `test-results/phase7/rangoli-start-${mobile}.png` })
    await page.getByRole('button', { name: 'Clear drawing' }).click()
    const canvas = page.getByLabel('Eight-fold symmetric rangoli drawing surface'), blank = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())
    await canvas.scrollIntoViewIfNeeded()
    const box = (await canvas.boundingBox())!
    const start = { x: box.x + box.width * .5, y: box.y + box.height * .25 }
    if (mobile) {
      const cdp = await context.newCDPSession(page)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + 15, y: start.y + 10, id: 1 }] })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    } else { await page.mouse.move(start.x, start.y); await page.mouse.down(); await page.mouse.move(start.x + 15, start.y + 10, { steps: 5 }); await page.mouse.up() }
    await expect(page.getByRole('button', { name: 'Undo stroke' })).toBeEnabled()
    expect(await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(blank)
    const count = await canvas.evaluate((c: HTMLCanvasElement) => {
      const ctx = c.getContext('2d')!
      return Array.from({ length: 8 }, (_, i) => {
        const a = i * Math.PI / 4
        const x = Math.round(c.width * (.5 + .25 * Math.sin(a)))
        const y = Math.round(c.height * (.5 - .25 * Math.cos(a)))
        return ctx.getImageData(x, y, 1, 1).data[0] > 100
      }).filter(Boolean).length
    })
    expect(count).toBe(8)
    await page.getByRole('button', { name: 'Undo stroke' }).click()
    expect(await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(blank)
    await page.getByRole('button', { name: 'Add symmetric petal' }).click()
    await page.setViewportSize(mobile ? { width: 844, height: 390 } : { width: 700, height: 800 })
    await expect(page.getByRole('button', { name: 'Undo stroke' })).toBeEnabled()
    expect(await canvas.evaluate((c: HTMLCanvasElement) => c.width <= 1024)).toBe(true)
    await page.getByRole('button', { name: 'Preview rangoli PNG' }).click()
    const image = page.getByAltText('Your exported rangoli preview')
    await expect(image).toBeVisible()
    expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1024)
    const downloadEvent = page.waitForEvent('download'); await page.getByRole('link', { name: 'Download rangoli' }).click()
    const download = await downloadEvent; await download.saveAs(`test-results/phase7/rangoli-${mobile}.png`)
    await page.evaluate(() => { Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }) })
    await page.getByRole('button', { name: 'Share rangoli' }).click(); await expect(page.getByRole('dialog')).toContainText('Native sharing unavailable')
    await page.screenshot({ path: `test-results/phase7/rangoli-${mobile}.png.preview.png` })
    const url = await image.getAttribute('src')
    await page.getByRole('button', { name: 'Back to mela', exact: true }).click()
    expect(await page.evaluate(async url => { try { await fetch(url!); return false } catch { return true } }, url)).toBe(true)
    expect(errors).toEqual([])
  } finally { await context.close() }
})
test('souvenir uses actual scene, only allowlisted labels, bounded PNG and cleaned preview URLs', async ({ page }) => {
  await page.addInitScript(capRaster)
  await enter(page)
  await page.evaluate(() => localStorage.setItem('banaras-kashi-journey', JSON.stringify({ version: 1, completed: ['chaat', 'ganga'], room: 'PRIVATE-ROOM', token: 'PRIVATE-TOKEN' })))
  await page.reload(); await page.getByRole('button', { name: 'Enter Silently' }).click()
  await tool(page, /Kashi Journey/); await page.getByRole('button', { name: 'My Kashi Evening souvenir' }).click()
  await page.getByLabel('My Kashi Evening souvenir (local journey summary)').check()
  await page.evaluate(() => {
    const original = CanvasRenderingContext2D.prototype.fillText
    const labels: string[] = []; Object.assign(window, { souvenirLabels: labels })
    CanvasRenderingContext2D.prototype.fillText = function (...args: Parameters<typeof original>) { labels.push(args[0]); return original.apply(this, args) }
  })
  await page.getByRole('button', { name: 'Capture PNG preview' }).click()
  const image = page.getByAltText('Captured actual mela scene'); await expect(image).toBeVisible()
  const labels = await page.evaluate(() => (window as unknown as { souvenirLabels: string[] }).souvenirLabels.join('\n'))
  expect(labels).toContain('My Kashi Evening · 2/5 local stamps'); expect(labels).toContain('Dev Deepawali 2026'); expect(labels).toContain('banarasdiwalimela.kesug.com')
  expect(labels).not.toMatch(/PRIVATE|token|reference|organiser/i)
  expect(await image.evaluate((img: HTMLImageElement) => Math.max(img.naturalWidth, img.naturalHeight))).toBeLessThanOrEqual(1920)
  const downloadEvent = page.waitForEvent('download'); await page.getByRole('link', { name: 'Download photo' }).click(); await (await downloadEvent).saveAs('test-results/phase7/souvenir.png')
  await page.screenshot({ path: 'test-results/phase7/souvenir-preview.png' })
  const url = await image.getAttribute('src'); await page.getByRole('button', { name: 'Back from photo mode' }).click()
  expect(await page.evaluate(async url => { try { await fetch(url!); return false } catch { return true } }, url)).toBe(true)
})
test('greetings are keyboard reachable and remain bounded in solo mode', async ({ page }) => {
  await page.addInitScript(capRaster); await enter(page); await tool(page, /Festival greetings/)
  const button = page.getByRole('button', { name: /Namaste/ }); await button.focus(); await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toContainText('solo greeting'); await expect(button).toBeDisabled()
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible()
})
