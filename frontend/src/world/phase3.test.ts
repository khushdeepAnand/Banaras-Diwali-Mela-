import { expect, it } from 'vitest'
import { AVATAR_PARTS, partVisible } from './avatarParts'
import { DEFAULT_APPEARANCE, validAppearance } from '../../../backend/src/shared/appearance'
import { cameraPointBlocked, clearCameraFraction } from './cameraCollision'
import { PHOTO_PRESETS } from './visitorView'
import { SUPPORT_LINES, TALK_COOLDOWN_MS } from '../components/dialogue'

it('removes the actual mouth-intersecting scarf while retaining small facial features', () => {
  const legacyScarfTop = 1.32 + .24 * Math.cos(.35) + .05 * Math.sin(.35)
  const mouth = AVATAR_PARTS.find(p => p.name === 'mouth')!
  expect(legacyScarfTop).toBeGreaterThan(mouth.y)
  expect(mouth.w).toBeLessThan(.1)
  for (const p of AVATAR_PARTS.filter(p => p.shade === 'trim')) {
    const top = p.y + (p.geometry === 'sphere' ? p.h : p.h / 2)
    expect(top, p.name).toBeLessThan(1.41) // actual head/chin boundary
  }
  for (const name of ['head', 'nose', 'mouth', 'eye-1', 'eye1', 'brow-1', 'brow1', 'ear-1', 'ear1']) expect(AVATAR_PARTS.some(p => p.name === name)).toBe(true)
})
it('uses allowlisted appearance IDs and distinct meaningful outfit parts', () => {
  expect(validAppearance(DEFAULT_APPEARANCE)).toBe(true)
  expect(validAppearance({ ...DEFAULT_APPEARANCE, hair: 'https://bad.example/model.glb' })).toBe(false)
  expect(validAppearance({ ...DEFAULT_APPEARANCE, url: '/model' })).toBe(false)
  const coat = AVATAR_PARTS.find(p => p.name === 'waistcoat1')!
  expect(partVisible(coat, DEFAULT_APPEARANCE)).toBe(false)
  expect(partVisible(coat, { ...DEFAULT_APPEARANCE, outfit: 'waistcoat' })).toBe(true)
})
it('shortens camera segments at actual stall/pillar envelopes and keeps preset eyes clear', () => {
  expect(clearCameraFraction({ x: -16, y: 4, z: 10.5 }, { x: -16, y: 4, z: 17 })).toBeLessThan(.5)
  expect(clearCameraFraction({ x: 0, y: 3, z: 7 }, { x: 0, y: 5, z: 11 })).toBe(1)
  expect(cameraPointBlocked({ x: -16, y: 5, z: 16.65 })).toBe(true)
  for (const preset of Object.values(PHOTO_PRESETS)) expect(cameraPointBlocked({ x: preset.eye[0], y: preset.eye[1], z: preset.eye[2] }), preset.label).toBe(false)
})
it('keeps the signature in a family-friendly non-spamming interaction rotation', () => {
  expect(SUPPORT_LINES[0]).toBe('dedo yaawwrr cmon')
  expect(new Set(SUPPORT_LINES).size).toBe(SUPPORT_LINES.length)
  expect(TALK_COOLDOWN_MS).toBeGreaterThanOrEqual(1000)
  expect(SUPPORT_LINES.every(line => line.length < 100)).toBe(true)
})
