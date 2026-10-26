import type { Position } from './environment'
import type { PublicApplication } from '../components/commerceApi'
import { STALL_INTERACT_RADIUS, STALL_INTERACT_Z } from '../../../backend/src/shared/gameplay'

export type StallKind = 'silk' | 'diya' | 'flowers' | 'food' | 'brass' | 'sweets'

export type BazaarStall = {
  id: string
  kind: StallKind
  name: string
  category: string
  description: string
  products: readonly { name: string; price: string }[]
  x: number
  color: string
  trim: string
  listing?: 'vendor' | 'sample'
  expiresAt?: string | null
}

// Decorative scene fixtures only; these IDs do not represent rentable units or inventory.
export const BAZAAR_STALLS: readonly BazaarStall[] = [
  { id: 'silk-001', kind: 'silk', name: 'Kashi Silk House', category: 'Banarasi silk', description: 'A glimpse of Banaras weaving: jewel-toned folds, intricate borders and draped sarees.', products: [{ name: 'Woven silk stole', price: '₹1,200' }, { name: 'Banarasi saree', price: '₹4,800' }], x: -16, color: '#723044', trim: '#e3ac69' },
  { id: 'diya-001', kind: 'diya', name: 'Deep Jyoti', category: 'Diyas & decorations', description: 'Hand-shaped clay lamps, glowing lanterns and festive details for the season of light.', products: [{ name: 'Clay diya set', price: '₹180' }, { name: 'Festival lantern', price: '₹450' }], x: -9.6, color: '#a25332', trim: '#ffcd73' },
  { id: 'flowers-001', kind: 'flowers', name: 'Phool Gali', category: 'Flowers & puja', description: 'Marigold garlands, flower baskets and small brass-colored ritual objects.', products: [{ name: 'Marigold garland', price: '₹120' }, { name: 'Puja flower basket', price: '₹250' }], x: -3.2, color: '#9b512e', trim: '#f5b34d' },
  { id: 'food-001', kind: 'food', name: 'Ghat Chaat', category: 'Banarasi food', description: 'An imagined street-food counter with steaming pots and favorites inspired by the lanes of Kashi.', products: [{ name: 'Tamatar chaat', price: '₹90' }, { name: 'Kachori sabzi', price: '₹110' }], x: 3.2, color: '#86402f', trim: '#eabc76' },
  { id: 'brass-001', kind: 'brass', name: 'Kashi Kansa', category: 'Brass handicrafts', description: 'Warm metal vessels and handcrafted decorative pieces on timber shelves.', products: [{ name: 'Brass diya stand', price: '₹580' }, { name: 'Engraved vessel', price: '₹1,350' }], x: 9.6, color: '#465a55', trim: '#eac37a' },
  { id: 'sweets-001', kind: 'sweets', name: 'Mithai & Lassi', category: 'Sweets & lassi', description: 'A sweet shop with trays of colorful mithai and tall clay cups of lassi.', products: [{ name: 'Assorted mithai box', price: '₹320' }, { name: 'Sweet lassi', price: '₹80' }], x: 16, color: '#6f4967', trim: '#f4be94' },
]

export const MARKET_KIOSKS: readonly BazaarStall[] = [
  { id: 'souvenirs-001', kind: 'brass', name: 'Kashi Keepsakes', category: 'Souvenirs & folk art', description: 'A festival display of hand-painted keepsakes and miniature craftwork inspired by the ghats.', products: [{ name: 'Painted river keepsake', price: '₹240' }, { name: 'Small craft ornament', price: '₹390' }], x: -20.4, color: '#485969', trim: '#e6b58c', listing: 'sample' },
  { id: 'craft-001', kind: 'diya', name: 'Mitti & Rang', category: 'Clay handicrafts', description: 'A compact artisan counter with patterned clay lamps, painted tiles and festive colour.', products: [{ name: 'Patterned clay lamp', price: '₹210' }, { name: 'Painted tile', price: '₹360' }], x: 20.4, color: '#9b5643', trim: '#f3c879', listing: 'sample' },
]

export function kioskStalls(listings: readonly PublicApplication[] = []): BazaarStall[] {
  return MARKET_KIOSKS.map((sample, index) => {
    const vendor = listings.filter(item => item.published)[index]
    if (!vendor) return sample
    const kind: StallKind = /textile|silk|cloth|weav/i.test(vendor.category) ? 'silk' : /flower|puja/i.test(vendor.category) ? 'flowers' : /food|snack/i.test(vendor.category) ? 'food' : /sweet/i.test(vendor.category) ? 'sweets' : /clay|diya/i.test(vendor.category) ? 'diya' : 'brass'
    return { ...sample, id: vendor.reference, kind, name: vendor.stallName, category: vendor.category, description: vendor.description,
      products: vendor.products.map(name => ({ name, price: 'Ask vendor' })), listing: 'vendor', expiresAt: vendor.expiresAt }
  })
}

export const STALL_CENTER_Z = 16.65
export const STALL_FRONT_Z = 15
export const INTERACT_Z = STALL_INTERACT_Z
export const INTERACT_RADIUS = STALL_INTERACT_RADIUS

export function nearestStall(position: Position, listings: readonly PublicApplication[] = []): BazaarStall | null {
  let nearest: BazaarStall | null = null
  let distance = INTERACT_RADIUS ** 2
  for (const stall of [...BAZAAR_STALLS, ...kioskStalls(listings)]) {
    const next = (position.x - stall.x) ** 2 + (position.z - INTERACT_Z) ** 2
    if (next < distance) { nearest = stall; distance = next }
  }
  return nearest
}
