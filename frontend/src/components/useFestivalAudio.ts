import { useEffect, useRef, useState } from 'react'

export const TRACKS = [
  { title: 'Sandhya — original meditative drone', category: 'Original instrumentals', url: 'audio/sandhya-drone.wav', available: true, creator: 'Banaras Diwali Mela procedural composition; not a traditional recording', licence: 'CC0-1.0', licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', source: '' },
  { title: 'Deep ki lau — original quiet melody', category: 'Original instrumentals', url: 'audio/deep-ki-lau.wav', available: true, creator: 'Banaras Diwali Mela procedural composition; not a traditional recording', licence: 'CC0-1.0', licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', source: '' },
  { title: 'Om Navashivam — Kumaon devotional song', category: 'Devotional recordings', url: 'audio/om-navashivam.mp3', available: true, creator: 'Yann (Yann Forget); audio revisions by Fulvio314 and Mitar. Official Commons MP3 transcode; no edits here.', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/w/index.php?title=File:Om_Navashivam,_traditional_hindu_song,_Kumaon,_Uttarakhand,_India.ogg&oldid=631545800' },
  { title: 'Thakil & Nadaswaram — temple Deeparadhana', category: 'Temple instrumentals', url: 'audio/temple-deeparadhana.mp3', available: true, creator: 'Vis M. Official Commons MP3 transcode; no edits here. Not a Banaras/Ganga field recording.', licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/', source: 'https://commons.wikimedia.org/w/index.php?title=File:Thakil_%26_Nadaswaram_during_temple_Deeparadhana.ogg&oldid=1110590040' },
  { title: 'Ganga Aarti — authorised recording needed', category: 'Awaiting permission', url: '', available: false, creator: 'No verified recording supplied. Nothing will be fetched.', licence: 'Not cleared', licenceUrl: '', source: '' },
] as const
export function clampVolume(value: number) { return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.45 }
export function trackIndex(index: number) { return Number.isFinite(index) ? (Math.trunc(index) % TRACKS.length + TRACKS.length) % TRACKS.length : 0 }
export function nextPlayable(index: number, direction: number) {
  for (let offset = 1; offset <= TRACKS.length; offset++) { const next = trackIndex(index + offset * (direction < 0 ? -1 : 1)); if (TRACKS[next].available) return next }
  return 0
}
export function audioPreferences(key: string, fallback = .35) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return { volume: typeof value?.volume === 'number' && Number.isFinite(value.volume) ? clampVolume(value.volume) : fallback, muted: value?.muted === true }
  } catch { return { volume: fallback, muted: false } }
}
export function saveAudioPreferences(key: string, volume: number, muted: boolean) { try { localStorage.setItem(key, JSON.stringify({ volume: clampVolume(volume), muted })) } catch { /* Storage is optional. */ } }
export function audioTime(seconds: number) { const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0; return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}` }

export function useFestivalAudio() {
  const ref = useRef<HTMLAudioElement>(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [preferences] = useState(() => audioPreferences('banaras.audio.music'))
  const [volume, setVolumeState] = useState(preferences.volume)
  const [muted, setMuted] = useState(preferences.muted)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0), [duration, setDuration] = useState(0)
  const generation = useRef(0), wanted = useRef(false), mounted = useRef(false)
  const [status, setStatus] = useState('Ready · sound starts only when you press Play')
  const current = TRACKS[index]
  useEffect(() => {
    const audio = ref.current
    if (!audio) return
    mounted.current = true; audio.volume = preferences.volume; audio.muted = preferences.muted
    const play = () => { if (!wanted.current || document.hidden) { audio.pause(); return }; setPlaying(true); setLoading(false); setStatus(`Playing · ${TRACKS[trackIndex(Number(audio.dataset.track))].title}`) }
    const pause = () => { if (audio.paused) { wanted.current = false; setPlaying(false); setLoading(false) } }
    const wait = () => { if (wanted.current) { setLoading(true); setStatus('Loading audio…') } }
    const error = () => { wanted.current = false; audio.pause(); setLoading(false); setPlaying(false); setStatus('Audio unavailable · retry Play or choose another track. The world still works without sound.') }
    const update = () => { setProgress(Number.isFinite(audio.currentTime) ? audio.currentTime : 0); setDuration(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0) }
    const hidden = () => { if (document.hidden) { generation.current++; wanted.current = false; audio.pause(); setPlaying(false); setLoading(false); setStatus('Paused while this tab is hidden. Press Play to resume.') } }
    audio.addEventListener('playing', play); audio.addEventListener('pause', pause)
    audio.addEventListener('waiting', wait); audio.addEventListener('error', error)
    audio.addEventListener('timeupdate', update); audio.addEventListener('loadedmetadata', update); audio.addEventListener('durationchange', update)
    document.addEventListener('visibilitychange', hidden)
    return () => {
      mounted.current = false; generation.current++; wanted.current = false
      audio.removeEventListener('playing', play); audio.removeEventListener('pause', pause)
      audio.removeEventListener('waiting', wait); audio.removeEventListener('error', error)
      audio.removeEventListener('timeupdate', update); audio.removeEventListener('loadedmetadata', update); audio.removeEventListener('durationchange', update)
      document.removeEventListener('visibilitychange', hidden)
      audio.pause(); audio.removeAttribute('src'); audio.load()
    }
  }, [preferences])
  async function playIndex(next: number, restart = true) {
    const audio = ref.current
    if (!audio) return
    const request = ++generation.current
    const chosen = trackIndex(next)
    if (restart || audio.dataset.track !== String(chosen) || !audio.getAttribute('src')) {
      audio.pause(); setIndex(chosen); setProgress(0); setDuration(0)
      audio.dataset.track = String(chosen)
      if (!TRACKS[chosen].available) { wanted.current = false; setLoading(false); setPlaying(false); audio.removeAttribute('src'); audio.load(); setStatus('Ganga Aarti recording not supplied: distribution permission must be verified first.'); return }
      audio.src = `${import.meta.env.BASE_URL}${TRACKS[chosen].url}`
      audio.load()
    }
    wanted.current = true; setLoading(true); setStatus('Loading audio…')
    try { await audio.play() }
    catch { if (mounted.current && generation.current === request) { wanted.current = false; setLoading(false); setPlaying(false); setStatus('Playback blocked or file missing · press Play to retry. The world remains usable.') } }
  }
  async function toggle() {
    const audio = ref.current
    if (!audio) return
    if (wanted.current || !audio.paused) { generation.current++; wanted.current = false; audio.pause(); setPlaying(false); setLoading(false); setStatus('Paused'); return }
    await playIndex(index, false) // Resume, without resetting elapsed playback.
  }
  function setVolume(next: number) { const value = clampVolume(next); setVolumeState(value); if (ref.current) ref.current.volume = value; saveAudioPreferences('banaras.audio.music', value, muted) }
  function toggleMute() { const next = !muted; if (ref.current) ref.current.muted = next; setMuted(next); saveAudioPreferences('banaras.audio.music', volume, next) }
  function seek(value: number) { if (ref.current && duration > 0 && Number.isFinite(value)) { try { ref.current.currentTime = Math.max(0, Math.min(duration, value)); setProgress(ref.current.currentTime) } catch { setStatus('Seeking is not available yet. Playback remains usable.') } } }
  return { ref, current, index, playing, loading, volume, muted, status, progress, duration, seek, toggle, playIndex, setVolume, toggleMute }
}
