import { useRef, useState, type PointerEvent } from 'react'
import type { GameInput } from '../world/Player'

export function MobileControls({ input, onReset }: { input: React.RefObject<GameInput>; onReset: () => void }) {
  const pointer = useRef<number | null>(null)
  const origin = useRef({ x: 0, y: 0 })
  const [stick, setStick] = useState({ x: 0, y: 0 })

  function update(event: PointerEvent<HTMLDivElement>) {
    if (pointer.current !== event.pointerId || !input.current) return
    const x = event.clientX - origin.current.x
    const y = event.clientY - origin.current.y
    const length = Math.max(1, Math.hypot(x, y) / 42)
    const next = { x: x / 42 / length, y: -y / 42 / length }
    input.current.x = next.x
    input.current.y = next.y
    setStick(next)
  }

  function stop(event: PointerEvent<HTMLDivElement>) {
    if (pointer.current !== event.pointerId) return
    pointer.current = null
    if (input.current) { input.current.x = 0; input.current.y = 0 }
    setStick({ x: 0, y: 0 })
  }

  return <div className="mobile-controls">
    <div className="joystick" aria-label="Movement joystick" role="group"
      onPointerDown={(event) => {
        if (pointer.current !== null) return
        pointer.current = event.pointerId
        origin.current = { x: event.clientX, y: event.clientY }
        event.currentTarget.setPointerCapture(event.pointerId)
        update(event)
      }}
      onPointerMove={update} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
      <div className="stick" style={{ transform: `translate(${stick.x * 40}px, ${-stick.y * 40}px)` }} />
    </div>
    <div className="mobile-actions"><span>Drag the scene to look</span><button onClick={onReset}>Reset</button></div>
  </div>
}
