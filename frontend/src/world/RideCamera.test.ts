import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { marketCamera, panoramaCamera } from './RideCamera'
import { WHEEL } from './ride'

describe('ride camera candidates', () => {
  it('places both viewpoints behind the rear rim, not inside the wheel', () => {
    for (const y of [WHEEL.centerY - WHEEL.radius, WHEEL.centerY, WHEEL.centerY + WHEEL.radius]) {
      for (const x of [WHEEL.x - WHEEL.radius, WHEEL.x, WHEEL.x + WHEEL.radius]) {
        const pose = { x, y, z: WHEEL.z - 1.45 }
        const position = new Vector3(), look = new Vector3()
        marketCamera(pose, position, look)
        expect(position.z).toBeGreaterThan(WHEEL.z + 0.8)
        expect(look.z).toBeGreaterThan(position.z)
        expect(position.y - y).toBeCloseTo(1.25)
        panoramaCamera(pose, position, look)
        expect(position.z).toBeGreaterThan(WHEEL.z + 0.8)
        expect(position.y - y).toBeCloseTo(1.25)
      }
    }
  })

  it('tilts the high portrait view down and moves the desktop view away from the rim', () => {
    const pose = { x: WHEEL.x + WHEEL.radius, y: WHEEL.centerY + WHEEL.radius, z: WHEEL.z - 1.45 }
    const landscape = new Vector3(), landscapeLook = new Vector3()
    const portrait = new Vector3(), portraitLook = new Vector3()
    marketCamera(pose, landscape, landscapeLook, 0)
    marketCamera(pose, portrait, portraitLook, 1)
    expect(landscape.x).toBeLessThan(portrait.x)
    expect(portraitLook.y).toBeLessThan(landscapeLook.y - 3)
    expect(landscape.z).toBe(portrait.z)
  })
})
