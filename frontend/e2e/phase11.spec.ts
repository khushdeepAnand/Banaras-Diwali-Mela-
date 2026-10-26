import { test, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const output = 'test-results/phase11'
mkdirSync(output, { recursive: true })

test('desktop audio stays tucked away until requested without blocking the scene', async ({ page }) => {
  test.setTimeout(120_000)
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  await expect.poll(() => page.locator('canvas').getAttribute('data-aarti-motion'), { timeout: 35_000 }).not.toBeNull()
  const toggle = page.getByRole('button', { name: 'Music +' })
  await expect(toggle).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play audio' })).toBeHidden()
  await toggle.click()
  await expect(page.getByRole('button', { name: 'Play audio' })).toBeVisible()
  await expect(page.getByRole('slider', { name: 'Audio volume' })).toBeVisible()
  await page.screenshot({ path: `${output}/audio-controls-open.png` })
  await page.getByRole('button', { name: 'Music −' }).click()
  await expect(page.getByRole('button', { name: 'Play audio' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Vendors' })).toBeVisible()
  expect(errors).toEqual([])
})
