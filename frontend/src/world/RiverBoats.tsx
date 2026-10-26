import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group, Shape, Vector3 } from 'three'
import type { RidePose } from './FerrisWheel'
import type { RidePhase } from './ride'
import { BOATS, boatPosition, type BoatKind } from './boats'
import { groundHeight } from './environment'
import { boatWake } from './waterMotion'

function Boat({ kind, phase, pose, onPhase, quality }: { kind: BoatKind; phase: RidePhase; pose: React.RefObject<RidePose>; onPhase: (phase: RidePhase) => void; quality: 'low' | 'medium' | 'high' }) {
  const config = BOATS[kind]
  const moving = useRef<Group>(null)
  const { camera, gl } = useThree()
  const time = useRef(0), transition = useRef(0), previous = useRef<RidePhase>('approaching')
  const view = useRef(new Vector3()), look = useRef(new Vector3())
  const cruise = kind === 'cruise'
  const hull = useMemo(() => {
    const width = cruise ? 4.35 : 2.65, length = cruise ? 8.7 : 4.85
    return new Shape().moveTo(-width / 2, length / 2).lineTo(width / 2, length / 2)
      .lineTo(width / 2, -length * 0.29).lineTo(width * 0.35, -length * 0.44)
      .lineTo(0, -length / 2).lineTo(-width * 0.35, -length * 0.44).lineTo(-width / 2, -length * 0.29).closePath()
  }, [cruise])
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    if (previous.current !== phase) {
      transition.current = 0
      if (phase === 'boarding' || phase === 'exiting') time.current = 0
      previous.current = phase
    }
    transition.current += dt
    if (phase === 'riding') time.current = (time.current + dt) % config.duration
    const p = boatPosition(kind, time.current)
    boatWake[kind].x = p.x
    boatWake[kind].z = p.z
    if (moving.current) {
      moving.current.position.set(p.x, -0.055 + Math.sin(time.current * 1.5) * 0.025, p.z)
      moving.current.rotation.y = Math.atan2(config.end.x - config.start.x, config.end.z - config.start.z) * (time.current < config.duration / 2 ? 1 : -1)
      moving.current.rotation.z = Math.sin(time.current * 1.7) * 0.017
    }
    if (phase === 'approaching') return
    pose.current = { x: p.x, y: 0.8, z: p.z }
    view.current.set(p.x + (cruise ? -5.5 : 4.5), cruise ? 4.9 : 3.7, p.z + (cruise ? 8 : 7))
    look.current.set(p.x - 2.3, 1.5, p.z - 8)
    camera.position.lerp(view.current, 1 - Math.exp(-3 * dt))
    camera.lookAt(look.current)
    gl.domElement.dataset[kind === 'ferry' ? 'ferryPosition' : 'cruisePosition'] = `${p.x.toFixed(2)},${p.z.toFixed(2)}`
    if (phase === 'boarding' && transition.current > 1.25) onPhase('riding')
    if (phase === 'exiting' && transition.current > 1) onPhase('approaching')
  })
  return <group name={`${kind}-boat`}>
    <group ref={moving} position={[config.start.x, -0.055, config.start.z]}>
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><extrudeGeometry args={[hull, { depth: 0.41, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelThickness: 0.08, bevelSize: 0.075 }]} /><meshStandardMaterial color={cruise ? '#8d434b' : '#80584e'} metalness={0.16} roughness={0.7} /></mesh>
      <mesh position={[0, 0.38, 0]}><boxGeometry args={[cruise ? 4 : 2.34, 0.09, cruise ? 7.5 : 4.05]} /><meshStandardMaterial color="#d1aa7f" roughness={0.8} /></mesh>
      <mesh position={[0, 0.13, 0]}><boxGeometry args={[cruise ? 4.43 : 2.75, 0.035, cruise ? 7.15 : 4.05]} /><meshStandardMaterial color="#e4bb86" metalness={0.25} roughness={0.65} /></mesh>
      {[-1, 1].map(side => <mesh key={side} position={[side * (cruise ? 2.05 : 1.2), 0.58, 0]}><boxGeometry args={[0.12, 0.65, cruise ? 8 : 4.3]} /><meshStandardMaterial color="#ebbc7c" metalness={0.3} /></mesh>)}
      {[-1, 1].map(side => <group key={`rails-${side}`}>
        <mesh position={[side * (cruise ? 2.02 : 1.18), 0.94, 0]}><boxGeometry args={[0.055, 0.05, cruise ? 7.35 : 3.75]} /><meshStandardMaterial color="#edc28a" metalness={0.42} roughness={0.5} /></mesh>
        {Array.from({ length: quality === 'low' ? 3 : 5 }, (_, i) => <mesh key={i} position={[side * (cruise ? 2.02 : 1.18), 0.78, -(cruise ? 3.2 : 1.7) + i * (cruise ? 6.4 : 3.4) / (quality === 'low' ? 2 : 4)]}>
          <cylinderGeometry args={[0.025, 0.025, 0.34, 6]} /><meshStandardMaterial color="#e4bf8d" metalness={0.4} roughness={0.48} />
        </mesh>)}
      </group>)}
      {(cruise ? [-2.7, -0.9, 0.9, 2.7] : [-1.1, 1.1]).map(z => <mesh key={z} position={[0, 0.56, z]}><boxGeometry args={[cruise ? 2.7 : 1.5, 0.28, 0.6]} /><meshStandardMaterial color="#704757" /></mesh>)}
      {[-1, 1].map(side => <group key={`nav-${side}`} position={[side * (cruise ? 1.75 : 0.95), 0.96, -(cruise ? 3.55 : 1.82)]}>
        <mesh><cylinderGeometry args={[0.07, 0.09, 0.1, 6]} /><meshStandardMaterial color="#c9ae88" /></mesh>
        <mesh position={[0, 0.1, 0]}><octahedronGeometry args={[0.07, 0]} /><meshBasicMaterial color={side > 0 ? '#77b99e' : '#dd736e'} /></mesh>
      </group>)}
      {cruise && <>
        {[-3.4, 3.4].map(z => <group key={z}><mesh position={[0, 1.75, z]}><cylinderGeometry args={[0.07, 0.07, 2.4, 6]} /><meshStandardMaterial color="#d6ae79" /></mesh><mesh position={[0, 3, z]}><sphereGeometry args={[0.15, 8, 6]} /><meshBasicMaterial color="#ffd293" /></mesh></group>)}
        <mesh position={[0, 3, 0]}><boxGeometry args={[3.9, 0.09, 7]} /><meshStandardMaterial color="#883e4d" roughness={0.76} /></mesh>
        {[-1.5, -0.5, 0.5, 1.5].map(x => <mesh key={x} position={[x, 3.08, 0]}><boxGeometry args={[0.06, 0.03, 6.8]} /><meshStandardMaterial color="#d8ad75" metalness={0.25} /></mesh>)}
        {quality === 'high' && <pointLight position={[0, 2.3, 0]} color="#ffd093" intensity={1.6} distance={6} />}
      </>}
    </group>
    <group position={[config.dock.x, groundHeight(config.dock.z), config.dock.z]}>
      <mesh position={[0, 0.08, -0.3]}><boxGeometry args={[2.7, 0.16, 1.4]} /><meshStandardMaterial color="#bb926f" /></mesh>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.52, 0.64, 24]} /><meshBasicMaterial color="#ffdc95" side={2} /></mesh>
    </group>
  </group>
}

export function RiverBoats({ quality, kind, phase, pose, onPhase }: { quality: 'low' | 'medium' | 'high'; kind: 'wheel' | 'pendulum' | BoatKind; phase: RidePhase; pose: React.RefObject<RidePose>; onPhase: (phase: RidePhase) => void }) {
  return <>{(['ferry', 'cruise'] as const).map(boat => <Boat key={boat} kind={boat} quality={quality} phase={boat === kind ? phase : 'approaching'} pose={pose} onPhase={onPhase} />)}</>
}
