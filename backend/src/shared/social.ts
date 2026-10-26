export const EMOTES = {
  namaste: '🙏 Namaste', wave: '👋 Wave', diwali: '🪔 Happy Diwali',
  mahadev: 'Har Har Mahadev', dance: '✦ Celebrate',
} as const
export type Emote = keyof typeof EMOTES
export const EMOTE_LIFE = 3500, EMOTE_COOLDOWN = 4000, GROUP_LIFE = 6000
export type SocialEvent = { id: string; at: number; player: string; emote: Emote | 'group' }
export type DiyaWindow = { started: number; players: Set<string>; celebrated: boolean }
export function newDiyaWindow(): DiyaWindow { return { started: -1, players: new Set(), celebrated: false } }
// Called only after applyGameplay has accepted an actual diya offering.
export function groupDiya(window: DiyaWindow, player: string, now: number, threshold = 3, duration = 30_000): boolean {
  if (window.started < 0 || now - window.started >= duration) { window.started = now; window.players.clear(); window.celebrated = false }
  if (window.celebrated) return false
  window.players.add(player)
  if (window.celebrated || window.players.size < threshold) return false
  window.celebrated = true
  return true
}
