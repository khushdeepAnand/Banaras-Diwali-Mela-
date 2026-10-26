import { afterEach, expect, it, vi } from 'vitest'
import { audioPreferences, audioTime, clampVolume, nextPlayable, saveAudioPreferences, trackIndex, TRACKS } from './useFestivalAudio'
afterEach(() => vi.unstubAllGlobals())
it('clamps volume and wraps playlist indices safely', () => {
  expect(clampVolume(3)).toBe(1); expect(clampVolume(-1)).toBe(0)
  expect(trackIndex(-1)).toBe(TRACKS.length - 1)
  expect(TRACKS.filter(t => t.available)).toHaveLength(4)
  expect(TRACKS.filter(t => t.available).every(t => t.licenceUrl && t.url.startsWith('audio/'))).toBe(true)
  expect(TRACKS.find(t => t.title.startsWith('Ganga Aarti'))?.available).toBe(false)
  expect(TRACKS.some(t => /demo chime/i.test(t.title))).toBe(false)
  expect(trackIndex(Number.NaN)).toBe(0)
  expect(nextPlayable(3, 1)).toBe(0); expect(nextPlayable(0, -1)).toBe(3)
})
it('handles unavailable/corrupt preferences and stores only levels/mute, never playback state', () => {
  vi.stubGlobal('localStorage', { getItem: () => '{broken', setItem: vi.fn() })
  expect(audioPreferences('test')).toEqual({ volume: .35, muted: false })
  localStorage.getItem = () => JSON.stringify({ volume: 4, muted: true, playing: true, token: 'not-persisted' })
  expect(audioPreferences('test')).toEqual({ volume: 1, muted: true })
  saveAudioPreferences('test', .2, true)
  expect(localStorage.setItem).toHaveBeenCalledWith('test', '{"volume":0.2,"muted":true}')
  localStorage.getItem = () => { throw new Error('Storage denied') }
  expect(audioPreferences('test').volume).toBe(.35)
})
it('formats finite progress without NaN or negative times', () => {
  expect(audioTime(125.4)).toBe('2:05'); expect(audioTime(Infinity)).toBe('0:00'); expect(audioTime(-3)).toBe('0:00')
})
