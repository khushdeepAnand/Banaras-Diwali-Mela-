import type { Activity } from '../../../backend/src/shared/gameplay'
export const ACTIVITIES: { id: Activity; icon: string; name: string; next: string }[] = [
  { id: 'marigolds', icon: '❀', name: 'Marigolds for the evening', next: 'Visit the flower stall in the bazaar and collect marigolds.' },
  { id: 'ganga', icon: '🪔', name: 'An offering to Ganga', next: 'Carry flowers or a diya to the central river steps. Open Gifts to offer.' },
  { id: 'fountain', icon: '✦', name: 'Your spark of joy', next: 'Collect a spark fountain at the diya stall, then light it at the central marked pad.' },
  { id: 'wheel', icon: '☸', name: 'Above the ghats', next: 'Walk to the Ferris wheel platform and take a ride.' },
  { id: 'chaat', icon: '◉', name: 'A taste of Banaras', next: 'Visit the food stall and collect the free imagined Banarasi tasting.' },
]
export const JOURNEY_KEY = 'banaras-kashi-journey'
export type Journey = { version: 1; completed: Activity[] }
export function emptyJourney(): Journey { return { version: 1, completed: [] } }
export function parseJourney(raw: string | null): Journey {
  if (!raw || raw.length > 2048) return emptyJourney()
  try {
    const value = JSON.parse(raw)
    // No previous published journey schema exists. Unknown versions reset only this feature.
    if (!value || value.version !== 1 || !Array.isArray(value.completed) || value.completed.length > 5 || !value.completed.every((id: unknown) => ACTIVITIES.some(a => a.id === id))) return emptyJourney()
    return { version: 1, completed: [...new Set<Activity>(value.completed)] }
  } catch { return emptyJourney() }
}
export function completeActivity(state: Journey, id: Activity): Journey {
  return !ACTIVITIES.some(a => a.id === id) || state.completed.includes(id) ? state : { ...state, completed: [...state.completed, id] }
}
