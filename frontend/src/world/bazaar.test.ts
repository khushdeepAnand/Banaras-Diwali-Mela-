import { describe, expect, it } from 'vitest'
import { BAZAAR_STALLS, INTERACT_Z, nearestStall } from './bazaar'
import { advance, cameraBlocked, cameraClearance, SPAWN, walkable } from './environment'

describe('bazaar layout and interactions', () => {
  it('provides six uniquely identified displays and reachable interaction spots', () => {
    expect(new Set(BAZAAR_STALLS.map((stall) => stall.id)).size).toBe(6)
    for (const stall of BAZAAR_STALLS) {
      expect(walkable({ x: stall.x, z: INTERACT_Z })).toBe(true)
      expect(nearestStall({ x: stall.x, z: INTERACT_Z })?.id).toBe(stall.id)
      expect(stall.products.length).toBeGreaterThan(0)
      expect(walkable({ x: stall.x, z: 16.5 })).toBe(false)
    }
  })

  it('retains a river route and blocks counter structures with axis sliding', () => {
    expect(walkable(SPAWN)).toBe(true)
    expect(walkable({ x: 0, z: 0.7 })).toBe(true)
    expect(advance({ x: 3.2, z: 14.8 }, 0, 0.4).z).toBe(14.8)
    expect(advance({ x: 3.2, z: 14.8 }, 1, 0.4).x).toBe(4.2)
    expect(nearestStall({ x: 0, z: 10.5 })).toBeNull()
  })

  it('keeps the follow camera out of a market stall', () => {
    const safe = cameraClearance({ x: 3.2, z: 18 })
    expect(cameraBlocked({ x: 3.2, z: 18 })).toBe(true)
    expect(cameraBlocked(safe)).toBe(false)
    expect(cameraClearance({ x: 0, z: 10 })).toEqual({ x: 0, z: 10 })
  })
})
