import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, MathUtils, SRGBColorSpace } from 'three'
import { groundHeight, type Position } from './environment'
import type { RoomLink } from '../components/useRoom'
import { BEGGARS, makeCrowd, NPC_COUNTS, tickCrowd } from './crowd'
import type { RideKind } from '../../../backend/src/shared/network'
import { DEFAULT_APPEARANCE, KURTAS, type Appearance } from '../../../backend/src/shared/appearance'
import { AvatarBatch, type ActorPose } from './AvatarBatch'

type Pose = Position & { y: number; heading: number; moving: boolean; id: string; ride: RideKind | null; appearance: Appearance }
export type LocalPresence = Position & { y: number; heading: number; moving: boolean }
const hidden = { x: 0, y: -100, z: 0, heading: 0, moving: false, id: '', ride: null, appearance: DEFAULT_APPEARANCE }
export function Crowd({ quality, local, room }: { quality: 'low' | 'medium' | 'high'; local: React.RefObject<LocalPresence>; room: React.RefObject<RoomLink> }) {
  const npcs = useMemo(() => makeCrowd(NPC_COUNTS[quality]), [quality])
  const remote = useRef<Pose[]>(Array.from({ length: 3 }, () => ({ ...hidden })))
  const { gl } = useThree()
  const slots = npcs.length + BEGGARS.length + 3
  const actors = useMemo(() => ({ current: Array.from({ length: slots }, (_, i): ActorPose => ({ x: 0, y: -100, z: 0, heading: 0, moving: false, scale: 1, skin: i % 3, appearance: { ...DEFAULT_APPEARANCE, kurta: KURTAS[i % KURTAS.length], accessory: 'none', outfit: i % 3 === 0 ? 'waistcoat' : 'kurta' } })) }), [slots])
  const elapsed = useRef(0), ai = useRef(0), telemetry = useRef(0)
  const people = useRef<Position[]>([local.current])
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 80
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#142d36'; ctx.fillRect(0, 0, 256, 80); ctx.fillStyle = '#ffe0a4'; ctx.textAlign = 'center'
    ctx.font = 'bold 22px sans-serif'; ctx.fillText('Optional support', 128, 34); ctx.font = '17px sans-serif'; ctx.fillText('Approach to donate', 128, 62)
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace; return result
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.2); elapsed.current += dt; ai.current += dt; telemetry.current += dt
    let remotes = 0
    for (const visitor of room.current.visitors) {
      if (visitor.id === room.current.self?.id || remotes >= 3) continue
      const pose = remote.current[remotes++]
      if (pose.id !== visitor.id) Object.assign(pose, visitor)
      else {
        pose.x = MathUtils.damp(pose.x, visitor.x, 10, dt); pose.z = MathUtils.damp(pose.z, visitor.z, 10, dt); pose.y = MathUtils.damp(pose.y, visitor.y, 10, dt)
        pose.heading += Math.atan2(Math.sin(visitor.heading - pose.heading), Math.cos(visitor.heading - pose.heading)) * (1 - Math.exp(-10 * dt))
        pose.moving = visitor.moving
        pose.ride = visitor.ride
        pose.appearance = visitor.appearance
      }
    }
    for (let i = remotes; i < 3; i++) Object.assign(remote.current[i], hidden)
    if (ai.current >= 0.1) {
      people.current.length = 0; people.current.push(local.current)
      for (const beggar of BEGGARS) people.current.push(beggar)
      for (let i = 0; i < remotes; i++) people.current.push(remote.current[i])
      tickCrowd(npcs, Math.min(ai.current, 0.2), people.current); ai.current = 0
    }
    for (let i = 0; i < npcs.length; i++) Object.assign(actors.current[i], npcs[i], { y: groundHeight(npcs[i].z) })
    for (let i = 0; i < BEGGARS.length; i++) {
      const actor = actors.current[npcs.length + i], beggar = BEGGARS[i]
      Object.assign(actor, beggar, { y: groundHeight(beggar.z), moving: false })
      actor.appearance.kurta = 'teal'; actor.appearance.accessory = 'stole'
    }
    for (let i = 0; i < 3; i++) Object.assign(actors.current[npcs.length + BEGGARS.length + i], remote.current[i], { hidden: i >= remotes, scale: remote.current[i].ride ? .6 : 1 })
    if (telemetry.current > 0.2) {
      // Observability follows the actual interpolated render poses, not a mocked room.
      gl.domElement.dataset.visitors = JSON.stringify(remote.current.slice(0, remotes))
      gl.domElement.dataset.guestId = room.current.self?.id || ''
      gl.domElement.dataset.npcs = JSON.stringify(npcs.map(p => ({ id: p.id, x: p.x, z: p.z, moving: p.moving })))
      telemetry.current = 0
    }
  })
  return <group name="visitors-and-independent-crowd">
    <AvatarBatch actors={actors} count={slots} />
    {BEGGARS.map(b => <group key={b.id} position={[b.x, groundHeight(b.z), b.z]}>
      <mesh position={[0, 2.25, 0]}><planeGeometry args={[1.9, 0.6]} /><meshBasicMaterial map={texture} side={2} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}><ringGeometry args={[0.5, 0.56, 16]} /><meshBasicMaterial color="#d7bd84" /></mesh>
    </group>)}
  </group>
}
