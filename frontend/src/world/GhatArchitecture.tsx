import { useMemo } from 'react'
import { GHAT_WIDTH, groundHeight, OBSTACLES, STEP_DEPTH, STEP_HEIGHT } from './environment'
import { GhatDetails } from './GhatDetails'
import { NearFacades } from './NearFacades'

const sandstone = ['#997866', '#aa8771', '#8c6c61', '#b18c71', '#967463', '#ac8270', '#a38572', '#b8957a']

function Temple({ x, z = 25, base = 2.9, scale = 1, color = '#ad8069', variant = 0 }: { x: number; z?: number; base?: number; scale?: number; color?: string; variant?: number }) {
  const tiers = variant % 3 === 0 ? 5 : variant % 3 === 1 ? 4 : 6
  const finial = 4.65 + (tiers - 1) * 0.58 + 0.38
  return (
    <group position={[x, base, z]} scale={scale}>
      {/* Temple base platform */}
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.6, 3.9]} /><meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Main sanctum (garbhagriha) */}
      <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 4, 3.5]} /><meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Mandapa roof */}
      <mesh position={[0, 4.22, 0]} castShadow>
        <boxGeometry args={[4.3, 0.46, 4]} /><meshStandardMaterial color="#d1ad85" />
      </mesh>
      {/* Shikhara tiers - more detailed */}
      {Array.from({ length: tiers }, (_, tier) => (
        <mesh key={tier} position={[0, 4.65 + tier * 0.58, 0]} castShadow>
          <cylinderGeometry args={[1.5 - tier * 0.22, 1.9 - tier * 0.2, 0.62, 8]} />
          <meshStandardMaterial color={tier % 2 ? '#bb9273' : '#d2ac82'} roughness={0.8} />
        </mesh>
      ))}
      {/* Amalaka (top disk) */}
      <mesh position={[0, finial, 0]}><cylinderGeometry args={[0.65, 0.65, 0.15, 16]} /><meshStandardMaterial color="#e5b66e" metalness={0.5} /></mesh>
      {/* Kalasha (finial) */}
      <mesh position={[0, finial + 0.15, 0]}><sphereGeometry args={[0.19, 8, 6]} /><meshStandardMaterial color="#e5b66e" metalness={0.5} /></mesh>
      <mesh position={[0, finial + 0.27, 0]}><coneGeometry args={[0.12, 0.25, 6]} /><meshStandardMaterial color="#f0c87a" metalness={0.6} /></mesh>
      {/* Entrance porch */}
      <mesh position={[0, 1.35, -1.77]}>
        <boxGeometry args={[1.25, 2.65, 0.05]} /><meshStandardMaterial color="#261c29" />
      </mesh>
      <mesh position={[0, 2.68, -1.8]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.63, 0.12, 5, 16, Math.PI]} /><meshStandardMaterial color="#d9ad7e" />
      </mesh>
      {/* Side niches */}
      {[-1.4, 1.4].map((offset) => (
        <group key={offset} position={[offset, 2.2, -1.79]}>
          <mesh><boxGeometry args={[0.18, 3.5, 0.16]} /><meshStandardMaterial color="#d4b08a" /></mesh>
          <mesh position={[0, 1.5, 0.1]}><sphereGeometry args={[0.2, 6, 5]} /><meshStandardMaterial color="#e8c48a" roughness={0.8} /></mesh>
        </group>
      ))}
      {/* Corner decorative elements */}
      {[-1.6, 1.6].map((cx) => [-1.6, 1.6].map((cz) => (
        <mesh key={`${cx}-${cz}`} position={[cx, 0.6, cz]}>
          <boxGeometry args={[0.15, 1.2, 0.15]} /><meshStandardMaterial color="#c9a068" metalness={0.4} />
        </mesh>
      )))}
    </group>
  )
}

