import { useEffect, useRef, useState } from 'react'

// Replace this file only with an authorised recording. The bundled WAV is an original demo chime.
export const AARTI_AUDIO_URL = `${import.meta.env.BASE_URL}audio/aarti-placeholder.wav`
export const DEMO_AUDIO_LABEL = 'Original demo chime · Aarti recording not yet supplied'

export function clampVolume(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.45
}

export function useCeremonyAudio() {
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.45)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const audio = ref.current
    if (!audio) return
    audio.volume = volume
    const onPlay = () => { setPlaying(true); setError('') }
    const onPause = () => setPlaying(false)
    const onError = () => { setPlaying(false); setError('Demo audio could not load. The scene remains available without sound.') }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.pause()
    }
    // One media element persists across ordinary scene and UI rerenders.
  }, [])

  async function toggle() {
    const audio = ref.current
    if (!audio) return
    if (!audio.paused) { audio.pause(); return }
    try {
      await audio.play() // Called only from an explicit visitor action.
    } catch {
      setPlaying(false)
      setError('Demo audio could not play. Check the file or browser permissions; the world still works silently.')
    }
  }

  function setVolume(value: number) {
    const next = clampVolume(value)
    setVolumeState(next)
    if (ref.current) ref.current.volume = next
  }

  function toggleMute() {
    if (ref.current) ref.current.muted = !muted
    setMuted(!muted)
  }

  return { ref, playing, volume, muted, error, toggle, setVolume, toggleMute }
}
