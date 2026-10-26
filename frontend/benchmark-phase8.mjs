// Local comparison only. Run after browser tests with a ZIP-equivalent baseline.
// Usage: node benchmark-phase8.mjs /path/to/baseline/frontend
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

if (!process.argv[2]) throw new Error('Pass the baseline frontend directory as the first argument')

const projects = [
  [process.argv[2], 'ZIP-equivalent baseline'],
  [fileURLToPath(new URL('.', import.meta.url)), 'Phase 8'],
]

async function ready(url) {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(url)).ok) return } catch { /* startup */ }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error(`Vite failed to start at ${url}`)
}

const browser = await chromium.launch({ args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
try {
  for (const [cwd, label] of projects) {
    const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5180', '--strictPort'], { cwd, stdio: 'ignore', detached: true })
    const url = 'http://127.0.0.1:5180/'
    try {
      await ready(url)
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
      await page.goto(url)
      await page.getByRole('button', { name: /enter the ghat/i }).click()
      await page.locator('canvas[data-aarti-motion]').waitFor({ timeout: 45_000 })
      for (const quality of ['low', 'high']) {
        await page.getByRole('combobox', { name: 'Graphics' }).selectOption(quality)
        await page.waitForTimeout(2000)
        const stats = await page.evaluate(async () => {
          const times = []
          const start = performance.now()
          await new Promise(resolve => {
            function frame(now) {
              times.push(now)
              if (now - start < 4000) requestAnimationFrame(frame)
              else resolve()
            }
            requestAnimationFrame(frame)
          })
          const intervals = times.slice(1).map((time, index) => time - times[index]).sort((a, b) => a - b)
          return { frames: times.length, elapsedMs: times.at(-1) - times[0], medianFrameMs: intervals[Math.floor(intervals.length / 2)], p95FrameMs: intervals[Math.floor(intervals.length * 0.95)] }
        })
        console.log(JSON.stringify({ label, quality, ...stats }))
      }
      await page.close()
    } finally {
      if (server.exitCode === null && server.pid) {
        try { process.kill(-server.pid, 'SIGTERM') } catch { /* already stopped */ }
        await new Promise(resolve => server.once('exit', resolve))
      }
    }
  }
} finally { await browser.close() }
