import { clampVolume } from './useFestivalAudio'

export type EffectName = 'gift' | 'offering' | 'fountain'
const FILES = { river: 'river-loop.wav', crowd: 'crowd-loop.wav', bells: 'bells-loop.wav', gift: 'gift-feedback.wav', offering: 'offering-water.wav', fountain: 'spark-fountain.wav' } as const

// One opt-in context, three ambience loops and at most two brief effect voices.
export class FestivalSound {
  private context: AudioContext | null = null
  private ambience: GainNode | null = null
  private effects: GainNode | null = null
  private buffers = new Map<string, Promise<AudioBuffer>>()
  private loops: { source: AudioBufferSourceNode; gain: GainNode; role: 'river' | 'crowd' | 'bells' }[] = []
  private voices = new Set<AudioBufferSourceNode>()
  private abort = new AbortController()
  private ambienceRequest = 0
  private effectsRequest = 0
  private effectsReady = false
  private disposed = false
  private lastEffect = -Infinity
  private zone = 10.5

  constructor(private suspended: () => void = () => {}) {}
  private stateChanged = () => { if (this.context?.state === 'suspended') { this.stopAmbience(); this.stopEffects(); this.suspended() } }
  private wake() {
    if (this.disposed) throw new Error('Sound session closed')
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' })
      this.ambience = this.context.createGain(); this.effects = this.context.createGain()
      this.ambience.gain.value = this.effects.gain.value = 0
      this.ambience.connect(this.context.destination); this.effects.connect(this.context.destination)
      this.context.addEventListener('statechange', this.stateChanged)
    }
    return this.context.resume() // Invoked synchronously from an explicit button gesture.
  }
  private buffer(name: keyof typeof FILES) {
    const previous = this.buffers.get(name)
    if (previous) return previous
    const context = this.context!
    const promise = fetch(`${import.meta.env.BASE_URL}audio/${FILES[name]}`, { signal: this.abort.signal })
      .then(response => { if (!response.ok) throw new Error('Audio asset unavailable'); return response.arrayBuffer() })
      .then(data => context.decodeAudioData(data))
      .catch(error => { this.buffers.delete(name); throw error })
    this.buffers.set(name, promise)
    return promise
  }
  async startAmbience(volume: number, muted: boolean) {
    const request = ++this.ambienceRequest
    await this.wake()
    const roles = ['river', 'crowd', 'bells'] as const
    const buffers = await Promise.all(roles.map(role => this.buffer(role)))
    if (this.disposed || request !== this.ambienceRequest || document.hidden || this.context?.state !== 'running') return false
    this.clearLoops()
    const context = this.context
    roles.forEach((role, i) => {
      const source = context.createBufferSource(), gain = context.createGain()
      source.buffer = buffers[i]; source.loop = true
      source.connect(gain); gain.connect(this.ambience!)
      gain.gain.value = 0
      this.loops.push({ source, gain, role }); source.start(context.currentTime + .02)
    })
    this.mix(volume, muted, 'ambience'); this.setZone(this.zone)
    return true
  }
  async startEffects(volume: number, muted: boolean) {
    const request = ++this.effectsRequest
    await this.wake()
    await Promise.all((['gift', 'offering', 'fountain'] as const).map(name => this.buffer(name)))
    if (this.disposed || request !== this.effectsRequest || document.hidden || this.context?.state !== 'running') return false
    this.effectsReady = true; this.mix(volume, muted, 'effects')
    return true
  }
  mix(volume: number, muted: boolean, kind: 'ambience' | 'effects') {
    const node = kind === 'ambience' ? this.ambience : this.effects
    if (node && this.context?.state !== 'closed') node.gain.setTargetAtTime(muted ? 0 : clampVolume(volume) * (kind === 'effects' ? .45 : .8), this.context!.currentTime, .04)
  }
  setZone(z: number) {
    this.zone = Number.isFinite(z) ? z : 10.5
    const market = Math.max(0, Math.min(1, (this.zone - 2) / 13))
    for (const loop of this.loops) loop.gain.gain.setTargetAtTime(loop.role === 'river' ? 1.2 - market * .7 : loop.role === 'crowd' ? .2 + market * .8 : .4, this.context!.currentTime, .6)
  }
  playEffect(name: EffectName) {
    const context = this.context
    if (!this.effectsReady || !context || context.state !== 'running' || document.hidden || this.voices.size >= 2 || context.currentTime - this.lastEffect < .15) return
    const promise = this.buffers.get(name)
    if (!promise) return
    const request = this.effectsRequest
    this.lastEffect = context.currentTime
    void promise.then(buffer => {
      if (this.disposed || request !== this.effectsRequest || !this.effectsReady || context.state !== 'running' || document.hidden || this.voices.size >= 2) return
      const source = context.createBufferSource(); source.buffer = buffer; source.connect(this.effects!)
      this.voices.add(source)
      source.onended = () => { source.disconnect(); this.voices.delete(source) }
      source.start()
    }).catch(() => {}) // Loading failures are already reported by the explicit enable action.
  }
  private clearLoops() { for (const { source, gain } of this.loops) { source.stop(); source.disconnect(); gain.disconnect() }; this.loops = [] }
  stopAmbience() { this.ambienceRequest++; this.clearLoops() }
  stopEffects() { this.effectsRequest++; this.effectsReady = false; for (const source of this.voices) { source.onended = null; source.stop(); source.disconnect() }; this.voices.clear() }
  pause() { this.stopAmbience(); this.stopEffects(); if (this.context?.state === 'running') void this.context.suspend().catch(() => {}) }
  dispose() {
    this.disposed = true; this.abort.abort(); this.stopAmbience(); this.stopEffects(); this.buffers.clear()
    this.ambience?.disconnect(); this.effects?.disconnect()
    this.context?.removeEventListener('statechange', this.stateChanged)
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {})
    this.context = null
  }
  stats() { return { context: this.context?.state ?? 'not-created', loops: this.loops.length, voices: this.voices.size, buffers: this.buffers.size } }
}
