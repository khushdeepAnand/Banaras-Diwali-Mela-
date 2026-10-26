import { validRoomCode } from '../../../backend/src/shared/network'

export const PORTAL_URL = 'https://banarasdiwalimela.kesug.com'
export function invitation(code: string, page: string): string {
  if (!validRoomCode(code)) throw new Error('Invalid room code')
  const url = new URL(page)
  url.search = ''; url.hash = ''; url.username = ''; url.password = ''
  url.searchParams.set('room', code)
  return url.href
}
export function inviteFromSearch(search: string) {
  const codes = new URLSearchParams(search).getAll('room')
  return { code: codes.length === 1 && validRoomCode(codes[0]) ? codes[0] : '', invalid: codes.length > 0 && (codes.length !== 1 || !validRoomCode(codes[0])) }
}
export function whatsappInvite(url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`Banaras mein milte hain! Mela free hai — mere room mein aao: ${url}`)}`
}
