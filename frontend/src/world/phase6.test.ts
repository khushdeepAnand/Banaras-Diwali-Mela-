import { describe, expect, it } from 'vitest'
import { DESTINATIONS, destinationCue } from './navigation'
import { walkable, SPAWN } from './environment'
import { photoSize } from '../components/photoFinish'
import { QualitySampler } from './adaptiveQuality'

describe('Phase 6 guidance and bounded photos', () => {
  it('downgrades only sustained poor performance without oscillation', () => {
    const sampler = new QualitySampler()
    expect(sampler.sample(.8, false)).toBe(false)
    for (let i = 0; i < 600; i++) expect(sampler.sample(1 / 60, false)).toBe(false)
    let reductions = 0
    for (let i = 0; i < 250; i++) if (sampler.sample(.1, false)) reductions++
    expect(reductions).toBe(1)
    expect(sampler.sample(5, true)).toBe(false)
    expect(sampler.poor).toBe(0)
  })
  it('uses valid scene approaches and existing arrival rules', () => {
    for (const place of DESTINATIONS) {
      expect(walkable(place.point)).toBe(true)
      expect(destinationCue(place.id, place.point, false)).toContain('Arrived:')
      expect(destinationCue(place.id, SPAWN, true)).toContain('Exit your ride')
    }
    expect(destinationCue('river', SPAWN, false)).toContain('up toward the river')
    expect(destinationCue('missing', SPAWN, false)).toContain('unavailable')
  })
  it('never enlarges captures and caps long edge at 1920 pixels', () => {
    expect(photoSize(3840, 2160)).toEqual({ width: 1920, height: 1080 })
    expect(photoSize(390, 844)).toEqual({ width: 390, height: 844 })
    expect(photoSize(2160, 3840)).toEqual({ width: 1080, height: 1920 })
  })
})
