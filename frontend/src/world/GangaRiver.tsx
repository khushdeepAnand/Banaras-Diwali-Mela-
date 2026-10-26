import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3, Vector4, type ShaderMaterial } from 'three'
import { boatWake } from './waterMotion'

// Stylised animated water and light streaks, not screen-space or physically accurate reflections.
// Improved: overlapping ripples with different directions/frequencies, broken reflections, reduced horizontal stripes.
const vertexShader = `
uniform float uTime;
varying vec2 vWater;
varying vec3 vWorldPos;
void main() {
  vec3 p = position;
  vWater = vec2(p.x, -43.0 - p.y);
  vWorldPos = (modelMatrix * vec4(p, 1.0)).xyz;
  float large = sin(p.x * 0.31 + p.y * 0.27 + uTime * 0.75) * 0.017;
  float crossing = sin(p.x * -0.42 + p.y * 0.49 - uTime * 1.1) * 0.014;
  float ripple1 = sin(p.x * 0.85 + uTime * 1.8) * 0.006;
  float ripple2 = sin(p.y * 0.72 - uTime * 1.5) * 0.005;
  float ripple3 = sin((p.x + p.y) * 0.55 + uTime * 2.1) * 0.004;
  p.z += large + crossing + ripple1 + ripple2 + ripple3;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`

