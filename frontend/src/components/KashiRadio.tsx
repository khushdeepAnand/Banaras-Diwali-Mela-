import { audioTime, nextPlayable, TRACKS, type useFestivalAudio } from './useFestivalAudio'
import type { useFestivalSound } from './useFestivalSound'

export function KashiRadio({ music, sound, open, close }: { music: ReturnType<typeof useFestivalAudio>; sound: ReturnType<typeof useFestivalSound>; open: boolean; close: () => void }) {
  return <section className={`audio-tools kashi-radio${open ? ' audio-tools--open' : ''}`} aria-label="Kashi Radio" hidden={!open}>
    <div className="radio-heading"><div><small>AN EVENING OF LIGHT & SOUND</small><h2>Kashi Radio <span>· Dev Deepawali</span></h2></div>{open && <button className="sound-toggle" aria-expanded={true} aria-label="Music −" title="Minimise Kashi Radio" onClick={close}>−</button>}</div>
    <label className="radio-playlist">Music <select aria-label="Music track" value={music.index} onChange={event => void music.playIndex(Number(event.target.value))}>
      {[...new Set(TRACKS.map(track => track.category))].map(category => <optgroup key={category} label={category}>{TRACKS.map((track, index) => track.category === category && <option key={track.title} value={index}>{track.title}</option>)}</optgroup>)}
    </select></label>
    <p className="radio-now"><small>{music.current.category}</small><strong>{music.current.title}</strong></p>
    <label className="radio-seek">Playback progress<input aria-label="Playback progress" type="range" min="0" max={music.duration || 1} step="0.1" value={Math.min(music.progress, music.duration || 1)} disabled={!music.duration} onChange={event => music.seek(Number(event.target.value))} /></label>
    <div className="radio-times"><span data-testid="radio-elapsed">{audioTime(music.progress)}</span><span>{music.duration ? audioTime(music.duration) : '—:—'}</span></div>
    <div className="radio-transport"><button aria-label="Previous track" onClick={() => void music.playIndex(nextPlayable(music.index, -1))}>Previous</button><button className="radio-play" aria-label={music.playing || music.loading ? 'Pause audio' : 'Play audio'} aria-pressed={music.playing} onClick={() => void music.toggle()}>{music.loading ? 'Cancel loading' : music.playing ? 'Pause' : 'Play'}</button><button aria-label="Next track" onClick={() => void music.playIndex(nextPlayable(music.index, 1))}>Next</button></div>
    <div className="radio-mix"><label>Music volume<input aria-label="Audio volume" type="range" min="0" max="1" step="0.05" value={music.volume} onChange={event => music.setVolume(Number(event.target.value))} /></label><button aria-label={music.muted ? 'Unmute audio' : 'Mute audio'} aria-pressed={music.muted} onClick={music.toggleMute}>{music.muted ? 'Unmute' : 'Mute'}</button></div>
    <p className="audio-caption" role="status">{music.status}</p>
    <div className="radio-environment"><h3>Original festival ambience</h3><p>Synthesized river, soft bells and abstract crowd textures — not a field recording.</p>
      {(['ambience', 'effects'] as const).map(kind => {
        const prefs = kind === 'ambience' ? sound.ambiencePrefs : sound.effectsPrefs
        const enabled = kind === 'ambience' ? sound.ambience : sound.effects
        const loading = kind === 'ambience' ? sound.ambienceLoading : sound.effectsLoading
        return <div className="radio-layer" key={kind}>
          <button aria-pressed={enabled} onClick={() => void sound.toggle(kind)} aria-label={`${enabled || loading ? 'Disable' : 'Enable'} ${kind === 'ambience' ? 'ambience' : 'festival effects'}`}>{kind === 'ambience' ? 'Ambience' : 'Festival effects'}: {loading ? 'Loading…' : enabled ? 'On' : 'Off'}</button>
          <div className="radio-mix"><label>{kind === 'ambience' ? 'Ambience' : 'Effects'} volume<input aria-label={`${kind === 'ambience' ? 'Ambience' : 'Effects'} volume`} type="range" min="0" max="1" step="0.05" value={prefs.volume} onChange={event => sound.preferences(kind, Number(event.target.value), prefs.muted)} /></label><button aria-label={`${prefs.muted ? 'Unmute' : 'Mute'} ${kind}`} aria-pressed={prefs.muted} onClick={() => sound.preferences(kind, prefs.volume, !prefs.muted)}>{prefs.muted ? 'Unmute' : 'Mute'}</button></div>
        </div>
      })}
      <p role="status" className="radio-note">{sound.status}</p>
    </div>
    <details className="radio-credits"><summary>Recording credits & external listening</summary><p>{music.current.creator}</p>{music.current.source && <a href={music.current.source} target="_blank" rel="noopener noreferrer">Source and original credit</a>}{music.current.licenceUrl && <> · <a href={music.current.licenceUrl} target="_blank" rel="noopener noreferrer">{music.current.licence}</a></>}<p>Ganga Aarti recording still needs verified distribution permission. No reference-site audio is bundled.</p><a href="https://www.youtube.com/results?search_query=Ganga+Aarti+official+Varanasi" target="_blank" rel="noopener noreferrer">Find official Ganga Aarti recordings on YouTube ↗</a><p>Opens an external provider with its own privacy policy. No YouTube player, cookies or requests load inside this game.</p><a href={`${import.meta.env.BASE_URL}audio/CREDITS.md`} target="_blank" rel="noopener noreferrer">All audio credits and reuse terms</a></details>
  </section>
}
