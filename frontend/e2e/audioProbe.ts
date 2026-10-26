// Observe native Web Audio sources without replacing decoding or playback.
export function installAudioProbe() {
  const state = { contexts: [] as AudioContext[], active: 0, started: 0 }
  ;(window as unknown as { audioProbe: typeof state }).audioProbe = state
  const Native = window.AudioContext
  window.AudioContext = class extends Native {
    constructor(options?: AudioContextOptions) { super(options); state.contexts.push(this) }
    override createBufferSource() {
      const source = super.createBufferSource(), start = source.start.bind(source), stop = source.stop.bind(source)
      let active = false
      const ended = () => { if (active) { active = false; state.active-- } }
      source.start = (...args: Parameters<typeof start>) => { start(...args); active = true; state.active++; state.started++ }
      source.stop = (...args: Parameters<typeof stop>) => { stop(...args); ended() }
      source.addEventListener('ended', ended, { once: true })
      return source
    }
  }
}
