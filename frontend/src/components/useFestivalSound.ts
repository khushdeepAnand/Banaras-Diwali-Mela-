import { useCallback, useEffect, useRef, useState } from 'react'
import { FestivalSound } from './festivalSound'
import { audioPreferences, clampVolume, saveAudioPreferences } from './useFestivalAudio'
import type { GameplayResult } from '../../../backend/src/shared/gameplay'

export function useFestivalSound() {
  const engine = useRef<FestivalSound | null>(null)
  const [ambiencePrefs, setAmbiencePrefs] = useState(() => audioPreferences('banaras.audio.ambience', .4))
  const [effectsPrefs, setEffectsPrefs] = useState(() => audioPreferences('banaras.audio.effects', .4))
  const [ambience, setAmbience] = useState(false), [effects, setEffects] = useState(false)
  const [ambienceLoading, setAmbienceLoading] = useState(false), [effectsLoading, setEffectsLoading] = useState(false)
  const [status, setStatus] = useState('Original synthesized river, bells and crowd textures. Silent until enabled.')
  const operations = useRef({ ambience: 0, effects: 0 })
  useEffect(() => {
    const stop = () => {
      operations.current.ambience++; operations.current.effects++
      setAmbience(false); setEffects(false); setAmbienceLoading(false); setEffectsLoading(false)
      setStatus('Environment sound paused. Enable it again to resume.')
    }
    const sound = new FestivalSound(stop); engine.current = sound
    const hidden = () => { if (document.hidden) { sound.pause(); stop() } }
    document.addEventListener('visibilitychange', hidden)
    return () => { operations.current.ambience++; operations.current.effects++; document.removeEventListener('visibilitychange', hidden); sound.dispose(); if (engine.current === sound) engine.current = null }
  }, [])
  async function toggle(kind: 'ambience' | 'effects') {
    const sound = engine.current
    if (!sound) return
    const request = ++operations.current[kind]
    if (kind === 'ambience' ? ambience || ambienceLoading : effects || effectsLoading) {
      if (kind === 'ambience') { sound.stopAmbience(); setAmbience(false); setAmbienceLoading(false) }
      else { sound.stopEffects(); setEffects(false); setEffectsLoading(false) }
      setStatus('Environment layer stopped. Music is controlled separately.'); return
    }
    if (kind === 'ambience') setAmbienceLoading(true); else setEffectsLoading(true)
    setStatus('Loading original environment audio…')
    try {
      const prefs = kind === 'ambience' ? ambiencePrefs : effectsPrefs
      const started = await (kind === 'ambience' ? sound.startAmbience(prefs.volume, prefs.muted) : sound.startEffects(prefs.volume, prefs.muted))
      if (engine.current !== sound || operations.current[kind] !== request) return
      if (kind === 'ambience') { setAmbience(started); setAmbienceLoading(false) } else { setEffects(started); setEffectsLoading(false) }
      setStatus(started ? kind === 'ambience' ? 'Original river, bells and abstract crowd textures playing.' : 'Festival effects enabled for your successful gift, offering and fountain actions.' : 'Audio paused by the browser. Enable again to retry.')
    } catch {
      if (engine.current !== sound || operations.current[kind] !== request) return
      if (kind === 'ambience') { sound.stopAmbience(); setAmbience(false); setAmbienceLoading(false) } else { sound.stopEffects(); setEffects(false); setEffectsLoading(false) }
      setStatus('Environment audio unavailable or blocked. Retry enabling it; the game still works silently.')
    }
  }
  function preferences(kind: 'ambience' | 'effects', volume: number, muted: boolean) {
    const next = { volume: clampVolume(volume), muted }
    if (kind === 'ambience') setAmbiencePrefs(next); else setEffectsPrefs(next)
    engine.current?.mix(next.volume, muted, kind); saveAudioPreferences(`banaras.audio.${kind}`, next.volume, muted)
  }
  const onGameplay = useCallback((result: GameplayResult) => { if (result.ok) engine.current?.playEffect(result.event?.item === 'firecracker' ? 'fountain' : result.event ? 'offering' : 'gift') }, [])
  const setZone = useCallback((z: number) => engine.current?.setZone(z), [])
  return { ambience, effects, ambienceLoading, effectsLoading, ambiencePrefs, effectsPrefs, status, toggle, preferences, onGameplay, setZone }
}
