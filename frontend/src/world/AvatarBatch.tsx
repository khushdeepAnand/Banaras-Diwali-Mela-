import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Object3D, type InstancedMesh } from 'three'
import { AVATAR_PARTS, KURTA_COLOURS, partVisible } from './avatarParts'
import type { Appearance } from '../../../backend/src/shared/appearance'

export type ActorPose = { x: number; y: number; z: number; heading: number; moving: boolean; appearance: Appearance; scale: number; skin?: number; hidden?: boolean }
const shapes = ['box', 'sphere', 'cylinder'] as const
const grouped = shapes.map(shape => AVATAR_PARTS.filter(p => p.geometry === shape))
const skins = ['#c78f68', '#a67553', '#d39f7c']
export function AvatarBatch({ actors, count }: { actors: React.RefObject<ActorPose[]>; count: number }) {
  const meshes = useRef<(InstancedMesh | null)[]>([])
  const dummy = useMemo(() => new Object3D(), []), color = useMemo(() => new Color(), [])
  const time = useRef(0)
  useFrame((_, delta) => {
    time.current += Math.min(delta, .2)
    for (let shape = 0; shape < shapes.length; shape++) {
      const mesh = meshes.current[shape]
      if (!mesh) continue
      const parts = grouped[shape]
      let written = 0
      for (let i = 0; i < count; i++) {
        const actor = actors.current[i]
        if (actor.hidden) continue
        const sin = Math.sin(actor.heading), cos = Math.cos(actor.heading), stride = actor.moving ? Math.sin(time.current * 8 + i) * .17 : 0
        for (let n = 0; n < parts.length; n++) {
          const p = parts[n], visible = !actor.hidden && partVisible(p, actor.appearance)
          if (!visible) continue
          const offset = (p.limb || 0) * stride, scale = visible ? actor.scale : 0
          dummy.position.set(actor.x + (p.x * cos + (p.z + offset) * sin) * scale, actor.y + p.y * scale, actor.z + (-p.x * sin + (p.z + offset) * cos) * scale)
          dummy.rotation.set(0, actor.heading, p.rz || 0); dummy.scale.set(p.w * scale, p.h * scale, p.d * scale); dummy.updateMatrix()
          const shade = p.shade === 'skin' ? skins[(actor.skin || 0) % skins.length] : p.shade === 'cloth' ? KURTA_COLOURS[actor.appearance.kurta] : p.shade === 'trim' ? '#dfb978' : p.shade === 'hair' ? '#302724' : p.shade === 'pants' ? '#e3d4b6' : p.shade === 'white' ? '#f6eddb' : p.shade === 'ink' ? '#222325' : p.shade === 'lip' ? '#855346' : '#46342d'
          mesh.setMatrixAt(written, dummy.matrix); mesh.setColorAt(written++, color.set(shade))
        }
      }
      mesh.count = written
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  })
  return <group name="shared-festival-characters">
    {shapes.map((shape, i) => <instancedMesh key={shape} ref={mesh => { meshes.current[i] = mesh }} args={[undefined, undefined, count * grouped[i].length]} frustumCulled={false}>
      {shape === 'box' ? <boxGeometry /> : shape === 'sphere' ? <sphereGeometry args={[1, 8, 4]} /> : <cylinderGeometry args={[.85, 1, 1, 8]} />}
      <meshStandardMaterial color="white" roughness={shape === 'sphere' ? .82 : .94} />
    </instancedMesh>)}
  </group>
}
