import type { Appearance } from '../../../backend/src/shared/appearance'

type Shade = 'skin' | 'cloth' | 'trim' | 'pants' | 'hair' | 'white' | 'ink' | 'lip' | 'shoe'
export type AvatarPart = { name: string; geometry: 'box' | 'sphere' | 'cylinder'; x: number; y: number; z: number; w: number; h: number; d: number; shade: Shade; limb?: number; rz?: number; only?: string }
const part = (name: string, geometry: AvatarPart['geometry'], x: number, y: number, z: number, w: number, h: number, d: number, shade: Shade, extra: Partial<AvatarPart> = {}): AvatarPart => ({ name, geometry, x, y, z, w, h, d, shade, ...extra })
// Body faces -Z. Cloth/accessories end BELOW the chin; facial features alone may
// occupy the face. The previous rotated 0.65-wide scarf box crossed the mouth.
export const AVATAR_PARTS: readonly AvatarPart[] = [
  part('kurta', 'cylinder', 0, .95, 0, .32, .8, .235, 'cloth'),
  part('hem', 'box', 0, .57, 0, .57, .06, .38, 'trim'),
  part('neck', 'cylinder', 0, 1.38, 0, .09, .17, .09, 'skin'),
  part('head', 'sphere', 0, 1.66, 0, .195, .25, .185, 'skin'),
  part('scalp', 'sphere', 0, 1.85, .025, .203, .105, .18, 'hair'),
  part('bun', 'sphere', 0, 1.85, .205, .11, .11, .10, 'hair', { only: 'bun' }),
  ...[-1, 1].flatMap(side => [
    part(`ear${side}`, 'sphere', side * .193, 1.65, 0, .045, .07, .04, 'skin'),
    part(`eye${side}`, 'box', side * .072, 1.70, -.184, .072, .038, .02, 'white'),
    part(`iris${side}`, 'box', side * .071, 1.697, -.198, .027, .027, .012, 'ink'),
    part(`brow${side}`, 'box', side * .074, 1.756, -.174, .08, .018, .02, 'hair', { rz: side * .08 }),
    part(`leg${side}`, 'box', side * .14, .31, 0, .17, .56, .19, 'pants', { limb: side }),
    part(`shoe${side}`, 'box', side * .14, .065, -.055, .20, .12, .34, 'shoe', { limb: side }),
    part(`shoe-trim${side}`, 'box', side * .14, .13, -.13, .14, .014, .08, 'trim', { limb: side }),
    part(`sleeve${side}`, 'cylinder', side * .315, 1.02, 0, .09, .51, .09, 'cloth', { limb: -side }),
    part(`hand${side}`, 'sphere', side * .335, .69, -.005, .072, .10, .065, 'skin', { limb: -side }),
    part(`stole${side}`, 'box', side * .155, 1.02, -.246, .09, .50, .035, 'trim', { only: 'stole' }),
    part(`waistcoat${side}`, 'box', side * .16, 1.07, -.21, .23, .48, .055, 'pants', { only: 'waistcoat' }),
    part(`wave${side}`, 'sphere', side * .10, 1.88, -.07, .095, .075, .10, 'hair', { only: 'wavy' }),
  ]),
  part('nose', 'box', 0, 1.625, -.204, .05, .075, .072, 'skin'),
  part('mouth', 'box', 0, 1.525, -.177, .072, .014, .016, 'lip'),
  part('collar', 'box', 0, 1.31, -.205, .15, .055, .035, 'trim'),
  part('placket', 'box', 0, 1.10, -.229, .035, .30, .018, 'trim'),
  part('fold-left', 'box', -.11, .77, -.23, .012, .26, .015, 'trim'),
  part('fold-right', 'box', .11, .77, -.23, .012, .26, .015, 'trim'),
  part('angrakha', 'box', .05, 1.02, -.254, .06, .55, .025, 'trim', { only: 'angrakha', rz: .45 }),
  ...Array.from({ length: 5 }, (_, i) => part(`mala${i}`, 'sphere', (i - 2) * .065, 1.18 - Math.sin(i / 4 * Math.PI) * .10, -.258, .028, .028, .028, 'trim', { only: 'mala' })),
]
export const KURTA_COLOURS = { saffron: '#c66c3d', teal: '#397c78', indigo: '#535886', maroon: '#93485d' }
export function partVisible(part: AvatarPart, appearance: Appearance) {
  return !part.only || part.only === appearance.outfit || part.only === appearance.hair || part.only === appearance.accessory
}
