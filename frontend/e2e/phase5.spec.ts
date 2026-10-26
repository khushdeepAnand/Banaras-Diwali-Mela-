import { expect, test, type Page } from '@playwright/test'
import { capRaster } from './raster'
import { installAudioProbe } from './audioProbe'

async function enter(page: Page) {
  await page.addInitScript(capRaster); await page.addInitScript(installAudioProbe)
  await page.goto('/'); await page.getByRole('button', { name: /Enter Silently/i }).click()
  await page.getByLabel('Graphics').selectOption('low')
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-mode', 'third')
}
async function probe(page: Page) {
  return page.evaluate(() => { const value = (window as unknown as { audioProbe: { contexts: AudioContext[]; active: number; started: number } }).audioProbe; return { contexts: value.contexts.length, states: value.contexts.map(context => context.state), active: value.active, started: value.started } })
}

test('one Kashi Radio plays real local music, resumes, seeks, credits and persists only safe preferences', async ({ page }) => {
  test.setTimeout(90_000)
  const requests: string[] = []; page.on('request', request => { if (request.url().includes('/audio/')) requests.push(request.url()) })
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
  await enter(page)
  expect(requests).toEqual([]); expect((await probe(page)).contexts).toBe(0)
  const media = page.getByTestId('aarti-audio')
  await expect(media).not.toHaveAttribute('src'); await expect(page.locator('audio')).toHaveCount(1)
  await page.getByRole('button', { name: 'Music +' }).click()
  await expect(page.getByRole('heading', { name: /Kashi Radio/ })).toBeVisible()
  await page.getByRole('button', { name: 'Play audio', exact: true }).click()
  await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => !audio.paused && audio.duration > 30)).toBe(true)
  await page.screenshot({ path: 'test-results/phase5/radio-desktop.png' })
  await page.getByLabel('Playback progress', { exact: true }).fill('8')
  await page.getByRole('button', { name: 'Pause audio', exact: true }).click()
  await page.evaluate(() => {
    const native = HTMLMediaElement.prototype.play
    ;(window as unknown as { restorePlay: () => void }).restorePlay = () => { HTMLMediaElement.prototype.play = native }
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Test permission denial', 'NotAllowedError'))
  })
  await page.getByRole('button', { name: 'Play audio', exact: true }).click()
  await expect(page.locator('.audio-caption')).toContainText('Playback blocked')
  await page.evaluate(() => (window as unknown as { restorePlay: () => void }).restorePlay())
  await page.getByRole('button', { name: 'Play audio', exact: true }).click()
  await expect.poll(() => page.getByTestId('aarti-audio').evaluate((audio: HTMLAudioElement) => !audio.paused)).toBe(true)
  await page.getByRole('button', { name: 'Pause audio', exact: true }).click()
  const paused = await media.evaluate((audio: HTMLAudioElement) => audio.currentTime)
  await page.getByRole('button', { name: 'Play audio', exact: true }).click()
  await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThanOrEqual(paused)
  await page.getByRole('slider', { name: 'Audio volume', exact: true }).fill('0.2')
  await page.getByRole('button', { name: 'Mute audio', exact: true }).click()
  await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => audio.muted && audio.volume === .2)).toBe(true)
  for (const [value, minimum] of [['2', 100], ['3', 500]] as const) {
    await page.getByLabel('Music track', { exact: true }).selectOption(value)
    await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => !audio.paused && audio.duration > 0), { timeout: 30_000 }).toBe(true)
    expect(await media.evaluate((audio: HTMLAudioElement) => audio.duration)).toBeGreaterThan(minimum)
  }
  await page.getByRole('button', { name: 'Previous track' }).click()
  await expect(page.getByLabel('Music track', { exact: true })).toHaveValue('2')
  await page.getByRole('button', { name: 'Next track' }).click()
  await expect(page.getByLabel('Music track', { exact: true })).toHaveValue('3')
  await page.getByRole('button', { name: 'Next track' }).click()
  await expect(page.getByLabel('Music track', { exact: true })).toHaveValue('0')
  await page.getByLabel('Music track', { exact: true }).selectOption('4')
  await expect(page.locator('.audio-caption')).toContainText('recording not supplied')
  expect(requests.some(url => url.includes('ganga-aarti'))).toBe(false)
  await page.getByTitle('Minimise Kashi Radio').click()
  await expect(page.getByRole('region', { name: 'Kashi Radio' })).toBeHidden()
  await page.reload(); await page.getByRole('button', { name: /Enter Silently/i }).click()
  await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => audio.paused && audio.muted && audio.volume === .2)).toBe(true)
  expect((await probe(page)).contexts).toBe(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('banaras.audio.music') || '{}'))).toEqual({ volume: .2, muted: true })
  expect(errors).toEqual([])
})

