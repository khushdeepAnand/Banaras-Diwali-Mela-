import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { CaptureQueue } from './visitorView'

// Positive priority replaces R3F's automatic draw: exactly ONE final render/frame.
// Read only on request, synchronously after drawing, without preserveDrawingBuffer.
export function CaptureBridge({ queue, onReady }: { queue: React.RefObject<CaptureQueue>; onReady: () => void }) {
  const { gl, scene, camera } = useThree()
  const ready = useRef(false)
  useEffect(() => () => { queue.current.job?.reject(new Error('Scene closed before capture')); queue.current.job = null }, [queue])
  useFrame(() => {
    gl.render(scene, camera)
    if (!ready.current) { ready.current = true; onReady() }
    const job = queue.current.job
    if (!job) return
    queue.current.job = null
    try { gl.domElement.toBlob(blob => blob ? job.resolve(blob) : job.reject(new Error('This browser could not capture the WebGL frame.')), 'image/png') }
    catch { job.reject(new Error('Capture blocked by the browser. No image was saved.')) }
  }, 1)
  return null
}
