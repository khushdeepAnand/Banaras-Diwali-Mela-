import { AARTI_APPROACH, nearAarti } from './aarti'
import { BAZAAR_STALLS, INTERACT_Z, kioskStalls, nearestStall } from './bazaar'
import { BOATS } from './boats'
import { PAVILIONS, WALK, type Position } from './environment'
import { PENDULUM_BOARD } from './pendulum'
import { BOARD, nearBoard } from './ride'
import { GOODS, OFFER_POINT, nearPoint } from '../../../backend/src/shared/gameplay'
import { walkable } from './environment'
import type { PublicApplication } from '../components/commerceApi'

// Shared world-space routes: drawn on the map AND paved in the scene.
export const PATHS: readonly (readonly Position[])[] = [
  [{ x: -24, z: 1 }, { x: -24, z: 20.5 }, { x: 24, z: 20.5 }, { x: 24, z: 1 }],
  [{ x: -24, z: 10.5 }, { x: 24, z: 10.5 }],
  [{ x: -27, z: 8.5 }, { x: -24, z: 8.5 }],
  [{ x: 24, z: 8.5 }, { x: 27, z: 8.5 }],
  [{ x: -24, z: INTERACT_Z }, { x: 24, z: INTERACT_Z }],
  [{ x: -24, z: 1 }, { x: 24, z: 1 }],
  [{ x: 0, z: 1 }, { x: 0, z: 14.5 }],
]
export type Landmark = Position & { id: string; name: string; kind: 'stall' | 'ride' | 'aarti' | 'place' }
export function landmarks(listings: readonly PublicApplication[] = []): Landmark[] {
  return [
    ...[...BAZAAR_STALLS, ...kioskStalls(listings)].map(stall => ({ id: stall.id, name: stall.name, kind: 'stall' as const, x: stall.x, z: INTERACT_Z })),
    { ...BOARD, id: 'wheel', name: 'Ferris wheel', kind: 'ride' },
    { ...PENDULUM_BOARD, id: 'pendulum', name: 'Pendulum', kind: 'ride' },
    { ...BOATS.ferry.dock, id: 'ferry', name: 'Ferry dock', kind: 'ride' },
    { ...BOATS.cruise.dock, id: 'cruise', name: 'Cruise dock', kind: 'ride' },
    { ...AARTI_APPROACH, id: 'aarti', name: 'Ganga Aarti viewing', kind: 'aarti' },
    { ...PAVILIONS[0], id: 'west', name: 'West lamp pavilion', kind: 'place' },
    { ...PAVILIONS[1], id: 'east', name: 'East river pavilion', kind: 'place' },
    { x: 0, z: 20.5, id: 'court', name: 'Temple forecourt', kind: 'place' },
  ]
}
export const MAP = { minX: WALK.minX - 2, maxX: WALK.maxX + 2, minZ: -4, maxZ: WALK.maxZ + 2 }
// Guidance uses the same approach geometry and proximity rules as gameplay.
// It never moves the player or invents a path through an obstacle.
export const DESTINATIONS = [
  { id: 'aarti', name: 'Ganga Aarti', point: AARTI_APPROACH, arrived: nearAarti, tip: 'Follow the river steps to the marked viewing area.' },
  { id: 'wheel', name: 'Ferris wheel', point: BOARD, arrived: nearBoard, tip: 'Approach the boarding platform from the upper steps.' },
  { id: 'bazaar', name: 'Bazaar', point: { x: GOODS.flower.x, z: INTERACT_Z }, arrived: (p: Position) => !!nearestStall(p), tip: 'Follow the market path; approach a stall for its prompt.' },
  { id: 'river', name: 'River / offerings', point: OFFER_POINT, arrived: (p: Position) => nearPoint(p, OFFER_POINT), tip: 'Use the central steps to reach the offering area.' },
] as const
export function destinationCue(id: string, position: Position, riding: boolean) {
  const place = DESTINATIONS.find(place => place.id === id)
  if (!place || !walkable(place.point)) return 'Destination unavailable. Keep exploring with the map.'
  if (riding) return 'Exit your ride before following this destination.'
  if (place.arrived(position)) return `Arrived: ${place.name}. Look for the nearby interaction prompt.`
  const dx = place.point.x - position.x, dz = place.point.z - position.z
  const direction = [Math.abs(dz) > 1 ? dz < 0 ? 'up toward the river' : 'down toward the market' : '', Math.abs(dx) > 1 ? dx < 0 ? 'left (west)' : 'right (east)' : ''].filter(Boolean).join(' and ')
  return `${place.name}: ${direction ? `on the map, head ${direction}.` : 'approach the highlighted point.'} ${place.tip} Walk around obstacles; no automatic travel.`
}
export function mapPose(position: Position, heading: number) {
  return { x: Math.max(MAP.minX + 1, Math.min(MAP.maxX - 1, position.x)),
    z: Math.max(MAP.minZ + 1, Math.min(MAP.maxZ - 1, position.z)), angle: -heading * 180 / Math.PI,
    offMap: position.x < MAP.minX || position.x > MAP.maxX || position.z < MAP.minZ || position.z > MAP.maxZ }
}
