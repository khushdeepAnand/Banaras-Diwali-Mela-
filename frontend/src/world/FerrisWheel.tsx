import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Group, Object3D, Quaternion, SRGBColorSpace, Vector3, type InstancedMesh } from 'three'
import { groundHeight } from './environment'
import { angleToBottom, gondolaAngle, nearestBottomIndex, type RidePhase, WHEEL } from './ride'
import { useRideCamera } from './RideCamera'

export type RidePose = { x: number; y: number; z: number }

function Beam({ from, to, radius = 0.11, color = '#78535b' }: { from: [number, number, number]; to: [number, number, number]; radius?: number; color?: string }) {
  const a = useMemo(() => new Vector3(...from), [from[0], from[1], from[2]])
  const b = useMemo(() => new Vector3(...to), [to[0], to[1], to[2]])
  const direction = useMemo(() => b.clone().sub(a), [a, b])
  const quaternion = useMemo(() => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize()), [direction])
  return <mesh position={a.clone().add(b).multiplyScalar(0.5)} quaternion={quaternion} castShadow>
    <cylinderGeometry args={[radius, radius, direction.length(), 8]} /><meshStandardMaterial color={color} metalness={0.45} roughness={0.55} />
  </mesh>
}

function Cabin({ index, quality }: { index: number; quality: 'low' | 'medium' | 'high' }) {
  const color = ['#ad614c', '#d7a754', '#497775', '#9e6480'][index % 4]
  return <group name={`gondola-${index}`}>
    <mesh position={[0, -0.7, 0]} castShadow><boxGeometry args={[1.28, 0.13, 1.05]} /><meshStandardMaterial color={color} /></mesh>
    <mesh position={[0, -0.53, 0.3]}><boxGeometry args={[1.15, 0.28, 0.11]} /><meshStandardMaterial color="#f2c88d" /></mesh>
    <mesh position={[0, -0.42, 0.44]}><boxGeometry args={[1.05, 0.12, 0.3]} /><meshStandardMaterial color="#63404a" /></mesh>
    <mesh position={[0, -0.52, -0.16]}><boxGeometry args={[0.96, 0.1, 0.49]} /><meshStandardMaterial color="#9b5751" roughness={0.7} /></mesh>
    <mesh position={[0, -0.2, 0.39]}><boxGeometry args={[1.07, 0.06, 0.06]} /><meshStandardMaterial color="#e7c891" metalness={0.36} roughness={0.52} /></mesh>
    {[-0.6, 0.6].map((x) => <group key={x}>
      <Beam from={[x, -0.67, -0.45]} to={[x, 0.38, -0.45]} radius={0.045} color="#dfc08b" />
      <Beam from={[x, -0.67, 0.45]} to={[x, 0.38, 0.45]} radius={0.045} color="#dfc08b" />
      <mesh position={[x, -0.38, 0]}><boxGeometry args={[0.06, 0.31, 0.85]} /><meshStandardMaterial color="#e9b57d" /></mesh>
    </group>)}
    <mesh position={[0, 0.44, 0]} castShadow><boxGeometry args={[1.38, 0.09, 1.15]} /><meshStandardMaterial color={color} /></mesh>
    <mesh position={[0, 0.49, 0]}><boxGeometry args={[1.19, 0.028, 0.87]} /><meshStandardMaterial color="#efca8c" metalness={0.28} roughness={0.55} /></mesh>
    {quality === 'high' && <mesh position={[0, 0.51, -0.44]}><boxGeometry args={[0.85, 0.08, 0.1]} /><meshBasicMaterial color="#ffe2a2" /></mesh>}
  </group>
}

function Spokes() {
  const instances = useRef<InstancedMesh>(null)
  useEffect(() => {
    const object = new Object3D()
    for (let i = 0; i < WHEEL.gondolas; i++) {
      const angle = -Math.PI / 2 + i * 2 * Math.PI / WHEEL.gondolas
      object.position.set(Math.cos(angle) * WHEEL.radius / 2, Math.sin(angle) * WHEEL.radius / 2, 0)
      object.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(Math.cos(angle), Math.sin(angle), 0))
      object.updateMatrix()
      instances.current?.setMatrixAt(i, object.matrix)
    }
    if (instances.current) instances.current.instanceMatrix.needsUpdate = true
  }, [])
  return <instancedMesh ref={instances} args={[undefined, undefined, WHEEL.gondolas]} castShadow>
    <cylinderGeometry args={[0.062, 0.062, WHEEL.radius, 8]} />
    <meshStandardMaterial color="#e2ba83" metalness={0.4} roughness={0.55} />
  </instancedMesh>
}

