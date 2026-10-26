import type { Position } from './world.js'
import type { Appearance } from './appearance.js'
import type { GameplayEvent, GameplayState } from './gameplay.js'
export const ROOM_CAPACITY = 4, SNAPSHOT_MS = 100, RECONNECT_MS = 20_000
export const ROOM_CODE_PATTERN = '^[A-F0-9]{10}$'
export function validRoomCode(value: unknown): value is string { return typeof value === 'string' && new RegExp(ROOM_CODE_PATTERN).test(value) }
export type RideKind = 'wheel' | 'pendulum' | 'ferry' | 'cruise'
export type Visitor = Position & { id: string; y: number; heading: number; moving: boolean; ride: RideKind | null; appearance: Appearance }
export type Snapshot = { type: 'snapshot'; room: string; visitors: Visitor[]; events: GameplayEvent[]; serverTime: number }
export type Welcome = { type: 'welcome'; room: string; id: string; token: string; visitor: Visitor; world: number; gameplay: GameplayState }
export const RIDE_ENTRY = { wheel: { x: 15.5, z: 8.35 }, pendulum: { x: -16.5, z: 9.1 }, ferry: { x: 4, z: 1.15 }, cruise: { x: 17, z: 1.15 } } as const
export const RIDE_EXIT = { wheel: { x: 15.5, z: 8.6 }, pendulum: { x: -16.5, z: 9.3 }, ferry: RIDE_ENTRY.ferry, cruise: RIDE_ENTRY.cruise } as const
