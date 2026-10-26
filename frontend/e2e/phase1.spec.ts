import { expect, test, type Page } from '@playwright/test'

async function enter(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  await expect(page.getByTestId('map-player')).toBeVisible()
  await expect.poll(() => page.locator('canvas').getAttribute('data-aarti-motion'), { timeout: 35_000 }).not.toBeNull()
  await page.getByLabel('Graphics').selectOption('low')
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
}
async function value(page: Page, key: 'x' | 'z' | 'heading') {
  return Number(await page.getByTestId('map-player').getAttribute(`data-${key}`))
}
async function walk(page: Page, key: string, axis: 'x' | 'z', target: number, greater = true) {
  await page.keyboard.down(key)
  try {
    await expect.poll(() => value(page, axis), { timeout: 40_000 })[greater ? 'toBeGreaterThan' : 'toBeLessThan'](target)
  } finally { await page.keyboard.up(key) }
}

test('expanded promenade, forecourt and minimap track real movement and reset', async ({ page }) => {
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await enter(page)
  await expect(page.locator('.minimap svg circle.map-stall')).toHaveCount(8)
  await expect(page.locator('.minimap svg circle.map-ride')).toHaveCount(4)
  await walk(page, 'd', 'x', 24)
  await expect.poll(() => value(page, 'heading')).toBeLessThan(-1)
  const hudX = Number((await page.getByTestId('coordinates').textContent())?.match(/X (-?[\d.]+)/)?.[1])
  expect(Math.abs(hudX - await value(page, 'x'))).toBeLessThan(0.15)
  await page.screenshot({ path: 'test-results/phase1/east-promenade.png' })
  await walk(page, 's', 'z', 20.1)
  await walk(page, 'a', 'x', 0.5, false)
  await page.mouse.move(850, 350); await page.mouse.down(); await page.mouse.move(220, 350, { steps: 15 }); await page.mouse.up()
  await page.screenshot({ path: 'test-results/phase1/temple-forecourt.png' })
  await page.getByRole('button', { name: 'Hide map' }).click()
  await expect(page.getByTestId('map-player')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show map' }).click()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect.poll(() => value(page, 'x')).toBe(0)
  await expect.poll(() => value(page, 'z')).toBe(10.5)
  await expect.poll(() => value(page, 'heading')).toBe(0)
  expect(errors).toEqual([])
})

test('map leaves desktop and touch controls unobscured in compact layouts', async ({ browser }) => {
  test.setTimeout(120_000)
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 800, height: 540 }]) {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true })
    try {
      const page = await context.newPage()
      await page.goto('/')
      await page.getByRole('button', { name: /Enter Silently/i }).click()
      await expect.poll(() => page.locator('canvas').getAttribute('data-aarti-motion'), { timeout: 35_000 }).not.toBeNull()
      const show = page.getByRole('button', { name: 'Show map' })
      if (await show.isVisible()) await show.click()
      await expect(page.getByTestId('map-player')).toBeVisible()
      for (const selector of ['.joystick', '.mobile-actions button', '.quality', '.sound-toggle', '.explore-toggle']) {
        const control = page.locator(selector)
        if (!await control.isVisible()) continue
        const unobscured = await control.evaluate(element => {
          const r = element.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2
          return x >= 0 && y >= 0 && x < innerWidth && y < innerHeight && element.contains(document.elementFromPoint(x, y))
        })
        expect(unobscured, `${selector} at ${viewport.width}x${viewport.height}`).toBe(true)
      }
      await page.screenshot({ path: `test-results/phase1/layout-${viewport.width}x${viewport.height}.png` })
      await page.getByRole('button', { name: 'Hide map' }).click()
      await page.getByRole('button', { name: 'Show map' }).click()
    } finally { await context.close() }
  }
})
