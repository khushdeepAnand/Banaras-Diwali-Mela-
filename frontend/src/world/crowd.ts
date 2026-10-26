import { advance, clearSegment, walkable, type Position } from '../../../backend/src/shared/world'

export const BEGGAR_RADIUS = 1.9
export const BEGGARS = [
  { id: 'beggar:west', x: -12, z: 10.8, heading: 0.4 },
  { id: 'beggar:east', x: 24, z: 12.2, heading: -1.3 },
] as const
export const NPC_COUNTS = { low: 4, medium: 6, high: 8 } as const
const routes: readonly (readonly Position[])[] = [
  [{ x: -24, z: 3.5 }, { x: -24, z: 20.5 }, { x: 24, z: 20.5 }, { x: 24, z: 14.5 }, { x: -24, z: 14.5 }],
  [{ x: 24, z: 1 }, { x: 24, z: 10.5 }, { x: -24, z: 10.5 }, { x: -24, z: 1 }],
]
export type Npc = Position & { id: string; heading: number; moving: boolean; speed: number; route: number; target: number; direction: number; pause: number; blocked: number }
export function makeCrowd(count: number): Npc[] {
  return Array.from({ length: count }, (_, i) => {
    const route = i % routes.length, target = Math.floor(i / 2) % routes[route].length
    return { ...routes[route][target], id: `npc:${i}`, heading: 0, moving: false, speed: 0.65 + (i * 7 % 5) * 0.13, route, target: (target + 1) % routes[route].length, direction: 1, pause: i * 0.37, blocked: 0 }
  })
}
export function tickCrowd(crowd: Npc[], dt: number, people: readonly Position[]) {
  for (const npc of crowd) {
    npc.moving = false
    if (npc.pause > 0) { npc.pause -= dt; continue }
    const route = routes[npc.route], target = route[npc.target]
    const dx = target.x - npc.x, dz = target.z - npc.z, distance = Math.hypot(dx, dz)
    if (distance < 0.15) {
      npc.target = (npc.target + npc.direction + route.length) % route.length
      npc.pause = 0.6 + (Number(npc.id.split(':')[1]) * 3 % 7) * 0.23
      continue
    }
    const amount = Math.min(distance, npc.speed * dt)
    let stepX = dx / distance * amount, stepZ = dz / distance * amount
    // Yield and gently step away if a visitor walks into the crowd. NPCs never block input.
    for (const person of people) {
      const awayX = npc.x - person.x, awayZ = npc.z - person.z, near = Math.hypot(awayX, awayZ)
      if (near < 1.2) {
        if (near < 0.55) { stepX = (near > 0.01 ? awayX / near : -dz / distance) * amount; stepZ = (near > 0.01 ? awayZ / near : dx / distance) * amount }
        else { stepX = (dx * 0.35 - dz * 0.93) / distance * amount; stepZ = (dz * 0.35 + dx * 0.93) / distance * amount }
        break
      }
    }
    const next = advance(npc, stepX, stepZ)
    const occupied = crowd.some(other => other !== npc && Math.hypot(next.x - other.x, next.z - other.z) < 0.6)
    if (!occupied && walkable(next) && clearSegment(npc, next) && Math.hypot(next.x - npc.x, next.z - npc.z) > 0.001) {
      npc.heading = Math.atan2(npc.x - next.x, npc.z - next.z); npc.x = next.x; npc.z = next.z; npc.moving = true; npc.blocked = 0
    } else {
      npc.blocked += dt
      if (npc.blocked > 2) { npc.direction *= -1; npc.target = (npc.target + npc.direction + route.length) % route.length; npc.pause = 0.3; npc.blocked = 0 }
    }
  }
}
export function nearestBeggar(position: Position, beggars: readonly (Position & { id: string })[] = BEGGARS) {
  let closest: (Position & { id: string }) | null = null, distance = BEGGAR_RADIUS
  for (const beggar of beggars) {
    const next = Math.hypot(position.x - beggar.x, position.z - beggar.z)
    if (next < distance || next === distance && closest && beggar.id < closest.id) { closest = beggar; distance = next }
  }
  return closest
}
