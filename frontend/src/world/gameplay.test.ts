import { describe, expect, it } from 'vitest'
import { applyGameplay, eventAlive, EVENT_LIMIT, FIRE_COOLDOWN, FIRE_LIFE, GOODS, ITEMS, LIGHT_POINT, newGameplay, OFFER_LIFE, OFFER_POINT, offeringPose, type GameplayEvent } from '../../../backend/src/shared/gameplay'
import { clearSegment, walkable } from '../../../backend/src/shared/world'

describe('session festival gifts', () => {
  it('collects only at the right stall, caps gifts and debounces repeat inputs', () => {
    const state = newGameplay(), action = { request: 0, action: 'collect' as const, item: 'flower' as const }
    expect(applyGameplay(state, action, OFFER_POINT, false, 1000, [], 'a').ok).toBe(false)
    let current = state
    for (let i = 0; i < 4; i++) {
      const result = applyGameplay(current, { ...action, request: i }, { x: -3.2, z: 14.5 }, false, 1000 + i * 1200, [], 'a')
      expect(result.ok).toBe(i < 3); current = result.state
    }
    expect(current.inventory.flower).toBe(3)
    const first = applyGameplay(state, action, { x: -3.2, z: 14.5 }, false, 1000, [], 'a')
    expect(applyGameplay(first.state, { ...action, request: 1 }, { x: -3.2, z: 14.5 }, false, 1100, [], 'b').state.inventory.flower).toBe(1)
    expect(state.inventory.flower).toBe(0)
  })
  it('consumes only a successful offering and makes duplicate requests harmless', () => {
    const state = newGameplay(); state.inventory.flower = 2
    const action = { request: 0, action: 'offer' as const, item: 'flower' as const }
    for (const [position, riding] of [[{ x: 0, z: 10 }, false], [OFFER_POINT, true]] as const) expect(applyGameplay(state, action, position, riding, 2000, [], 'a').state.inventory.flower).toBe(2)
    const result = applyGameplay(state, action, OFFER_POINT, false, 2000, [], 'a')
    expect(result.ok).toBe(true); expect(result.state.inventory.flower).toBe(1); expect(result.event?.item).toBe('flower')
    expect(applyGameplay(result.state, action, OFFER_POINT, false, 5000, [], 'b').event).toBeUndefined()
    expect(applyGameplay(result.state, { ...action, request: 1 }, OFFER_POINT, false, 2100, [], 'b').state.inventory.flower).toBe(1)
    expect(applyGameplay(newGameplay(), action, OFFER_POINT, false, 2000, [], 'a').ok).toBe(false)
  })
  it('accepts diya and rejects wrong item/action combinations without consumption', () => {
    const state = newGameplay(); for (const item of ITEMS) state.inventory[item] = 1
    expect(applyGameplay(state, { request: 0, action: 'offer', item: 'diya' }, OFFER_POINT, false, 1000, [], 'a').state.inventory.diya).toBe(0)
    for (const item of ['tasting', 'firecracker'] as const) expect(applyGameplay(state, { request: 0, action: 'offer', item }, OFFER_POINT, false, 1000, [], 'a').ok).toBe(false)
    expect(applyGameplay(state, { request: 0, action: 'light', item: 'flower' }, LIGHT_POINT, false, 1000, [], 'a').ok).toBe(false)
  })
  it('enforces fountain cooldown and room event limits before consuming', () => {
    const state = newGameplay(); state.inventory.firecracker = 1
    const action = { request: 0, action: 'light' as const, item: 'firecracker' as const }
    const result = applyGameplay(state, action, LIGHT_POINT, false, 1000, [], 'a')
    expect(result.ok).toBe(true); expect(result.state.lightAt).toBe(1000 + FIRE_COOLDOWN)
    result.state.inventory.firecracker = 1
    expect(applyGameplay(result.state, { ...action, request: 1 }, LIGHT_POINT, false, 8999, [], 'b').ok).toBe(false)
    expect(applyGameplay(result.state, { ...action, request: 1 }, LIGHT_POINT, false, 9000, [], 'b').ok).toBe(true)
    const events: GameplayEvent[] = [{ id: '1', item: 'firecracker', at: 1000 }, { id: '2', item: 'firecracker', at: 1000 }]
    expect(applyGameplay(state, action, LIGHT_POINT, false, 1100, events, 'b').state.inventory.firecracker).toBe(1)
    const full = Array.from({ length: EVENT_LIMIT }, (_, i): GameplayEvent => ({ id: String(i), item: 'flower', at: 1000 }))
    expect(applyGameplay(state, action, LIGHT_POINT, false, 1100, full, 'b').ok).toBe(false)
    expect(applyGameplay(state, action, LIGHT_POINT, false, OFFER_LIFE + 1000, full, 'b').ok).toBe(true)
    expect(eventAlive(events[0], 1000 + FIRE_LIFE)).toBe(false)
  })
  it('keeps downstream poses offshore, finite, smooth, bounded and distinct from decorative lamps', () => {
    let previous = offeringPose(0)
    for (let age = 50; age <= OFFER_LIFE; age += 50) {
      const pose = offeringPose(age)
      expect(Object.values(pose).every(Number.isFinite)).toBe(true)
      expect(pose.x).toBeLessThan(previous.x); expect(pose.z).toBeLessThanOrEqual(-1.25)
      expect(pose.x).toBeGreaterThan(OFFER_POINT.x - 16); expect(pose.y).toBeGreaterThan(-.14)
      expect(Math.hypot(pose.x - previous.x, pose.y - previous.y, pose.z - previous.z)).toBeLessThan(.1)
      previous = pose
    }
    expect(offeringPose(5000, true).tilt).toBe(0)
    for (const point of [LIGHT_POINT, OFFER_POINT, ...ITEMS.map(item => ({ x: GOODS[item].x, z: 14.5 }))]) expect(walkable(point)).toBe(true)
    expect(clearSegment(LIGHT_POINT, OFFER_POINT)).toBe(true)
  })
})
