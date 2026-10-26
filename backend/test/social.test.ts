import { expect, it } from 'vitest'
import { groupDiya, newDiyaWindow } from '../src/shared/social.js'
it('needs three distinct eligible offers; repeated identity and reconnect never retrigger a window', () => {
  const window = newDiyaWindow()
  expect(groupDiya(window, 'a', 10_000)).toBe(false)
  expect(groupDiya(window, 'a', 11_000)).toBe(false)
  expect(groupDiya(window, 'b', 12_000)).toBe(false)
  expect(groupDiya(window, 'c', 13_000)).toBe(true)
  expect(groupDiya(window, 'c', 14_000)).toBe(false)
  expect(groupDiya(window, 'd', 15_000)).toBe(false)
  expect(groupDiya(window, 'a', 41_000)).toBe(false)
  expect(window.players.size).toBe(1)
})
it('expires old contributors and supports configured thresholds', () => {
  const window = newDiyaWindow()
  expect(groupDiya(window, 'a', 1000, 2, 5000)).toBe(false)
  expect(groupDiya(window, 'b', 6000, 2, 5000)).toBe(false)
  expect(groupDiya(window, 'c', 6001, 2, 5000)).toBe(true)
})