export function FerrisWheel({ quality, phase, onPhase, pose, onHeight }: {
  quality: 'low' | 'medium' | 'high'; phase: RidePhase; onPhase: (phase: RidePhase) => void
  pose: React.RefObject<RidePose>; onHeight: (height: number) => void
}) {
  const rotor = useRef<Group>(null)
  const mechanics = useRef<Group>(null)
  const cabins = useRef<(Group | null)[]>([])
  const { gl } = useThree()
  const updateRideCamera = useRideCamera(mechanics)
  const rotation = useRef(0)
  const seat = useRef(0)
  const elapsed = useRef(0)
  const lastPhase = useRef<RidePhase>('approaching')
  const heightElapsed = useRef(0)
  const stopElapsed = useRef(0)
  const sign = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#312639'; ctx.fillRect(0, 0, 256, 128)
    ctx.strokeStyle = '#f6ce8b'; ctx.lineWidth = 5; ctx.strokeRect(5, 5, 246, 118)
    ctx.fillStyle = '#ffe4ab'; ctx.textAlign = 'center'
    ctx.font = 'bold 31px Georgia'; ctx.fillText('FERRIS', 128, 55)
    ctx.fillText('WHEEL', 128, 93)
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [])
  useEffect(() => () => sign.dispose(), [sign])
  const ground = groundHeight(WHEEL.z)
  const selected = phase !== 'approaching'

  useEffect(() => { cabins.current.length = WHEEL.gondolas }, [])
  useFrame((_, frameDelta) => {
    const dt = Math.min(frameDelta, 0.05)
    const rotationDt = Math.min(frameDelta, 0.2)
    if (lastPhase.current !== phase) {
      elapsed.current = 0
      stopElapsed.current = 0
      if (phase === 'boarding') seat.current = nearestBottomIndex(rotation.current)
      lastPhase.current = phase
    }
    // Boarding is a timed transition, not simulated motion: do not stretch it
    // indefinitely when software rendering delivers fewer than 20 frames/s.
    elapsed.current += Math.min(frameDelta, 0.5)
    if (phase === 'approaching' || phase === 'riding') rotation.current += WHEEL.speed * rotationDt
    if (phase === 'exiting') {
      const remaining = angleToBottom(gondolaAngle(rotation.current, seat.current))
      // Accelerate towards the next bottom stop, then hold for the disembark transition.
      if (remaining > 0.025) rotation.current += Math.min(remaining, Math.max(WHEEL.speed, 0.9 * Math.min(1, remaining * 3)) * rotationDt)
      else {
        stopElapsed.current += Math.min(frameDelta, 0.5)
        if (stopElapsed.current > 2.2) onPhase('approaching')
      }
    }
    if (rotor.current) rotor.current.rotation.z = rotation.current
    cabins.current.forEach((cabin) => { if (cabin) cabin.rotation.z = -rotation.current })
    heightElapsed.current += dt
    if (heightElapsed.current > 0.25) {
      gl.domElement.dataset.wheelAngle = rotation.current.toFixed(3)
      if (selected) onHeight(pose.current.y)
      heightElapsed.current = 0
    }
    if (!selected) return
    const angle = gondolaAngle(rotation.current, seat.current)
    pose.current.x = WHEEL.x + Math.cos(angle) * WHEEL.radius
    pose.current.y = WHEEL.centerY + Math.sin(angle) * WHEEL.radius
    pose.current.z = WHEEL.z - 1.45
    if (heightElapsed.current === 0) gl.domElement.dataset.gondola = `${pose.current.x.toFixed(2)},${pose.current.y.toFixed(2)},${pose.current.z.toFixed(2)}`
    const atStop = phase === 'exiting' && angleToBottom(angle) < 0.025
    updateRideCamera(phase, pose.current, atStop, dt)
    if (phase === 'boarding' && elapsed.current >= 2.1) onPhase('riding')
  })

  return <group name="ferris-wheel" position={[WHEEL.x, 0, WHEEL.z]}>
    <group ref={mechanics}>
    {/* Pair of A-frames, cross-bracing and a real depth-wise axle. */}
    {[-0.95, 0.95].map((z) => <group key={z}>
      <Beam from={[-2.55, ground, z]} to={[0, WHEEL.centerY, z]} radius={0.17} />
      <Beam from={[2.55, ground, z]} to={[0, WHEEL.centerY, z]} radius={0.17} />
      <Beam from={[-1.65, ground + 2.1, z]} to={[1.65, ground + 2.1, z]} radius={0.09} />
      {[-2.55, 2.55].map((x) => <mesh key={x} position={[x, ground - 0.09, z]} receiveShadow>
        <boxGeometry args={[0.85, 0.18, 0.85]} /><meshStandardMaterial color="#987967" />
      </mesh>)}
    </group>)}
    <mesh position={[0, WHEEL.centerY, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.22, 0.22, 2.4, 12]} /><meshStandardMaterial color="#dcb578" metalness={0.6} roughness={0.4} />
    </mesh>
    {[-1.06, 1.06].map(z => <group key={`hub-${z}`} position={[0, WHEEL.centerY, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.55, 0.55, 0.09, 14]} /><meshStandardMaterial color="#ae7880" metalness={0.5} roughness={0.45} /></mesh>
      <mesh position={[0, 0, Math.sign(z) * 0.055]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.24, 0.24, 0.075, 12]} /><meshStandardMaterial color="#efcc96" metalness={0.6} roughness={0.36} /></mesh>
    </group>)}
    <group ref={rotor} position={[0, WHEEL.centerY, 0]}>
      {[-0.8, 0.8].map((z) => <group key={z} position={[0, 0, z]}>
        <mesh><torusGeometry args={[WHEEL.radius, 0.13, 8, 72]} /><meshStandardMaterial color="#d5a166" metalness={0.45} roughness={0.5} /></mesh>
        <mesh><torusGeometry args={[WHEEL.radius - 0.65, 0.045, 6, 72]} /><meshStandardMaterial color="#925564" metalness={0.45} /></mesh>
        <mesh><torusGeometry args={[WHEEL.radius - 0.23, 0.032, 5, 72]} /><meshStandardMaterial color="#f0cb91" metalness={0.44} roughness={0.42} /></mesh>
        <mesh><cylinderGeometry args={[0.42, 0.42, 0.25, 12]} /><meshStandardMaterial color="#e1b979" /></mesh>
        <Spokes />
        {Array.from({ length: WHEEL.gondolas }, (_, i) => {
          const angle = -Math.PI / 2 + i * Math.PI * 2 / WHEEL.gondolas
          return <group key={i}>
            <mesh position={[Math.cos(angle) * WHEEL.radius, Math.sin(angle) * WHEEL.radius, 0]}>
              <sphereGeometry args={[0.115, 8, 6]} /><meshBasicMaterial color={i % 2 ? '#ffe1a4' : '#ffac63'} toneMapped={false} />
            </mesh>
          </group>
        })}
      </group>)}
      {Array.from({ length: WHEEL.gondolas }, (_, i) => {
        const angle = -Math.PI / 2 + i * Math.PI * 2 / WHEEL.gondolas
        return <group key={i} position={[Math.cos(angle) * WHEEL.radius, Math.sin(angle) * WHEEL.radius, 0]}>
          <Beam from={[0, 0, -1.45]} to={[0, 0, 0.8]} radius={0.055} color="#e5c28c" />
          <group position={[0, 0, -1.45]} ref={(node) => { cabins.current[i] = node }}><Cabin index={i} quality={quality} /></group>
        </group>
      })}
    </group>
    </group>
    {/* The approach is on the existing z=6–9 terrace, rather than across the river or bazaar aisle. */}
    <mesh position={[0, groundHeight(7.5) + 0.04, 2.7]} receiveShadow>
      <boxGeometry args={[3.7, 0.08, 2.45]} /><meshStandardMaterial color="#ad8469" roughness={1} />
    </mesh>
    {[-1.87, 1.87].map((x) => <group key={x}>
      <Beam from={[x, groundHeight(7.5), 1.75]} to={[x, groundHeight(7.5) + 1.05, 1.75]} radius={0.06} />
      <Beam from={[x, groundHeight(7.5), 3.8]} to={[x, groundHeight(7.5) + 1.05, 3.8]} radius={0.06} />
      <Beam from={[x, groundHeight(7.5) + 0.95, 1.75]} to={[x, groundHeight(7.5) + 0.95, 3.8]} radius={0.045} />
    </group>)}
    <group position={[3.85, groundHeight(7.5), 2.5]}>
      <mesh position={[0, 1.03, 0]} castShadow><boxGeometry args={[1.4, 2.05, 1.15]} /><meshStandardMaterial color="#7c4350" /></mesh>
      <mesh position={[0, 2.13, 0]}><coneGeometry args={[1.15, 0.7, 4]} /><meshStandardMaterial color="#e7b270" /></mesh>
      <mesh position={[0, 1.48, 0.59]}><planeGeometry args={[1.18, 0.62]} /><meshBasicMaterial map={sign} toneMapped={false} /></mesh>
      <mesh position={[0, 0.88, 0.6]}><boxGeometry args={[1.1, 0.13, 0.3]} /><meshStandardMaterial color="#e5c18c" /></mesh>
    </group>
    <mesh position={[0, groundHeight(8.35) + 0.025, 3.35]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.55, 0.64, 24]} /><meshBasicMaterial color="#ffdb9b" transparent opacity={0.85} depthWrite={false} />
    </mesh>
  </group>
}
