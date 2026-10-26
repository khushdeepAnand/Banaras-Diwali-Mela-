import { useEffect, useMemo, useRef } from 'react'
import { Color, Object3D, type InstancedMesh } from 'three'

type Quality = 'low' | 'medium' | 'high'

// Building archetypes for varied silhouettes
const BUILDING_TYPES = [
  { name: 'temple', heightMul: 1.6, widthMul: 1.2, hasShikhara: true, hasDome: false, terrace: false },
  { name: 'haveli', heightMul: 1.2, widthMul: 1.5, hasShikhara: false, hasDome: true, terrace: true },
  { name: 'ghat-house', heightMul: 1.0, widthMul: 1.0, hasShikhara: false, hasDome: false, terrace: true },
  { name: 'tower', heightMul: 1.8, widthMul: 0.8, hasShikhara: false, hasDome: false, terrace: false },
  { name: 'pavilion', heightMul: 0.7, widthMul: 1.3, hasShikhara: false, hasDome: true, terrace: true },
]

// All scenery lies beyond the ±21 walkable strip; no simulated streets or new collision surface.
export function scenicBuildings(quality: Quality) {
  const count = quality === 'low' ? 28 : quality === 'medium' ? 44 : 60
  return Array.from({ length: count }, (_, i) => {
    const bank = i % 2 === 0
    const slot = Math.floor(i / 2)
    const x = bank ? -75 + slot * 5.4 : -73 + slot * 5.35
    const z = bank ? -74 - (slot % 4) * 2.2 : 28 + (slot % 5) * 2.0
    
    // Select building type based on position for visual variety
    const typeIndex = (i * 7 + slot * 3) % BUILDING_TYPES.length
    const type = BUILDING_TYPES[typeIndex]
    
    const baseHeight = 2.8 + (i * 11 % 7) * 0.85
    const height = baseHeight * type.heightMul
    const width = 3.2 + (i % 5) * 0.4
    
    return { 
      x, z, height, width, bank, 
      type: type.name,
      hasShikhara: type.hasShikhara,
      hasDome: type.hasDome,
      hasTerrace: type.terrace,
      colorIndex: i % 7,
      windowRows: quality === 'low' ? 1 : quality === 'medium' ? 2 : 3,
      detailLevel: quality
    }
  })
}

