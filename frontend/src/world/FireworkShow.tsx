import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, PointsMaterial, type Mesh, type Points } from 'three'
import { CUES, cueAge, formation } from './fireworks'

function Burst({ index, quality, enabled, sprite }: { index: number; quality: 'low' | 'medium' | 'high'; enabled: boolean; sprite: CanvasTexture }) {
  const cue = CUES[index]
  const count = quality === 'low' ? 55 : quality === 'medium' ? 92 : 155
  const targets = useMemo(() => formation(cue.kind, count), [cue.kind, count])
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3))
    const colors = new Float32Array(count * 3), color = new Color()
    const palette = cue.kind === 'gold' || cue.kind === 'ram' ? ['#ffd681', '#e6a34c', '#ffefb9'] : cue.kind === 'lotus' ? ['#ff86b0', '#ffc47d', '#f8b6d9'] : ['#78c9ff', '#bc9aed', '#ffbd75', '#91d9bc']
    for (let i = 0; i < count; i++) { color.set(palette[(i + index) % palette.length]); color.toArray(colors, i * 3) }
    g.setAttribute('color', new BufferAttribute(colors, 3))
    return g
  }, [count, cue.kind, index])
  const material = useMemo(() => new PointsMaterial({ color: '#ffffff', vertexColors: true, map: sprite, size: quality === 'low' ? 0.66 : quality === 'medium' ? 0.82 : 0.97, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true }), [quality, sprite])
  const points = useRef<Points>(null)
  const launchPoint = useRef<Mesh>(null)
  const { gl } = useThree()
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useFrame(({ clock }) => {
    const age = cueAge(clock.elapsedTime, cue)
    const visible = enabled && !document.hidden && age < 5.4
    if (index === 0) gl.domElement.dataset.fireworks = enabled ? `${visible ? cue.kind : 'idle'}:${age.toFixed(1)}` : 'off'
    if (points.current) points.current.visible = visible && age >= 1.15
    if (launchPoint.current) {
      launchPoint.current.visible = visible && age < 1.15
      launchPoint.current.position.y = -cue.y + cue.y * Math.min(1, age / 1.15)
      launchPoint.current.position.x = Math.sin(Math.min(1, age / 1.15) * Math.PI) * (index % 2 ? 1.5 : -1.2)
    }
    if (!visible) return
    const launch = Math.min(1, age / 1.15)
    const spread = Math.max(0, Math.min(1, (age - 1.15) / 1.05))
    const fade = Math.max(0, Math.min(1, (5.4 - age) / 2.6))
    material.opacity = fade * Math.min(1, Math.max(0, age - 1.15) * 3) * (cue.kind === 'gold' ? 0.85 : 0.95)
    const positions = geometry.attributes.position as BufferAttribute
    for (let i = 0; i < count; i++) {
      const drift = cue.kind === 'gold' || cue.kind === 'finale' ? Math.max(0, age - 2.1) ** 2 * 0.52 : 0
      const size = .76 + (index % 4) * .12
      positions.setXYZ(i, targets[i * 3] * spread * size * (cue.kind === 'ram' || cue.kind === 'lotus' ? 1 : 1 + Math.max(0, age - 2.2) * 0.12) + Math.max(0, age - 2.2) * (index % 2 ? .16 : -.12),
        -cue.y + cue.y * launch + targets[i * 3 + 1] * spread * size - drift,
        targets[i * 3 + 2] * spread * (1 + index % 3 * .3))
    }
    positions.needsUpdate = true
  })
  return <group position={[cue.x, cue.y, -23]}><points ref={points} geometry={geometry} material={material} frustumCulled={false} />
    <mesh ref={launchPoint}><sphereGeometry args={[0.14, 6, 5]} /><meshBasicMaterial color="#ffd59a" toneMapped={false} /></mesh>
  </group>
}

export function Fireworks({ quality, enabled }: { quality: 'low' | 'medium' | 'high'; enabled: boolean }) {
  const sprite = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32
    const context = canvas.getContext('2d')!
    const gradient = context.createRadialGradient(16, 16, 1, 16, 16, 16)
    gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(0.16, '#ffffffdd'); gradient.addColorStop(0.56, '#ffffff66'); gradient.addColorStop(1, '#ffffff00')
    context.fillStyle = gradient; context.fillRect(0, 0, 32, 32)
    return new CanvasTexture(canvas)
  }, [])
  useEffect(() => () => sprite.dispose(), [sprite])
  return <group name="fireworks-show" visible={enabled}>{CUES.map((cue, index) => <Burst key={`${index}-${cue.kind}`} index={index} quality={quality} enabled={enabled} sprite={sprite} />)}</group>
}
