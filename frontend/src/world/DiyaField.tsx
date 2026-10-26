import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, Object3D, type InstancedMesh, type MeshBasicMaterial, type MeshStandardMaterial } from 'three'
import { groundHeight } from './environment'

export type DiyaPosition = readonly [number, number, number]

export function ghatDiyaPositions(quality: 'low' | 'medium' | 'high'): DiyaPosition[] {
  const result: DiyaPosition[] = []
  // An ordered line on each step, with a wider aisle in front of the market.
  for (let row = 0; row < 6; row++) {
    const z = row === 5 ? 14.58 : row * 3 + 0.38
    for (let i = 0; i < 55; i++) {
      if (quality === 'low' && i % 2) continue
      result.push([-20.2 + i * 0.75, groundHeight(z) + 0.055, z])
    }
  }
  // Symmetric edge lights and small, deliberate pairs where routes meet.
  for (const z of [4.6, 7.6, 10.6, 13.6]) {
    for (const x of [-20.6, -19.9, 19.9, 20.6]) result.push([x, groundHeight(z) + 0.055, z])
  }
  for (const [x, z] of [[-14, 9.4], [0, 9.4], [10.5, 9.4], [-13, 12.5], [0, 12.5], [12, 12.5]]) {
    for (const offset of quality === 'low' ? [-0.48, 0.48] : [-0.72, -0.24, 0.24, 0.72]) {
      result.push([x + offset, groundHeight(z) + 0.055, z])
    }
  }
  // Audience edge above the small riverside Aarti dais (platform ends at z=2.8).
  for (const x of quality === 'low' ? [-10.5, -8.5, -6, -3.5, -1.5] : [-10.5, -9.5, -8.5, -7.2, -6, -4.8, -3.5, -2.5, -1.5]) {
    const z = 3.13
    result.push([x, groundHeight(z) + 0.055, z])
  }
  return result
}

export function floatingDiyaPositions(quality: 'low' | 'medium' | 'high'): DiyaPosition[] {
  const result: DiyaPosition[] = []
  const count = quality === 'low' ? 14 : quality === 'medium' ? 22 : 32
  for (let i = 0; i < count; i++) {
    const lane = i % 4
    const baseX = -18.5 + (i * 5.7 % 30) * 1.15
    const baseZ = -3.2 - lane * 2.2 - Math.floor(i / 12) * 1.2
    // Add slight randomization to avoid perfect grid
    const jitterX = (Math.sin(i * 13.7) * 0.5 + 0.5) * 0.6 - 0.3
    const jitterZ = (Math.cos(i * 9.3) * 0.5 + 0.5) * 0.4 - 0.2
    result.push([baseX + jitterX, -0.085, baseZ + jitterZ])
  }
  return result
}

