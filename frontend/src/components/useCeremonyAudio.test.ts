import { describe, expect, it } from 'vitest'
import { clampVolume, DEMO_AUDIO_LABEL } from './useCeremonyAudio'

describe('ceremony audio settings', () => {
  it('clamps volume without allowing invalid values', () => {
    expect(clampVolume(-1)).toBe(0)
    expect(clampVolume(0.4)).toBe(0.4)
    expect(clampVolume(2)).toBe(1)
    expect(clampVolume(Number.NaN)).toBe(0.45)
  })
  it('labels the supplied asset as a demo rather than a devotional recording', () => {
    expect(DEMO_AUDIO_LABEL).toContain('demo')
    expect(DEMO_AUDIO_LABEL).toContain('not yet supplied')
  })
})
