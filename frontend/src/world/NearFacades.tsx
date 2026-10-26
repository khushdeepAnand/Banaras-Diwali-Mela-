import { useEffect, useMemo, useRef } from 'react'
import { Color, Object3D, type InstancedMesh } from 'three'

type Quality = 'low' | 'medium' | 'high'

// The market sits in front of these façades. Everything here is beyond the
// walkable boundary; the details do not introduce invisible collision walls.
export function NearFacades({ quality }: { quality: Quality }) {
  const walls = useRef<InstancedMesh>(null)
  const cornices = useRef<InstancedMesh>(null)
  const balconies = useRef<InstancedMesh>(null)
  const roofPavilions = useRef<InstancedMesh>(null)
  const windows = useRef<InstancedMesh>(null)
  const arches = useRef<InstancedMesh>(null)
  const houses = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    x: -20 + i * 3.7, height: 5 + (i * 7 % 5) * 0.85, width: 3.35 + (i % 4) * 0.12,
    depth: 5.7 + (i % 3) * 0.45, shade: i % 6,
  })), [])
  const openings = useMemo(() => houses.flatMap((house, index) =>
    Array.from({ length: quality === 'low' ? 2 : house.height > 6 ? 6 : 4 }, (_, n) => ({
      index, x: house.x + (n % 2 ? 0.82 : -0.82),
      y: 6.6 + Math.floor(n / 2) * 1.45, z: 32 - house.depth / 2 - 0.027,
      lit: (index * 7 + n * 3) % 5 !== 0,
    })).filter(window => window.y < house.height + 2.7)
  ), [houses, quality])

  useEffect(() => {
    const o = new Object3D(), c = new Color()
    const shades = ['#98735f', '#b2886c', '#836f69', '#a67c64', '#a48270', '#8e6860']
    houses.forEach((h, i) => {
      o.rotation.set(0, 0, 0)
      o.position.set(h.x, 3 + h.height / 2, 32)
      o.scale.set(h.width, h.height, h.depth)
      o.updateMatrix(); walls.current?.setMatrixAt(i, o.matrix)
      walls.current?.setColorAt(i, c.set(shades[h.shade]))
      o.position.set(h.x, 3 + h.height + 0.14, 32)
      o.scale.set(h.width + 0.38, 0.28, h.depth + 0.38)
      o.updateMatrix(); cornices.current?.setMatrixAt(i, o.matrix)
      o.position.set(h.x, 4.65, 32 - h.depth / 2 - 0.36)
      o.scale.set(h.width - 0.16, 0.12, 0.78)
      o.updateMatrix(); balconies.current?.setMatrixAt(i, o.matrix)
      if (i % 3 === 0) {
        o.position.set(h.x, 3 + h.height + 0.75, 32 - h.depth / 2 + 0.85)
        o.scale.set(0.95 + (i % 4) * 0.12, 1.12, 0.95)
        o.updateMatrix(); roofPavilions.current?.setMatrixAt(i / 3, o.matrix)
      }
    })
    openings.forEach((w, i) => {
      o.position.set(w.x, w.y, w.z)
      o.scale.set(0.48, 0.82, 0.035)
      o.updateMatrix(); windows.current?.setMatrixAt(i, o.matrix)
      windows.current?.setColorAt(i, c.set(w.lit ? '#e8b773' : '#303549'))
      o.position.y = w.y + 0.43
      o.scale.set(0.28, 0.27, 0.065)
      o.rotation.z = Math.PI / 4
      o.updateMatrix(); arches.current?.setMatrixAt(i, o.matrix)
      o.rotation.z = 0
    })
    for (const mesh of [walls.current, cornices.current, balconies.current, roofPavilions.current, windows.current, arches.current]) {
      if (!mesh) continue
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  }, [houses, openings])
  return <group name="riverfront-havelis">
    <instancedMesh ref={walls} args={[undefined, undefined, houses.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#ffffff" roughness={0.96} />
    </instancedMesh>
    <instancedMesh ref={cornices} args={[undefined, undefined, houses.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#d1ac85" roughness={0.9} />
    </instancedMesh>
    <instancedMesh ref={balconies} args={[undefined, undefined, houses.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#c49a75" roughness={0.9} />
    </instancedMesh>
    <instancedMesh ref={roofPavilions} args={[undefined, undefined, houses.length / 3]} frustumCulled={false}>
      <coneGeometry args={[1, 1, 8]} /><meshStandardMaterial color="#b98d70" roughness={0.95} />
    </instancedMesh>
    <instancedMesh ref={windows} args={[undefined, undefined, openings.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#ffffff" />
    </instancedMesh>
    <instancedMesh ref={arches} args={[undefined, undefined, openings.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#d8ae87" roughness={0.9} />
    </instancedMesh>
  </group>
}
