import { useCallback, useEffect, useRef, useState } from 'react'
import { applyGameplay, eventAlive, newGameplay, type Action, type GameplayEvent, type GameplayResult } from '../../../backend/src/shared/gameplay'
import type { LocalPresence } from '../world/CrowdScene'
import type { useRoom } from './useRoom'

export type GameplayVisuals = { events: readonly GameplayEvent[]; offset: number }
export function useGameplay(room: ReturnType<typeof useRoom>, local: React.RefObject<LocalPresence>, riding: boolean, onResult?: (result: GameplayResult) => void) {
  const solo = useRef(newGameplay()), soloEvents = useRef<GameplayEvent[]>([])
  const sequence = useRef(0), pendingRequest = useRef<number | null>(null)
  const [revision, setRevision] = useState(0), [pending, setPending] = useState(false)
  const [message, setMessage] = useState('Free session gifts. Solo and room collections are separate; nothing is saved to a database.')
  const visuals = useRef<GameplayVisuals>({ events: [], offset: 0 })
  const shared = !!room.link.current.self
  const state = shared ? room.game ?? newGameplay() : solo.current
  visuals.current.events = shared ? room.link.current.events : soloEvents.current
  visuals.current.offset = shared ? room.link.current.serverOffset : 0
  // Snapshots mutate the existing room link without rerendering App.
  const visualSource = useRef(room.link)
  const readVisuals = useCallback((): GameplayVisuals => {
    const link = visualSource.current.current
    visuals.current.events = link.self ? link.events : soloEvents.current
    visuals.current.offset = link.self ? link.serverOffset : 0
    return visuals.current
  }, [])
  useEffect(() => {
    if (!room.gameResult || room.gameResult.request !== pendingRequest.current) return
    pendingRequest.current = null; setPending(false); setMessage(room.gameResult.message)
    onResult?.(room.gameResult)
  }, [room.gameResult, onResult])
  useEffect(() => {
    pendingRequest.current = null; setPending(false)
    sequence.current = (room.game?.lastRequest ?? -1) + 1
  }, [room.code, room.status === 'Connected'])
  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => { setMessage('No acknowledgement. Actions stay locked until the reply arrives or you reconnect; nothing is consumed locally.') }, 6000)
    return () => clearTimeout(timer)
  }, [pending])
  const act = (action: Action['action'], item: Action['item']) => {
    if (pendingRequest.current !== null) return
    const request = Math.max(sequence.current++, state.lastRequest + 1)
    sequence.current = request + 1
    if (shared) {
      if (!room.link.current.self?.connected || !room.game) { setMessage('Reconnect before using room items. Nothing consumed locally.'); return }
      pendingRequest.current = request; setPending(true); setMessage('Waiting for room acknowledgement…')
      room.link.current.send({ type: 'gameplay', action, item, request })
    } else {
      const now = Date.now()
      soloEvents.current = soloEvents.current.filter(event => eventAlive(event, now))
      const result = applyGameplay(solo.current, { request, action, item }, local.current, riding, now, soloEvents.current, `solo-${request}`)
      solo.current = result.state
      if (result.event) soloEvents.current.push(result.event)
      onResult?.(result)
      setMessage(result.message); setRevision(revision + 1)
    }
  }
  return { state, pending, message, act, readVisuals }
}
