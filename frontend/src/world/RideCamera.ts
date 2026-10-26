import { useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Group, MathUtils, PerspectiveCamera, Raycaster, Vector3 } from 'three'
import { groundHeight } from './environment'
import { EXIT, type RidePhase, WHEEL } from './ride'
import type { RidePose } from './FerrisWheel'

// Both viewpoints stay behind the rear rim (z=5.8); only the optional panorama
// looks across its plane, and that direction is checked before it is used.
export function marketCamera(pose: RidePose, position: Vector3, look: Vector3, portrait = 0) {
  const rise = MathUtils.smoothstep(pose.y, 4.5, 10)
  const side = (1 - portrait) * (1.3 + 3 * rise)
  const tilt = portrait * 5 * rise
  position.set(pose.x - 2.1 - side, pose.y + 1.15 + (1 - portrait) * 0.1, WHEEL.z + 2.8)
  look.set(pose.x - 16 - side - (1 - portrait) * 0.5 * rise, Math.max(1.8, pose.y - 2.2 - tilt), 15)
}

export function panoramaCamera(pose: RidePose, position: Vector3, look: Vector3, portrait = 0) {
  const rise = MathUtils.smoothstep(pose.y, 4.5, 10)
  const side = (1 - portrait) * (0.9 + 3 * rise)
  const tilt = portrait * 5 * rise
  position.set(pose.x - 6.5 - side, pose.y + 1.15 + (1 - portrait) * 0.1, WHEEL.z + 2.8)
  look.set(pose.x - 22 - side - (1 - portrait) * 0.5 * rise, Math.max(1.8, pose.y - 2.8 - tilt), 5.5)
}

export function useRideCamera(mechanics: React.RefObject<Group | null>) {
  const { camera, size, gl } = useThree()
  const phaseBefore = useRef<RidePhase>('approaching')
  const elapsed = useRef(0)
  const stopElapsed = useRef(0)
  const stopping = useRef(false)
  const checkElapsed = useRef(0.25)
  const scenicClear = useRef(false)
  const scenic = useRef(0)
  const ray = useRef(new Raycaster())
  const start = useRef(new Vector3())
  const startLook = useRef(new Vector3())
  const market = useRef(new Vector3())
  const marketLook = useRef(new Vector3())
  const panorama = useRef(new Vector3())
  const panoramaLook = useRef(new Vector3())
  const desired = useRef(new Vector3())
  const desiredLook = useRef(new Vector3())
  const point = useRef(new Vector3())
  const look = useRef(new Vector3())
  const waypoint = useRef(new Vector3())
  const end = useRef(new Vector3())
  const exitView = useRef(new Vector3())
  const exitLook = useRef(new Vector3())
  const direction = useRef(new Vector3())

  return (phase: RidePhase, pose: RidePose, atStop: boolean, dt: number) => {
    if (phaseBefore.current !== phase) {
      elapsed.current = 0
      stopElapsed.current = 0
      stopping.current = false
      start.current.copy(camera.position)
      camera.getWorldDirection(startLook.current).multiplyScalar(12).add(camera.position)
      phaseBefore.current = phase
    }
    if (phase === 'approaching') return
    elapsed.current += dt
    const portrait = MathUtils.smoothstep(1.3 - size.width / Math.max(1, size.height), 0, 0.85)
    marketCamera(pose, market.current, marketLook.current, portrait)
    panoramaCamera(pose, panorama.current, panoramaLook.current, portrait)

    // A quarter-second check avoids raycasting every frame as the spokes rotate.
    checkElapsed.current += dt
    if (checkElapsed.current >= 0.25) {
      checkElapsed.current = 0
      if (mechanics.current) {
        mechanics.current.updateWorldMatrix(true, true)
        direction.current.subVectors(panoramaLook.current, panorama.current)
        ray.current.set(panorama.current, direction.current.normalize())
        ray.current.far = 25
        scenicClear.current = ray.current.intersectObject(mechanics.current, true).length === 0
      }
    }
    scenic.current = MathUtils.damp(scenic.current,
      scenicClear.current ? 0.78 * MathUtils.smoothstep(pose.y, 4.5, 10) : 0, 2.5, dt)
    desired.current.lerpVectors(market.current, panorama.current, scenic.current)
    desiredLook.current.lerpVectors(marketLook.current, panoramaLook.current, scenic.current)

    // The access lane stays on the z>5.8 side of both rims and the A-frames.
    waypoint.current.set(WHEEL.x - 6.7, 4.8, 10.3)
    end.current.set(WHEEL.x - 6.7, 4.8, WHEEL.z + 2.8)
    if (atStop) {
      if (!stopping.current) {
        start.current.copy(camera.position)
        camera.getWorldDirection(startLook.current).multiplyScalar(12).add(camera.position)
        stopping.current = true
      }
      stopElapsed.current += dt
      exitView.current.set(EXIT.x, groundHeight(EXIT.z) + 3.4, EXIT.z + 5.4)
      exitLook.current.set(EXIT.x, groundHeight(EXIT.z) + 1, EXIT.z)
      if (stopElapsed.current < 0.75) point.current.lerpVectors(start.current, end.current, MathUtils.smoothstep(stopElapsed.current, 0, 0.75))
      else if (stopElapsed.current < 1.5) point.current.lerpVectors(end.current, waypoint.current, MathUtils.smoothstep(stopElapsed.current, 0.75, 1.5))
      else point.current.lerpVectors(waypoint.current, exitView.current, MathUtils.smoothstep(stopElapsed.current, 1.5, 2.2))
      look.current.lerpVectors(startLook.current, exitLook.current, MathUtils.smoothstep(stopElapsed.current, 0, 2.2))
      camera.position.copy(point.current)
    } else if (phase === 'boarding') {
      if (elapsed.current < 0.7) point.current.lerpVectors(start.current, waypoint.current, MathUtils.smoothstep(elapsed.current, 0, 0.7))
      else if (elapsed.current < 1.4) point.current.lerpVectors(waypoint.current, end.current, MathUtils.smoothstep(elapsed.current, 0.7, 1.4))
      else point.current.lerpVectors(end.current, desired.current, MathUtils.smoothstep(elapsed.current, 1.4, 2.1))
      look.current.lerpVectors(startLook.current, desiredLook.current, MathUtils.smoothstep(elapsed.current, 0, 2.1))
      camera.position.copy(point.current)
    } else {
      camera.position.lerp(desired.current, 1 - Math.exp(-4 * dt))
      look.current.copy(desiredLook.current)
    }
    camera.lookAt(look.current)
    if (camera instanceof PerspectiveCamera) {
      // A wider portrait view retains the route and horizon without magnifying passing cabins.
      camera.fov = MathUtils.damp(camera.fov, 65 + portrait * 11, 4, dt)
      camera.updateProjectionMatrix()
    }
    if (checkElapsed.current === 0) {
      gl.domElement.dataset.rideCamera = `${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)}`
      gl.domElement.dataset.rideObstructed = String(!scenicClear.current)
    }
  }
}
