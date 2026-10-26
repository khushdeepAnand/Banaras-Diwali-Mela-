import type { Position } from './environment'
export type BoatKind = 'ferry' | 'cruise'
export const BOATS = {
  ferry: { label: 'Ferry', dock: { x: 4, z: 1.15 }, start: { x: 4, z: -4.4 }, end: { x: 15, z: -22 }, duration: 26 },
  cruise: { label: 'Ganga cruise', dock: { x: 17, z: 1.15 }, start: { x: 17, z: -8 }, end: { x: -10, z: -31 }, duration: 42 },
} as const
export function nearBoat(kind: BoatKind, p: Position) { const dock = BOATS[kind].dock; return Math.hypot(p.x - dock.x, p.z - dock.z) < 1.65 }
export function boatPosition(kind: BoatKind, time: number) {
  const boat = BOATS[kind]
  const progress = (1 - Math.cos(time / boat.duration * Math.PI * 2)) / 2
  return { x: boat.start.x + (boat.end.x - boat.start.x) * progress, z: boat.start.z + (boat.end.z - boat.start.z) * progress }
}
