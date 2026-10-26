import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Color, Object3D, SRGBColorSpace, type InstancedMesh } from 'three'
import { BAZAAR_STALLS, STALL_CENTER_Z, kioskStalls, type BazaarStall } from './bazaar'
import type { PublicApplication } from '../components/commerceApi'
import { groundHeight } from './environment'
import { StallGoods } from './StallGoods'

function makeSign(title: string, subtitle: string, trim: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  // Dark background with subtle texture
  ctx.fillStyle = '#1a1620'
  ctx.fillRect(0, 0, 512, 128)
  // Decorative border
  ctx.strokeStyle = trim
  ctx.lineWidth = 4
  ctx.strokeRect(8, 8, 496, 112)
  ctx.lineWidth = 1
  ctx.strokeStyle = '#3a2f3d'
  ctx.strokeRect(12, 12, 488, 104)
  ctx.textAlign = 'center'
  ctx.fillStyle = trim
  const shortTitle = title.trim().replace(/\s+\d{8,}$/, '').slice(0, 22).trim() || 'Festival vendor'
  ctx.font = `bold ${shortTitle.length > 17 ? 37 : 45}px Georgia`
  ctx.fillText(shortTitle, 256, 60, 458)
  // Decorative line under title
  ctx.strokeStyle = trim + '80'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(180, 68)
  ctx.lineTo(332, 68)
  ctx.stroke()
  ctx.font = '16px sans-serif'
  ctx.fillStyle = '#ffe7bd'
  ctx.fillText(subtitle.slice(0, 29).toUpperCase(), 256, 92, 455)
  const result = new CanvasTexture(canvas)
  result.colorSpace = SRGBColorSpace
  return result
}

function StallSign({ stall }: { stall: BazaarStall }) {
  const texture = useMemo(() => makeSign(stall.name, stall.category, stall.trim), [stall])
  useEffect(() => { texture.needsUpdate = true; return () => texture.dispose() }, [texture])
  return <mesh position={[0, 3.12, -1.54]} rotation={[0, Math.PI, 0]}>
    <planeGeometry args={[stall.listing ? 5.4 : 3.45, 0.86]} /><meshBasicMaterial map={texture} toneMapped={false} />
  </mesh>
}

function BazaarEntrance() {
  const texture = useMemo(() => makeSign('DIWALI BAZAAR', 'Explore the market', '#f8c880'), [])
  useEffect(() => { texture.needsUpdate = true; return () => texture.dispose() }, [texture])
  return <group position={[0, groundHeight(16), 15.25]}>
    {[-1.22, 1.22].map((x) => <mesh key={x} position={[x, 1.85, 0]}>
      <boxGeometry args={[0.13, 3.7, 0.13]} /><meshStandardMaterial color="#6d433d" />
    </mesh>)}
    <mesh position={[0, 3.38, 0]}><boxGeometry args={[2.65, 0.85, 0.13]} /><meshStandardMaterial color="#713c44" /></mesh>
    <mesh position={[0, 3.38, -0.075]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[2.5, 0.76]} /><meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  </group>
}

