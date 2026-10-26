export const KURTAS = ['saffron', 'teal', 'indigo', 'maroon'] as const
export const OUTFITS = ['kurta', 'waistcoat', 'angrakha'] as const
export const HAIR = ['short', 'wavy', 'bun'] as const
export const ACCESSORIES = ['none', 'stole', 'mala'] as const
export type Appearance = { kurta: typeof KURTAS[number]; outfit: typeof OUTFITS[number]; hair: typeof HAIR[number]; accessory: typeof ACCESSORIES[number] }
export const DEFAULT_APPEARANCE: Appearance = { kurta: 'saffron', outfit: 'kurta', hair: 'short', accessory: 'stole' }
export function validAppearance(value: unknown): value is Appearance {
  if (!value || typeof value !== 'object') return false
  const p = value as Appearance
  return Object.keys(p).length === 4 && KURTAS.includes(p.kurta) && OUTFITS.includes(p.outfit) && HAIR.includes(p.hair) && ACCESSORIES.includes(p.accessory)
}
