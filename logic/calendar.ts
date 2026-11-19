/**
 * Seasonal events (M7), e.g. Winter Walkies: which one is on, and presents saved toward
 * its rewards. Dates and rewards live in content/events.json (Remote Config can move or
 * switch off an event). Pure functions; `now` is passed in.
 */
import raw from '~/content/events.json'
import type { GameEvent } from '~/game/config'
import type { Save } from './save'
import { grant } from './shop'

export const EVENTS = raw.events as GameEvent[]

const DAY = 86_400_000
const utc = (d: string) => Date.parse(`${d}T00:00:00Z`)

export function isOn(e: GameEvent, now: Date) {
  const t = now.getTime()
  return !e.off && t >= utc(e.start) && t < utc(e.end)
}

/** The event on right now, if any. */
export function activeEvent(now: Date, events: GameEvent[] = EVENTS): GameEvent | null {
  return events.find((e) => isOn(e, now)) ?? null
}

/** Whole days until it ends (0 when over). */
export function eventDaysLeft(e: GameEvent, now: Date) {
  return Math.max(0, Math.ceil((utc(e.end) - now.getTime()) / DAY))
}

export type EventState = Pick<Save, 'event' | 'owned' | 'equipped' | 'wallet' | 'player'>

/** This event's progress (a save from another event starts again at zero). */
export function progress(s: EventState, e: GameEvent) {
  return s.event.id === e.id ? s.event.presents : 0
}

/** The next reward still to earn, or null when all are earned. */
export function nextReward(s: EventState, e: GameEvent) {
  const have = progress(s, e)
  return e.rewards.find((r) => r.at > have) ?? null
}

/**
 * Banks a run's presents toward the event and gives any rewards reached. Returns the item
 * ids newly earned.
 */
export function recordPresents(s: EventState, e: GameEvent, n: number): string[] {
  if (s.event.id !== e.id) s.event = { id: e.id, presents: 0, claimed: [] }
  s.event.presents += Math.max(0, Math.floor(n))
  const got: string[] = []
  for (const r of e.rewards)
    if (s.event.presents >= r.at && !s.event.claimed.includes(r.item)) {
      s.event.claimed.push(r.item)
      if (!s.owned.includes(r.item)) {
        grant(s, r.item)
        got.push(r.item)
      }
    }
  return got
}