function DiyaInstances({ positions, afloat = false }: { positions: DiyaPosition[]; afloat?: boolean }) {
  const bowls = useRef<InstancedMesh>(null)
  const flames = useRef<InstancedMesh>(null)
  const halos = useRef<InstancedMesh>(null)
  const flameMaterial = useRef<MeshStandardMaterial>(null)
  const haloMaterial = useRef<MeshBasicMaterial>(null)
  const bobElapsed = useRef(0)
  const object = useRef(new Object3D())
  // Precompute per-diya phase offsets for natural variation
  const phaseOffsets = useMemo(() => positions.map((_, i) => ({
    driftPhase: i * 2.34 + Math.sin(i * 7.1) * 0.5,
    floatPhase: i * 1.73 + Math.cos(i * 5.3) * 0.5,
    driftAmp: 0.03 + (i % 7) * 0.005,
    floatAmp: 0.01 + (i % 5) * 0.003,
    spinPhase: i * 0.37,
    spinSpeed: 0.08 + (i % 4) * 0.02,
    flickerPhase: i * 3.11,
    flickerSpeed: 3.8 + (i % 3) * 0.7,
  })), [positions])

  function place(time: number) {
    positions.forEach(([x, y, z], i) => {
      const item = object.current
      const ph = phaseOffsets[i]
      const drift = afloat ? Math.sin(time * 0.38 + ph.driftPhase) * ph.driftAmp : 0
      // Two-frequency bobbing for more natural water movement
      const float = afloat ? (
        Math.sin(time * 1.15 + ph.floatPhase) * ph.floatAmp + 
        Math.sin(time * 0.67 + ph.floatPhase * 1.3) * ph.floatAmp * 0.4
      ) : 0
      // Gentle rotation from water current
      const spin = afloat ? Math.sin(time * 0.15 + ph.spinPhase) * ph.spinSpeed * 0.15 : 0
      
      item.position.set(x + drift, y + float, z)
      item.rotation.z = spin
      item.scale.set(1, 1, 1)
      item.updateMatrix()
      bowls.current?.setMatrixAt(i, item.matrix)
      
      item.position.y = y + float + 0.145
      item.rotation.z = spin + (i % 5 - 2) * 0.065
      item.scale.set(0.76, 0.87 + (i % 4) * 0.08, 0.76)
      item.updateMatrix()
      flames.current?.setMatrixAt(i, item.matrix)
      
      item.rotation.z = spin
      item.position.y = y + float + 0.19
      item.scale.set(0.78, 0.72, 0.78)
      item.updateMatrix()
      halos.current?.setMatrixAt(i, item.matrix)
    })
    for (const mesh of [bowls.current, flames.current, halos.current]) if (mesh) mesh.instanceMatrix.needsUpdate = true
  }

  useEffect(() => {
    const amber = new Color()
    positions.forEach((_, i) => {
      const warm = i % 4 !== 0
      const brightness = 0.85 + (i % 5) * 0.03
      flames.current?.setColorAt(i, amber.set(warm ? '#ffe4a0' : '#ffb960').multiplyScalar(brightness))
    })
    place(0)
    if (flames.current?.instanceColor) flames.current.instanceColor.needsUpdate = true
  }, [positions])

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime
    if (flameMaterial.current) {
      flameMaterial.current.emissiveIntensity = 1.55 + Math.sin(time * 4.3) * 0.18 + Math.sin(time * 7.1) * 0.08
    }
    if (haloMaterial.current) {
      haloMaterial.current.opacity = 0.07 + Math.sin(time * 3.5) * 0.015 + Math.sin(time * 5.2) * 0.008
    }
    bobElapsed.current += delta
    if (afloat && bobElapsed.current >= 0.035) { place(time); bobElapsed.current = 0 }
  })

  return <group>
    <instancedMesh ref={bowls} args={[undefined, undefined, positions.length]} frustumCulled={false}>
      <cylinderGeometry args={[0.135, 0.095, 0.07, 8]} /><meshStandardMaterial color="#a05034" roughness={0.85} />
    </instancedMesh>
    <instancedMesh ref={halos} args={[undefined, undefined, positions.length]} frustumCulled={false}>
      <sphereGeometry args={[0.17, 6, 5]} /><meshBasicMaterial ref={haloMaterial} color="#ffb850" transparent opacity={0.07} depthWrite={false} />
    </instancedMesh>
    <instancedMesh ref={flames} args={[undefined, undefined, positions.length]} frustumCulled={false}>
      <coneGeometry args={[0.058, 0.2, 5]} /><meshStandardMaterial ref={flameMaterial} color="#ffffff" emissive="#ff8a34" emissiveIntensity={1.55} toneMapped={false} />
    </instancedMesh>
  </group>
}

export function DiyaField({ quality }: { quality: 'low' | 'medium' | 'high' }) {
  const steps = useMemo(() => ghatDiyaPositions(quality), [quality])
  const river = useMemo(() => floatingDiyaPositions(quality), [quality])
  return <group><DiyaInstances positions={steps} /><DiyaInstances positions={river} afloat /></group>
}