test('ambience and effects share one bounded native context, mute independently and stop on hidden/unmount', async ({ page }) => {
  await enter(page); await page.getByRole('button', { name: 'Music +' }).click()
  await page.getByRole('button', { name: 'Enable ambience', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Disable ambience', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(await probe(page)).toMatchObject({ contexts: 1, active: 3 })
  await page.getByRole('button', { name: 'Enable festival effects', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Disable festival effects', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(await probe(page)).toMatchObject({ contexts: 1, active: 3 })
  await page.getByRole('slider', { name: 'Ambience volume', exact: true }).fill('0.15')
  await page.getByRole('button', { name: 'Mute ambience', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Unmute ambience' })).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => page.getByTestId('aarti-audio').evaluate((audio: HTMLAudioElement) => audio.paused && !audio.muted)).toBe(true)
  await page.getByRole('button', { name: 'Disable ambience', exact: true }).click()
  expect((await probe(page)).active).toBe(0)
  await page.getByRole('button', { name: 'Enable ambience', exact: true }).click()
  await expect.poll(async () => (await probe(page)).active).toBe(3)
  await page.getByRole('button', { name: 'Play audio', exact: true }).click()
  await expect.poll(() => page.getByTestId('aarti-audio').evaluate((audio: HTMLAudioElement) => !audio.paused)).toBe(true)
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')) })
  await expect.poll(async () => (await probe(page)).active).toBe(0)
  await expect.poll(() => page.getByTestId('aarti-audio').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true)
  await expect(page.getByRole('button', { name: 'Enable ambience', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')) })
  expect((await probe(page)).active).toBe(0)
  expect(await page.getByTestId('aarti-audio').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true)
  // Native context disposal, not just UI removal, must happen when React unmounts.
  await page.evaluate(() => window.history.pushState(null, '', '/not-a-game-route'))
  await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')))
  await expect.poll(async () => (await probe(page)).states).toEqual(['closed'])
})

test('unavailable media remains recoverable without breaking gameplay', async ({ page }) => {
  await page.route('**/audio/sandhya-drone.wav', route => route.fulfill({ status: 404, body: 'not available' }))
  await enter(page); await page.getByRole('button', { name: 'Music +' }).click()
  await page.getByRole('button', { name: 'Play audio', exact: true }).click()
  await expect(page.locator('.audio-caption')).toContainText(/unavailable|blocked|missing/i)
  await page.getByRole('button', { name: 'Next track' }).click()
  await expect.poll(() => page.getByTestId('aarti-audio').evaluate((audio: HTMLAudioElement) => !audio.paused)).toBe(true)
  await page.getByRole('button', { name: 'Pause audio', exact: true }).click()
  await page.getByTitle('Minimise Kashi Radio').click()
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur()); await page.keyboard.down('w')
  try { await expect.poll(async () => Number((await page.getByTestId('coordinates').textContent())?.match(/Z ([\d.]+)/)?.[1])).toBeLessThan(9.5) } finally { await page.keyboard.up('w') }
})

test('touch radio is scrollable above controls, minimises and exposes no embedded third-party player', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })
  try {
    const page = await context.newPage(); await enter(page)
    await page.getByRole('button', { name: 'Music +' }).tap()
    await page.getByRole('button', { name: 'Play audio', exact: true }).tap()
    await expect.poll(() => page.getByTestId('aarti-audio').evaluate((audio: HTMLAudioElement) => !audio.paused)).toBe(true)
    const panel = await page.getByRole('region', { name: 'Kashi Radio' }).boundingBox()
    const joystick = await page.getByRole('group', { name: 'Movement joystick' }).boundingBox()
    expect(panel!.y + panel!.height).toBeLessThan(joystick!.y)
    await page.screenshot({ path: 'test-results/phase5/radio-mobile.png' })
    await expect(page.locator('iframe')).toHaveCount(0)
    await page.getByText('Recording credits & external listening', { exact: true }).tap()
    await expect(page.getByRole('link', { name: /Find official Ganga Aarti/ })).toHaveAttribute('href', /^https:\/\/www.youtube.com\/results\?/)
    await page.getByTitle('Minimise Kashi Radio').tap()
    await expect(page.getByRole('region', { name: 'Kashi Radio' })).toBeHidden()
  } finally { await context.close() }
})

test('keyboard sliders and compact landscape keep gameplay controls usable', async ({ browser }) => {
  for (const viewport of [{ width: 844, height: 390 }, { width: 800, height: 540 }, { width: 800, height: 600 }]) {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })
    try {
      const page = await context.newPage(); await enter(page)
      await page.getByRole('button', { name: 'Music +' }).tap()
      const panel = await page.getByRole('region', { name: 'Kashi Radio' }).boundingBox()
      const stick = await page.getByRole('group', { name: 'Movement joystick' }).boundingBox()
      expect(panel!.y + panel!.height).toBeLessThan(stick!.y)
      await expect(page.getByTestId('collection')).toBeHidden()
      const slider = page.getByRole('slider', { name: 'Audio volume', exact: true })
      await slider.focus(); const position = await page.getByTestId('coordinates').textContent()
      await page.keyboard.press('ArrowLeft')
      expect(await slider.inputValue()).toBe('0.3')
      expect(await page.getByTestId('coordinates').textContent()).toBe(position)
      await page.screenshot({ path: `test-results/phase5/radio-${viewport.width}x${viewport.height}.png` })
      await page.getByTitle('Minimise Kashi Radio').tap()
      await expect(page.getByRole('button', { name: 'Visitor tools', exact: true })).toBeVisible()
    } finally { await context.close() }
  }
})
