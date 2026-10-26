import { OBSTACLES, PAVILIONS, PROMENADE_POSTS, STALL_X, groundHeight } from '../../../backend/src/shared/world'

export type Point3 = { x: number; y: number; z: number }
type Volume = { min: Point3; max: Point3 }
const box = (x: number, y: number, z: number, w: number, h: number, d: number): Volume => ({ min: { x: x - w / 2, y: y - h / 2, z: z - d / 2 }, max: { x: x + w / 2, y: y + h / 2, z: z + d / 2 } })
// Deliberate camera envelopes for the existing solid geometry, not per-mesh raycasts.
export const CAMERA_VOLUMES: readonly Volume[] = [
  ...STALL_X.map(x => box(x, 4.7, 16.65, 5.15, 3.9, 3.25)),
  ...[-20.4, 20.4].map(x => box(x, 4.4, 16.65, 2.9, 3.3, 3.0)),
  ...OBSTACLES.map(p => box(p.x, groundHeight(p.z) + 1.6, p.z, 1.3, 3.3, 1.3)),
  ...PROMENADE_POSTS.map(p => box(p.x, 3.2, p.z, .45, 4, .45)),
  ...PAVILIONS.map(p => box(p.x, groundHeight(p.z) + 3.9, p.z, 4.6, 1.3, 4.6)),
  box(-31, 2, 11, .9, 5.5, 25), box(31, 2, 11, .9, 5.5, 25), box(0, 3.85, 23, 62, 1.3, .8),
  ...[-17, -9, 0, 9, 17].map((x, i) => box(x, 7, 25, i % 2 ? 3.8 : 5.2, 9, i % 2 ? 3.8 : 5.2)),
  box(0, 6.28, 15.25, 2.8, .95, .3),
]
function entry(a: Point3, b: Point3, volume: Volume) {
  let near = 0, far = 1
  for (const axis of ['x', 'y', 'z'] as const) {
    const delta = b[axis] - a[axis], min = volume.min[axis] - .12, max = volume.max[axis] + .12
    if (Math.abs(delta) < .00001) { if (a[axis] < min || a[axis] > max) return 1; continue }
    const t0 = (min - a[axis]) / delta, t1 = (max - a[axis]) / delta
    near = Math.max(near, Math.min(t0, t1)); far = Math.min(far, Math.max(t0, t1))
    if (near > far) return 1
  }
  // An eye already inside an envelope must be allowed to leave it, not trapped.
  return near > .001 ? near : 1
}
export function clearCameraFraction(eye: Point3, desired: Point3): number {
  let fraction = 1
  for (const volume of CAMERA_VOLUMES) fraction = Math.min(fraction, entry(eye, desired, volume))
  return Math.max(0, fraction - (fraction < 1 ? .035 : 0))
}
export function cameraPointBlocked(point: Point3): boolean {
  return CAMERA_VOLUMES.some(v => point.x > v.min.x - .12 && point.x < v.max.x + .12 && point.y > v.min.y - .12 && point.y < v.max.y + .12 && point.z > v.min.z - .12 && point.z < v.max.z + .12)
}
