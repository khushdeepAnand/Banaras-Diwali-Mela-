import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { advance, cameraBlocked, cameraClearance, groundHeight, SPAWN, walkable } from './environment'
import { BOARD, EXIT, WHEEL } from './ride'

describe('ghat walk surface', () => {
  it('has reachable steps with discrete elevations', () => {
    expect(groundHeight(2.9)).toBeCloseTo(0.48)
    expect(groundHeight(3)).toBeCloseTo(0.96)
    expect(groundHeight(10.5)).toBeCloseTo(1.92)
  })

  it('cannot enter the river, leave the ghat, or pass through a pillar', () => {
    expect(walkable(SPAWN)).toBe(true)
    expect(advance({ x: 0, z: 0.8 }, 0, -0.5).z).toBe(0.8)
    expect(advance({ x: 29.9, z: 10 }, 0.5, 0).x).toBe(29.9)
    expect(advance({ x: 8, z: 12.5 }, 0, 0.7).z).toBe(12.5)
  })

  it('slides along a blocking edge', () => {
    expect(advance({ x: 29.9, z: 10 }, 1, -1)).toEqual({ x: 29.9, z: 9 })
  })

  it('keeps the lower right ghat open without the removed character obstacles', () => {
    for (const position of [{ x: 3.2, z: 8.1 }, { x: 5.3, z: 8.4 }, { x: 7.3, z: 8 }]) {
      expect(walkable(position)).toBe(true)
    }
  })

  it('keeps the follow camera in front of stall structures and the entrance', () => {
    for (const x of [-16, -9.6, -3.2, 0, 3.2, 9.6, 16]) {
      const safe = cameraClearance({ x, z: 17 })
      expect(safe).toEqual({ x, z: 14.65 })
      expect(cameraBlocked(safe)).toBe(false)
    }
    expect(cameraClearance({ x: 6.4, z: 17 })).toEqual({ x: 6.4, z: 17 })
    // The outer edge of a stall canopy is wider than its counter.
    expect(cameraClearance({ x: 13.4, z: 17 })).toEqual({ x: 13.4, z: 14.65 })
    expect(cameraClearance({ x: 5.7, z: 14.65 })).toEqual({ x: 5.7, z: 14.65 })
  })

  it('frames the entire wheel in the desktop spawn overview', () => {
    const camera = new PerspectiveCamera(90, 1280 / 720, 0.1, 180)
    camera.position.set(5.7, 6.4, 14.65)
    camera.lookAt(5.7, groundHeight(SPAWN.z) + 4.2, SPAWN.z)
    camera.updateMatrixWorld()
    const points = [[WHEEL.x - WHEEL.radius, WHEEL.centerY, WHEEL.z], [WHEEL.x + WHEEL.radius, WHEEL.centerY, WHEEL.z],
      [WHEEL.x, WHEEL.centerY + WHEEL.radius, WHEEL.z], [WHEEL.x, WHEEL.centerY - WHEEL.radius, WHEEL.z]]
    for (const [x, y, z] of points) {
      const screen = new Vector3(x, y, z).project(camera)
      expect(Math.abs(screen.x)).toBeLessThan(0.96)
      expect(Math.abs(screen.y)).toBeLessThan(0.82)
    }
  })

  it('keeps the attraction reachable without walking through the sweep, booth or queue rails', () => {
    expect(walkable(BOARD)).toBe(true)
    expect(walkable(EXIT)).toBe(true)
    expect(walkable({ x: WHEEL.x, z: WHEEL.z })).toBe(false)
    expect(walkable({ x: WHEEL.x + 3.85, z: WHEEL.z + 2.5 })).toBe(false)
    expect(walkable({ x: WHEEL.x + 1.87, z: BOARD.z })).toBe(false)
    expect(advance({ x: BOARD.x, z: 9.2 }, 0, -1)).toEqual({ x: BOARD.x, z: 8.2 })
  })
})