function Lamp({ x, z, height }: { x: number; z: number; height: number }) {
  return (
    <group position={[x, height, z]}>
      <mesh position={[0, 1.45, 0]} castShadow><cylinderGeometry args={[0.07, 0.11, 2.9, 7]} /><meshStandardMaterial color="#51424a" metalness={0.6} /></mesh>
      <mesh position={[0, 2.92, 0]}><octahedronGeometry args={[0.12, 0]} /><meshStandardMaterial color="#fbe0ac" emissive="#d48845" emissiveIntensity={0.75} /></mesh>
      <mesh position={[0, 2.56, 0]}><cylinderGeometry args={[0.23, 0.12, 0.04, 8]} /><meshStandardMaterial color="#ad8668" metalness={0.35} /></mesh>
      <mesh position={[0, 3.18, 0]}><coneGeometry args={[0.35, 0.35, 6]} /><meshStandardMaterial color="#6a5149" /></mesh>
      {/* Lamp decorative base */}
      <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.18, 0.22, 0.3, 8]} /><meshStandardMaterial color="#6b5250" /></mesh>
    </group>
  )
}

export function GhatArchitecture({ quality }: { quality: 'low' | 'medium' | 'high' }) {
  const steps = useMemo(() => Array.from({ length: 7 }, (_, i) => i), [])
  return (
    <group>
      <GhatDetails quality={quality} />
      {steps.map((i) => (
        <group key={i}>
          <mesh receiveShadow position={[0, (i + 1) * STEP_HEIGHT / 2 - 0.05, i * STEP_DEPTH + (i === 6 ? 3 : STEP_DEPTH / 2)]}>
            <boxGeometry args={[GHAT_WIDTH, (i + 1) * STEP_HEIGHT + 0.1, i === 6 ? 6 : STEP_DEPTH]} />
            <meshStandardMaterial color={sandstone[i % sandstone.length]} roughness={0.98} />
          </mesh>
          <mesh position={[0, (i + 1) * STEP_HEIGHT - 0.035, i * STEP_DEPTH + 0.12]}>
            <boxGeometry args={[GHAT_WIDTH, 0.065, 0.24]} /><meshStandardMaterial color="#d2a880" roughness={1} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.85, 23]} castShadow><boxGeometry args={[GHAT_WIDTH, 1, 0.6]} /><meshStandardMaterial color="#805e58" /></mesh>
      {[-31, 31].map((x) => <mesh key={x} position={[x, 2, 11]}><boxGeometry args={[0.5, 5, 25]} /><meshStandardMaterial color="#70565b" /></mesh>)}
      {OBSTACLES.map(({ x, z }) => (
        <group key={x} position={[x, groundHeight(z) + 1.3, z]}>
          <mesh castShadow><cylinderGeometry args={[0.45, 0.52, 2.6, 8]} /><meshStandardMaterial color="#c9a27e" /></mesh>
          <mesh position={[0, 1.43, 0]}><boxGeometry args={[1.2, 0.2, 1.2]} /><meshStandardMaterial color="#e1bc8d" /></mesh>
          <mesh position={[0, 1.85, 0]}><octahedronGeometry args={[0.14, 0]} /><meshStandardMaterial color="#ffe2a2" emissive="#be7936" emissiveIntensity={0.65} /></mesh>
          <mesh position={[0, 1.66, 0]}><boxGeometry args={[0.5, 0.08, 0.5]} /><meshStandardMaterial color="#a47c5e" /></mesh>
        </group>
      ))}
      {[-18, -12, -4, 4, 12].map((x) => <Lamp key={x} x={x} z={7.5} height={groundHeight(7.5)} />)}
      <Lamp x={20} z={10.5} height={groundHeight(10.5)} />
      {[-17, -9, 0, 9, 17].map((x, i) => <Temple key={x} x={x} scale={i % 2 ? 0.8 : 1.15} color={sandstone[i]} variant={i} />)}
      <mesh position={[0, -0.4, -72]}><boxGeometry args={[150, 1.1, 9]} /><meshStandardMaterial color="#273649" /></mesh>
      {[-32, -13, 14, 33].map((x, i) => <Temple key={`far-${x}`} x={x} z={-72} base={0.1} scale={i % 2 ? 1.25 : 1.65} color="#536070" variant={i + 1} />)}
      <NearFacades quality={quality} />
      <mesh position={[0, -0.35, -0.48]} receiveShadow><boxGeometry args={[GHAT_WIDTH, 0.89, 0.87]} /><meshStandardMaterial color="#776964" roughness={0.98} /></mesh>
      <mesh position={[0, 0.07, -0.55]}><boxGeometry args={[GHAT_WIDTH, 0.12, 1.1]} /><meshStandardMaterial color="#c19b7a" roughness={0.87} /></mesh>
    </group>
  )
}
