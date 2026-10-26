import { describe, expect, it } from 'vitest'
import { floatingDiyaPositions, ghatDiyaPositions } from './DiyaField'
import { groundHeight } from './environment'

describe('deliberate diya placement', () => {
  it('keeps step lamps on their terraces and limits the mobile count', () => {
    const low = ghatDiyaPositions('low'), high = ghatDiyaPositions('high')
    expect(high.length).toBeGreaterThan(low.length)
    expect(high.length).toBeLessThan(450)
    for (const [, y, z] of high) expect(y).toBeCloseTo(groundHeight(z) + 0.055)
    expect(high.some(([x, , z]) => x < -8 && z === 3.13)).toBe(true)
  })
  it('floats a sparse arrangement above the water, never inside the ghat', () => {
    const low = floatingDiyaPositions('low'), high = floatingDiyaPositions('high')
    expect(low).toHaveLength(14)
    expect(high).toHaveLength(32)
    expect(high.every(([, y, z]) => y > -0.17 && z < -0.5)).toBe(true)
  })
})
