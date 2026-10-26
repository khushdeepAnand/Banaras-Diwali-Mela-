import { expect, it } from 'vitest'
import { PENDULUM, PENDULUM_EXIT, nearPendulum, pendulumAngle, pendulumPose } from './pendulum'
import { walkable } from './environment'
it('swings symmetrically and exits to walkable ground', () => {
  expect(pendulumAngle(0)).toBe(0)
  expect(pendulumAngle(Math.PI / (2 * 1.32))).toBeCloseTo(0.86)
  expect(pendulumPose(0).y).toBeCloseTo(PENDULUM.pivotY - PENDULUM.length)
  expect(nearPendulum(PENDULUM_EXIT)).toBe(true)
  expect(walkable(PENDULUM_EXIT)).toBe(true)
})