function Vendor({ stall, quality }: { stall: BazaarStall; quality: 'low' | 'medium' | 'high' }) {
  return <group position={[0, 0, 0.42]}>
    {/* Lower garment */}
    <mesh position={[0, 1.2, 0]} castShadow={quality === 'high'}>
      <cylinderGeometry args={[0.3, 0.37, 0.95, 8]} /><meshStandardMaterial color={stall.color} roughness={0.95} />
    </mesh>
    {/* Waist sash */}
    <mesh position={[0, 1.68, 0]}><cylinderGeometry args={[0.33, 0.39, 0.12, 8]} /><meshStandardMaterial color={stall.trim} roughness={0.8} /></mesh>
    {/* Upper body */}
    <mesh position={[0, 1.98, 0]}><cylinderGeometry args={[0.25, 0.3, 0.55, 8]} /><meshStandardMaterial color="#b88361" roughness={0.9} /></mesh>
    {/* Head */}
    <mesh position={[0, 2.33, 0]}><sphereGeometry args={[0.17, 10, 8]} /><meshStandardMaterial color="#b88361" /></mesh>
    {/* Turban */}
    <mesh position={[0, 2.45, 0]}><cylinderGeometry args={[0.19, 0.22, 0.18, 9]} /><meshStandardMaterial color={stall.trim} /></mesh>
    <mesh position={[0, 2.56, 0]}><torusGeometry args={[0.21, 0.035, 5, 12]} /><meshStandardMaterial color="#e8c48a" /></mesh>
    {quality === 'high' && [-0.36, 0.36].map((x) => <mesh key={x} position={[x, 1.36, -0.03]} rotation={[0, 0, x * 0.5]}>
      <capsuleGeometry args={[0.075, 0.36, 3, 6]} /><meshStandardMaterial color="#b88361" />
    </mesh>)}
    {quality === 'high' && [-0.09, 0.09].map((x) => <mesh key={x} position={[x, 2.28, -0.195]}>
      <sphereGeometry args={[0.022, 5, 4]} /><meshBasicMaterial color="#251d25" />
    </mesh>)}
    {/* Small lamp near vendor */}
    <mesh position={[0.35, 1.4, -0.5]}><cylinderGeometry args={[0.05, 0.06, 0.3, 6]} /><meshStandardMaterial color="#c9a068" metalness={0.5} /></mesh>
    <mesh position={[0.35, 1.55, -0.5]}><sphereGeometry args={[0.06, 5, 4]} /><meshBasicMaterial color="#ffe4a0" toneMapped={false} /></mesh>
  </group>
}

