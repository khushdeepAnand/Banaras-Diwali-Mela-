import { describe, expect, it } from 'vitest'
import { advance, CAMERA, cameraBlocked, cameraClearance, GHAT_WIDTH, groundHeight, PROMENADE_POSTS, SPAWN, WALK, walkable } from './environment'
import { landmarks, MAP, mapPose, PATHS } from './navigation'
import { BAZAAR_STALLS, INTERACT_Z, MARKET_KIOSKS, nearestStall } from './bazaar'
import { BOARD, EXIT } from './ride'
import { PENDULUM_BOARD, PENDULUM_EXIT } from './pendulum'
import { BOATS } from './boats'
import { AARTI_APPROACH } from './aarti'

describe('expanded world navigation contract', () => {
  it('keeps all mapped paths on the ground and outside obstacles', () => {
    for (const path of PATHS) for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i], steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.05)
      for (let n = 0; n <= steps; n++) {
        const p = { x: a.x + (b.x - a.x) * n / steps, z: a.z + (b.z - a.z) * n / steps }
        expect(walkable(p), JSON.stringify(p)).toBe(true)
        expect(groundHeight(p.z)).toBeGreaterThan(0)
        expect(Math.abs(p.x)).toBeLessThan(GHAT_WIDTH / 2)
      }
    }
  })

  it('connects all walkable grid cells and every destination to spawn', () => {
    const step = 0.25, cols = Math.round((WALK.maxX - WALK.minX) / step) + 1
    const rows = Math.floor((WALK.maxZ - 0.75) / step) + 1
    const points = Array.from({ length: rows * cols }, (_, i) => ({ x: WALK.minX + (i % cols) * step, z: 0.75 + Math.floor(i / cols) * step }))
    const valid = points.map(walkable), visited = new Set<number>()
    const index = (p: { x: number; z: number }) => Math.round((p.z - 0.75) / step) * cols + Math.round((p.x - WALK.minX) / step)
    const queue = [index(SPAWN)]; visited.add(queue[0])
    for (let q = 0; q < queue.length; q++) {
      const current = queue[q], x = current % cols, z = Math.floor(current / cols)
      for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        if (x + dx < 0 || x + dx >= cols || z + dz < 0 || z + dz >= rows) continue
        const next = current + dx + dz * cols
        if (valid[next] && !visited.has(next)) { visited.add(next); queue.push(next) }
      }
    }
    expect(visited.size).toBe(valid.filter(Boolean).length)
    for (const p of [...landmarks(), BOARD, EXIT, PENDULUM_BOARD, PENDULUM_EXIT, BOATS.ferry.dock, BOATS.cruise.dock, AARTI_APPROACH]) {
      expect(walkable(p), JSON.stringify(p)).toBe(true)
      expect(visited.has(index(p)), JSON.stringify(p)).toBe(true)
    }
  })

  it('preserves all eight stall prompts and accurate landmark coordinates', () => {
    for (const stall of [...BAZAAR_STALLS, ...MARKET_KIOSKS]) {
      expect(nearestStall({ x: stall.x, z: INTERACT_Z })?.id).toBe(stall.id)
      expect(landmarks().find(p => p.id === stall.id)).toMatchObject({ x: stall.x, z: INTERACT_Z })
    }
    expect(landmarks().find(p => p.id === 'wheel')).toMatchObject(BOARD)
    expect(landmarks().find(p => p.id === 'aarti')).toMatchObject(AARTI_APPROACH)
    expect(landmarks().find(p => p.id === 'ferry')).toMatchObject(BOATS.ferry.dock)
    expect(landmarks().find(p => p.id === 'cruise')).toMatchObject(BOATS.cruise.dock)
  })

  it('rejects invalid coordinates, respects new bounds, and blocks pavilion posts at slow frame rates', () => {
    for (const p of [{ x: NaN, z: 10 }, { x: 0, z: Infinity }, { x: -30.01, z: 10 }, { x: 30.01, z: 10 }, { x: 0, z: 22.01 }]) expect(walkable(p)).toBe(false)
    expect(walkable(SPAWN)).toBe(true)
    for (const post of PROMENADE_POSTS) {
      let p = { x: post.x - 1, z: post.z }
      // Same <=0.12-unit segments used by Player, at its maximum 0.2s dt.
      for (let n = 0; n < 30; n++) p = advance(p, 0.12, 0)
      expect(p.x).toBeLessThan(post.x - post.radius + 0.01)
      expect(walkable(p)).toBe(true)
      expect(advance(p, 0, 0.12).z).toBeGreaterThan(p.z)
    }
    expect(CAMERA.minX).toBeGreaterThan(WALK.minX)
    expect(CAMERA.maxX).toBeLessThan(WALK.maxX)
    expect(CAMERA.maxZ).toBeLessThan(22.7) // before temple platforms / back wall
    expect(groundHeight(WALK.maxZ)).toBeCloseTo(3.36)
    const rearCamera = cameraClearance({ x: 0, z: 14 }, { x: 0, z: 21 })
    expect(rearCamera.z).toBe(19.3)
    expect(cameraBlocked(rearCamera)).toBe(false)
    expect(cameraClearance({ x: 0, z: 22 }, SPAWN)).toEqual({ x: 0, z: 14.65 })
  })

  it('maps real coordinates without distortion and rotates the arrow with avatar heading', () => {
    expect(mapPose(SPAWN, 0)).toMatchObject({ ...SPAWN, angle: -0, offMap: false })
    expect(mapPose({ x: 24, z: 20.5 }, Math.PI / 2)).toMatchObject({ x: 24, z: 20.5, angle: -90 })
    expect(mapPose({ x: 4, z: -30 }, 0)).toMatchObject({ x: 4, z: MAP.minZ + 1, offMap: true })
  })
})
