import { describe, expect, it } from 'vitest'
import { invitation, inviteFromSearch, whatsappInvite } from './sharing'
import { validRoomCode } from '../../../backend/src/shared/network'

describe('room invitation trust boundary', () => {
  it('accepts only the backend code format and rejects duplicate parameters', () => {
    for (const code of ['', 'abcde12345', 'ABCDEF123', 'ABCDEF12345', '<script>', 'FFFFFFFFFG']) expect(validRoomCode(code)).toBe(false)
    expect(inviteFromSearch('?room=ABCDEF1234')).toEqual({ code: 'ABCDEF1234', invalid: false })
    expect(inviteFromSearch('?room=ABCDEF1234&room=FFFFFFFFFF').invalid).toBe(true)
    expect(inviteFromSearch('?room=garbage').invalid).toBe(true)
    expect(inviteFromSearch('')).toEqual({ code: '', invalid: false })
  })
  it('shares code only, stripping unrelated query, fragment and credentials', () => {
    const url = invitation('ABCDEF1234', 'https://user:password@example.org/?private=value#fragment')
    expect(url).toBe('https://example.org/?room=ABCDEF1234')
    expect(decodeURIComponent(whatsappInvite(url))).toContain(url)
    expect(() => invitation('invalid', 'https://example.org')).toThrow('Invalid room code')
  })
})