const fragmentShader = `
uniform float uTime;
uniform float uDetail;
uniform float uFireworks;
uniform vec4 uBoats;
uniform vec3 uCameraPos;
varying vec2 vWater;
varying vec3 vWorldPos;
// Polynomial hash avoids dozens of per-pixel sine evaluations on software GPUs.
float hash21(vec2 p) {
  vec3 h = fract(vec3(p.xyx) * 0.1031);
  h += dot(h, h.yzx + 33.33);
  return fract((h.x + h.y) * h.z);
}
float noise21(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x),
             mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
void main() {
  vec2 p = vWater;
  float distanceFromBank = max(0.0, -p.y);
  float nearBank = 1.0 - smoothstep(0.0, 18.0, distanceFromBank);
  float farMist = smoothstep(22.0, 78.0, distanceFromBank);
  
  // Multi-scale drift for more natural water movement
  float drift = noise21(p * 0.13 + vec2(uTime * 0.09, -uTime * 0.07)) - 0.5;
  vec2 warped = p + vec2(drift, -drift * 0.83) * 2.2;
  
  // Overlapping ripples at different scales and directions - breaks horizontal stripe repetition
  float waveLarge = sin(dot(warped, vec2(0.52, 0.83)) + uTime * 0.85);
  float waveMed = sin(dot(warped, vec2(-0.71, 1.15)) - uTime * 1.2);
  float waveSmall = sin(dot(warped, vec2(1.34, 0.42)) + uTime * 1.9);
  float waveCross = sin(dot(warped, vec2(0.91, -0.67)) - uTime * 1.45);
  float waveDiag = sin(dot(warped, vec2(-0.48, -0.92)) + uTime * 1.68);
  float brokenLight = noise21(warped * 0.58 + uTime * vec2(0.17, -0.12));
  float fine = noise21(warped * 1.8 + uTime * vec2(0.31, -0.24));
  float detail = (brokenLight - 0.5) * uDetail;
  float microRipple = (fine - 0.5) * 0.15 * uDetail;
  
  // Combined waves with varied amplitudes - no single dominant direction
  float waves = waveLarge * 0.22 + waveMed * 0.18 + waveSmall * 0.14 + waveCross * 0.12 + waveDiag * 0.10 + detail * 0.15 + microRipple;
  
  // Crest highlighting with noise variation
  float crest = smoothstep(0.28, 0.58, waves) * (0.25 + 0.65 * brokenLight);
  float secondaryCrest = smoothstep(0.45, 0.72, waves) * (0.15 + 0.4 * fine);
  
  // Base water colour with depth variation
  float depthFactor = clamp(distanceFromBank / 60.0, 0.0, 1.0);
  vec3 deepWater = vec3(0.008, 0.035, 0.062);
  vec3 shallowWater = vec3(0.025, 0.085, 0.115);
  vec3 water = mix(deepWater, shallowWater, 1.0 - depthFactor);
  
  // Wave-based colour modulation
  water += vec3(0.06, 0.12, 0.14) * waves * 0.5;
  water += vec3(0.09, 0.17, 0.19) * crest * (0.3 + nearBank * 0.12);
  water += vec3(0.04, 0.08, 0.1) * secondaryCrest * (0.25 + nearBank * 0.08);
  
  // Broken, elongated diya/ghat reflections - not continuous stripes
  // Warp the light columns in world space with the moving waves, rather than
  // drawing static horizontal ribbons independent of the surface.
  float reflectedX = p.x + drift * (1.1 + distanceFromBank * 0.06) + waveCross * 0.65 + waveSmall * 0.23;
  float lamp1 = exp(-pow((reflectedX + 6.0) * 0.12, 2.0)) * 0.83;
  float lamp2 = exp(-pow((reflectedX - 4.0) * 0.16, 2.0)) * 0.26;
  float lamp3 = exp(-pow((reflectedX - 17.0) * 0.16, 2.0)) * 0.18;
  float lamp4 = exp(-pow((reflectedX + 14.0) * 0.14, 2.0)) * 0.22;
  float lamp5 = exp(-pow((reflectedX - 10.0) * 0.15, 2.0)) * 0.15;
  float lamps = lamp1 + lamp2 + lamp3 + lamp4 + lamp5;
  
  // Reflection fragmentation by wave motion - breaks horizontal stripes
  float reflectDistortion = brokenLight * 0.8;
  float flame = smoothstep(0.28, 0.68, 0.42 + waves * 0.35 + reflectDistortion * 0.3 + detail * 0.1);
  float scattered = 0.3 + 0.7 * smoothstep(0.38, 0.75, fine);
  float reflectionMask = (0.18 + 0.82 * smoothstep(0.4, 0.76, brokenLight)) * (0.55 + 0.45 * smoothstep(0.3, 0.7, fine));
  
  float fireworkCycle = mod(uTime, 38.0);
  float skyGlow = smoothstep(0.7, 2.0, fireworkCycle) * (1.0 - smoothstep(31.0, 35.0, fireworkCycle));
  
  // Reflections only where water faces viewer (fresnel-like) and broken by waves
   float viewAngle = dot(normalize(uCameraPos - vWorldPos), vec3(0.0, 1.0, 0.0));
  float fresnel = smoothstep(0.0, 0.35, viewAngle);
  float festivalLight = (lamps * (0.14 + nearBank * 0.82) + skyGlow * uFireworks * 0.022) * flame * scattered * reflectionMask * fresnel * (1.0 - farMist);
  water += vec3(1.1, 0.55, 0.2) * festivalLight;
  // Dim, interrupted reflections from the far bank, visible only near it.
  float oppositeBank = smoothstep(44.0, 73.0, distanceFromBank);
  float farLights = smoothstep(0.55, 0.85, fine);
  water += vec3(0.16, 0.09, 0.045) * oppositeBank * farLights *
           smoothstep(0.44, 0.73, brokenLight) * (1.0 - farMist * 0.6) * uDetail;
  
  // Boat wakes - subtle, fading rings
  float wakes = 0.0;
  for (int i = 0; i < 2; i++) {
    vec2 boat = i == 0 ? uBoats.xy : uBoats.zw;
    vec2 delta = p - boat;
    float r = length(delta * vec2(0.85, 1.1));
    wakes += exp(-r * 0.32) * sin(r * 3.5 - uTime * 3.0) * smoothstep(0.5, 2.0, r) * 0.11;
    // Secondary wake ripple
    wakes += exp(-r * 0.45) * sin(r * 5.2 - uTime * 4.2) * smoothstep(0.8, 3.0, r) * 0.05;
  }
  water += vec3(0.08, 0.18, 0.21) * max(0.0, wakes) * uDetail;
  
  // Subsurface scattering hint near bank
  water += vec3(0.02, 0.04, 0.05) * nearBank * (0.15 + brokenLight * 0.08);
  
  // Atmospheric perspective
  water = mix(water, vec3(0.022, 0.052, 0.072), farMist * 0.72);
  
  // Clamp to prevent oversaturation
  water = clamp(water, 0.0, 1.0);
  
  gl_FragColor = vec4(water, 1.0);
}`

export function GangaRiver({ quality, fireworks }: { quality: 'low' | 'medium' | 'high'; fireworks: boolean }) {
  const material = useRef<ShaderMaterial>(null)
  const { camera } = useThree()
  const uniforms = useMemo(() => ({ 
    uTime: { value: 0 }, 
    uDetail: { value: quality === 'low' ? 0.45 : quality === 'medium' ? 0.75 : 1 }, 
    uFireworks: { value: fireworks ? 1 : 0 },
    uBoats: { value: new Vector4(4, -4.4, 17, -8) },
    uCameraPos: { value: new Vector3() }
  }), [quality, fireworks])
  useFrame(({ clock }) => {
    if (!material.current) return
    material.current.uniforms.uTime.value = clock.elapsedTime
    material.current.uniforms.uBoats.value.set(boatWake.ferry.x, boatWake.ferry.z, boatWake.cruise.x, boatWake.cruise.z)
    material.current.uniforms.uCameraPos.value.copy(camera.position)
  })
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.17, -43]}>
    <planeGeometry args={quality === 'low' ? [180, 85, 40, 24] : quality === 'medium' ? [180, 85, 64, 32] : [180, 85, 96, 48]} />
    <shaderMaterial ref={material} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
  </mesh>
}
