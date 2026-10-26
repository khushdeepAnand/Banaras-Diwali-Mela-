import { expect, it } from 'vitest'
import { BOATS, boatPosition, nearBoat } from './boats'
import { walkable } from './environment'
for (const kind of ['ferry', 'cruise'] as const) it(`${kind} loops in water and has safe shore disembarkation`, () => {
  const { duration, dock, start, end } = BOATS[kind]
  expect(walkable(dock)).toBe(true)
  expect(nearBoat(kind, dock)).toBe(true)
  expect(boatPosition(kind, 0)).toEqual(start)
  expect(boatPosition(kind, duration / 2)).toEqual(end)
  expect(boatPosition(kind, duration)).toEqual(start)
  for (let t = 0; t < duration; t += 0.5) expect(boatPosition(kind, t).z).toBeLessThanOrEqual(start.z)
})
