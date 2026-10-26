import { expect, test, type Page } from '@playwright/test'
import { capRaster } from './raster'

async function enter(page: Page, path = '/') {
  await page.addInitScript(capRaster)
  await page.goto(path)
  await page.getByRole('button', { name: 'Enter Silently', exact: true }).click()
  await page.getByLabel('Graphics').selectOption('low')
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-mode', 'third')
}

test('welcome stays responsive during real lazy loading; silent entry makes no audio request', async ({ page }) => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/world/MelaScene.tsx*', async route => { await gate; await route.continue() })
  const audio: string[] = []; page.on('request', request => { if (request.url().includes('/audio/')) audio.push(request.url()) })
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Enter with Sound', exact: true })).toBeEnabled()
    await page.getByRole('button', { name: 'Help / controls', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Mela controls' })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Enter Silently', exact: true }).focus()
    await expect(page.getByRole('button', { name: 'Enter Silently', exact: true })).toBeFocused()
    expect(await page.getByRole('button', { name: 'Enter Silently', exact: true }).evaluate(button => getComputedStyle(button).outlineStyle)).not.toBe('none')
    await page.screenshot({ path: 'test-results/phase6/welcome-desktop.png' })
    await page.getByRole('button', { name: 'Enter Silently', exact: true }).click()
    const loading = page.getByRole('status', { name: 'Loading riverfront' })
    await expect(loading).toBeVisible()
    await expect(loading.locator('progress')).not.toHaveAttribute('value')
    await expect(loading).not.toContainText('100%')
    await page.screenshot({ path: 'test-results/phase6/loading.png' })
    release()
    await expect(loading).toBeHidden({ timeout: 45_000 })
    expect(audio).toEqual([])
    await expect(page.locator('audio')).not.toHaveAttribute('src')
  } finally { release() }
})

test('sound entry uses one explicit media gesture; denial keeps scene usable and reload silent', async ({ page }) => {
  await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Test permission denial', 'NotAllowedError')) })
  await page.goto('/')
  await expect(page.locator('audio')).not.toHaveAttribute('src')
  await page.getByRole('button', { name: 'Enter with Sound', exact: true }).click()
  await expect(page.locator('.audio-caption')).toContainText('Playback blocked')
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-mode', 'third')
  await expect(page.locator('audio')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('audio')).not.toHaveAttribute('src')
})

test('sound entry starts actual local playback only after click', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('audio')).not.toHaveAttribute('src')
  await page.getByRole('button', { name: 'Enter with Sound', exact: true }).click()
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => !audio.paused && audio.currentTime > 0)).toBe(true)
  await page.getByRole('button', { name: 'Pause audio', exact: true }).click()
})

test('fresh mobile invitation validates, prefills and joins only on confirmation; copy/share fallbacks remain honest', async ({ browser }) => {
  test.setTimeout(150_000)
  const owner = await browser.newContext({ viewport: { width: 800, height: 540 }, deviceScaleFactor: 1 })
  const guest = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })
  try {
    const first = await owner.newPage(); await enter(first)
    await first.getByTestId('multiplayer').click(); await first.getByRole('button', { name: 'Create room', exact: true }).click()
    await expect(first.getByTestId('room-status')).toHaveText('Connected')
    const url = await first.getByLabel('Invite link', { exact: true }).inputValue()
    expect(new URL(url).search).toMatch(/^\?room=[A-F0-9]{10}$/)
    const code = new URL(url).searchParams.get('room')!
    await owner.grantPermissions(['clipboard-read', 'clipboard-write'])
    await first.getByRole('button', { name: 'Copy invite link' }).click()
    await expect(first.getByRole('dialog')).toContainText('Invite link copied.')
    expect(await first.evaluate(() => navigator.clipboard.readText())).toBe(url)
    await first.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    })
    await first.getByRole('button', { name: 'Copy invite link' }).click()
    await expect(first.getByRole('dialog')).toContainText('Select and copy')
    await first.getByRole('button', { name: 'Share invite', exact: true }).click()
    await expect(first.getByRole('dialog')).toContainText('Native sharing unavailable')
    const whatsapp = await first.getByRole('link', { name: 'WhatsApp invite' }).getAttribute('href')
    expect(decodeURIComponent(whatsapp!)).toContain(url)
    const second = await guest.newPage(); await enter(second, url)
    await expect(second.getByLabel('Room code', { exact: true })).toHaveValue(code)
    await expect(second.getByTestId('room-status')).toContainText('Solo')
    await second.getByRole('button', { name: 'Join room', exact: true }).tap()
    await expect(second.getByTestId('room-status')).toHaveText('Connected')
    await expect(first.getByTestId('room-count')).toHaveText('2')
    await second.screenshot({ path: 'test-results/phase6/mobile-invitation.png' })
    await second.getByRole('button', { name: 'Leave room', exact: true }).tap()
    await second.goto('/?room=bad')
    await second.getByRole('button', { name: 'Enter Silently', exact: true }).tap()
    await expect(second.getByRole('dialog')).toContainText('Invalid invitation')
    await expect(second.getByLabel('Room code', { exact: true })).toHaveValue('')
    await second.getByLabel('Room code', { exact: true }).fill('0000000000')
    await second.getByRole('button', { name: 'Join room', exact: true }).tap()
    await expect(second.getByTestId('room-status')).toHaveText('Room unavailable')
  } finally { await guest.close(); await owner.close() }
})

