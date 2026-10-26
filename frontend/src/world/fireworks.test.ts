import { describe, expect, it } from 'vitest'
import { CUES, SHOW_DURATION, cueAge, formation } from './fireworks'
describe('repeating fireworks', () => {
  it('runs ordered sequence and repeats with a finale pause', () => {
    expect(CUES.map(c => c.kind)).toEqual(['colour','colour','gold','gold','lotus','lotus','ram','gold','finale','finale','finale'])
    expect(CUES.at(-1)!.time + 5.4).toBeLessThan(SHOW_DURATION)
    expect(cueAge(1 + SHOW_DURATION * 3, CUES[0])).toBe(1)
  })
  it('generates finite, shaped formations', () => {
    const lotus = formation('lotus', 80), ram = formation('ram', 80)
    expect(lotus.length).toBe(240)
    expect([...lotus, ...ram].every(Number.isFinite)).toBe(true)
    expect(lotus[0]).not.toBe(ram[0])
    expect(formation('ram', 80)).toEqual(ram)
  })
})
