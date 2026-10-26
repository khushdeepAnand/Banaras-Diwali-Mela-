import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Group, Vector3 } from 'three'
import type { RidePose } from './FerrisWheel'
import type { RidePhase } from './ride'
import { groundHeight } from './environment'
import { PENDULUM, PENDULUM_BOARD, pendulumAngle, pendulumPose } from './pendulum'

export function PendulumRide({ phase, pose, onPhase }: { phase: RidePhase; pose: React.RefObject<RidePose>; onPhase: (phase: RidePhase) => void }) {
  const arm = useRef<Group>(null), platform = useRef<Group>(null)
  const { camera, gl } = useThree()
  const time = useRef(0), transition = useRef(0), previous = useRef<RidePhase>('approaching')
  const look = useRef(new Vector3()), view = useRef(new Vector3())
  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta)
    if (phase !== previous.current) { transition.current = 0; previous.current = phase }
    transition.current += dt
    time.current += dt
    const angle = pendulumAngle(time.current)
    if (arm.current) arm.current.rotation.z = angle
    if (platform.current) platform.current.rotation.z = -angle
    if (phase === 'approaching') return
    const p = pendulumPose(time.current)
    pose.current = { x: p.x, y: p.y + 0.5, z: p.z }
    view.current.set(p.x + 1.2, p.y + 2.7, p.z + 6.2)
    look.current.set(p.x, p.y + 0.5, p.z - 2)
    camera.position.lerp(view.current, 1 - Math.exp(-4 * dt))
    camera.lookAt(look.current)
    gl.domElement.dataset.pendulumAngle = angle.toFixed(3)
    gl.domElement.dataset.pendulumRider = `${p.x.toFixed(2)},${p.y.toFixed(2)}`
    if (phase === 'boarding' && transition.current > 1.3) onPhase('riding')
    if (phase === 'exiting' && transition.current > 0.9) onPhase('approaching')
  })
  const floor = groundHeight(PENDULUM.z)
  return <group name="pendulum-ride" position={[PENDULUM.x, 0, PENDULUM.z]}>
    {[-1.5, 1.5].map(z => <group key={z}>
      {[-2.7, 2.7].map(x => <mesh key={x} position={[x / 2, (floor + PENDULUM.pivotY) / 2, z]} rotation={[0, 0, -Math.atan2(x, PENDULUM.pivotY - floor)]} castShadow>
        <cylinderGeometry args={[0.18, 0.24, Math.hypot(x, PENDULUM.pivotY - floor), 8]} /><meshStandardMaterial color="#ba895a" metalness={0.5} roughness={0.43} />
      </mesh>)}
    </group>)}
    <mesh position={[0, PENDULUM.pivotY, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 3.7, 12]} /><meshStandardMaterial color="#f2c281" metalness={0.6} /></mesh>
    {[-1.56, 1.56].map(z => <mesh key={z} position={[0, PENDULUM.pivotY, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.48, 0.48, 0.11, 14]} /><meshStandardMaterial color="#966171" metalness={0.48} roughness={0.48} /></mesh>)}
    {[-1.5, 1.5].map(z => <mesh key={`cross-${z}`} position={[0, floor + 2.2, z]}><boxGeometry args={[4.1, 0.14, 0.13]} /><meshStandardMaterial color="#98676d" metalness={0.46} roughness={0.5} /></mesh>)}
    <group ref={arm} position={[0, PENDULUM.pivotY, 0]}>
      <mesh position={[0, -PENDULUM.length / 2, 0]} castShadow><boxGeometry args={[0.27, PENDULUM.length, 0.33]} /><meshStandardMaterial color="#e5ae6b" metalness={0.55} roughness={0.37} /></mesh>
      <mesh position={[0, -PENDULUM.length / 2, -0.19]}><boxGeometry args={[0.085, PENDULUM.length * 0.93, 0.06]} /><meshStandardMaterial color="#fff0ba" emissive="#a75d2c" emissiveIntensity={0.36} /></mesh>
      <group ref={platform} position={[0, -PENDULUM.length, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow><boxGeometry args={[3.9, 0.35, 2]} /><meshStandardMaterial color="#823d54" metalness={0.24} roughness={0.5} /></mesh>
        {[-1.4, -0.5, 0.5, 1.4].map(x => <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.78, 0.12, 0.67]} /><meshStandardMaterial color="#f0ba78" /></mesh>
          <mesh position={[0, 0.53, -0.3]}><boxGeometry args={[0.78, 0.65, 0.1]} /><meshStandardMaterial color="#d79565" /></mesh>
          <mesh position={[0, 0.45, 0.3]}><boxGeometry args={[0.7, 0.09, 0.1]} /><meshStandardMaterial color="#f9d793" /></mesh>
          <mesh position={[0, 0.66, 0.03]}><boxGeometry args={[0.64, 0.07, 0.1]} /><meshStandardMaterial color="#ead093" metalness={0.32} roughness={0.45} /></mesh>
        </group>)}
        <mesh position={[0, 0.9, 0]}><boxGeometry args={[4.15, 0.13, 2.2]} /><meshStandardMaterial color="#b87857" /></mesh>
        {[-1.98, 1.98].map(x => <mesh key={x} position={[x, 0.36, 0]}><boxGeometry args={[0.08, 0.87, 2.0]} /><meshStandardMaterial color="#e3b985" metalness={0.35} /></mesh>)}
      </group>
    </group>
    <mesh position={[0, groundHeight(PENDULUM_BOARD.z) + 0.04, PENDULUM_BOARD.z - PENDULUM.z]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.55, 0.69, 24]} /><meshBasicMaterial color="#ffdf96" side={2} /></mesh>
  </group>
}
