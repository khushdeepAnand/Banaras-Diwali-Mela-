import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Color, Object3D, SRGBColorSpace, type InstancedMesh } from 'three'
import { groundHeight, PAVILIONS, PROMENADE_POSTS } from './environment'
import { PATHS } from './navigation'

type Block = { x: number; y: number; z: number; w: number; h: number; d: number; color: string }
function Blocks({ blocks, glow = false }: { blocks: readonly Block[]; glow?: boolean }) {
  const mesh = useRef<InstancedMesh>(null)
  useEffect(() => {
    if (!mesh.current) return
    const o = new Object3D(), color = new Color()
    blocks.forEach((b, i) => {
      o.position.set(b.x, b.y, b.z); o.scale.set(b.w, b.h, b.d); o.updateMatrix()
      mesh.current!.setMatrixAt(i, o.matrix); mesh.current!.setColorAt(i, color.set(b.color))
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [blocks])
  return <instancedMesh ref={mesh} args={[undefined, undefined, blocks.length]} receiveShadow={!glow}>
    <boxGeometry />
    {glow ? <meshBasicMaterial color="white" /> : <meshStandardMaterial color="white" roughness={0.93} />}
  </instancedMesh>
}

function WayfindingSign({ x, z, title, route }: { x: number; z: number; title: string; route: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 192
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#192b3c'; ctx.fillRect(0, 0, 512, 192)
    ctx.strokeStyle = '#e5b978'; ctx.lineWidth = 6; ctx.strokeRect(8, 8, 496, 176)
    ctx.fillStyle = '#ffe0a4'; ctx.textAlign = 'center'; ctx.font = 'bold 35px Georgia'; ctx.fillText(title, 256, 75, 470)
    ctx.font = '23px sans-serif'; ctx.fillText(route, 256, 130, 470)
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace; return result
  }, [title, route])
  useEffect(() => () => texture.dispose(), [texture])
  return <group position={[x, groundHeight(z) + 3, z]}>
    {[-1.4, 1.4].map(dx => <mesh key={dx} position={[dx, -1.1, 0]}><boxGeometry args={[0.12, 3.8, 0.12]} /><meshStandardMaterial color="#735843" /></mesh>)}
    <mesh><boxGeometry args={[4.2, 1.6, 0.12]} /><meshStandardMaterial color="#593d35" /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[0, 0, side * 0.07]} rotation={[0, side < 0 ? Math.PI : 0, 0]}>
      <planeGeometry args={[4, 1.5]} /><meshBasicMaterial map={texture} />
    </mesh>)}
  </group>
}

export function FestivalPromenades({ quality }: { quality: 'low' | 'medium' | 'high' }) {
  const { stone, lamps } = useMemo(() => {
    const stone: Block[] = [], lamps: Block[] = []
    const add = (x: number, z: number, w: number, h: number, d: number, y: number, color = '#b99976') => stone.push({ x, z, w, h, d, y, color })
    PATHS.forEach(path => path.slice(1).forEach((end, i) => {
      const start = path[i], distance = Math.hypot(end.x - start.x, end.z - start.z), count = Math.ceil(distance / 0.9)
      for (let j = 0; j < count; j++) {
        const t = (j + 0.5) / count, x = start.x + (end.x - start.x) * t, z = start.z + (end.z - start.z) * t
        add(x, z, end.x === start.x ? 0.35 : distance / count * 0.8, 0.012, end.z === start.z ? 0.35 : distance / count * 0.8, groundHeight(z) + 0.025, '#dbc19a')
      }
    }))
    PROMENADE_POSTS.forEach(p => {
      const h = groundHeight(PAVILIONS[0].z) + 3.4 - groundHeight(p.z)
      add(p.x, p.z, 0.28, h, 0.28, groundHeight(p.z) + h / 2)
    })
    PAVILIONS.forEach(p => {
      const y = groundHeight(p.z)
      add(p.x, p.z, 4.3, 0.22, 4.3, y + 3.45, '#d4ac80')
      for (const dx of [-1.4, 0, 1.4]) lamps.push({ x: p.x + dx, z: p.z, y: y + 3.18, w: 0.16, h: 0.2, d: 0.16, color: '#ffc779' })
    })
    // Railings stay outside navigation, never across a dock or Aarti approach.
    for (const x of [-30.6, 30.6]) for (let i = 0; i < 7; i++) {
      const z = i * 3 + 1.5, y = groundHeight(z)
      add(x, z, 0.13, 1.05, 0.13, y + 0.525, '#816654')
      add(x, z, 0.12, 0.1, 2.9, y + 1.05, '#d2b18a')
    }
    const spacing = quality === 'low' ? 3 : 1.5
    for (const x of [-29.8, 29.8]) for (let z = 1; z < 22; z += spacing) {
      const y = groundHeight(z)
      add(x, z, 0.26, 0.09, 0.26, y + 0.05, '#a35e3b')
      lamps.push({ x, z, y: y + 0.2, w: 0.07, h: 0.19, d: 0.07, color: '#ffc779' })
    }
    for (let x = -28; x <= 28; x += 2) add(x, 21.5, 1.8, 0.018, 0.6, groundHeight(21.5) + 0.018, x % 4 ? '#c7a680' : '#a88269')
    return { stone, lamps }
  }, [quality])
  return <group name="connected-festival-promenades">
    <Blocks blocks={stone} /><Blocks blocks={lamps} glow />
    {PAVILIONS.map((p, i) => <mesh key={p.x} position={[p.x, groundHeight(p.z) + 4.15, p.z]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[3.25, i ? 1.4 : 1, 4]} /><meshStandardMaterial color={i ? '#8b5146' : '#b17a50'} roughness={0.9} />
    </mesh>)}
    <WayfindingSign x={-26} z={22.7} title="WEST LAMP WALK" route="River / Aarti - Market / Temples" />
    <WayfindingSign x={26} z={22.7} title="EAST RIVER WALK" route="Rides / Boats - Market / Temples" />
    <WayfindingSign x={0} z={22.7} title="TEMPLE FORECOURT" route="Market below - River ahead" />
  </group>
}
