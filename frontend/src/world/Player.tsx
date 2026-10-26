import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { MathUtils, PerspectiveCamera, Vector3, type Group } from 'three'
import { advance, CAMERA, cameraBlocked, cameraClearance, groundHeight, SPAWN, walkable, type Position } from './environment'
import { BOARD, EXIT, type RidePhase } from './ride'
import type { RidePose } from './FerrisWheel'
import { PENDULUM_EXIT } from './pendulum'
import { BOATS } from './boats'
import type { RoomLink } from '../components/useRoom'
import type { LocalPresence } from './CrowdScene'
import { RIDE_EXIT } from '../../../backend/src/shared/network'
import type { Appearance } from '../../../backend/src/shared/appearance'
import { AvatarBatch, type ActorPose } from './AvatarBatch'
import { PHOTO_PRESETS, type VisitorView } from './visitorView'
import { cameraPointBlocked, clearCameraFraction } from './cameraCollision'

export type GameInput = { x: number; y: number; yaw: number; pitch: number }

export function Player({ input, local, room, appearance, view, active, reset, ride, ridePose, rideKind, onTelemetry }: { input: React.RefObject<GameInput>; local: React.RefObject<LocalPresence>; room: React.RefObject<RoomLink>; appearance: React.RefObject<Appearance>; view: React.RefObject<VisitorView>; active: boolean; reset: number; ride: RidePhase; ridePose: React.RefObject<RidePose>; rideKind: 'wheel' | 'pendulum' | 'ferry' | 'cruise'; onTelemetry: (position: Position, yaw: number, heading: number) => void }) {
  const group = useRef<Group>(null)
  const { camera, size, gl } = useThree()
  const position = useRef<Position>({ ...SPAWN })
  const velocity = useRef({ x: 0, z: 0 })
  const previousReset = useRef(reset)
  const previousRide = useRef<RidePhase>(ride)
  const heading = useRef(0)
  const target = useRef(new Vector3())
  const cameraTarget = useRef(new Vector3(5.7, groundHeight(SPAWN.z) + 4.2, SPAWN.z))
  const cameraCandidate = useRef(new Vector3())
  const telemetryElapsed = useRef(0)
  const eye = useRef(new Vector3())
  const previousView = useRef('none:third')
  const actors = useMemo<{ current: ActorPose[] }>(() => ({ current: [{ x: 0, y: 0, z: 0, heading: 0, moving: false, appearance: appearance.current, scale: 1 }] }), [appearance])

  useFrame((_, frameDelta) => {
    if (!group.current || !input.current) return
    const state = input.current
    const settings = view.current
    const viewKey = `${settings.tool}:${settings.camera}`
    const viewChanged = previousView.current !== viewKey
    previousView.current = viewKey
    actors.current[0].appearance = appearance.current
    group.current.visible = settings.camera !== 'first' || settings.tool === 'wardrobe' || settings.tool === 'photo' || ride !== 'approaching'
    const correction = room.current.correction
    if (correction) {
      if (ride === 'approaching') {
        position.current = correction.ride ? { ...RIDE_EXIT[correction.ride] } : { x: correction.x, z: correction.z }
        if (correction.ride) room.current.send({ type: 'walk' })
        heading.current = correction.heading; velocity.current.x = 0; velocity.current.z = 0
      }
      room.current.correction = null
    }
    const resetting = previousReset.current !== reset
    if (resetting || !walkable(position.current)) {
      position.current = { ...SPAWN }
      velocity.current = { x: 0, z: 0 }
      state.yaw = 0
      state.pitch = 0.26
      heading.current = 0
      group.current.rotation.y = 0
      previousReset.current = reset
      camera.position.set(5.7, 6.4, 14.65)
      cameraTarget.current.set(5.7, groundHeight(SPAWN.z) + 4.2, SPAWN.z)
    }
    if (previousRide.current !== ride) {
      if (!resetting && previousRide.current === 'exiting' && ride === 'approaching') {
        position.current = { ...(rideKind === 'pendulum' ? PENDULUM_EXIT : rideKind === 'ferry' || rideKind === 'cruise' ? BOATS[rideKind].dock : EXIT) }
        velocity.current = { x: 0, z: 0 }
        onTelemetry(position.current, state.yaw, heading.current)
      }
      previousRide.current = ride
    }
    if (ride !== 'approaching') {
      actors.current[0].moving = false
      gl.domElement.dataset.cameraMode = 'ride'
      velocity.current = { x: 0, z: 0 }
      gl.domElement.dataset.playerGround = `${position.current.x.toFixed(2)},${position.current.z.toFixed(2)}`
      group.current.position.set(ridePose.current.x, ridePose.current.y - 0.7, ridePose.current.z + 0.18)
      group.current.scale.setScalar(0.6)
      local.current.x = group.current.position.x; local.current.y = group.current.position.y; local.current.z = group.current.position.z
      telemetryElapsed.current += frameDelta
      if (telemetryElapsed.current >= 0.2) {
        onTelemetry(ridePose.current, state.yaw, group.current.rotation.y)
        room.current.send({ type: 'ridePose', x: group.current.position.x, y: group.current.position.y, z: group.current.position.z, heading: Math.atan2(Math.sin(group.current.rotation.y), Math.cos(group.current.rotation.y)) })
        telemetryElapsed.current = 0
      }
      return
    }
    group.current.scale.setScalar(1)
    // Keep walking close to real time on slow/software GPUs; advance() already
    // subdivides the motion for collision safety.
    const dt = Math.min(frameDelta, 0.2)
    const length = Math.hypot(state.x, state.y)
    const forward = Math.min(1, length)
    const dx = (Math.cos(state.yaw) * state.x - Math.sin(state.yaw) * state.y) / (length || 1)
    const dz = (-Math.sin(state.yaw) * state.x - Math.cos(state.yaw) * state.y) / (length || 1)
    const ease = 1 - Math.exp(-11 * dt)
    velocity.current.x = MathUtils.lerp(velocity.current.x, active ? dx * forward * 4.2 : 0, ease)
    velocity.current.z = MathUtils.lerp(velocity.current.z, active ? dz * forward * 4.2 : 0, ease)
    if (!active) { velocity.current.x = 0; velocity.current.z = 0 }
    const segments = Math.max(1, Math.ceil(Math.hypot(velocity.current.x, velocity.current.z) * dt / 0.12))
    for (let i = 0; i < segments; i++) {
      position.current = advance(position.current, velocity.current.x * dt / segments, velocity.current.z * dt / segments)
    }

    const y = groundHeight(position.current.z)
    group.current.position.set(position.current.x, y, position.current.z)
    local.current.x = position.current.x; local.current.y = y; local.current.z = position.current.z
    const speed = Math.hypot(velocity.current.x, velocity.current.z)
    if (speed > 0.12) {
      heading.current = Math.atan2(-velocity.current.x, -velocity.current.z)
    }
    group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, heading.current, ease)
    local.current.heading = group.current.rotation.y; local.current.moving = speed > 0.12
    actors.current[0].moving = speed > .12
    const special = settings.tool === 'photo' || settings.tool === 'wardrobe'

    if (!special && settings.camera === 'third') {
    // Blend across aspect ratios instead of jumping at a mobile breakpoint.
    const portrait = MathUtils.smoothstep(1.3 - size.width / Math.max(size.height, 1), 0, 0.85)
    const overview = (1 - portrait) * Math.max(0, Math.cos(state.yaw)) *
      (1 - MathUtils.smoothstep(Math.hypot(position.current.x - SPAWN.x, position.current.z - SPAWN.z), 1.5, 5.5))
    const wheelView = MathUtils.smoothstep(9 - Math.hypot(position.current.x - BOARD.x, position.current.z - BOARD.z), 0, 6) * Math.max(0, Math.cos(state.yaw))
    if (camera instanceof PerspectiveCamera) {
      camera.fov = MathUtils.damp(camera.fov, 72 + portrait * 8 + overview * 18 + wheelView * (portrait > 0.5 ? 4 : 7), 5, dt)
      camera.updateProjectionMatrix()
    }
    // Aim slightly into the market when looking towards it, without detaching from the player.
    const marketView = Math.max(0, -Math.cos(state.yaw)) * MathUtils.smoothstep(position.current.z, 10, 14)
    target.current.set(
      position.current.x - MathUtils.clamp(position.current.x, -8, 8) * marketView * portrait * 0.4 + wheelView * 1.7 + Math.max(0, Math.cos(state.yaw)) * (1 - portrait) * 1.1 + overview * 4.6,
      y + 2.5 - portrait * 0.3 + wheelView * (2.4 + portrait * 0.9) + overview * 1.7,
      position.current.z + marketView * (0.4 + portrait * 0.25),
    )
    const distance = 8.2 + portrait * 0.7 + overview
    const candidate = cameraCandidate.current.set(
      position.current.x + Math.sin(state.yaw) * distance + overview * 5.7,
      y + 2.9 + portrait * 0.15 + state.pitch * 3.2 + wheelView * 0.45 + overview * 0.75,
      position.current.z + Math.cos(state.yaw) * distance,
    )
    candidate.x = MathUtils.clamp(candidate.x, CAMERA.minX, CAMERA.maxX)
    candidate.z = MathUtils.clamp(candidate.z, CAMERA.minZ, CAMERA.maxZ)
    candidate.z = Math.min(candidate.z, 14.65 + (1 - overview) * (CAMERA.maxZ - 14.65))
    const safe = cameraClearance({ x: candidate.x, z: candidate.z }, position.current)
    candidate.x = safe.x
    candidate.z = safe.z
    // On the new rear bypass, never follow from inside/through the stall roofs.
    const behindMarket = position.current.z >= 18.7 && Math.abs(position.current.x) < 22
    // The two narrow edge kiosks need a river-side camera rather than a near-vertical view over their canopies.
    if (Math.abs(position.current.x) > 18.2 && Math.abs(position.current.x) < 22 && position.current.z > 12.3 && position.current.z < 18.7) candidate.z = Math.min(candidate.z, position.current.z - 4.1)
    candidate.y = Math.max(candidate.y, groundHeight(candidate.z) + 1.8)
    if (viewChanged) camera.position.copy(candidate)
    else camera.position.lerp(candidate, 1 - Math.exp(-6 * dt))
    if (cameraBlocked({ x: camera.position.x, z: camera.position.z }) || behindMarket && camera.position.z < 18.8) camera.position.copy(candidate)
    camera.position.y = Math.max(camera.position.y, groundHeight(camera.position.z) + 1.8)
    cameraTarget.current.lerp(target.current, 1 - Math.exp(-8 * dt))
    camera.lookAt(cameraTarget.current)
    eye.current.set(position.current.x, y + 1.66, position.current.z)
    camera.position.lerpVectors(eye.current, camera.position, clearCameraFraction(eye.current, camera.position))
    } else {
      const candidate = cameraCandidate.current
      if (special && settings.preset !== 'orbit' && settings.tool === 'photo') {
        const preset = PHOTO_PRESETS[settings.preset]
        target.current.set(preset.target[0], preset.target[1], preset.target[2])
        const zoom = settings.distance / 6
        candidate.set(target.current.x + (preset.eye[0] - target.current.x) * zoom, target.current.y + (preset.eye[1] - target.current.y) * zoom, target.current.z + (preset.eye[2] - target.current.z) * zoom)
        if (cameraPointBlocked(candidate)) candidate.set(preset.eye[0], preset.eye[1], preset.eye[2])
        const dx = target.current.x - candidate.x, dz = target.current.z - candidate.z
        target.current.x = candidate.x + dx * Math.cos(settings.yaw) + dz * Math.sin(settings.yaw)
        target.current.z = candidate.z - dx * Math.sin(settings.yaw) + dz * Math.cos(settings.yaw)
        target.current.y += settings.pitch * 4
        camera.position.copy(candidate)
      } else if (special) {
        const wardrobe = settings.tool === 'wardrobe'
        const offset = wardrobe && size.width >= 650 ? .9 : 0
        target.current.set(position.current.x + Math.cos(settings.yaw) * offset, y + (wardrobe && size.width < 650 ? 0 : 1.1), position.current.z - Math.sin(settings.yaw) * offset)
        candidate.set(position.current.x + Math.sin(settings.yaw) * settings.distance, y + 1.9 + settings.pitch * 3, position.current.z + Math.cos(settings.yaw) * settings.distance)
        candidate.x = MathUtils.clamp(candidate.x, CAMERA.minX, CAMERA.maxX)
        candidate.z = MathUtils.clamp(candidate.z, CAMERA.minZ, CAMERA.maxZ)
        candidate.y = Math.max(candidate.y, groundHeight(candidate.z) + .3)
        eye.current.set(position.current.x, y + 1.66, position.current.z)
        candidate.lerpVectors(eye.current, candidate, clearCameraFraction(eye.current, candidate))
        camera.position.copy(candidate)
      } else {
        candidate.set(position.current.x, y + 1.66, position.current.z)
        if (viewChanged) camera.position.copy(candidate)
        else camera.position.lerp(candidate, 1 - Math.exp(-18 * dt))
        camera.position.y = Math.max(camera.position.y, groundHeight(camera.position.z) + .2)
        target.current.set(position.current.x - Math.sin(state.yaw) * 5, y + 1.66 - state.pitch * 1.8, position.current.z - Math.cos(state.yaw) * 5)
      }
      if (camera instanceof PerspectiveCamera) {
        camera.fov = MathUtils.damp(camera.fov, special ? settings.tool === 'wardrobe' ? 42 : 58 : 76, 10, dt)
        camera.updateProjectionMatrix()
      }
      camera.lookAt(target.current)
      cameraTarget.current.copy(target.current)
    }
    telemetryElapsed.current += dt
    if (telemetryElapsed.current >= 0.2) {
      onTelemetry(position.current, state.yaw, group.current.rotation.y)
      gl.domElement.dataset.cameraMode = special ? settings.tool : settings.camera
      gl.domElement.dataset.cameraPosition = `${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)}`
      gl.domElement.dataset.avatarVisible = String(group.current.visible)
      gl.domElement.dataset.appearance = JSON.stringify(appearance.current)
      room.current.send({ type: 'move', ...position.current, heading: Math.atan2(Math.sin(group.current.rotation.y), Math.cos(group.current.rotation.y)), moving: speed > 0.12 })
      telemetryElapsed.current = 0
    }
  })

  return (
    <group ref={group} position={[SPAWN.x, groundHeight(SPAWN.z), SPAWN.z]}>
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 16]} /><meshBasicMaterial color="#241b2a" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <AvatarBatch actors={actors} count={1} />
    </group>
  )
}
