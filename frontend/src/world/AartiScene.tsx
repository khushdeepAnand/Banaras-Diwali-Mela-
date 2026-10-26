import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Group, Mesh } from 'three'
import { AARTI } from './aarti'
import { groundHeight } from './environment'

function CeremonialLamp() {
  return <group>
    <mesh position={[0, -0.06, 0]}><cylinderGeometry args={[0.055, 0.065, 0.56, 8]} /><meshStandardMaterial color="#d9aa65" metalness={0.55} roughness={0.38} /></mesh>
    <mesh position={[0, -0.34, 0]}><cylinderGeometry args={[0.14, 0.16, 0.08, 9]} /><meshStandardMaterial color="#b7783f" metalness={0.55} roughness={0.35} /></mesh>
    {[0.14, 0.34, 0.52].map((y, i) => <group key={y} position={[0, y, 0]}>
      <mesh><cylinderGeometry args={[0.13 + i * 0.065, 0.065, 0.09, 9]} /><meshStandardMaterial color="#e2b56e" metalness={0.58} roughness={0.35} /></mesh>
      <mesh position={[0, 0.11, 0]}><coneGeometry args={[0.052, 0.18 + i * 0.035, 6]} /><meshStandardMaterial color="#ffe1a3" emissive="#ff8c29" emissiveIntensity={2.8} toneMapped={false} /></mesh>
      {[-0.7, 0.7].map(x => <mesh key={x} position={[x * (0.13 + i * 0.06), -0.03, 0]} rotation={[0, 0, x]}>
        <boxGeometry args={[0.035, 0.07, 0.035]} /><meshStandardMaterial color="#eec283" metalness={0.55} />
      </mesh>)}
    </group>)}
    <mesh position={[0, 0.52, 0]}><sphereGeometry args={[0.32, 8, 6]} /><meshBasicMaterial color="#ffbc69" transparent opacity={0.13} depthWrite={false} /></mesh>
    {/* Decorative base details */}
    <mesh position={[0, -0.45, 0]}><torusGeometry args={[0.18, 0.025, 6, 16]} /><meshStandardMaterial color="#c9a068" metalness={0.5} /></mesh>
  </group>
}

function Priest({ x, index, quality, body, arms, smoke }: {
  x: number; index: number; quality: 'low' | 'medium' | 'high'
  body: React.RefObject<(Group | null)[]>; arms: React.RefObject<(Group | null)[]>; smoke: React.RefObject<(Mesh | null)[]>
}) {
  const dhotiColor = index % 2 ? '#e4ac74' : '#e9c08a'
  const angavastramColor = index === 1 ? '#be563f' : '#bc7149'
  const skinColor = '#b98768'
  return <group position={[x, 0.24, 0]}>
    {/* Platform base */}
    <mesh position={[0, -0.1, 0]} receiveShadow><cylinderGeometry args={[0.63, 0.74, 0.16, 12]} /><meshStandardMaterial color="#c3976f" roughness={1} /></mesh>
    <group ref={(node) => { body.current[index] = node }}>
      {/* Lower body - dhoti */}
      <mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[0.3, 0.38, 0.84, 9]} /><meshStandardMaterial color={dhotiColor} roughness={0.88} /></mesh>
      <mesh position={[0, 0.88, 0]}><cylinderGeometry args={[0.27, 0.34, 0.12, 10]} /><meshStandardMaterial color="#a45f3b" roughness={1} /></mesh>
      {/* Torso */}
      <mesh position={[0, 1.12, 0]}><cylinderGeometry args={[0.23, 0.28, 0.42, 10]} /><meshStandardMaterial color={skinColor} roughness={1} /></mesh>
      {/* Angavastram (upper cloth) */}
      <mesh position={[0, 1.38, 0]}><cylinderGeometry args={[0.28, 0.33, 0.38, 10]} /><meshStandardMaterial color={angavastramColor} roughness={0.85} /></mesh>
      {/* Neck */}
      <mesh position={[0, 1.59, 0]}><cylinderGeometry args={[0.11, 0.14, 0.14, 8]} /><meshStandardMaterial color={skinColor} /></mesh>
      {/* Head */}
      <mesh position={[0, 1.7, 0]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color={skinColor} roughness={1} /></mesh>
      {/* Head covering - turban/pagri */}
      <mesh position={[0, 1.8, 0]}><cylinderGeometry args={[0.17, 0.21, 0.16, 8]} /><meshStandardMaterial color="#433039" /></mesh>
      <mesh position={[0, 1.86, 0]}><torusGeometry args={[0.18, 0.035, 5, 12]} /><meshStandardMaterial color={index === 1 ? '#e7ae7f' : '#eed2ae'} /></mesh>
      {/* Sacred thread (yajnopavita) */}
      <mesh position={[0.08, 1.25, -0.02]} rotation={[0.15, 0, -0.25]}><capsuleGeometry args={[0.025, 0.55, 4, 7]} /><meshStandardMaterial color="#f2c46d" roughness={1} /></mesh>
      {/* Right arm holding lamp */}
      <group ref={(node) => { arms.current[index] = node }} position={[0.25, 1.22, -0.06]}>
        <mesh position={[0.1, -0.15, -0.18]} rotation={[-0.5, 0, -0.3]}><capsuleGeometry args={[0.09, 0.37, 4, 7]} /><meshStandardMaterial color={skinColor} /></mesh>
        <group position={[0.25, -0.4, -0.58]}><CeremonialLamp /></group>
      </group>
      {/* Left arm - folded or at side */}
      <group position={[-0.28, 1.18, 0.02]}>
        <mesh position={[-0.12, -0.15, 0.15]} rotation={[-0.3, 0, 0.35]}><capsuleGeometry args={[0.085, 0.35, 4, 7]} /><meshStandardMaterial color={skinColor} /></mesh>
        <mesh position={[-0.2, -0.45, 0.25]} rotation={[0.2, 0, 0.4]}><capsuleGeometry args={[0.075, 0.25, 4, 7]} /><meshStandardMaterial color={skinColor} /></mesh>
      </group>
      {/* Tilak on forehead */}
      <mesh position={[0, 1.74, 0.17]}><boxGeometry args={[0.06, 0.08, 0.01]} /><meshStandardMaterial color="#e03e2d" /></mesh>
    </group>
    {quality === 'high' && <mesh ref={(node) => { smoke.current[index] = node }} position={[0.55, 2.27, -0.76]}>
      <sphereGeometry args={[0.16, 7, 5]} /><meshBasicMaterial color="#b8b9b5" transparent opacity={0.15} depthWrite={false} />
    </mesh>}
  </group>
}

