import { ACTIVITIES } from './journey'
import type { Activity } from '../../../backend/src/shared/gameplay'
export function photoSize(width: number, height: number) {
  const scale = Math.min(1, 1920 / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

// Decorate only the existing scene PNG. DOM, room codes and organiser UI never enter it.
export async function finishPhoto(blob: Blob, frame: boolean, completed?: readonly Activity[]): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  try {
    const size = photoSize(bitmap.width, bitmap.height)
    canvas.width = size.width; canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Photo preview unavailable. Try another browser.')
    context.drawImage(bitmap, 0, 0, size.width, size.height)
    const font = Math.max(12, Math.round(size.width / 65)), padding = Math.max(10, Math.round(size.width / 80))
    context.fillStyle = '#0b1830cc'
    context.fillRect(0, size.height - font * 3 - padding, size.width, font * 3 + padding)
    context.fillStyle = '#ffe1a5'; context.font = `600 ${font}px sans-serif`
    context.fillText('Banaras Diwali Mela', padding, size.height - padding - font * 1.3)
    context.font = `${font}px sans-serif`
    context.fillText('banarasdiwalimela.kesug.com', padding, size.height - padding)
    if (frame) {
      context.strokeStyle = '#f9c789'; context.lineWidth = Math.max(2, size.width / 500)
      context.strokeRect(padding / 2, padding / 2, size.width - padding, size.height - padding)
      context.fillStyle = '#0b1830dd'; context.fillRect(0, 0, size.width, font * 2.5 + padding)
      context.fillStyle = '#ffe1a5'; context.font = `600 ${font * 1.3}px serif`
      context.fillText('Dev Deepawali 2026', padding, font * 1.7 + padding / 2)
    }
    if (completed) {
      const labels = ACTIVITIES.filter(a => completed.includes(a.id))
      const line = font * 1.5, top = Math.max(font * 4, size.height - (labels.length + 4) * line - padding)
      context.fillStyle = '#0b1830'; context.fillRect(0, top, size.width, size.height - top)
      context.fillStyle = '#ffe1a5'; context.font = `600 ${font * 1.2}px serif`
      context.fillText(`My Kashi Evening · ${labels.length}/5 local stamps`, padding, top + line)
      context.font = `${font}px sans-serif`
      labels.forEach((a, i) => context.fillText(`✓ ${a.name}`, padding, top + (i + 2) * line, size.width - 2 * padding))
      context.fillText('Dev Deepawali 2026 · banarasdiwalimela.kesug.com', padding, size.height - padding, size.width - 2 * padding)
    }
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(image => image ? resolve(image) : reject(new Error('Photo processing failed. Retry capture.')), 'image/png'))
  } finally { bitmap.close(); canvas.width = 1; canvas.height = 1 }
}
