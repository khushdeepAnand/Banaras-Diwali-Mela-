import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BufferAttribute, BufferGeometry, Color, Object3D, type InstancedMesh, type Mesh, type PointLight, type Points } from 'three'
import { EVENT_LIMIT, FIRE_LIFE, FIRE_POSITION, LIGHT_POINT, OFFER_LIFE, OFFER_POINT, offeringPose } from '../../../backend/src/shared/gameplay'
import type { GameplayVisuals } from '../components/useGameplay'
import { groundHeight } from './environment'

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => { const query = window.matchMedia('(prefers-reduced-motion: reduce)'); const change = () => setReduced(query.matches); query.addEventListener('change', change); return () => query.removeEventListener('change', change) }, [])
  return reduced
}

export function GameplayEffects({ read, quality }: { read: () => GameplayVisuals; quality: 'low' | 'medium' | 'high' }) {
  const reduced = useReducedMotion()
  const bowls = useRef<InstancedMesh>(null), petals = useRef<InstancedMesh>(null), flames = useRef<InstancedMesh>(null)
  const ignitionA = useRef<Mesh>(null), ignitionB = useRef<Mesh>(null), light = useRef<PointLight>(null)
  const sparkPoints = useRef<Points>(null)
  const object = useMemo(() => new Object3D(), []), color = useMemo(() => new Color(), [])
  const pose = useMemo(() => ({ x: 0, y: 0, z: 0, yaw: 0, tilt: 0 }), [])
  const count = reduced ? 16 : quality === 'low' ? 96 : quality === 'medium' ? 160 : 240
  const geometry = useMemo(() => { const result = new BufferGeometry(); result.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3)); return result }, [count])
  const directions = useMemo(() => {
    const result = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) { const angle = i * 2.39996; result[i * 3] = Math.cos(angle) * (.3 + i % 7 / 14); result[i * 3 + 1] = 1.4 + i % 11 / 7; result[i * 3 + 2] = Math.sin(angle) * (.3 + i % 5 / 12) }
    return result
  }, [count])
  useEffect(() => {
    for (let i = 0; i < EVENT_LIMIT; i++) bowls.current?.setColorAt(i, color.set('#ffffff'))
    if (bowls.current?.instanceColor) bowls.current.instanceColor.needsUpdate = true
    return () => geometry.dispose()
  }, [geometry, color])
  useFrame(({ gl }) => {
    if (!bowls.current || !petals.current || !flames.current) return
    if (document.hidden) { if (light.current) light.current.intensity = 0; return }
    const visual = read(), now = Date.now() + visual.offset
    let offered = 0, fountains = 0, intensity = 0
    const positions = geometry.attributes.position as BufferAttribute
    for (let i = 0; i < count * 2; i++) positions.setXYZ(i, 0, -100, 0)
    if (ignitionA.current) ignitionA.current.visible = false
    if (ignitionB.current) ignitionB.current.visible = false
    for (const event of visual.events) {
      const age = now - event.at
      if (age < 0) continue
      if (event.item !== 'firecracker' && age < OFFER_LIFE && offered < EVENT_LIMIT) {
        offeringPose(age, reduced, pose)
        const scale = Math.min(1, (OFFER_LIFE - age) / 2500)
        object.position.set(pose.x, pose.y, pose.z); object.rotation.set(pose.tilt, pose.yaw, pose.tilt); object.scale.setScalar(scale); object.updateMatrix()
        bowls.current.setMatrixAt(offered, object.matrix); bowls.current.setColorAt(offered, color.set(event.item === 'flower' ? '#587a3b' : '#a05034'))
        object.position.y += .16; object.scale.setScalar(event.item === 'diya' ? scale : 0); object.updateMatrix(); flames.current.setMatrixAt(offered, object.matrix)
        for (let petal = 0; petal < 5; petal++) {
          const a = petal * Math.PI * 2 / 5
          object.position.set(pose.x + Math.cos(a) * .11, pose.y + .08, pose.z + Math.sin(a) * .11)
          object.scale.setScalar(event.item === 'flower' ? scale : 0); object.updateMatrix(); petals.current.setMatrixAt(offered * 5 + petal, object.matrix)
        }
        offered++
      } else if (event.item === 'firecracker' && age < FIRE_LIFE && fountains < 2) {
        const ignition = fountains ? ignitionB.current : ignitionA.current
        if (ignition) { ignition.visible = true; ignition.scale.setScalar(age < 900 ? .5 + age / 900 : .7); ignition.position.y = FIRE_POSITION.y + .13 + (age < 900 ? age / 900 * .18 : 0) }
        const duration = (age - 900) / 1000
        if (duration >= 0 && !document.hidden) {
          intensity = Math.max(intensity, reduced ? .12 : Math.max(0, 1 - duration / 3) * .8)
          for (let i = 0; i < count; i++) {
            const phase = (duration + i / count * .8) % 1.1, fade = Math.min(1, Math.max(0, (3.3 - duration) / .7)), spread = reduced ? .16 : 1
            positions.setXYZ(fountains * count + i, FIRE_POSITION.x + directions[i * 3] * phase * spread * fade,
              FIRE_POSITION.y + Math.max(0, directions[i * 3 + 1] * phase - 1.8 * phase * phase) * spread * fade,
              FIRE_POSITION.z + directions[i * 3 + 2] * phase * spread * fade)
          }
        }
        fountains++
      }
    }
    bowls.current.count = offered; petals.current.count = offered * 5; flames.current.count = offered
    bowls.current.visible = petals.current.visible = flames.current.visible = offered > 0
    if (sparkPoints.current) sparkPoints.current.visible = fountains > 0
    bowls.current.instanceMatrix.needsUpdate = true; petals.current.instanceMatrix.needsUpdate = true; flames.current.instanceMatrix.needsUpdate = true
    if (bowls.current.instanceColor) bowls.current.instanceColor.needsUpdate = true
    positions.needsUpdate = true
    if (light.current) { light.current.intensity = intensity; light.current.visible = quality !== 'low' && intensity > 0 }
    gl.domElement.dataset.offerings = String(offered); gl.domElement.dataset.fountains = String(fountains)
  })
  return <group name="festival-gameplay">
    <instancedMesh ref={bowls} args={[undefined, undefined, EVENT_LIMIT]} frustumCulled={false}><cylinderGeometry args={[.24, .18, .07, 10]} /><meshStandardMaterial color="white" roughness={.85} /></instancedMesh>
    <instancedMesh ref={petals} args={[undefined, undefined, EVENT_LIMIT * 5]} frustumCulled={false}><sphereGeometry args={[.105, 6, 4]} /><meshStandardMaterial color="#ffb63e" emissive="#b95b12" emissiveIntensity={.25} /></instancedMesh>
    <instancedMesh ref={flames} args={[undefined, undefined, EVENT_LIMIT]} frustumCulled={false}><coneGeometry args={[.065, .24, 6]} /><meshBasicMaterial color="#ffd282" toneMapped={false} /></instancedMesh>
    <points ref={sparkPoints} visible={false} geometry={geometry} frustumCulled={false}><pointsMaterial color="#ffc66a" size={reduced ? .08 : .11} transparent opacity={reduced ? .45 : .8} depthWrite={false} /></points>
    <pointLight ref={light} visible={false} position={[FIRE_POSITION.x, FIRE_POSITION.y + .6, FIRE_POSITION.z]} color="#ffb85d" intensity={0} distance={4} decay={2} />
    {[ignitionA, ignitionB].map((ref, index) => <mesh key={index} ref={ref} visible={false} position={[FIRE_POSITION.x, FIRE_POSITION.y + .15, FIRE_POSITION.z]}><coneGeometry args={[.08, .28, 6]} /><meshBasicMaterial color="#ffd999" toneMapped={false} /></mesh>)}
    <mesh position={[FIRE_POSITION.x, FIRE_POSITION.y, FIRE_POSITION.z]}><cylinderGeometry args={[.15, .18, .2, 10]} /><meshStandardMaterial color="#aa4937" roughness={.9} /></mesh>
    {[OFFER_POINT, LIGHT_POINT].map((point, index) => <mesh key={index} position={[point.x, groundHeight(point.z) + .025, point.z]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.55, .7, 24]} /><meshBasicMaterial color={index ? '#efaa72' : '#e5c56d'} transparent opacity={.75} depthWrite={false} /></mesh>)}
  </group>
}
