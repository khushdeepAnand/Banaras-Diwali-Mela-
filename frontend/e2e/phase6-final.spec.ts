import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const shots = 'test-results/phase6-final'
mkdirSync(shots, { recursive: true })

async function coordinate(page: Page, axis: 'X' | 'Z') {
  const text = await page.getByTestId('coordinates').textContent()
  return Number(text?.match(new RegExp(`${axis} (-?\\d+\\.\\d+)`))?.[1])
}

test('capture the final riverfront, water, Aarti and market', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  await expect(page.locator('canvas')).toBeVisible()
  await expect.poll(() => page.locator('canvas').getAttribute('data-aarti-motion'), { timeout: 30_000 }).not.toBeNull()
  await page.screenshot({ path: `${shots}/desktop-riverfront.png` })

  await page.keyboard.down('w')
  await expect.poll(() => coordinate(page, 'Z'), { timeout: 35_000 }).toBeLessThan(3.6)
  await page.keyboard.up('w')
  await page.screenshot({ path: `${shots}/water-closeup.png` })

  await page.getByRole('button', { name: 'Reset' }).click()
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('a')
  await expect.poll(() => coordinate(page, 'X'), { timeout: 35_000 }).toBeLessThan(-5.5)
  await page.keyboard.up('a')
  await page.keyboard.down('w')
  await expect.poll(() => coordinate(page, 'Z'), { timeout: 35_000 }).toBeLessThan(4.4)
  await page.keyboard.up('w')
  await expect(page.getByTestId('aarti-notice')).toBeVisible()
  await page.screenshot({ path: `${shots}/ganga-aarti.png` })

  await page.getByRole('button', { name: 'Reset' }).click()
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('s')
  await expect.poll(() => coordinate(page, 'Z'), { timeout: 35_000 }).toBeGreaterThanOrEqual(13.5)
  await page.keyboard.up('s')
  await page.mouse.move(980, 380)
  await page.mouse.down()
  await page.mouse.move(350, 380, { steps: 18 })
  await page.mouse.up()
  await page.screenshot({ path: `${shots}/market-stalls.png` })
})

test('capture the final Ferris wheel', async ({ page }) => {
  test.setTimeout(70_000)
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  await expect.poll(() => page.locator('canvas').getAttribute('data-wheel-angle'), { timeout: 30_000 }).not.toBeNull()
  await page.keyboard.down('d')
  await expect.poll(() => coordinate(page, 'X'), { timeout: 25_000 }).toBeGreaterThan(4)
  await page.keyboard.up('d')
  await page.screenshot({ path: `${shots}/ferris-wheel.png` })
})

test('capture the final mobile composition', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  try {
    const page = await context.newPage()
    await page.goto('/')
    await page.getByRole('button', { name: /Enter Silently/i }).click()
    await expect(page.getByRole('group', { name: 'Movement joystick' })).toBeVisible()
    await expect.poll(() => page.locator('canvas').getAttribute('data-aarti-motion'), { timeout: 30_000 }).not.toBeNull()
    await page.screenshot({ path: `${shots}/mobile-portrait.png` })
  } finally {
    await context.close()
  }
})