test('map shortcuts guide real walking, announce arrival, and can be dismissed', async ({ page }) => {
  await enter(page)
  const map = page.getByRole('complementary', { name: 'Festival navigation' })
  for (const name of ['Ganga Aarti', 'Ferris wheel', 'Bazaar', 'River / offerings']) {
    await map.getByRole('button', { name, exact: true }).click()
    await expect(map.getByRole('status')).not.toHaveText('')
  }
  await expect(map.getByRole('status')).toContainText('up toward the river')
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.down('w')
  try { await expect(map.getByRole('status')).toContainText('Arrived: River / offerings', { timeout: 30_000 }) }
  finally { await page.keyboard.up('w') }
  await expect(page.getByTestId('gameplay-prompt')).toBeVisible()
  await page.screenshot({ path: 'test-results/phase6/navigation-arrival.png' })
  await map.getByRole('button', { name: 'Hide map', exact: true }).click()
  await expect(map.getByRole('group', { name: 'Find a festival activity' })).toBeHidden()
})

test('real photo has frame/watermark, preview before download, native fallback and failure recovery', async ({ page }) => {
  test.setTimeout(120_000)
  await enter(page)
  await page.getByRole('button', { name: 'Visitor tools', exact: true }).click()
  await page.getByRole('button', { name: 'Photo mode', exact: true }).click()
  await page.getByLabel('Scenic preset', { exact: true }).selectOption('festival')
  await page.getByLabel('Dev Deepawali 2026 frame (next capture)').check()
  await page.evaluate(() => {
    const original = CanvasRenderingContext2D.prototype.fillText
    ;(window as unknown as { photoLabels: string[] }).photoLabels = []
    CanvasRenderingContext2D.prototype.fillText = function (...args: Parameters<typeof original>) {
      ;(window as unknown as { photoLabels: string[] }).photoLabels.push(args[0]); return original.apply(this, args)
    }
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
  })
  let downloads = 0; page.on('download', () => downloads++)
  await page.getByRole('button', { name: 'Capture PNG preview', exact: true }).click()
  const image = page.getByRole('img', { name: 'Captured actual mela scene' })
  await expect(image).toBeVisible()
  expect(downloads).toBe(0)
  expect(await page.evaluate(() => (window as unknown as { photoLabels: string[] }).photoLabels)).toEqual(expect.arrayContaining(['Banaras Diwali Mela', 'banarasdiwalimela.kesug.com', 'Dev Deepawali 2026']))
  expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth <= 1920 && img.naturalWidth > 500)).toBe(true)
  const event = page.waitForEvent('download'); await page.getByRole('link', { name: 'Download photo', exact: true }).click()
  const download = await event; expect(download.suggestedFilename()).toMatch(/^banaras-dev-deepawali-2026-.+\.png$/)
  await download.saveAs('test-results/phase6/watermarked-photo.png')
  await page.getByRole('button', { name: 'Share photo', exact: true }).click()
  await expect(page.getByTestId('photo-status')).toContainText('Native sharing is unavailable')
  await page.screenshot({ path: 'test-results/phase6/photo-preview.png' })
  await page.evaluate(() => { window.createImageBitmap = () => Promise.reject(new Error('Test capture processing failure')) })
  await page.getByRole('button', { name: 'Capture PNG preview', exact: true }).click()
  await expect(page.getByTestId('photo-status')).toContainText('Test capture processing failure')
  await expect(page.getByRole('button', { name: 'Capture PNG preview', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Back from photo mode', exact: true }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-mode', 'third')
})

