import type { Position } from './environment'

export type RidePhase = 'approaching' | 'boarding' | 'riding' | 'exiting'
import { WHEEL } from '../../../backend/src/shared/world'
export { WHEEL } from '../../../backend/src/shared/world'
export const BOARD: Position = { x: 15.5, z: 8.35 }
export const EXIT: Position = { x: 15.5, z: 8.6 }
export const BOARD_RADIUS = 2.1

export function nearBoard(p: Position): boolean {
  return Math.hypot(p.x - BOARD.x, p.z - BOARD.z) < BOARD_RADIUS
}

export function nearestBottomIndex(rotation: number): number {
  const step = 2 * Math.PI / WHEEL.gondolas
  return ((Math.round(-rotation / step) % WHEEL.gondolas) + WHEEL.gondolas) % WHEEL.gondolas
}

export function gondolaAngle(rotation: number, index: number): number {
  return -Math.PI / 2 + index * 2 * Math.PI / WHEEL.gondolas + rotation
}

export function angleToBottom(angle: number): number {
  return ((-Math.PI / 2 - angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
}
