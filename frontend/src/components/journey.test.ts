import { describe, expect, it } from 'vitest'
import { ACTIVITIES, completeActivity, emptyJourney, parseJourney } from './journey'
import { applyGameplay, newGameplay } from '../../../backend/src/shared/gameplay'
import { mirrors } from './rangoli'
describe('local journey trust boundary', () => {
  it('resets only invalid or unknown versions; strips extra fields', () => {
    for (const raw of [null, '{', 'null', '{}', '{"version":0,"completed":["wheel"]}', '{"version":2,"completed":[]}', '{"version":1,"completed":["fake"]}', 'x'.repeat(3000)]) expect(parseJourney(raw)).toEqual(emptyJourney())
    expect(parseJourney('{"version":1,"completed":["wheel","wheel"],"token":"not-persisted"}')).toEqual({ version: 1, completed: ['wheel'] })
  })
  it('round trips all five stamps; duplicate completions preserve identity', () => {
    let state = emptyJourney()
    for (const a of ACTIVITIES) state = completeActivity(state, a.id)
    expect(completeActivity(state, 'wheel')).toBe(state)
    expect(parseJourney(JSON.stringify(state))).toEqual(state)
    expect(state.completed).toHaveLength(5)
  })
  it('only real successful gameplay results carry stamps; replay and distance fail', () => {
    const state = newGameplay()
    expect(applyGameplay(state, { request: 0, action: 'collect', item: 'flower' }, { x: 0, z: 10.5 }, false, 10_000, [], 'a').activity).toBeUndefined()
    const success = applyGameplay(state, { request: 0, action: 'collect', item: 'flower' }, { x: -3.2, z: 14.5 }, false, 10_000, [], 'a')
    expect(success.activity).toBe('marigolds')
    expect(applyGameplay(success.state, { request: 0, action: 'collect', item: 'flower' }, { x: -3.2, z: 14.5 }, false, 12_000, [], 'b').activity).toBeUndefined()
    expect(applyGameplay(state, { request: 0, action: 'collect', item: 'tasting' }, { x: 3.2, z: 14.5 }, false, 10_000, [], 'a')).toMatchObject({ ok: true, activity: 'chaat', state: { inventory: { tasting: 1 } } })
  })
  it('radial brush preserves radius in eight distinct sectors', () => {
    const points = mirrors({ x: .5, y: .2 })
    expect(points).toHaveLength(8)
    for (const p of points) expect(Math.hypot(p.x - .5, p.y - .5)).toBeCloseTo(.3)
    expect(new Set(points.map(p => `${p.x.toFixed(4)},${p.y.toFixed(4)}`)).size).toBe(8)
  })
})