function MarketStall({ stall, quality }: { stall: BazaarStall; quality: 'low' | 'medium' | 'high' }) {
  return <group name={stall.id} position={[stall.x, groundHeight(STALL_CENTER_Z), STALL_CENTER_Z]} scale={stall.listing ? [0.52, 0.88, 0.9] : 1}>
    {/* Base platform with stone texture variation */}
    <mesh position={[0, -0.06, 0]} receiveShadow><boxGeometry args={[4.65, 0.1, 2.7]} /><meshStandardMaterial color="#b79177" roughness={1} /></mesh>
    {/* Subtle platform edge detail */}
    <mesh position={[0, -0.01, 1.35]}><boxGeometry args={[4.8, 0.06, 0.12]} /><meshStandardMaterial color="#a07860" roughness={0.9} /></mesh>
    <mesh position={[0, -0.01, -1.35]}><boxGeometry args={[4.8, 0.06, 0.12]} /><meshStandardMaterial color="#a07860" roughness={0.9} /></mesh>
    {/* Back wall */}
    <mesh position={[0, 1.08, 1.23]}><boxGeometry args={[4.4, 2.18, 0.16]} /><meshStandardMaterial color={stall.color} roughness={0.95} /></mesh>
    {/* Wall decorative band */}
    <mesh position={[0, 2.15, 1.24]}><boxGeometry args={[4.5, 0.12, 0.08]} /><meshStandardMaterial color={stall.trim} metalness={0.3} roughness={0.7} /></mesh>
    {/* Support pillars */}
    {[-2.14, 2.14].flatMap((x) => [-1.22, 1.2].map((z) => <mesh key={`${x}-${z}`} position={[x, 1.73, z]} castShadow>
      <cylinderGeometry args={[0.16, 0.18, 3.45, 8]} /><meshStandardMaterial color="#68483d" roughness={1} />
    </mesh>))}
    {/* Roof */}
    <mesh position={[0, 3.45, 0]} castShadow><boxGeometry args={[4.85, 0.14, 2.9]} /><meshStandardMaterial color={stall.trim} roughness={1} /></mesh>
    {/* Roof decorative trim */}
    <mesh position={[0, 3.53, 0]}><boxGeometry args={[4.9, 0.06, 2.95]} /><meshStandardMaterial color="#e8c48a" metalness={0.2} roughness={0.6} /></mesh>
    {/* Roof valance strips */}
    {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[-2.05 + i * 0.59, 3.55, -0.02]} castShadow={quality === 'high'}>
      <boxGeometry args={[0.55, 0.07, 2.88]} /><meshStandardMaterial color={i % 2 ? stall.color : stall.trim} roughness={1} />
    </mesh>)}
    {/* Front valance */}
    {Array.from({ length: 8 }, (_, i) => <mesh key={`valance-${i}`} position={[-2.05 + i * 0.59, 3.08, -1.4]}>
      <boxGeometry args={[0.54, i % 2 ? 0.47 : 0.38, 0.07]} /><meshStandardMaterial color={i % 2 ? stall.color : stall.trim} side={2} />
    </mesh>)}
    {/* Counter top */}
    <mesh position={[0, 0.86, -0.95]} castShadow receiveShadow>
      <boxGeometry args={[4.17, 0.8, 0.76]} /><meshStandardMaterial color="#6b4036" roughness={0.92} />
    </mesh>
    <mesh position={[0, 1.27, -0.95]}><boxGeometry args={[4.35, 0.08, 0.85]} /><meshStandardMaterial color="#bd916c" roughness={0.8} /></mesh>
    {/* Counter front edge */}
    <mesh position={[0, 0.78, -1.35]}><boxGeometry args={[3.8, 0.13, 0.035]} /><meshStandardMaterial color={stall.trim} metalness={0.4} /></mesh>
    <mesh position={[0, 0.31, -1.36]}><boxGeometry args={[2.95, 0.03, 0.045]} /><meshStandardMaterial color={stall.trim} metalness={0.3} roughness={0.54} /></mesh>
    {/* Counter support brackets */}
    {[-1.86, 1.86].map(x => <mesh key={x} position={[x, 1.52, -1.41]}><boxGeometry args={[0.08, 0.75, 0.09]} /><meshStandardMaterial color="#d2a177" roughness={0.78} /></mesh>)}
    {/* Decorative corner brackets */}
    {[-2.0, 2.0].map(x => <mesh key={`bracket-${x}`} position={[x, 1.1, -1.0]}>
      <boxGeometry args={[0.12, 0.12, 0.12]} /><meshStandardMaterial color="#c9a068" metalness={0.5} />
    </mesh>)}
    <StallSign stall={stall} />
    <Vendor stall={stall} quality={quality} />
    <StallGoods kind={stall.kind} quality={quality} />
    {/* Counter diyas - both sides for high quality */}
    {(quality === 'low' ? [-1.95] : [-1.95, 1.95]).map((x) => <group key={`counter-diya-${x}`} position={[x, 1.36, -1.08]}>
      <mesh><cylinderGeometry args={[0.12, 0.08, 0.07, 7]} /><meshStandardMaterial color="#a35a39" /></mesh>
      <mesh position={[0, 0.13, 0]}><coneGeometry args={[0.052, 0.17, 5]} /><meshStandardMaterial color="#ffe1a1" emissive="#ff9a39" emissiveIntensity={2} toneMapped={false} /></mesh>
    </group>)}
    {/* Welcome mat */}
    <mesh position={[0, 0.014, -1.64]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.33, 0.39, 20]} /><meshBasicMaterial color={stall.trim} transparent opacity={0.75} depthWrite={false} />
    </mesh>
    {/* Floor extension */}
    <mesh position={[0, 0.013, -2.19]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[3.55, 0.42]} /><meshStandardMaterial color={stall.color} roughness={1} />
    </mesh>
    {/* Subtle ambient light per stall */}
    {quality === 'high' && <pointLight position={[0, 2.5, -1.2]} color="#ffd4a0" intensity={1.5} distance={4} decay={2} />}
  </group>
}

