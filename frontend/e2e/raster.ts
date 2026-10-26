// Test-only software-raster cap. Input, scene logic and native networking are real.
export function capRaster() {
  const raf = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window)
  const pending = new Map<number, { timer: number; frame: number }>(); let next = 0
  window.requestAnimationFrame = callback => {
    const id = ++next, entry = { timer: 0, frame: 0 }
    entry.timer = window.setTimeout(() => { entry.frame = raf(time => { pending.delete(id); callback(time) }) }, 200)
    pending.set(id, entry); return id
  }
  window.cancelAnimationFrame = id => { const entry = pending.get(id); if (entry) { clearTimeout(entry.timer); cancel(entry.frame); pending.delete(id) } }
}
