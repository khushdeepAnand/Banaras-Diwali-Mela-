import { useMemo, useState } from 'react'
import type { PublicApplication } from './commerceApi'
import { WALK, type Position } from '../world/environment'
import { DESTINATIONS, destinationCue, landmarks, MAP, mapPose, PATHS } from '../world/navigation'

export function Minimap({ position, heading, riding, listings, obscured }: { position: Position; heading: number; riding: boolean; listings: readonly PublicApplication[]; obscured: boolean }) {
  const [open, setOpen] = useState(() => typeof window === 'undefined' || !window.matchMedia('(max-height: 550px)').matches)
  const places = useMemo(() => landmarks(listings), [listings])
  const [destination, setDestination] = useState('')
  const target = DESTINATIONS.find(place => place.id === destination)
  const cue = destination ? destinationCue(destination, position, riding) : ''
  const pose = mapPose(position, heading)
  return <aside className="minimap" aria-label="Festival navigation" hidden={obscured}>
    <button aria-expanded={open} aria-controls="festival-map" onClick={() => setOpen(!open)}>{open ? 'Hide map' : 'Show map'}</button>
    {open && <div id="festival-map">
      <svg viewBox={`${MAP.minX} ${MAP.minZ} ${MAP.maxX - MAP.minX} ${MAP.maxZ - MAP.minZ}`} role="img" aria-label="Festival map: river above, market and temples below">
        <rect x={MAP.minX} y={MAP.minZ} width={MAP.maxX - MAP.minX} height={MAP.maxZ - MAP.minZ} fill="#12394c" />
        <rect x={WALK.minX} y={WALK.minZ} width={WALK.maxX - WALK.minX} height={WALK.maxZ - WALK.minZ} fill="#53473f" stroke="#b99b7a" strokeWidth="0.3" />
        {PATHS.map((path, i) => <polyline key={i} points={path.map(p => `${p.x},${p.z}`).join(' ')} fill="none" stroke="#c9ad84" strokeWidth="0.6" />)}
        {places.map(place => <circle key={place.id} cx={place.x} cy={place.z} r={place.kind === 'stall' ? 0.6 : 0.9} className={`map-${place.kind}`}><title>{place.name}</title></circle>)}
        {target && <circle cx={target.point.x} cy={target.point.z} r="2" fill="none" stroke="#fff5bb" strokeWidth=".6"><title>Selected: {target.name}</title></circle>}
        <text x="-29" y="-1.6" fill="#d3ecf0" fontSize="2.1">GANGA</text>
        <text x="-6" y="18.8" fill="#ffe0a4" fontSize="1.8">MARKET</text>
        <text x="-29" y="5" fill="#d3c4f2" fontSize="1.7">WEST</text>
        <text x="24" y="5" fill="#d3c4f2" fontSize="1.7">EAST</text>
        <text x="-8.5" y="7" fill="#ffb09a" fontSize="1.7">AARTI</text>
        <text x="-8" y="23" fill="#d3c4f2" fontSize="1.7">TEMPLE COURT</text>
        <g data-testid="map-player" data-x={position.x.toFixed(2)} data-z={position.z.toFixed(2)} data-heading={heading.toFixed(3)} transform={`translate(${pose.x} ${pose.z}) rotate(${pose.angle})`}>
          <circle r="1.5" fill="#102438" stroke="#fff4c8" strokeWidth="0.3" />
          <path d="M 0 -2 L 1.1 1 L 0 0.5 L -1.1 1 Z" fill="#fff4c8" />
        </g>
      </svg>
      <p><span className="map-stall">●</span> Stalls <span className="map-ride">●</span> Rides <span className="map-aarti">●</span> Aarti</p>
      <small>{pose.offMap ? 'River ride — beyond map edge' : riding ? 'On a ride' : 'Arrow: you · River is up'}</small>
      <div className="map-destinations" role="group" aria-label="Find a festival activity">{DESTINATIONS.map(place => <button key={place.id} aria-pressed={destination === place.id} onClick={() => setDestination(destination === place.id ? '' : place.id)}>{place.name}</button>)}</div>
      <p className="map-guidance" role="status" aria-live="polite">{cue}</p>
    </div>}
  </aside>
}
