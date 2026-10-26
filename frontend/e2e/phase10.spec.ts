import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const output = 'test-results/phase10'
mkdirSync(output, { recursive: true })

async function enter(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  await expect.poll(() => page.locator('canvas').getAttribute('data-aarti-motion'), { timeout: 35_000 }).not.toBeNull()
  await expect(page.locator('canvas')).not.toHaveAttribute('data-cavemen', /.+/)
}

async function coordinate(page: Page, axis: 'X' | 'Z') {
  return Number((await page.getByTestId('coordinates').textContent())?.match(new RegExp(`${axis} (-?[0-9]+[.][0-9]+)`))?.[1])
}

test('corrected world has no character encounter and retains river and wheel approaches', async ({ page }) => {
  test.setTimeout(200_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await enter(page)
  await page.screenshot({ path: `${output}/desktop-overview.png` })
  await page.getByLabel('Graphics').selectOption('low')
  await page.keyboard.down('d')
  await expect.poll(() => coordinate(page, 'X')).toBeGreaterThan(3)
  await page.keyboard.up('d')
  await page.keyboard.down('w')
  await expect.poll(() => coordinate(page, 'Z')).toBeLessThan(8.4)
  await page.keyboard.up('w')
  await expect(page.getByRole('button', { name: /^Meet / })).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: /talking to/i })).toHaveCount(0)
  await page.screenshot({ path: `${output}/open-ghat.png` })
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('d')
  await expect.poll(() => coordinate(page, 'X')).toBeGreaterThan(12)
  await page.keyboard.up('d')
  await page.screenshot({ path: `${output}/ferris-wheel.png` })
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('w')
  await expect.poll(() => coordinate(page, 'Z')).toBeLessThan(3.6)
  await page.keyboard.up('w')
  await page.screenshot({ path: `${output}/riverfront.png` })
  expect(errors).toEqual([])
})

test('corrected mobile portrait and landscape preserve touch controls', async ({ browser }) => {
  test.setTimeout(120_000)
  for (const viewport of [{ width: 390, height: 844, name: 'mobile-portrait' }, { width: 844, height: 390, name: 'mobile-landscape' }]) {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
    try {
      const page = await context.newPage()
      await enter(page)
      await expect(page.getByRole('group', { name: 'Movement joystick' })).toBeVisible()
      await page.screenshot({ path: `${output}/${viewport.name}.png` })
    } finally { await context.close() }
  }
})
