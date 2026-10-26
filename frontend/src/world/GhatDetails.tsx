import { useEffect, useMemo, useRef } from 'react'
import { Color, Object3D, type InstancedMesh } from 'three'
import { GHAT_WIDTH, STEP_DEPTH, STEP_HEIGHT, groundHeight } from './environment'

export function pavingPositions(quality: 'low' | 'medium' | 'high') {
  const columns = quality === 'low' ? 18 : quality === 'medium' ? 25 : 36
  return Array.from({ length: 7 * columns * 2 }, (_, n) => {
    const column = n % columns, lane = Math.floor(n / columns) % 2, step = Math.floor(n / (columns * 2))
    const width = (GHAT_WIDTH - 1) / columns
    return { x: -(GHAT_WIDTH - 1) / 2 + (column + 0.5 + (lane % 2) * 0.25) * width, z: step * STEP_DEPTH + lane * 1.35 + 0.82,
      width: width - 0.07, depth: 1.28, step, variation: (column * 31 + lane * 11 + step * 7) % 9 }
  }).filter(tile => tile.x < GHAT_WIDTH / 2 - 0.2)
}

function StonePaving({ quality }: { quality: 'low' | 'medium' | 'high' }) {
  const positions = useMemo(() => pavingPositions(quality), [quality])
  const mesh = useRef<InstancedMesh>(null)
  useEffect(() => {
    const object = new Object3D(), color = new Color()
    positions.forEach((p, i) => {
      object.position.set(p.x, groundHeight(p.z) + 0.002, p.z)
      object.scale.set(p.width, 0.012 + p.variation * 0.0004, p.depth)
      object.updateMatrix()
      mesh.current?.setMatrixAt(i, object.matrix)
      mesh.current?.setColorAt(i, color.set(['#b39277', '#be9c7c', '#9e836f', '#bd997f', '#ab886d', '#c6a184', '#b09279', '#967c70', '#c6a68a'][p.variation]))
    })
    if (mesh.current) { mesh.current.instanceMatrix.needsUpdate = true; if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true }
  }, [positions])
  return <instancedMesh ref={mesh} args={[undefined, undefined, positions.length]} frustumCulled={false} receiveShadow>
    <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#ffffff" roughness={0.98} metalness={0.02} />
  </instancedMesh>
}

export function GhatDetails({ quality }: { quality: 'low' | 'medium' | 'high' }) {
  return <group name="paved-ghat-terraces">
    <StonePaving quality={quality} />
    {Array.from({ length: 7 }, (_, row) => <group key={row}>
      <mesh position={[0, (row + 1) * STEP_HEIGHT - 0.04, row * STEP_DEPTH + 0.1]}><boxGeometry args={[GHAT_WIDTH - 0.5, 0.1, 0.19]} /><meshStandardMaterial color="#d4b38d" roughness={0.84} /></mesh>
      <mesh position={[0, (row + 1) * STEP_HEIGHT - 0.25, row * STEP_DEPTH + 0.008]}><boxGeometry args={[GHAT_WIDTH - 0.5, 0.035, 0.025]} /><meshStandardMaterial color="#856b61" roughness={1} /></mesh>
    </group>)}
    {[-30.6, 30.6].map(x => <group key={x}>
      {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[x, groundHeight(i * 3 + 1.5) + 0.12, i * 3 + 1.5]}>
        <boxGeometry args={[0.3, 0.22, 2.85]} /><meshStandardMaterial color="#9a7969" roughness={0.9} />
      </mesh>)}
    </group>)}
    <mesh position={[0, -0.14, -1.11]} rotation={[0.14, 0, 0]} receiveShadow><boxGeometry args={[43.6, 0.18, 0.91]} /><meshStandardMaterial color="#8d8177" roughness={1} /></mesh>
    {[-10.7, 0, 10.7].map(x => <group key={x} position={[x, 0.07, -0.85]}>
      <mesh><boxGeometry args={[0.9, 0.21, 0.29]} /><meshStandardMaterial color="#ad8f75" roughness={0.88} /></mesh>
      <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.33, 0.12, 0.31]} /><meshStandardMaterial color="#d0aa84" roughness={0.86} /></mesh>
    </group>)}
  </group>
}
