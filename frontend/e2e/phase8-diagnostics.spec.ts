import { test, expect } from '@playwright/test'

test('phase 8 has no page exceptions, console errors or failed scene assets', async ({ page }) => {
  test.setTimeout(65_000)
  const problems: string[] = []
  page.on('pageerror', error => problems.push(`page: ${error.message}`))
  page.on('console', message => { if (message.type() === 'error') problems.push(`console: ${message.text()}`) })
  page.on('requestfailed', request => problems.push(`network: ${request.url()} ${request.failure()?.errorText}`))
  page.on('response', response => { if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`) })
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  await expect.poll(() => page.locator('canvas').getAttribute('data-aarti-motion'), { timeout: 35_000 }).not.toBeNull()
  await expect(page.getByRole('button', { name: /fireworks/i })).toBeVisible()
  await page.waitForTimeout(1500)
  expect(problems).toEqual([])
})