function Festoon({ quality }: { quality: 'low' | 'medium' | 'high' }) {
  const flowers = useRef<InstancedMesh>(null)
  const bulbs = useRef<InstancedMesh>(null)
  const flowerPositions = useMemo(() => BAZAAR_STALLS.flatMap((stall, stallIndex) =>
    Array.from({ length: quality === 'low' ? 8 : 16 }, (_, n) => {
      const baseX = stall.x - 2 + n * (4 / (quality === 'low' ? 7 : 15))
      const sway = Math.sin((stallIndex + n) * 0.7) * 0.2
      const heightVar = Math.cos(n * 1.3) * 0.15
      return [baseX + sway, 5.5 - Math.sin(n / 15 * Math.PI) * 0.34 + heightVar, 15.17] as const
    })), [quality])
  const bulbPositions = useMemo(() => Array.from({ length: quality === 'low' ? 25 : 49 }, (_, i) => {
    const baseX = -20 + i * (40 / (quality === 'low' ? 24 : 48))
    const sway = Math.sin(i * 0.5) * 0.15
    const heightVar = Math.cos(i * 0.8) * 0.1
    return [baseX + sway, 6.34 - Math.sin(i / (quality === 'low' ? 24 : 48) * Math.PI) * 0.75 + heightVar, 12.7] as const
  }), [quality])

  useEffect(() => {
    const object = new Object3D()
    flowerPositions.forEach(([x, y, z], i) => {
      object.position.set(x, y, z); object.updateMatrix()
      flowers.current?.setMatrixAt(i, object.matrix)
      // More varied flower colors - marigold, jasmine, rose
      const colorVariants = ['#e5a02f', '#efc854', '#f5d06a', '#fff4c0', '#e8b44a', '#f0d87a']
      flowers.current?.setColorAt(i, new Color(colorVariants[i % colorVariants.length]))
    })
    bulbPositions.forEach(([x, y, z], i) => {
      object.position.set(x, y, z); object.updateMatrix()
      bulbs.current?.setMatrixAt(i, object.matrix)
      const bulbColors = ['#ffd18a', '#ffab68', '#ffe4a0', '#ffc870', '#fff0b0']
      bulbs.current?.setColorAt(i, new Color(bulbColors[i % bulbColors.length]))
    })
    for (const mesh of [flowers.current, bulbs.current]) {
      if (!mesh) continue
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  }, [flowerPositions, bulbPositions])

  return <group>
    {/* Additional support posts */}
    {[-19.5, -9.5, 10.5, 20.5].map(x => <mesh key={x} position={[x, 3.5, 12.7]}>
      <cylinderGeometry args={[0.04, 0.05, 3.6, 6]} /><meshStandardMaterial color="#583d3d" />
    </mesh>)}
    <instancedMesh ref={bulbs} args={[undefined, undefined, bulbPositions.length]} frustumCulled={false}>
      <octahedronGeometry args={[0.038, 0]} /><meshBasicMaterial color="#ffffff" />
    </instancedMesh>
    <instancedMesh ref={flowers} args={[undefined, undefined, flowerPositions.length]} frustumCulled={false}>
      <sphereGeometry args={[0.1, 6, 5]} /><meshStandardMaterial color="#ffffff" roughness={1} />
    </instancedMesh>
    <mesh position={[0, 2.44, 14.3]} receiveShadow><boxGeometry args={[42, 0.015, 0.07]} /><meshStandardMaterial color="#e6b580" roughness={1} /></mesh>
  </group>
}

function MarketWalk() {
  const height = groundHeight(13.5) + 0.012
  return <group>
    {/* A quiet cobbled aisle across the stall fronts; all pieces lie below foot level. */}
    {BAZAAR_STALLS.map((stall, i) => <group key={stall.id}>
      <mesh position={[stall.x, height, 13.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.85, 1.9]} />
        <meshStandardMaterial color={i % 2 ? '#aa8166' : '#b58b6e'} roughness={1} />
      </mesh>
      <mesh position={[stall.x, height + 0.005, 13.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.24, 8]} />
        <meshBasicMaterial color={stall.trim} transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </group>)}
    {[-19.2, -12.8, -6.4, 0, 6.4, 12.8, 19.2].map((x) =>
      <mesh key={x} position={[x, height + 0.006, 13.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.035, 1.85]} /><meshBasicMaterial color="#e7bb8a" transparent opacity={0.6} depthWrite={false} />
      </mesh>)}
  </group>
}

export function Bazaar({ quality, listings = [] }: { quality: 'low' | 'medium' | 'high'; listings?: readonly PublicApplication[] }) {
  return <group>
    <MarketWalk />
    <Festoon quality={quality} />
    <BazaarEntrance />
    {BAZAAR_STALLS.map((stall) => <MarketStall key={stall.id} stall={stall} quality={quality} />)}
    {kioskStalls(listings).map((stall) => <MarketStall key={stall.id} stall={stall} quality={quality} />)}
    {quality === 'high' && <pointLight position={[0, 6.5, 14.5]} color="#ffb870" intensity={11} distance={17} decay={2} />}
  </group>
}
