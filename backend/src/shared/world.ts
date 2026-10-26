// Pure, versioned world contract shared by server, player and NPCs. No Node imports.
export type Position = { x: number; z: number }
export const WORLD_VERSION = 2
export const SPAWN: Position = { x: 0, z: 10.5 }
export const WALK = { minX: -30, maxX: 30, minZ: 0.7, maxZ: 22 }
export const GHAT_WIDTH = 62
export const STEP_DEPTH = 3, STEP_HEIGHT = 0.48
export const PAVILIONS = [{ x: -27, z: 8.5 }, { x: 27, z: 8.5 }] as const
export const PROMENADE_POSTS = PAVILIONS.flatMap(p => [-1.6, 1.6].flatMap(x => [-1.6, 1.6].map(z => ({ x: p.x + x, z: p.z + z, radius: 0.5 }))))
export const OBSTACLES = [-16, -8, 8, 20].map(x => ({ x, z: 13.5, radius: 0.9 }))
export const STALL_X = [-16, -9.6, -3.2, 3.2, 9.6, 16] as const
export const AARTI = { x: -6, z: 2.05, width: 8.1, depth: 1.5 } as const
export const WHEEL = { x: 15.5, z: 5, radius: 5.1, centerY: 7.25, gondolas: 12, speed: 0.26 } as const
export const PENDULUM = { x: -16.5, z: 5, pivotY: 8.1, length: 5.1 } as const
export function groundHeight(z: number): number {
  return (Math.min(6, Math.max(0, Math.floor(z / STEP_DEPTH))) + 1) * STEP_HEIGHT
}
export function aartiBlocked(p: Position): boolean {
  return Math.abs(p.x - AARTI.x) < AARTI.width / 2 && Math.abs(p.z - AARTI.z) < AARTI.depth / 2
}
export function walkable(p: Position): boolean {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.z)) return false
  if (p.x < WALK.minX || p.x > WALK.maxX || p.z < WALK.minZ || p.z > WALK.maxZ) return false
  if (OBSTACLES.some(o => (p.x - o.x) ** 2 + (p.z - o.z) ** 2 < o.radius ** 2)) return false
  if (PROMENADE_POSTS.some(o => Math.hypot(p.x - o.x, p.z - o.z) < o.radius)) return false
  if (aartiBlocked(p)) return false
  if (Math.abs(Math.abs(p.x) - 20.4) < 1.25 && p.z > 15 && p.z < 18.5) return false
  if (Math.abs(p.x - PENDULUM.x) < 3 && p.z > PENDULUM.z - 1.8 && p.z < PENDULUM.z + 1.6) return false
  const wheelX = p.x - WHEEL.x, wheelZ = p.z - WHEEL.z
  if (Math.abs(wheelX) < 2.7 && wheelZ > -1.9 && wheelZ < 1.6) return false
  if (Math.abs(wheelX - 3.85) < 1.02 && Math.abs(wheelZ - 2.5) < 0.9) return false
  if (Math.abs(Math.abs(wheelX) - 1.87) < 0.23 && wheelZ > 1.65 && wheelZ < 3.9) return false
  return !STALL_X.some(x => Math.abs(p.x - x) < 2.35 && p.z > 15 && p.z < 18.5)
}
export function advance(p: Position, dx: number, dz: number): Position {
  const x = walkable({ x: p.x + dx, z: p.z }) ? p.x + dx : p.x
  const z = walkable({ x, z: p.z + dz }) ? p.z + dz : p.z
  return { x, z }
}
export function clearSegment(a: Position, b: Position): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.08))
  for (let i = 1; i <= steps; i++) if (!walkable({ x: a.x + (b.x - a.x) * i / steps, z: a.z + (b.z - a.z) * i / steps })) return false
  return true
}
