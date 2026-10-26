import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FestivalSound } from './festivalSound'

class Gain {
  gain = { value: 0, setTargetAtTime: vi.fn() }
  connect = vi.fn(); disconnect = vi.fn()
}
class Source {
  buffer: unknown; loop = false; onended: (() => void) | null = null
  connect = vi.fn(); disconnect = vi.fn(); start = vi.fn(); stop = vi.fn()
}
class Context {
  static instances: Context[] = []
  state = 'suspended'; currentTime = 1; destination = {}; sources: Source[] = []
  constructor() { Context.instances.push(this) }
  createGain() { return new Gain() }
  createBufferSource() { const source = new Source(); this.sources.push(source); return source }
  resume = vi.fn(async () => { this.state = 'running' })
  suspend = vi.fn(async () => { this.state = 'suspended' })
  close = vi.fn(async () => { this.state = 'closed' })
  decodeAudioData = vi.fn(async () => ({}))
  addEventListener = vi.fn(); removeEventListener = vi.fn()
}
beforeEach(() => {
  Context.instances = []
  vi.stubGlobal('AudioContext', Context)
  vi.stubGlobal('document', { hidden: false })
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
})
afterEach(() => vi.unstubAllGlobals())

describe('bounded opt-in environment audio', () => {
  it('creates no context or fetch until enabled; reuses three loops and decoded buffers', async () => {
    const sound = new FestivalSound()
    expect(sound.stats()).toMatchObject({ context: 'not-created', loops: 0, voices: 0 })
    expect(fetch).not.toHaveBeenCalled()
    await sound.startAmbience(.4, false); expect(sound.stats().loops).toBe(3)
    await sound.startAmbience(.6, true); expect(sound.stats().loops).toBe(3)
    expect(fetch).toHaveBeenCalledTimes(3); expect(Context.instances).toHaveLength(1)
    sound.setZone(1); sound.setZone(20); sound.setZone(NaN)
    sound.dispose(); expect(sound.stats()).toMatchObject({ context: 'not-created', loops: 0, voices: 0, buffers: 0 })
    expect(Context.instances[0].close).toHaveBeenCalledTimes(1)
  })
  it('cancels enabling safely and rejects missing files without starting partial loops', async () => {
    const sound = new FestivalSound()
    const start = sound.startAmbience(.4, false); sound.stopAmbience()
    expect(await start).toBe(false); expect(sound.stats().loops).toBe(0)
    sound.dispose()
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
    const missing = new FestivalSound()
    await expect(missing.startAmbience(.4, false)).rejects.toThrow('Audio asset unavailable')
    expect(missing.stats().loops).toBe(0); missing.dispose()
  })
  it('caps overlapping effects, debounces inputs and disconnects ended/stopped voices', async () => {
    const sound = new FestivalSound(); sound.playEffect('fountain'); expect(Context.instances).toHaveLength(0)
    await sound.startEffects(.4, false)
    sound.playEffect('gift'); sound.playEffect('gift'); await Promise.resolve()
    expect(sound.stats().voices).toBe(1)
    Context.instances[0].currentTime += .2; sound.playEffect('offering'); await Promise.resolve()
    Context.instances[0].currentTime += .2; sound.playEffect('fountain'); await Promise.resolve()
    expect(sound.stats().voices).toBe(2)
    Context.instances[0].sources[0].onended?.(); expect(sound.stats().voices).toBe(1)
    sound.pause(); expect(sound.stats().voices).toBe(0); expect(Context.instances[0].suspend).toHaveBeenCalledOnce()
    sound.dispose()
  })
  it('does not restart hidden-tab or disposed audio after an asynchronous load', async () => {
    const sound = new FestivalSound()
    const start = sound.startAmbience(.4, false); Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    expect(await start).toBe(false); expect(sound.stats().loops).toBe(0)
    sound.dispose(); await expect(sound.startEffects(.4, false)).rejects.toThrow('Sound session closed')
  })
})
