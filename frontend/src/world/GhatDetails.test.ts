import { expect, it } from 'vitest'
import { pavingPositions } from './GhatDetails'
import { scenicBuildings } from './ScenicRiverfront'
import { WALK } from './environment'

it('uses quality-aware paving entirely inside the original ghat footprint', () => {
  const low = pavingPositions('low'), medium = pavingPositions('medium'), high = pavingPositions('high')
  expect(low.length).toBeLessThan(medium.length)
  expect(medium.length).toBeLessThan(high.length)
  expect(high.every(tile => tile.x >= WALK.minX - 1 && tile.x <= WALK.maxX + 1 && tile.z >= 0 && tile.z <= 21)).toBe(true)
})
it('scenic buildings remain off the playable route', () => {
  for (const quality of ['low', 'medium', 'high'] as const) {
    const buildings = scenicBuildings(quality)
    expect(buildings.every(house => house.x + house.width / 2 < WALK.minX || house.x - house.width / 2 > WALK.maxX || house.z + 2 < WALK.minZ || house.z - 2 > WALK.maxZ)).toBe(true)
  }
})
