import { describe, expect, it } from 'vitest'
import { aartiBlocked, AARTI, AARTI_APPROACH, nearAarti } from './aarti'
import { advance, walkable } from './environment'

describe('riverside Aarti placement', () => {
  it('has an approachable riverside viewing position without blocking the original route', () => {
    expect(walkable(AARTI_APPROACH)).toBe(true)
    expect(nearAarti(AARTI_APPROACH)).toBe(true)
    expect(nearAarti({ x: 0, z: 10.5 })).toBe(false)
    expect(aartiBlocked({ x: AARTI.x, z: AARTI.z })).toBe(true)
    expect(walkable({ x: 0, z: 1 })).toBe(true)
    expect(advance({ x: AARTI.x, z: 3.05 }, 0, -0.4).z).toBe(3.05)
    expect(walkable({ x: -11, z: 1 })).toBe(true)
  })
})
