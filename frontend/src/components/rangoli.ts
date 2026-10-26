export type Dot = { x: number; y: number }
export type Stroke = { colour: string; points: Dot[] }
export const PALETTE = ['#f9c66d', '#f58b92', '#70c9bf', '#ebe2ca', '#b3a0df']
export const SYMMETRY = 8, MAX_STROKES = 160, MAX_POINTS = 600
export function mirrors(point: Dot): Dot[] {
  return Array.from({ length: SYMMETRY }, (_, i) => {
    const angle = i * Math.PI * 2 / SYMMETRY, x = point.x - .5, y = point.y - .5
    return { x: .5 + x * Math.cos(angle) - y * Math.sin(angle), y: .5 + x * Math.sin(angle) + y * Math.cos(angle) }
  })
}
export function renderRangoli(canvas: HTMLCanvasElement, strokes: readonly Stroke[], starter: 'none' | 'lotus' | 'rings', pixels: number) {
  if (canvas.width !== pixels) canvas.width = pixels
  if (canvas.height !== pixels) canvas.height = pixels
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#10272f'; ctx.fillRect(0, 0, pixels, pixels)
  ctx.strokeStyle = '#f9c66d'; ctx.lineWidth = pixels * .004
  if (starter !== 'none') {
    for (let i = 0; i < 8; i++) {
      ctx.save(); ctx.translate(pixels / 2, pixels / 2); ctx.rotate(i * Math.PI / 4)
      ctx.beginPath()
      if (starter === 'lotus') ctx.ellipse(0, -pixels * .17, pixels * .065, pixels * .17, 0, 0, Math.PI * 2)
      else ctx.arc(0, -pixels * .2, pixels * .12, 0, Math.PI * 2)
      ctx.stroke(); ctx.restore()
    }
  }
  ctx.lineWidth = pixels * .012; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (const stroke of strokes) {
    ctx.strokeStyle = stroke.colour; ctx.fillStyle = stroke.colour
    for (let i = 0; i < SYMMETRY; i++) {
      const angle = i * Math.PI * 2 / SYMMETRY, cos = Math.cos(angle), sin = Math.sin(angle)
      ctx.beginPath()
      stroke.points.forEach((p, index) => {
        const x = (.5 + (p.x - .5) * cos - (p.y - .5) * sin) * pixels
        const y = (.5 + (p.x - .5) * sin + (p.y - .5) * cos) * pixels
        if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y)
      })
      ctx.stroke()
      if (stroke.points.length === 1) { const p = mirrors(stroke.points[0])[i]; ctx.beginPath(); ctx.arc(p.x * pixels, p.y * pixels, pixels * .006, 0, Math.PI * 2); ctx.fill() }
    }
  }
}