export function AartiScene({ quality }: { quality: 'low' | 'medium' | 'high' }) {
  const garlands = quality === 'low' ? 15 : quality === 'medium' ? 22 : 28
  const bodies = useRef<(Group | null)[]>([])
  const arms = useRef<(Group | null)[]>([])
  const smoke = useRef<(Mesh | null)[]>([])
  const reduced = useRef(false)
  const { gl } = useThree()
  const telemetry = useRef(0)
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { reduced.current = preference.matches }
    update(); preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime * (reduced.current ? 0.45 : 1)
    arms.current.forEach((arm, index) => {
      if (!arm) return
      // More natural arm movement - sweeping arcs
      arm.rotation.x = -0.15 + Math.sin(time * 0.78 + index * 0.75) * (reduced.current ? 0.08 : 0.32)
      arm.rotation.y = Math.sin(time * 0.55 + index * 1.5) * (reduced.current ? 0.07 : 0.22)
      // Subtle body sway
      if (bodies.current[index]) bodies.current[index]!.rotation.z = Math.sin(time * 0.58 + index * 0.8) * 0.035
      if (smoke.current[index]) {
        smoke.current[index]!.position.y = 2.21 + (time * 0.17 + index * 0.28) % 0.53
        smoke.current[index]!.scale.setScalar(0.8 + (time * 0.17 + index * 0.28) % 0.53)
      }
    })
    telemetry.current += delta
    if (telemetry.current > 0.3) {
      gl.domElement.dataset.aartiMotion = (arms.current[0]?.rotation.x ?? 0).toFixed(3)
      telemetry.current = 0
    }
  })

  return <group name="ganga-aarti" position={[AARTI.x, groundHeight(AARTI.z), AARTI.z]}>
    {/* Main platform */}
    <mesh position={[0, 0.09, 0]} receiveShadow><boxGeometry args={[AARTI.width, 0.18, AARTI.depth]} /><meshStandardMaterial color="#a78c77" roughness={0.92} /></mesh>
    {/* Platform decorative edges */}
    <mesh position={[0, 0.19, -0.16]}><boxGeometry args={[7.65, 0.016, 1.05]} /><meshStandardMaterial color="#7d4651" roughness={0.95} /></mesh>
    <mesh position={[0, 0.21, -0.16]}><boxGeometry args={[7.3, 0.013, 0.85]} /><meshStandardMaterial color="#a65b54" roughness={0.95} /></mesh>
    <mesh position={[0, 0.2, -0.67]}><boxGeometry args={[AARTI.width, 0.08, 0.12]} /><meshStandardMaterial color="#e0b375" /></mesh>
    {/* Platform side pillars */}
    {[-3.9, 3.9].map(x => <mesh key={`dais-${x}`} position={[x, 0.17, 0]}><boxGeometry args={[0.13, 0.08, 1.52]} /><meshStandardMaterial color="#d6ae79" /></mesh>)}
    {/* Canopy supports */}
    {[-3.75, 3.75].map((x) => <group key={x}>
      <mesh position={[x, 1.75, 0.57]}><cylinderGeometry args={[0.08, 0.12, 3.3, 7]} /><meshStandardMaterial color="#755056" /></mesh>
      <mesh position={[x, 3.34, 0.57]}><sphereGeometry args={[0.17, 8, 6]} /><meshStandardMaterial color="#ffc976" emissive="#e58b32" emissiveIntensity={1.1} /></mesh>
      {/* Hanging bell on canopy */}
      <mesh position={[x, 1.6, 0.57]}><sphereGeometry args={[0.06, 6, 5]} /><meshStandardMaterial color="#d4a068" metalness={0.6} /></mesh>
    </group>)}
    {/* Canopy roof */}
    <mesh position={[0, 3.2, 0.55]}><boxGeometry args={[7.7, 0.09, 0.13]} /><meshStandardMaterial color="#ab6a4a" /></mesh>
    <mesh position={[0, 3.53, 0.25]} castShadow><boxGeometry args={[8.18, 0.13, 1.1]} /><meshStandardMaterial color="#7c4451" roughness={0.78} /></mesh>
    <mesh position={[0, 3.59, -0.31]}><boxGeometry args={[8.18, 0.055, 0.065]} /><meshBasicMaterial color="#efbd78" /></mesh>
    {/* Canopy decorative edges */}
    {[-2.6, 0, 2.6].map(x => <mesh key={`roof-${x}`} position={[x, 3.63, 0.22]}><boxGeometry args={[0.1, 0.06, 1.18]} /><meshStandardMaterial color="#e1b575" /></mesh>)}
    {/* Flower garlands - more varied */}
    {Array.from({ length: garlands }, (_, i) => <mesh key={i} position={[-3.55 + i * (7.1 / (garlands - 1)), 3.06 - (i % 3) * 0.06, 0.55]}>
      <sphereGeometry args={[0.095, 6, 5]} /><meshStandardMaterial color={i % 3 === 0 ? '#e3a434' : i % 3 === 1 ? '#f4c253' : '#d48a2a'} emissive="#b2611f" emissiveIntensity={0.3} /></mesh>
    )}
    {/* Three priests */}
    {[-2.35, 0, 2.35].map((x, index) => <Priest key={index} x={x} index={index} quality={quality} body={bodies} arms={arms} smoke={smoke} />)}
    {/* Warm ceremonial lighting */}
    {quality === 'high' ? [
      <pointLight key="left" position={[-2.1, 2.0, -0.7]} color="#ffad57" intensity={5} distance={6} decay={2} />,
      <pointLight key="right" position={[2.1, 2.0, -0.7]} color="#ffad57" intensity={5} distance={6} decay={2} />,
      <pointLight key="center" position={[0, 2.5, -0.5]} color="#ffb864" intensity={3} distance={5} decay={2} />
    ] : <pointLight position={[0, 2.3, -0.5]} color="#ffae64" intensity={5} distance={8} decay={2} />}
    {/* Platform front decorative strip */}
    <mesh position={[0, 0.15, 0.84]}><boxGeometry args={[8.3, 0.04, 0.05]} /><meshBasicMaterial color="#f1c286" /></mesh>
    {/* Brass vessels on platform corners */}
    {[-3.5, 3.5].map(x => <group key={x} position={[x, 0.22, 0]}>
      <mesh><cylinderGeometry args={[0.18, 0.14, 0.35, 8]} /><meshStandardMaterial color="#d4a862" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[0, 0.2, 0]}><torusGeometry args={[0.16, 0.04, 6, 12]} /><meshStandardMaterial color="#e5b87a" metalness={0.6} /></mesh>
    </group>)}
  </group>
}
