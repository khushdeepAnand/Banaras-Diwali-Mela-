import { expect, test } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

test('bounded renderer workload at spawn across quality tiers', async ({ page }) => {
  test.setTimeout(180_000)
  await page.addInitScript(() => {
    const samples: { calls: number; triangles: number }[] = []
    let calls = 0, triangles = 0
    window.addEventListener('phase1-profile-reset', () => { samples.length = 0 })
    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced'] as const) {
        const target = prototype as unknown as Record<string, (...args: number[]) => void>
        const original = target[name]
        if (!Object.hasOwn(prototype, name) || !original) continue
        target[name] = function (this: WebGLRenderingContext, ...args: number[]) {
          calls++
          if (args[0] === 4) triangles += (name.includes('Arrays') ? args[2] : args[1]) / 3 * (name.endsWith('Instanced') ? args[name.includes('Arrays') ? 3 : 4] : 1)
          original.apply(this, args)
        }
      }
    }
    const raf = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = callback => raf(time => {
      calls = 0; triangles = 0
      callback(time)
      if (calls) { samples.push({ calls, triangles }); if (samples.length > 60) samples.shift() }
      document.documentElement.dataset.workload = JSON.stringify(samples)
    })
  })
  await page.goto('/')
  await page.getByRole('button', { name: /Enter Silently/i }).click()
  await page.getByRole('button', { name: /fireworks: on/i }).click()
  const results: Record<string, unknown> = {}
  for (const tier of ['low', 'medium', 'high'] as const) {
    await page.getByLabel('Graphics').selectOption(tier)
    await page.evaluate(() => { window.dispatchEvent(new Event('phase1-profile-reset')); document.documentElement.dataset.workload = '[]' })
    await page.waitForTimeout(6000)
    await expect.poll(() => page.evaluate(() => JSON.parse(document.documentElement.dataset.workload || '[]').length), { timeout: 30_000 }).toBeGreaterThanOrEqual(12)
    const samples = await page.evaluate(() => JSON.parse(document.documentElement.dataset.workload || '[]') as { calls: number; triangles: number }[])
    expect(samples.length).toBeGreaterThan(0)
    const last = samples.slice(-10)
    const measured = { calls: Math.max(...last.map(s => s.calls)), triangles: Math.round(Math.max(...last.map(s => s.triangles))) }
    const baseline = { low: { calls: 610, triangles: 56372 }, medium: { calls: 631, triangles: 82832 }, high: { calls: 976, triangles: 102764 } }[tier]!
    expect(measured.calls).toBeLessThanOrEqual(baseline.calls + 40)
    expect(measured.triangles).toBeLessThanOrEqual(baseline.triangles * 1.2)
    results[tier] = measured
    await page.screenshot({ path: `test-results/phase1/profile-${tier}.png` })
  }
  mkdirSync('test-results/phase1', { recursive: true })
  writeFileSync('test-results/phase1/workload.json', JSON.stringify(results, null, 2))
  console.log('Renderer workload (Edge/SwiftShader; NOT hardware FPS):', results)
})
