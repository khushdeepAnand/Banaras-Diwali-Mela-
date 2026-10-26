import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const output = 'test-results/phase8'
mkdirSync(output, { recursive: true })

async function enter(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  await expect.poll(() => page.locator('canvas').getAttribute('data-aarti-motion'), { timeout: 35_000 }).not.toBeNull()
}

async function coordinate(page: Page, axis: 'X' | 'Z') {
  const text = await page.getByTestId('coordinates').textContent()
  return Number(text?.match(new RegExp(`${axis} (-?[0-9]+[.][0-9]+)`))?.[1])
}

test('updated river, ceremony, architecture, rides and market', async ({ page }) => {
  test.setTimeout(360_000)
  await enter(page)
  await page.screenshot({ path: `${output}/${process.env.PHASE11_CAPTURE ? 'desktop-overview' : 'desktop-riverfront'}.png` })
  await page.keyboard.down('w')
  await expect.poll(() => coordinate(page, 'Z'), { timeout: 35_000 }).toBeLessThan(3.6)
  await page.keyboard.up('w')
  await page.screenshot({ path: `${output}/river-reflections.png` })
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('a')
  await expect.poll(() => coordinate(page, 'X')).toBeLessThan(-5.5)
  await page.keyboard.up('a')
  await page.keyboard.down('w')
  await expect.poll(() => coordinate(page, 'Z'), { timeout: 35_000 }).toBeLessThan(4.4)
  await page.keyboard.up('w')
  await expect(page.getByTestId('aarti-notice')).toBeVisible()
  await page.screenshot({ path: `${output}/ganga-aarti.png` })
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('s')
  await expect.poll(() => coordinate(page, 'Z')).toBeGreaterThanOrEqual(13.5)
  await page.keyboard.up('s')
  await page.mouse.move(980, 380)
  await page.mouse.down()
  await page.mouse.move(350, 380, { steps: 18 })
  await page.mouse.up()
  await page.screenshot({ path: `${output}/market-stalls.png` })
  await page.mouse.move(900, 530)
  await page.mouse.down()
  await page.mouse.move(900, 350, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${output}/ghats-architecture.png` })
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('d')
  await expect.poll(() => coordinate(page, 'X')).toBeGreaterThan(12)
  await page.keyboard.up('d')
  await page.screenshot({ path: `${output}/ferris-wheel.png` })
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('a')
  await expect.poll(() => coordinate(page, 'X')).toBeLessThan(-4)
  await page.keyboard.up('a')
  await page.mouse.move(900, 470)
  await page.mouse.down()
  await page.mouse.move(680, 360, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${output}/pendulum.png` })
  if (await page.getByRole('button', { name: /fireworks: off/i }).count()) await page.getByRole('button', { name: /fireworks: off/i }).click()
  await expect.poll(() => page.locator('canvas').getAttribute('data-fireworks'), { timeout: 42_000 }).toMatch(/^(colour|gold|lotus|ram|finale):[1-4]/)
  await page.screenshot({ path: `${output}/fireworks.png` })
})

test('updated touch layouts', async ({ browser }) => {
  test.setTimeout(110_000)
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
