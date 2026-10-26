import type { Position } from './environment'
import { PENDULUM } from '../../../backend/src/shared/world'
export { PENDULUM } from '../../../backend/src/shared/world'
export const PENDULUM_BOARD: Position = { x: -16.5, z: 9.1 }
export const PENDULUM_EXIT: Position = { x: -16.5, z: 9.3 }
export function nearPendulum(p: Position) { return Math.hypot(p.x - PENDULUM_BOARD.x, p.z - PENDULUM_BOARD.z) < 1.8 }
export function pendulumAngle(time: number) { return 0.86 * Math.sin(time * 1.32) }
export function pendulumPose(time: number) {
  const angle = pendulumAngle(time)
  return { x: PENDULUM.x + Math.sin(angle) * PENDULUM.length, y: PENDULUM.pivotY - Math.cos(angle) * PENDULUM.length, z: PENDULUM.z }
}
