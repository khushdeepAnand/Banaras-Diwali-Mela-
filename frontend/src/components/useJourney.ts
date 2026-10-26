import { useCallback, useEffect, useRef, useState } from 'react'
import type { Activity, GameplayResult } from '../../../backend/src/shared/gameplay'
import { completeActivity, emptyJourney, JOURNEY_KEY, parseJourney } from './journey'
export function useJourney() {
  const [loaded] = useState(() => {
    try { return { state: parseJourney(localStorage.getItem(JOURNEY_KEY)), available: true } }
    catch { return { state: emptyJourney(), available: false } }
  })
  const [state, setState] = useState(loaded.state), [available, setAvailable] = useState(loaded.available)
  const current = useRef(state)
  const save = useCallback((next: typeof state) => {
    current.current = next; setState(next)
    try { localStorage.setItem(JOURNEY_KEY, JSON.stringify(next)); setAvailable(true) } catch { setAvailable(false) }
  }, [])
  const complete = useCallback((id: Activity) => { const next = completeActivity(current.current, id); if (next !== current.current) save(next) }, [save])
  const result = useCallback((value: GameplayResult) => { if (value.ok && value.activity) complete(value.activity) }, [complete])
  useEffect(() => {
    const changed = (event: StorageEvent) => { if (event.key === JOURNEY_KEY || event.key === null) { const next = parseJourney(event.newValue); current.current = next; setState(next) } }
    window.addEventListener('storage', changed)
    return () => window.removeEventListener('storage', changed)
  }, [])
  return { state, available, complete, result, reset: () => save(emptyJourney()) }
}
