import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { MobileControls } from './components/MobileControls'
import { StallPanel } from './components/StallPanel'
import { useFestivalAudio } from './components/useFestivalAudio'
import { useFestivalSound } from './components/useFestivalSound'
import { KashiRadio } from './components/KashiRadio'
import type { GameInput } from './world/Player'
import type { Position } from './world/environment'
import { nearestStall, type BazaarStall } from './world/bazaar'
import { nearBoard, type RidePhase } from './world/ride'
import { nearAarti } from './world/aarti'
import type { RidePose } from './world/FerrisWheel'
import { nearPendulum } from './world/pendulum'
import { BOATS, nearBoat } from './world/boats'
import { CommercePortal } from './components/CommercePortal'
import { api, type PublicApplication } from './components/commerceApi'
import { VendorDirectory } from './components/VendorDirectory'
import { Minimap } from './components/Minimap'
import { SPAWN } from './world/environment'
import { useRoom } from './components/useRoom'
import { RoomPanel } from './components/RoomPanel'
import { nearestBeggar } from './world/crowd'
import type { LocalPresence } from './world/CrowdScene'
import { DEFAULT_APPEARANCE, type Appearance } from '../../backend/src/shared/appearance'
import { HelpPanel, PhotoPanel, WardrobePanel } from './components/VisitorPanels'
import type { CaptureQueue, VisitorTool, VisitorView } from './world/visitorView'
import { SUPPORT_LINES, TALK_COOLDOWN_MS } from './components/dialogue'
import { CollectionPanel } from './components/CollectionPanel'
import { useGameplay } from './components/useGameplay'
import { LIGHT_POINT, OFFER_POINT, nearPoint } from '../../backend/src/shared/gameplay'
import { ActivityHighlights, SceneFallback, SceneLoading } from './components/LaunchExperience'
import { inviteFromSearch } from './components/sharing'
import { useJourney } from './components/useJourney'
import { JourneyPanel } from './components/JourneyPanel'
import { RangoliPanel } from './components/RangoliPanel'
import { SocialPanel, SocialCues } from './components/SocialPanel'
import './journey.css'

type Attraction = 'wheel' | 'pendulum' | 'ferry' | 'cruise'

const MelaScene = lazy(() => import('./world/MelaScene'))

class SceneError extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean; unsupported: boolean }> {
  state = { failed: false, unsupported: false }
  static getDerivedStateFromError(error: Error) { return { failed: true, unsupported: /webgl|context|gpu/i.test(error.message) } }
  componentDidCatch() { this.props.onFailure() }
  render() {
    return this.state.failed
      ? <SceneFallback unsupported={this.state.unsupported} retry={() => window.location.reload()} />
      : this.props.children
  }
}