test('unsupported WebGL shows verified static gallery without a renderer or automatic retries', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof getContext>) {
      if (String(args[0]).startsWith('webgl')) return null
      return getContext.apply(this, args)
    } as typeof getContext
  })
  await page.goto('/')
  const fallback = page.getByRole('region', { name: '3D compatibility help' })
  await expect(fallback).toBeVisible()
  await expect(fallback).toContainText('WebGL 2')
  await expect(fallback.locator('img')).toHaveCount(2)
  expect(await fallback.locator('img').evaluateAll(images => images.every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0))).toBe(true)
  await expect(fallback.getByRole('link', { name: 'Visit main website' })).toHaveAttribute('href', 'https://banarasdiwalimela.kesug.com')
  await page.screenshot({ path: 'test-results/phase6/webgl-fallback.png' })
})

test('real lost WebGL context unmounts scene and offers explicit retry', async ({ page }) => {
  await enter(page)
  await page.getByRole('button', { name: 'Music +', exact: true }).click()
  await page.getByRole('button', { name: 'Play audio', exact: true }).click()
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => !audio.paused)).toBe(true)
  const lost = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const extension = canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')
    extension?.loseContext(); return !!extension
  })
  expect(lost).toBe(true)
  await expect(page.getByRole('region', { name: '3D compatibility help' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Retry scene', exact: true })).toBeVisible()
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true)
})

test('failed lazy scene import offers a manual retry that recovers without autoplay', async ({ page }) => {
  await page.route('**/world/MelaScene.tsx*', route => route.abort())
  await page.goto('/')
  const fallback = page.getByRole('region', { name: '3D compatibility help' })
  await expect(fallback).toBeVisible()
  await expect(fallback).toContainText('could not finish loading')
  await page.unroute('**/world/MelaScene.tsx*')
  await fallback.getByRole('button', { name: 'Retry scene', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Enter Silently', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Enter Silently', exact: true }).click()
  await expect(page.locator('canvas')).toHaveAttribute('data-camera-mode', 'third')
  await expect(page.locator('audio')).not.toHaveAttribute('src')
})

test('welcome, help, map and photo fit phone portrait, landscape, tablet and compact desktop', async ({ browser }) => {
  test.setTimeout(180_000)
  for (const [width, height] of [[320, 640], [360, 480], [390, 844], [844, 390], [768, 1024], [800, 540]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    try {
      const page = await context.newPage(); await page.addInitScript(capRaster); await page.goto('/')
      await page.getByRole('button', { name: 'Enter Silently', exact: true }).scrollIntoViewIfNeeded()
      await page.screenshot({ path: `test-results/phase6/welcome-${width}x${height}.png` })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.getByRole('button', { name: 'Enter Silently', exact: true }).tap()
      await page.getByLabel('Graphics').selectOption('low')
      await expect(page.locator('canvas')).toHaveAttribute('data-camera-mode', 'third')
      const map = page.getByRole('complementary', { name: 'Festival navigation' })
      if (await map.getByRole('button', { name: 'Show map', exact: true }).isVisible()) await map.getByRole('button', { name: 'Show map', exact: true }).tap()
      await map.getByRole('button', { name: 'Ganga Aarti', exact: true }).tap()
      const toggle = await map.getByRole('button', { name: 'Hide map', exact: true }).boundingBox()
      const graphics = await page.getByLabel('Graphics').boundingBox()
      expect(toggle && graphics && (toggle.y >= graphics.y + graphics.height || toggle.x + toggle.width <= graphics.x)).toBe(true)
      for (const name of ['Multiplayer', 'Toggle camera mode', 'Visitor tools']) {
        expect(await page.getByRole('button', { name, exact: true }).evaluate(control => {
          const box = control.getBoundingClientRect()
          return control.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
        })).toBe(true)
      }
      await page.screenshot({ path: `test-results/phase6/map-${width}x${height}.png` })
      await map.getByRole('button', { name: 'Hide map', exact: true }).tap()
      await page.getByRole('button', { name: 'Visitor tools', exact: true }).tap()
      await page.getByRole('button', { name: 'Photo mode', exact: true }).tap()
      await page.getByLabel('Scenic preset', { exact: true }).selectOption('festival')
      await page.screenshot({ path: `test-results/phase6/photo-${width}x${height}.png` })
      await page.getByRole('button', { name: 'Back from photo mode', exact: true }).tap()
    } finally { await context.close() }
  }
})
