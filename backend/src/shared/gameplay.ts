import { groundHeight, type Position } from './world.js'

export const ITEMS = ['flower', 'diya', 'firecracker', 'tasting'] as const
export type Item = typeof ITEMS[number]
export type Action = { request: number; action: 'collect' | 'offer' | 'light'; item: Item }
export type Inventory = Record<Item, number>
export type GameplayState = { inventory: Inventory; lastRequest: number; collectAt: number; offerAt: number; lightAt: number }
export type GameplayEvent = { id: string; item: 'flower' | 'diya' | 'firecracker'; at: number }
export type Activity = 'marigolds' | 'ganga' | 'fountain' | 'wheel' | 'chaat'
export type GameplayResult = { request: number; ok: boolean; message: string; state: GameplayState; event?: GameplayEvent; activity?: Activity }
export const OFFER_POINT = { x: 0, z: 1.15 }
export const LIGHT_POINT = { x: 0, z: 7 }
export const STALL_INTERACT_RADIUS = 2.25, STALL_INTERACT_Z = 14.5
export const EVENT_LIMIT = 24, OFFER_LIFE = 32_000, FIRE_LIFE = 4200, FIRE_COOLDOWN = 8000
export const GOODS: Record<Item, { name: string; description: string; stall: string; x: number; cap: number }> = {
  flower: { name: 'Marigold offering', description: 'A leaf bowl of marigolds. Carry it to the central river steps and offer it to the Ganga.', stall: 'flowers-001', x: -3.2, cap: 3 },
  diya: { name: 'Clay diya', description: 'A glowing clay lamp on a leaf float. Offer it at the central river steps.', stall: 'diya-001', x: -9.6, cap: 3 },
  firecracker: { name: 'Festival spark fountain', description: 'A virtual celebration keepsake. Light it only at the marked central celebration pad.', stall: 'diya-001', x: -9.6, cap: 1 },
  tasting: { name: 'Banarasi tasting stamp', description: 'Enjoy an imagined tamatar chaat tasting and keep a festival stamp. Once per session.', stall: 'food-001', x: 3.2, cap: 1 },
}
export function newGameplay(): GameplayState {
  return { inventory: { flower: 0, diya: 0, firecracker: 0, tasting: 0 }, lastRequest: -1, collectAt: 0, offerAt: 0, lightAt: 0 }
}
export function nearPoint(p: Position, point: Position) { return Math.hypot(p.x - point.x, p.z - point.z) < 1.7 }
export function eventAlive(event: GameplayEvent, now: number) { return now - event.at < (event.item === 'firecracker' ? FIRE_LIFE : OFFER_LIFE) }

// Shared pure rules: solo uses the same limits as the authoritative room owner.
export function applyGameplay(state: GameplayState, action: Action, position: Position, riding: boolean, now: number, events: readonly GameplayEvent[], id: string): GameplayResult {
  const reject = (message: string, next = state): GameplayResult => ({ request: action.request, ok: false, message, state: next })
  if (!Number.isSafeInteger(action.request) || action.request < 0 || action.request <= state.lastRequest) return reject('Already handled; inventory unchanged.')
  const next = { ...state, inventory: { ...state.inventory }, lastRequest: action.request }
  if (!ITEMS.includes(action.item) || !['collect', 'offer', 'light'].includes(action.action)) return reject('Unknown festival action.', next)
  if (riding) return reject('Return to the ghat first.', next)
  const good = GOODS[action.item]
  if (action.action === 'collect') {
    if (Math.hypot(position.x - good.x, position.z - STALL_INTERACT_Z) >= STALL_INTERACT_RADIUS) return reject('Approach the correct stall first.', next)
    if (now < state.collectAt) return reject('Please wait a moment before collecting again.', next)
    if (state.inventory[action.item] >= good.cap) return reject('Collection limit reached. Use your offering before collecting more.', next)
    next.inventory[action.item]++; next.collectAt = now + 1200
    return { request: action.request, ok: true, message: `${good.name} collected. Free in-game gift; no money spent.`, state: next, activity: action.item === 'flower' ? 'marigolds' : action.item === 'tasting' ? 'chaat' : undefined }
  }
  if (action.action === 'offer' && action.item !== 'flower' && action.item !== 'diya' || action.action === 'light' && action.item !== 'firecracker') return reject('This item cannot be used here.', next)
  const lighting = action.action === 'light'
  if (!nearPoint(position, lighting ? LIGHT_POINT : OFFER_POINT)) return reject('Move closer to the marked interaction point.', next)
  if (now < (lighting ? state.lightAt : state.offerAt)) return reject(lighting ? 'Spark fountain cooling down. Wait eight seconds between lights.' : 'Let your previous offering float clear first.', next)
  if (!state.inventory[action.item]) return reject('Collect this item at the bazaar first.', next)
  const live = events.filter(event => eventAlive(event, now))
  if (live.length >= EVENT_LIMIT || lighting && live.filter(event => event.item === 'firecracker').length >= 2) return reject('Celebration is busy. Your item is safe; try shortly.', next)
  next.inventory[action.item]--
  if (lighting) next.lightAt = now + FIRE_COOLDOWN
  else next.offerAt = now + 1200
  const event: GameplayEvent = { id, item: action.item as GameplayEvent['item'], at: now }
  return { request: action.request, ok: true, message: lighting ? 'Spark fountain lit! Watch the central celebration pad.' : `${good.name} offered to the Ganga. Watch it drift downstream.`, state: next, event, activity: lighting ? 'fountain' : 'ganga' }
}

// Noise drift in GangaRiver translates toward -X/+Z. Keep a safe offshore lane
// instead of following its +Z component back into the steps. No real flow is claimed.
export function offeringPose(age: number, reduced = false, target = { x: 0, y: 0, z: 0, yaw: 0, tilt: 0 }) {
  const seconds = Math.max(0, Math.min(OFFER_LIFE / 1000, age / 1000)), release = Math.min(1, seconds / 1.2)
  target.x = OFFER_POINT.x - seconds * .48; target.y = -.085 + (1 - release) * .65 + (reduced ? 0 : Math.sin(seconds * 1.7) * .018)
  target.z = -1.25 - release * 1.1 - seconds * .025; target.yaw = -Math.PI / 2 + (reduced ? 0 : Math.sin(seconds * .35) * .16); target.tilt = reduced ? 0 : Math.sin(seconds * 1.3) * .035
  return target
}
export const FIRE_POSITION = { x: LIGHT_POINT.x, y: groundHeight(LIGHT_POINT.z - 2.2) + .1, z: LIGHT_POINT.z - 2.2 }
