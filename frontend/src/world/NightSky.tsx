import { useEffect, useMemo } from 'react'
import { BackSide, BufferGeometry, Float32BufferAttribute, SphereGeometry, Mesh, ShaderMaterial } from 'three'

const vertex = `
varying float vHeight;
varying vec3 vNormal;
void main() {
  vHeight = normalize(position).y;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const fragment = `
varying float vHeight;
varying vec3 vNormal;
void main() {
  float twilight = 1.0 - smoothstep(-0.12, 0.58, vHeight);
  float horizon = exp(-pow((vHeight + 0.09) * 6.5, 2.0));
  float horizonWide = exp(-pow((vHeight + 0.02) * 3.5, 2.0));
  vec3 midnight = vec3(0.008, 0.018, 0.045);
  vec3 deepBlue = vec3(0.015, 0.035, 0.075);
  vec3 dusk = vec3(0.055, 0.095, 0.145);
  vec3 warmGlow = vec3(0.085, 0.055, 0.045) * horizon;
  vec3 amberBand = vec3(0.12, 0.07, 0.04) * horizonWide * 0.4;
  vec3 zenith = mix(midnight, deepBlue, 0.5);
  vec3 sky = mix(zenith, dusk, twilight * 0.82) + warmGlow + amberBand;
  // Subtle vignette toward horizon
  float vignette = 1.0 - smoothstep(0.55, 0.85, vHeight) * 0.15;
  gl_FragColor = vec4(sky * vignette, 1.0);
}`

export function NightSky({ quality }: { quality: 'low' | 'medium' | 'high' }) {
  const stars = useMemo(() => {
    const geometry = new BufferGeometry()
    const positions: number[] = [], colors: number[] = [], sizes: number[] = []
    const count = quality === 'low' ? 35 : quality === 'medium' ? 70 : 110
    for (let i = 0; i < count; i++) {
      // Better distribution using golden angle
      const phi = Math.acos(2 * (i + 0.5) / count - 1)
      const theta = (i * 2.39996323) % (Math.PI * 2) // golden angle
      const radius = 110 + Math.random() * 20
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = 18 + radius * Math.cos(phi) * 0.6 // bias toward upper hemisphere
      const z = radius * Math.sin(phi) * Math.sin(theta)
      positions.push(x, y, z)
      const warm = i % 5 === 0
      const brightness = 0.5 + Math.random() * 0.5
      colors.push(
        warm ? 0.85 * brightness : 0.7 * brightness, 
        warm ? 0.75 * brightness : 0.85 * brightness, 
        warm ? 0.6 * brightness : 1.0 * brightness
      )
      sizes.push(warm ? 1.3 : 1.0)
    }
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1))
    return geometry
  }, [quality])
  
  // Moon
  const moon = useMemo(() => {
    const geometry = new SphereGeometry(1.8, 16, 12)
    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4(1.0, 0.92, 0.78, 1.0);
        }
      `,
      side: BackSide,
      depthWrite: false,
      transparent: true,
    })
    return new Mesh(geometry, material)
  }, [])
  
  moon.position.set(-45, 35, -55)
  moon.scale.setScalar(1)

  useEffect(() => () => { stars.dispose(); moon.geometry.dispose(); moon.material.dispose() }, [stars, moon])

  return <group>
    <mesh renderOrder={-1} geometry={new SphereGeometry(140, 32, 16)}>
      <shaderMaterial side={BackSide} depthWrite={false} vertexShader={vertex} fragmentShader={fragment} />
    </mesh>
    <points geometry={stars} frustumCulled={false}>
      <pointsMaterial vertexColors sizeAttenuation transparent opacity={0.8} depthWrite={false} size={0.45} />
    </points>
    <primitive object={moon} />
  </group>
}
