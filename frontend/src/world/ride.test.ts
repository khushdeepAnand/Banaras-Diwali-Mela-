import { describe, expect, it } from 'vitest'
import { angleToBottom, gondolaAngle, nearBoard, nearestBottomIndex, WHEEL } from './ride'

describe('Ferris wheel boarding', () => {
  it('keeps the boarding spot reachable and away from the river and market', () => {
    expect(nearBoard({ x: 15.5, z: 8.35 })).toBe(true)
    expect(nearBoard({ x: 0, z: 10.5 })).toBe(false)
  })
  it('selects the nearest cabin to the bottom and finds its next safe stop', () => {
    for (const rotation of [0, 0.6, 2, 5.8]) {
      const index = nearestBottomIndex(rotation)
      const angle = gondolaAngle(rotation, index)
      expect(Math.min(angleToBottom(angle), 2 * Math.PI - angleToBottom(angle))).toBeLessThanOrEqual(Math.PI / WHEEL.gondolas + 0.001)
      expect(angleToBottom(angle + angleToBottom(angle))).toBeCloseTo(0, 5)
    }
  })
})
