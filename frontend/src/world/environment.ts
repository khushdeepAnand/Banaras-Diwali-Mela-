import { WALK, type Position } from '../../../backend/src/shared/world'
export { SPAWN, WALK, GHAT_WIDTH, PAVILIONS, PROMENADE_POSTS, STEP_DEPTH, STEP_HEIGHT, OBSTACLES, groundHeight, walkable, advance, type Position } from '../../../backend/src/shared/world'
export const CAMERA = { minX: WALK.minX + 0.5, maxX: WALK.maxX - 0.5, minZ: 1, maxZ: WALK.maxZ + 0.4 }

export function cameraClearance(p: Position, following?: Position): Position {
  if (following && following.z >= 18.7 && Math.abs(following.x) < 22) return { x: p.x, z: Math.max(p.z, 19.3) }
  // A camera beyond a canopy can still look THROUGH it at a river-side player.
  if (!cameraBlocked({ x: p.x, z: Math.min(p.z, 18) })) return p
  // Stay on the aisle side of both counters and the entrance arch; no sideways teleport.
  return { x: p.x, z: STALL_FRONT_Z - 0.35 }
}

export function cameraBlocked(p: Position): boolean {
  return p.z > STALL_FRONT_Z && p.z < 18.7 &&
    (Math.abs(p.x) < 1.5 || BAZAAR_STALLS.some((stall) => Math.abs(p.x - stall.x) < 3.05) || MARKET_KIOSKS.some((stall) => Math.abs(p.x - stall.x) < 1.7))
}

import { BAZAAR_STALLS, MARKET_KIOSKS, STALL_FRONT_Z } from './bazaar'
