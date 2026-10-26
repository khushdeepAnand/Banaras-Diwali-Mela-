import { expect, it } from 'vitest'
import { BEGGARS, BEGGAR_RADIUS, makeCrowd, nearestBeggar, NPC_COUNTS, tickCrowd } from './crowd'
import { SPAWN, walkable } from './environment'
import { BAZAAR_STALLS } from './bazaar'
import { STALL_X } from '../../../backend/src/shared/world'

it('keeps shared collision stall coordinates aligned with the actual market', () => {
  expect(BAZAAR_STALLS.map(s => s.x)).toEqual(STALL_X)
})
it('moves independent crowds on valid ground for ten simulated minutes, away from spawn', () => {
  for (const count of Object.values(NPC_COUNTS)) {
    const crowd = makeCrowd(count), start = crowd.map(p => ({ ...p })), travelled = crowd.map(() => 0)
    const ranges = crowd.map(p => ({ minX: p.x, maxX: p.x, minZ: p.z, maxZ: p.z }))
    for (let tick = 0; tick < 6000; tick++) {
      const before = crowd.map(p => ({ x: p.x, z: p.z }))
      tickCrowd(crowd, 0.1, [SPAWN, ...BEGGARS])
      for (let i = 0; i < count; i++) {
        const p = crowd[i], range = ranges[i]
        expect(walkable(p)).toBe(true); travelled[i] += Math.hypot(p.x - before[i].x, p.z - before[i].z)
        range.minX = Math.min(range.minX, p.x); range.maxX = Math.max(range.maxX, p.x); range.minZ = Math.min(range.minZ, p.z); range.maxZ = Math.max(range.maxZ, p.z)
      }
    }
    expect(new Set(crowd.map(p => p.id)).size).toBe(count)
    expect(travelled.every(distance => distance > 40)).toBe(true)
    for (const [i, range] of ranges.entries()) {
      expect(range.maxX - range.minX, `npc:${i} X tour`).toBeGreaterThan(30)
      expect(range.maxZ - range.minZ, `npc:${i} Z tour`).toBeGreaterThan(9) // lower loop spans Z1..10.5
    }
    expect(start.every(p => Math.hypot(p.x - SPAWN.x, p.z - SPAWN.z) > 3)).toBe(true)
  }
})
it('keeps beggars accessible, optional and deterministic when several are nearby', () => {
  for (const b of BEGGARS) {
    expect(walkable(b)).toBe(true)
    expect(nearestBeggar(b)?.id).toBe(b.id)
    expect(nearestBeggar({ x: b.x, z: b.z + BEGGAR_RADIUS + 0.1 })).toBe(null)
  }
  expect(nearestBeggar(SPAWN)).toBe(null)
  expect(nearestBeggar({ x: 0, z: 0 }, [{ id: 'b', x: -1, z: 0 }, { id: 'a', x: 1, z: 0 }])?.id).toBe('a')
})
