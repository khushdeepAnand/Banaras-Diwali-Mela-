import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { memo, Suspense, useEffect, useRef } from 'react'
import { QualitySampler } from './adaptiveQuality'
import { GangaRiver } from './GangaRiver'
import { GhatArchitecture } from './GhatArchitecture'
import { DiyaField } from './DiyaField'
import { Bazaar } from './BazaarScene'
import { Player, type GameInput } from './Player'
import { FerrisWheel, type RidePose } from './FerrisWheel'
import { AartiScene } from './AartiScene'
import { NightSky } from './NightSky'
import { Fireworks } from './FireworkShow'
import { PendulumRide } from './PendulumRide'
import { RiverBoats } from './RiverBoats'
import { ScenicRiverfront } from './ScenicRiverfront'
import { FestivalPromenades } from './FestivalPromenades'
import { Crowd, type LocalPresence } from './CrowdScene'
import type { RoomLink } from '../components/useRoom'
import { type RidePhase } from './ride'
import type { Position } from './environment'
import type { PublicApplication } from '../components/commerceApi'
import type { Appearance } from '../../../backend/src/shared/appearance'
import type { CaptureQueue, VisitorView } from './visitorView'
import { CaptureBridge } from './CaptureBridge'
import { GameplayEffects } from './GameplayEffects'
import type { GameplayVisuals } from '../components/useGameplay'

type SceneProps = { quality: 'low' | 'medium' | 'high'; listings: readonly PublicApplication[]; input: React.RefObject<GameInput>; local: React.RefObject<LocalPresence>; room: React.RefObject<RoomLink>; appearance: React.RefObject<Appearance>; view: React.RefObject<VisitorView>; capture: React.RefObject<CaptureQueue>; active: boolean; reset: number; ride: RidePhase; rideKind: 'wheel' | 'pendulum' | 'ferry' | 'cruise'; fireworks: boolean; ridePose: React.RefObject<RidePose>; onRidePhase: (phase: RidePhase) => void; onRideHeight: (height: number) => void; onTelemetry: (position: Position, yaw: number, heading: number) => void }

type LaunchProps = { onReady: () => void; onContextLost: () => void; onPoorPerformance: () => void; automaticQuality: boolean }

function AdaptiveQuality({ automaticQuality, onPoorPerformance }: Pick<LaunchProps, 'automaticQuality' | 'onPoorPerformance'>) {
  const sampler = useRef(new QualitySampler())
  useEffect(() => { sampler.current = new QualitySampler() }, [automaticQuality])
  useFrame((_, delta) => { if (automaticQuality && sampler.current.sample(delta, document.hidden)) onPoorPerformance() })
  return null
}

function ContextLifecycle({ onContextLost }: Pick<LaunchProps, 'onContextLost'>) {
  const gl = useThree(state => state.gl)
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onContextLost() }
    canvas.addEventListener('webglcontextlost', lost)
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [gl, onContextLost])
  return null
}

function World({ quality, listings, input, local, room, appearance, view, capture, gameplay, active, reset, ride, rideKind, fireworks, ridePose, onRidePhase, onRideHeight, onTelemetry, onReady }: SceneProps & { gameplay: () => GameplayVisuals } & LaunchProps) {
  return <>
    <color attach="background" args={['#0b1830']} />
    <NightSky quality={quality} />
    <Fireworks quality={quality} enabled={fireworks} />
    <fog attach="fog" args={['#253d55', 34, 122]} />
    <hemisphereLight args={['#7cadd5', '#584b53', quality === 'low' ? 1.1 : 1.18]} />
    <ambientLight intensity={0.2} />
    <directionalLight position={[-9, 16, -8]} color="#ffd0a1" intensity={quality === 'low' ? 1.75 : 2.1} castShadow={quality === 'high'} shadow-mapSize={[512, 512]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} />
    <GangaRiver quality={quality} fireworks={fireworks} />
    <GhatArchitecture quality={quality} />
    <FestivalPromenades quality={quality} />
    <ScenicRiverfront quality={quality} />
    <DiyaField quality={quality} />
    <GameplayEffects quality={quality} read={gameplay} />
    <AartiScene quality={quality} />
    <Bazaar quality={quality} listings={listings} />
    <FerrisWheel quality={quality} phase={rideKind === 'wheel' ? ride : 'approaching'} onPhase={onRidePhase} pose={ridePose} onHeight={onRideHeight} />
    <PendulumRide phase={rideKind === 'pendulum' ? ride : 'approaching'} pose={ridePose} onPhase={onRidePhase} />
    <RiverBoats quality={quality} kind={rideKind} phase={ride} pose={ridePose} onPhase={onRidePhase} />
    <Crowd quality={quality} local={local} room={room} />
    <Player input={input} local={local} room={room} appearance={appearance} view={view} active={active} reset={reset} ride={ride} rideKind={rideKind} ridePose={ridePose} onTelemetry={onTelemetry} />
    <CaptureBridge queue={capture} onReady={onReady} />
  </>
}

function MelaScene(props: SceneProps & { gameplay: () => GameplayVisuals } & LaunchProps) {
  return <Canvas
    shadows={props.quality === 'high'}
    dpr={props.quality === 'low' ? [1, 1.25] : props.quality === 'medium' ? [1, 1.5] : [1, 1.6]}
    camera={{ position: [5.7, 6.4, 14.65], fov: 90, near: 0.1, far: 180 }}
    gl={{ antialias: props.quality === 'high', powerPreference: props.quality === 'low' ? 'low-power' : 'high-performance' }}
  >
    <ContextLifecycle onContextLost={props.onContextLost} />
    <AdaptiveQuality automaticQuality={props.automaticQuality} onPoorPerformance={props.onPoorPerformance} />
    <Suspense fallback={null}><World {...props} /></Suspense>
  </Canvas>
}

export default memo(MelaScene)
