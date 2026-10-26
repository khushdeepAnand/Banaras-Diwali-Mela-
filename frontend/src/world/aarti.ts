import type { Position } from './environment'

import { AARTI } from '../../../backend/src/shared/world'
export { AARTI, aartiBlocked } from '../../../backend/src/shared/world'
export const AARTI_APPROACH: Position = { x: AARTI.x, z: 3.65 }

export function nearAarti(p: Position): boolean {
  return Math.hypot(p.x - AARTI_APPROACH.x, p.z - AARTI_APPROACH.z) < 3.15
}