function Facades({ quality }: { quality: Quality }) {
  const buildings = useMemo(() => scenicBuildings(quality), [quality])
  const buildingsMesh = useRef<InstancedMesh>(null)
  const windows = useRef<InstancedMesh>(null)
  const shikharas = useRef<InstancedMesh>(null)
  const domes = useRef<InstancedMesh>(null)
  const terraces = useRef<InstancedMesh>(null)
  
  const lights = useMemo(() => buildings.flatMap((house, index) => {
    const rows = house.windowRows
    return Array.from({ length: rows * 2 }, (_, window) => ({ 
      x: house.x + (window % 2 ? 0.72 : -0.72), 
      y: 1.25 + Math.floor(window / 2) * 1.55, 
      z: house.z + (house.bank ? 2.0 : -2.0), 
      index,
      warm: (index + window) % 4 !== 0
    }))
  }), [buildings, quality])

  const shikharaData = useMemo(() => buildings.flatMap((house, index) => {
    if (!house.hasShikhara) return []
    return [{ x: house.x, y: house.height + 0.8, z: house.z, index, height: 2.5 + (index % 3) * 0.8 }]
  }), [buildings])

  const domeData = useMemo(() => buildings.flatMap((house, index) => {
    if (!house.hasDome) return []
    return [{ x: house.x, y: house.height + 0.5, z: house.z, index, radius: 0.8 + (index % 3) * 0.3 }]
  }), [buildings])

  const terraceData = useMemo(() => buildings.flatMap((house, index) => {
    if (!house.hasTerrace) return []
    return [{ x: house.x, y: house.height - 0.3, z: house.z, index, width: house.width * 1.2 }]
  }), [buildings])

  useEffect(() => {
    const object = new Object3D(), shade = new Color()
    const colors = ['#4a5568', '#5a6171', '#6a6473', '#55667a', '#666473', '#4b6172', '#525c6e', '#5d5568']
    
    buildings.forEach((house, i) => {
      object.position.set(house.x, house.height / 2 - 0.3, house.z)
      object.scale.set(house.width, house.height, 4.0)
      object.updateMatrix()
      buildingsMesh.current?.setMatrixAt(i, object.matrix)
      buildingsMesh.current?.setColorAt(i, shade.set(colors[house.colorIndex]))
    })
    
    lights.forEach((light, i) => {
      object.position.set(light.x, light.y, light.z)
      object.scale.set(0.31, 0.53, 0.04)
      object.updateMatrix()
      windows.current?.setMatrixAt(i, object.matrix)
      windows.current?.setColorAt(i, shade.set(light.warm ? '#ffe4a0' : '#d4a574'))
    })
    
    shikharaData.forEach((s, i) => {
      object.position.set(s.x, s.y + s.height * 0.25, s.z)
      object.scale.set(1, s.height, 1)
      object.rotation.y = (s.index * 0.37) % (Math.PI * 2)
      object.updateMatrix()
      shikharas.current?.setMatrixAt(i, object.matrix)
      shikharas.current?.setColorAt(i, shade.set(colors[(s.index + 2) % colors.length]))
    })
    
    domeData.forEach((d, i) => {
      object.position.set(d.x, d.y, d.z)
      object.scale.set(d.radius * 2, d.radius * 1.2, d.radius * 2)
      object.updateMatrix()
      domes.current?.setMatrixAt(i, object.matrix)
      domes.current?.setColorAt(i, shade.set('#7a6858'))
    })
    
    terraceData.forEach((t, i) => {
      object.position.set(t.x, t.y, t.z)
      object.scale.set(t.width, 0.35, 2.8)
      object.updateMatrix()
      terraces.current?.setMatrixAt(i, object.matrix)
      terraces.current?.setColorAt(i, shade.set('#8a7868'))
    })
    
    for (const mesh of [buildingsMesh.current, windows.current, shikharas.current, domes.current, terraces.current]) {
      if (!mesh) continue
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  }, [buildings, lights, shikharaData, domeData, terraceData])

  return <group name="scenic-bank-facades">
    <instancedMesh ref={buildingsMesh} args={[undefined, undefined, buildings.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" roughness={0.96} />
    </instancedMesh>
    <instancedMesh ref={windows} args={[undefined, undefined, lights.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffffff" />
    </instancedMesh>
    <instancedMesh ref={shikharas} args={[undefined, undefined, shikharaData.length]} frustumCulled={false}>
      <cylinderGeometry args={[0.12, 0.45, 1, 8]} />
      <meshStandardMaterial color="#ffffff" roughness={0.9} />
    </instancedMesh>
    <instancedMesh ref={domes} args={[undefined, undefined, domeData.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial color="#ffffff" roughness={0.85} />
    </instancedMesh>
    <instancedMesh ref={terraces} args={[undefined, undefined, terraceData.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" roughness={0.95} />
    </instancedMesh>
  </group>
}

function RiverfrontTerrace({ side, quality }: { side: -1 | 1; quality: Quality }) {
  const length = quality === 'low' ? 21 : 35
  return <group name="distant-terrace" position={[side * 40, 0, 0]}>
    {[0, 1, 2, 3].map(row => <mesh key={row} position={[0, (row + 1) * 0.28 - 0.12, 1.6 + row * 2.5]} receiveShadow={false}>
      <boxGeometry args={[length, (row + 1) * 0.56, 2.5]} /><meshStandardMaterial color={row % 2 ? '#856c63' : '#9a8071'} roughness={0.98} />
    </mesh>)}
    {Array.from({ length: quality === 'low' ? 5 : 8 }, (_, i) => <group key={i} position={[-length / 2 + 1.3 + i * (length - 2.6) / (quality === 'low' ? 4 : 7), 1.5, 8]}>
      <mesh><cylinderGeometry args={[0.1, 0.13, 1.85, 6]} /><meshStandardMaterial color="#6b5250" /></mesh>
      <mesh position={[0, 1.04, 0]}><octahedronGeometry args={[0.12, 0]} /><meshBasicMaterial color="#e5a866" /></mesh>
    </group>)}
    {[-0.75, 0.75].map((z, i) => <mesh key={i} position={[side * (length * 0.37), 3.4 + i * 1.5, 9 + z]} castShadow={false}>
      <cylinderGeometry args={[0.65 - i * 0.22, 1.1 - i * 0.19, 2, 8]} /><meshStandardMaterial color="#947b72" roughness={0.94} />
    </mesh>)}
    {/* Additional terrace lamps for warm glow */}
    {Array.from({ length: quality === 'low' ? 3 : 6 }, (_, i) => <group key={`lamp-${i}`} position={[-length / 2 + 2 + i * (length - 4) / (quality === 'low' ? 2 : 5), 2.2, 4.5]}>
      <mesh><cylinderGeometry args={[0.06, 0.09, 2.2, 6]} /><meshStandardMaterial color="#6b5250" /></mesh>
      <mesh position={[0, 1.25, 0]}><octahedronGeometry args={[0.1, 0]} /><meshBasicMaterial color="#ffe4a0" /></mesh>
    </group>)}
  </group>
}

function FarBankLights({ quality }: { quality: Quality }) {
  const mesh = useRef<InstancedMesh>(null)
  const count = quality === 'low' ? 42 : 88
  useEffect(() => {
    const object = new Object3D(), color = new Color()
    for (let i = 0; i < count; i++) {
      object.position.set(-84 + i * 168 / (count - 1), 0.37 + (i % 3) * 0.17, -68.1 - (i % 3) * 2.1)
      object.scale.setScalar(1)
      object.updateMatrix()
      mesh.current?.setMatrixAt(i, object.matrix)
      mesh.current?.setColorAt(i, color.set(i % 4 ? '#e6a364' : '#ffd196'))
    }
    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true
      if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    }
  }, [count])
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
    <octahedronGeometry args={[0.075, 0]} /><meshBasicMaterial color="#ffffff" />
  </instancedMesh>
}

export function ScenicRiverfront({ quality }: { quality: Quality }) {
  return <group name="extended-riverfront">
    <Facades quality={quality} />
    <RiverfrontTerrace side={-1} quality={quality} />
    <RiverfrontTerrace side={1} quality={quality} />
    {/* A stepped opposite bank ties the silhouetted city to the waterline. */}
    {[0, 1, 2, 3].map(i => <mesh key={i} position={[0, -0.33 + i * 0.31, -68 - i * 2.15]}>
      <boxGeometry args={[180, 0.52 + i * 0.18, 2.2]} />
      <meshStandardMaterial color={['#626576', '#746775', '#806d75', '#8e7376'][i]} roughness={0.98} />
    </mesh>)}
    <FarBankLights quality={quality} />
  </group>
}
