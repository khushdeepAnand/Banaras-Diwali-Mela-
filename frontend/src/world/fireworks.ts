export type FireworkKind = 'colour' | 'gold' | 'lotus' | 'ram' | 'finale'
export type FireworkCue = { time: number; kind: FireworkKind; x: number; y: number }
export const SHOW_DURATION = 38
export const CUES: readonly FireworkCue[] = [
  { time: 0, kind: 'colour', x: -11, y: 17 }, { time: 2.3, kind: 'colour', x: 11, y: 20 },
  { time: 5, kind: 'gold', x: -7, y: 21 }, { time: 7.5, kind: 'gold', x: 11, y: 18 },
  { time: 11, kind: 'lotus', x: -8, y: 20 }, { time: 14, kind: 'lotus', x: 9, y: 22 },
  { time: 18, kind: 'ram', x: -3, y: 21 }, { time: 24, kind: 'gold', x: -11, y: 19 },
  { time: 27, kind: 'finale', x: -9, y: 21 }, { time: 28.1, kind: 'finale', x: 10, y: 23 },
  { time: 29.3, kind: 'finale', x: 0, y: 24 },
]
export function cueAge(time: number, cue: FireworkCue): number {
  return ((time - cue.time) % SHOW_DURATION + SHOW_DURATION) % SHOW_DURATION
}

// Deterministic deliberately drawn formations; never randomized into ordinary bursts.
export function formation(kind: FireworkKind, count: number): Float32Array {
  const result = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const t = i / count, a = t * Math.PI * 2
    let x: number, y: number
    if (kind === 'lotus') {
      const petal = Math.floor(t * 8), u = t * 8 - petal, angle = (petal - 4) * Math.PI / 7
      const radius = 9 * Math.sin(Math.PI * u)
      x = radius * Math.sin(angle) + (petal - 3.5) * 0.23
      y = radius * Math.cos(angle) - 1.5
    } else if (kind === 'ram') {
      // A respectful symbolic profile: central lamp/tilak, arch and drawn bow.
      if (t < 0.38) { const v = t / 0.38; x = 7 * Math.cos(Math.PI * (1 - v)); y = 6 * Math.sin(Math.PI * v) - 2 }
      else if (t < 0.72) { const v = (t - 0.38) / 0.34; x = 8 + 2.8 * Math.sin(Math.PI * v); y = 7 - v * 14 }
      else if (t < 0.84) { x = 8; y = 7 - (t - 0.72) / 0.12 * 14 }
      else { const v = (t - 0.84) / 0.16; x = -1 + v * 2; y = 3.4 - Math.abs(v - 0.5) * 3 }
    } else {
      const radius = kind === 'gold' ? 7 + 3 * (i % 5) / 5 : 7 + 4 * (i % 7) / 7
      x = radius * Math.cos(a); y = radius * Math.sin(a)
      if (kind === 'gold') y -= (i % 4) * 0.45
    }
    result[i * 3] = x; result[i * 3 + 1] = y; result[i * 3 + 2] = Math.sin(i * 19.17) * 1.5
  }
  return result
}