function Festival() {
  const [entered, setEntered] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [sceneFailed, setSceneFailed] = useState(false)
  const [sceneFault, setSceneFault] = useState(false)
  const ready = useCallback(() => setSceneReady(true), [])
  const failed = useCallback(() => setSceneFailed(true), [])
  const lost = useCallback(() => { setSceneFailed(true); setSceneFault(true) }, [])
  const [invite] = useState(() => typeof window === 'undefined' ? { code: '', invalid: false } : inviteFromSearch(window.location.search))
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>(() =>
    typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || navigator.hardwareConcurrency <= 4) ? 'low' : 'high',
  )
  const [reset, setReset] = useState(0)
  const [automaticQuality, setAutomaticQuality] = useState(true)
  const lowerQuality = useCallback(() => setQuality(previous => previous === 'high' ? 'medium' : 'low'), [])
  const room = useRoom()
  const [roomOpen, setRoomOpen] = useState(false)
  const [tool, setTool] = useState<VisitorTool>('none')
  const [toolsOpen, setToolsOpen] = useState(false)
  const [firstPerson, setFirstPerson] = useState(false)
  const [photoHud, setPhotoHud] = useState(false)
  const [appliedLook, setAppliedLook] = useState<Appearance>({ ...DEFAULT_APPEARANCE })
  const [draftLook, setDraftLook] = useState<Appearance>({ ...DEFAULT_APPEARANCE })
  const appearance = useRef<Appearance>({ ...DEFAULT_APPEARANCE })
  const view = useRef<VisitorView>({ camera: 'third', tool: 'none', yaw: Math.PI, pitch: .05, distance: 6, preset: 'orbit' })
  const capture = useRef<CaptureQueue>({ job: null })
  const [supportLine, setSupportLine] = useState<string>(SUPPORT_LINES[0])
  const supportIndex = useRef(0), nextTalkAt = useRef(0)
  const [beggarCaption, setBeggarCaption] = useState(false)
  const [beggar, setBeggar] = useState<string | null>(null)
  const beggarRef = useRef<string | null>(null)
  const local = useRef<LocalPresence>({ ...SPAWN, y: 1.92, heading: 0, moving: false })
  const ceremonyAudio = useFestivalAudio()
  const festivalSound = useFestivalSound()
  const [fireworks, setFireworks] = useState(() => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [rideKind, setRideKind] = useState<Attraction>('wheel')
  const [soundOpen, setSoundOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [portal, setPortal] = useState<'contribute' | 'apply' | 'admin' | null>(null)
  const [directory, setDirectory] = useState(false)
  const [listings, setListings] = useState<PublicApplication[]>([])
  const [location, setLocation] = useState('X 0.0 · Z 10.5 · 0°')
  const [atBazaar, setAtBazaar] = useState(false)
  const [mapPlayer, setMapPlayer] = useState({ position: SPAWN, heading: 0 })
  const [nearby, setNearby] = useState<BazaarStall | null>(null)
  const [selected, setSelected] = useState<BazaarStall | null>(null)
  const [ride, setRide] = useState<RidePhase>('approaching')
  const [collectionOpen, setCollectionOpen] = useState(false)
  const journey = useJourney()
  const gameplayResult = useCallback((result: Parameters<typeof festivalSound.onGameplay>[0]) => { festivalSound.onGameplay(result); journey.result(result) }, [festivalSound.onGameplay, journey.result])
  const game = useGameplay(room, local, ride !== 'approaching', gameplayResult)
  useEffect(() => { if (room.wheelStamp > 0) journey.complete('wheel') }, [room.wheelStamp, journey.complete])
  useEffect(() => { if (!room.link.current.self && ride === 'riding' && rideKind === 'wheel') journey.complete('wheel') }, [ride, rideKind, room.link, journey.complete])
  const offeringNearby = nearPoint(mapPlayer.position, OFFER_POINT)
  const lightingNearby = nearPoint(mapPlayer.position, LIGHT_POINT)
  const [boardingNearby, setBoardingNearby] = useState(false)
  const [pendulumNearby, setPendulumNearby] = useState(false)
  const [boatNearby, setBoatNearby] = useState<'ferry' | 'cruise' | null>(null)
  const [atAarti, setAtAarti] = useState(false)
  const [rideHeight, setRideHeight] = useState('0.0')
  const input = useRef<GameInput>({ x: 0, y: 0, yaw: 0, pitch: 0.26 })
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  const nearbyRef = useRef<BazaarStall | null>(null)
  const boardRef = useRef(false)
  const pendulumRef = useRef(false)
  const boatRef = useRef<'ferry' | 'cruise' | null>(null)
  const ridePose = useRef<RidePose>({ x: 15.5, y: 2.15, z: 3.55 })
  const onRideHeight = useCallback((height: number) => setRideHeight(height.toFixed(1)), [])
  const onTelemetry = useCallback((position: Position, yaw: number, heading: number) => {
    festivalSound.setZone(position.z)
    const target = nearestBeggar(position)?.id ?? null
    beggarRef.current = target; setBeggar(previous => previous === target ? previous : target)
    setMapPlayer(previous => Math.abs(previous.position.x - position.x) + Math.abs(previous.position.z - position.z) < 0.02 && Math.abs(previous.heading - heading) < 0.01 ? previous : { position: { x: position.x, z: position.z }, heading })
    const label = `X ${position.x.toFixed(1)} · Z ${position.z.toFixed(1)} · ${Math.round(yaw * 180 / Math.PI)}°`
    setLocation((previous) => previous === label ? previous : label)
    setAtBazaar(position.z >= 12.5)
    const closest = nearestStall(position, listings)
    nearbyRef.current = closest
    setNearby((previous) => previous === closest ? previous : closest)
    const near = nearBoard(position)
    boardRef.current = near
    setBoardingNearby((previous) => previous === near ? previous : near)
    const nearSwing = nearPendulum(position)
    pendulumRef.current = nearSwing
    setPendulumNearby((previous) => previous === nearSwing ? previous : nearSwing)
    const boat = nearBoat('ferry', position) ? 'ferry' : nearBoat('cruise', position) ? 'cruise' : null
    boatRef.current = boat
    setBoatNearby(previous => previous === boat ? previous : boat)
    const ceremonyNearby = nearAarti(position)
    setAtAarti((previous) => previous === ceremonyNearby ? previous : ceremonyNearby)
  }, [listings, festivalSound.setZone])

  const refreshListings = useCallback(() => { void api<PublicApplication[]>('/stalls').then(setListings).catch(() => setListings([])) }, [])
  useEffect(() => { refreshListings() }, [refreshListings])

  function openPortal(next: 'contribute' | 'apply' | 'admin') {
    if (portal || selected || collectionOpen || tool !== 'none') return
    input.current.x = 0; input.current.y = 0
    drag.current = null
    setBeggarCaption(false)
    setExploreOpen(false)
    setPortal(next)
  }

  function donateToBeggar() {
    if (!beggarRef.current || portal || selected || directory || roomOpen || soundOpen || exploreOpen || toolsOpen || tool !== 'none' || ride !== 'approaching' || Date.now() < nextTalkAt.current) return
    setSupportLine(SUPPORT_LINES[supportIndex.current++ % SUPPORT_LINES.length])
    nextTalkAt.current = Date.now() + TALK_COOLDOWN_MS
    input.current.x = 0; input.current.y = 0; drag.current = null
    setBeggarCaption(true); setPortal('contribute')
  }

  useEffect(() => {
    if (roomOpen || soundOpen || exploreOpen || portal || selected || collectionOpen || directory || toolsOpen || tool !== 'none') {
      input.current.x = 0; input.current.y = 0; drag.current = null
    }
  }, [roomOpen, soundOpen, exploreOpen, portal, selected, collectionOpen, directory, toolsOpen, tool])

  useEffect(() => { if (room.status === 'Connected') room.link.current.send({ type: 'appearance', appearance: appliedLook }) }, [appliedLook, room.status, room.link])

  function closeTool(look: Appearance = appliedLook) {
    appearance.current = look; setDraftLook(look)
    view.current.tool = 'none'; setTool('none')
    capture.current.job?.reject(new Error('Photo mode closed before capture')); capture.current.job = null
    input.current.x = 0; input.current.y = 0; drag.current = null
  }
  useEffect(() => {
    if (!sceneFailed) return
    setPortal(null); setSelected(null); setCollectionOpen(false); setDirectory(false); setRoomOpen(false)
    setToolsOpen(false); setSoundOpen(false); setExploreOpen(false); closeTool()
    if (ceremonyAudio.playing || ceremonyAudio.loading) void ceremonyAudio.toggle()
    if (festivalSound.ambience || festivalSound.ambienceLoading) void festivalSound.toggle('ambience')
    if (festivalSound.effects || festivalSound.effectsLoading) void festivalSound.toggle('effects')
  }, [sceneFailed])
  function openTool(next: VisitorTool) {
    if (ride !== 'approaching' || portal || selected || collectionOpen || directory || roomOpen) return
    setToolsOpen(false); setSoundOpen(false); setExploreOpen(false)
    input.current.x = 0; input.current.y = 0; drag.current = null
    setDraftLook(appliedLook); appearance.current = appliedLook
    view.current.tool = next; view.current.preset = 'orbit'; view.current.yaw = local.current.heading + Math.PI; view.current.pitch = .04; view.current.distance = next === 'wardrobe' ? window.innerWidth < 650 ? 5.2 : 3.8 : 6
    setTool(next)
  }
  useEffect(() => {
    if (tool === 'none') return
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeTool() }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [tool, appliedLook])

  const previousRide = useRef(ride)
  useEffect(() => {
    if (ride === 'boarding') room.link.current.send({ type: 'ride', kind: rideKind })
    else if (ride === 'approaching' && previousRide.current !== 'approaching') room.link.current.send({ type: 'walk' })
    previousRide.current = ride
  }, [ride, rideKind, room.link])

  function boardRide(kind: Attraction) {
    if (tool !== 'none' || toolsOpen) return
    if (ride !== 'approaching' || !(kind === 'wheel' ? boardRef.current : kind === 'pendulum' ? pendulumRef.current : boatRef.current === kind) || selected) return
    input.current.x = 0
    input.current.y = 0
    setRideKind(kind)
    setRide('boarding')
  }

  function resetWorld() {
    if (tool !== 'none') return
    room.link.current.send({ type: 'reset' })
    input.current.x = 0
    input.current.y = 0
    setRide('approaching')
    setReset((n) => n + 1)
  }

  function openStall(stall: BazaarStall) {
    input.current.x = 0
    input.current.y = 0
    setSelected(stall)
  }

  useEffect(() => {
    if (!entered || portal || directory || selected || collectionOpen || roomOpen || toolsOpen || tool !== 'none') return
    const held = new Set<string>()
    const update = () => {
      input.current.x = ride === 'approaching' ? Number(held.has('KeyD') || held.has('ArrowRight')) - Number(held.has('KeyA') || held.has('ArrowLeft')) : 0
      input.current.y = ride === 'approaching' ? Number(held.has('KeyW') || held.has('ArrowUp')) - Number(held.has('KeyS') || held.has('ArrowDown')) : 0
    }
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target.tagName))
    const down = (event: KeyboardEvent) => {
      if (typing(event.target)) return
      if (event.code === 'KeyE' && (soundOpen || exploreOpen)) return
      if (event.target instanceof HTMLSelectElement && event.code.startsWith('Arrow')) return
      if (event.code === 'KeyE' && !event.repeat && ride === 'riding') {
        event.preventDefault(); setRide('exiting'); return
      }
      if (event.code === 'KeyE' && !event.repeat && ride === 'approaching' && (boardRef.current || pendulumRef.current || boatRef.current) && !selected) {
        event.preventDefault(); boardRide(boardRef.current ? 'wheel' : pendulumRef.current ? 'pendulum' : boatRef.current!); return
      }
      if (ride !== 'approaching') return
      if (event.code === 'KeyE' && !event.repeat && (nearPoint(local.current, OFFER_POINT) || nearPoint(local.current, LIGHT_POINT))) {
        event.preventDefault(); setCollectionOpen(true); return
      }
      if (event.code === 'KeyE' && !event.repeat && nearbyRef.current && !selected) {
        event.preventDefault()
        input.current.x = 0
        input.current.y = 0
        setSelected(nearbyRef.current)
        return
      }
      if (event.code === 'KeyE' && !event.repeat && beggarRef.current) { event.preventDefault(); donateToBeggar(); return }
      if (/^(Key[WASD]|Arrow(Up|Down|Left|Right))$/.test(event.code)) {
        event.preventDefault(); held.add(event.code); update()
      }
    }
    const up = (event: KeyboardEvent) => { held.delete(event.code); update() }
    const blur = () => { held.clear(); update() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); blur() }
  }, [entered, selected, collectionOpen, ride, portal, directory, roomOpen, soundOpen, exploreOpen, toolsOpen, tool])

  return <main className={`experience${sceneFailed ? ' scene-unavailable' : ''}${tool === 'photo' ? ` photo-active${photoHud ? ' photo-hud' : ''}` : tool === 'wardrobe' ? ' wardrobe-active' : ''}`}>
    <audio ref={ceremonyAudio.ref} preload="none" loop data-testid="aarti-audio" />
    <div className="viewport" aria-label="Interactive 3D ghat and Ganga riverfront"
      onPointerDown={(event) => {
        if (!entered || portal || selected || collectionOpen || directory || roomOpen || soundOpen || exploreOpen || toolsOpen || (tool !== 'none' && tool !== 'photo') || event.target !== event.currentTarget.querySelector('canvas')) return
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (portal || selected || directory || roomOpen || soundOpen || exploreOpen || drag.current?.id !== event.pointerId || ride !== 'approaching') return
        if (tool === 'photo') {
          view.current.yaw -= (event.clientX - drag.current.x) * .005
          view.current.pitch = Math.max(-.5, Math.min(.8, view.current.pitch + (event.clientY - drag.current.y) * .003))
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }; return
        }
        input.current.yaw -= (event.clientX - drag.current.x) * 0.005
        input.current.pitch = Math.max(-0.3, Math.min(0.8, input.current.pitch + (event.clientY - drag.current.y) * 0.003))
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
      }}
      onPointerUp={(event) => { if (drag.current?.id === event.pointerId) drag.current = null }}
      onPointerCancel={() => { drag.current = null }}
      onLostPointerCapture={() => { drag.current = null }}>
      <SceneError onFailure={failed}><Suspense fallback={null}>
        {sceneFault ? <SceneFallback retry={() => window.location.reload()} /> : <MelaScene automaticQuality={automaticQuality && quality !== 'low' && entered} onPoorPerformance={lowerQuality}
          onReady={ready} onContextLost={lost} quality={quality} listings={listings} input={input} local={local} room={room.link} appearance={appearance} view={view} capture={capture} gameplay={game.readVisuals} active={entered && !selected && !collectionOpen && !portal && !directory && !roomOpen && !toolsOpen && tool === 'none' && ride === 'approaching'} reset={reset} ride={ride} rideKind={rideKind} fireworks={fireworks} ridePose={ridePose} onRidePhase={setRide} onRideHeight={onRideHeight} onTelemetry={onTelemetry} />}
      </Suspense></SceneError>
      {entered && !sceneReady && !sceneFailed && <SceneLoading />}
    </div>
    <header className="topbar" inert={tool === 'photo'}>
      <div className="brand" aria-label="Banaras Diwali Mela"><span className="brand-mark" aria-hidden="true">✦</span><span>BANARAS <strong>DIWALI MELA</strong><small>AN EVENING ON THE GHATS</small></span></div>
      {entered && <div className="toolbar">
        <button aria-label="Multiplayer" data-testid="multiplayer" data-room={room.code} data-count={room.count} disabled={ride !== 'approaching' || tool !== 'none'} onClick={() => { setSoundOpen(false); setExploreOpen(false); setRoomOpen(true) }}>Together{room.code ? ` ${room.count}/4` : ''}</button>
        <button aria-label="Toggle camera mode" data-testid="camera-toggle" disabled={ride !== 'approaching' || tool !== 'none'} onClick={() => { const next = !firstPerson; setFirstPerson(next); view.current.camera = next ? 'first' : 'third' }}>View: {firstPerson ? 'First' : 'Third'}</button>
        <button aria-label="Visitor tools" aria-expanded={toolsOpen} disabled={ride !== 'approaching' || tool !== 'none'} onClick={() => setToolsOpen(!toolsOpen)}>Visitor tools</button>
        {toolsOpen && <div className="visitor-tools"><button onClick={() => openTool('journey')}>Kashi Journey · {journey.state.completed.length}/5</button><button onClick={() => openTool('rangoli')}>Make a rangoli</button><button onClick={() => openTool('social')}>Festival greetings</button><button onClick={() => openTool('wardrobe')}>Wardrobe</button><button onClick={() => openTool('photo')}>Photo mode</button><button onClick={() => openTool('help')}>Help / controls</button></div>}
        <button className="explore-toggle" aria-expanded={exploreOpen} onClick={() => setExploreOpen(!exploreOpen)}>Explore {exploreOpen ? '−' : '+'}</button>
        <div className={`portal-actions${exploreOpen ? ' portal-actions--open' : ''}`}>
          <button className="portal-nav" onClick={() => openPortal('contribute')}>Contribute</button>
          <button className="portal-nav" onClick={() => openPortal('apply')}>Apply for a stall</button>
          <button className="portal-nav" onClick={() => { input.current.x = 0; input.current.y = 0; refreshListings(); setDirectory(true); setExploreOpen(false) }}>Vendors</button>
        </div>
        <label className="quality">Graphics <select value={automaticQuality ? 'auto' : quality} onChange={(event) => { const next = event.target.value; setAutomaticQuality(next === 'auto'); if (next !== 'auto') setQuality(next as 'low' | 'medium' | 'high') }}><option value="auto">Auto ({quality})</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <button onClick={() => setFireworks(!fireworks)} aria-pressed={fireworks}>Fireworks: {fireworks ? 'On' : 'Off'}</button>
        {!soundOpen && <button className="sound-toggle" aria-expanded={false} onClick={() => setSoundOpen(true)}>Music +</button>}
        <KashiRadio music={ceremonyAudio} sound={festivalSound} open={soundOpen} close={() => setSoundOpen(false)} />
        <button className="desktop-reset" onClick={resetWorld}>Reset</button>
      </div>}
    </header>
    {entered && tool === 'none' && !soundOpen && <button className="collection-toggle" aria-label="Festival collection" data-testid="collection" disabled={ride !== 'approaching'} onClick={() => { setToolsOpen(false); setSoundOpen(false); setExploreOpen(false); setCollectionOpen(true) }}>Gifts {game.state.inventory.flower + game.state.inventory.diya + game.state.inventory.firecracker + game.state.inventory.tasting}</button>}
    {!entered ? <div className="intro-backdrop"><section className="intro" aria-labelledby="intro-title">
      <p className="eyebrow">Banaras Diwali Mela · Dev Deepawali 2026</p>
      <h1 id="intro-title">Where the river<br /><em>holds the light.</em></h1>
      <p>Aao, Banaras ki roshni mein saath chalein. Walk the ghats, offer a diya, and find your festival moment.</p>
      <p>Free to enter. Play in a compatible browser — no separate game installation needed.</p>
      <ActivityHighlights />
      {(invite.code || invite.invalid) && <p role="status">{invite.code ? 'A friend invited you. Enter, then confirm Join room in Together.' : 'This room invitation is invalid. You can still explore solo.'}</p>}
      <div className="entry-choices"><button className="enter" onClick={() => { void ceremonyAudio.toggle(); setEntered(true); setSoundOpen(true); if (invite.code || invite.invalid) setRoomOpen(true) }}>Enter with Sound</button><button className="enter enter-silent" onClick={() => { setEntered(true); if (invite.code || invite.invalid) setRoomOpen(true) }}>Enter Silently</button></div>
      <button className="organiser-link" onClick={() => openTool('help')}>Help / controls</button>
      <p className="entry-status" role="status">{sceneFailed ? '3D unavailable. Enter silently to see compatibility help and screenshots.' : sceneReady ? 'Riverfront ready when you are.' : 'Preparing the riverfront in the background. You can enter while it loads.'}</p>
      <div className="intro-actions"><button onClick={() => openPortal('contribute')}>Contribute ₹21 / ₹31 / ₹51</button><button onClick={() => openPortal('apply')}>Apply for a stall</button></div>
      <p className="disclaimer">Contributions and stall applications require a configured backend. Payment references await manual review; the 3D festival remains free to explore.</p>
      <button className="organiser-link" onClick={() => openPortal('admin')}>Organiser access</button>
    </section></div> : <>
      {ride === 'approaching' && <div className={`scene-label${nearby || boardingNearby || atAarti ? ' scene-label--with-prompt' : ''}`}><span>{atAarti ? '02 / GANGA AARTI' : atBazaar ? '03 / THE BAZAAR' : '01 / THE RIVERFRONT'}</span><strong>{atAarti ? 'Light for the river' : atBazaar ? 'A market of light' : 'Steps to the Ganga'}</strong><small data-testid="coordinates">{location}</small></div>}
      {ride === 'approaching' && atAarti && !selected && <div className="aarti-notice" data-testid="aarti-notice"><strong>Ganga Aarti</strong><small>The riverside ceremony is underway · pause and watch</small></div>}
      {ride === 'approaching' && boardingNearby && !selected && <button className="stall-prompt" onClick={() => boardRide('wheel')}>
        <span className="prompt-key" aria-hidden="true">E</span><span><strong>Board the Ferris wheel</strong><small>Take a ride above the ghats</small></span>
      </button>}
      {ride === 'approaching' && pendulumNearby && !boardingNearby && !selected && <button className="stall-prompt" onClick={() => boardRide('pendulum')}><span className="prompt-key" aria-hidden="true">E</span><span><strong>Board the pendulum</strong><small>Swing above the mela</small></span></button>}
      {ride === 'approaching' && boatNearby && !boardingNearby && !pendulumNearby && !selected && <button className="stall-prompt" onClick={() => boardRide(boatNearby)}><span className="prompt-key" aria-hidden="true">E</span><span><strong>Board the {BOATS[boatNearby].label}</strong><small>River journey · returns to shore</small></span></button>}
      {ride === 'approaching' && nearby && !boardingNearby && !pendulumNearby && !boatNearby && !selected && <button className="stall-prompt" onClick={() => openStall(nearby)}>
        <span className="prompt-key" aria-hidden="true">E</span><span><strong>{nearby.name}</strong><small>{nearby.listing === 'vendor' ? `Published vendor · ${nearby.category}` : `Explore ${nearby.category} · illustrative display`}</small></span>
      </button>}
      {ride === 'approaching' ? <><p className="desktop-hint">W A S D / ARROWS · MOVE <span>—</span> DRAG · LOOK</p>
        <MobileControls input={input} onReset={resetWorld} /></> : <div className="ride-hud" data-testid="ride-state" data-phase={ride}>
        <span>{ride === 'boarding' ? 'Boarding · hold on' : ride === 'exiting' ? 'Returning to the platform…' : rideKind === 'pendulum' ? 'Swinging above the mela' : rideKind === 'ferry' || rideKind === 'cruise' ? `${BOATS[rideKind].label} · river journey` : 'A view above the ghats'}</span>
        {rideKind === 'wheel' && <small>Cabin height <strong data-testid="ride-height">{rideHeight}</strong> m</small>}
        {ride === 'riding' && <button onClick={() => setRide('exiting')}>Exit ride <span aria-hidden="true">· E</span></button>}
      </div>}
    </>}
    {entered && ride === 'approaching' && beggar && !nearby && !boardingNearby && !pendulumNearby && !boatNearby && !portal && !selected && !directory && !roomOpen && !soundOpen && !exploreOpen && !toolsOpen && tool === 'none' && <button className="stall-prompt" data-testid="beggar-prompt" onClick={donateToBeggar}><span className="prompt-key" aria-hidden="true">E</span><span><strong>Talk / support (optional)</strong><small>Ek hello ho jaaye? Tap or press E</small></span></button>}
    {entered && !selected && !portal && !directory && !roomOpen && <Minimap position={mapPlayer.position} heading={mapPlayer.heading} riding={ride !== 'approaching'} listings={listings} obscured={soundOpen || exploreOpen} />}
    {roomOpen && <RoomPanel room={room} close={() => setRoomOpen(false)} />}
    {selected && <StallPanel stall={selected} inventory={game.state.inventory} collect={item => game.act('collect', item)} pending={game.pending} message={game.message} onClose={() => setSelected(null)} />}
    {collectionOpen && <CollectionPanel game={game} offering={offeringNearby} lighting={lightingNearby} close={() => setCollectionOpen(false)} />}
    {entered && ride === 'approaching' && (offeringNearby || lightingNearby) && !selected && !collectionOpen && !portal && !directory && !roomOpen && !soundOpen && !exploreOpen && !toolsOpen && tool === 'none' && <button className="stall-prompt" data-testid="gameplay-prompt" onClick={() => setCollectionOpen(true)}><span className="prompt-key" aria-hidden="true">E</span><span><strong>{offeringNearby ? 'Offer flowers / diya to the Ganga' : 'Light your spark fountain'}</strong><small>Open your festival collection</small></span></button>}
    {portal && <CommercePortal key={portal} section={portal} beggarCaption={beggarCaption} supportLine={supportLine} close={() => { if (beggarCaption) nextTalkAt.current = Date.now() + TALK_COOLDOWN_MS; setPortal(null) }} onPublished={refreshListings} />}
    {tool === 'wardrobe' && <WardrobePanel draft={draftLook} heading={local.current.heading} view={view} change={next => { appearance.current = next; setDraftLook(next) }} cancel={() => closeTool()} apply={() => { setAppliedLook(draftLook); closeTool(draftLook) }} />}
    {tool === 'photo' && <PhotoPanel completed={journey.state.completed} view={view} queue={capture} close={() => closeTool()} hud={photoHud} setHud={setPhotoHud} fireworks={fireworks} />}
    {tool === 'journey' && <JourneyPanel journey={journey} close={() => closeTool()} photo={() => { closeTool(); openTool('photo') }} rangoli={() => { closeTool(); openTool('rangoli') }} />}
    {tool === 'rangoli' && <RangoliPanel close={() => closeTool()} />}
    {tool === 'social' && <SocialPanel room={room} close={() => closeTool()} />}
    {entered && tool !== 'photo' && !sceneFailed && <SocialCues events={room.social} offset={room.link.current.serverOffset} self={room.link.current.self?.id} />}
    {tool === 'help' && <HelpPanel close={() => closeTool()} />}
    {directory && <VendorDirectory listings={listings} close={() => setDirectory(false)} />}
  </main>
}

export function App() {
  return <Routes><Route path="/" element={<Festival />} /></Routes>
}
