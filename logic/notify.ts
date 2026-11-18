/**
 * Reminders: asked about from the player's second day (never at first launch), then a
 * morning "new missions" nudge each day and a Sunday "your week ends tonight" nudge.
 * Times in content/store.json (notifications). Pure: `now` is passed in.
 */
import { dayKey } from './missions'
import type { Save } from './save'
import { STORE } from './store'

export type NotifyState = Pick<Save, 'notify'>

/** Ask once, on or after day `askOnDay` of play (day 1 is the first day played). */
export function shouldAskNotifications(s: NotifyState, now: Date) {
  if (s.notify.asked || !s.notify.firstDay) return false
  const [y, m, d] = s.notify.firstDay.split('-').map(Number) as [number, number, number]
  const first = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = Math.round((today.getTime() - first.getTime()) / 86_400_000) + 1
  return day >= STORE.notifications.askOnDay
}

function at(base: Date, hhmm: string, addDays = 0) {
  const [h, m] = hhmm.split(':').map(Number) as [number, number]
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + addDays, h, m)
}

export interface Reminder {
  id: number
  title: string
  body: string
  at: Date
}

/** The next week of reminders, from `now`. Rescheduled at every launch. */
export function upcomingReminders(now: Date, days = 7): Reminder[] {
  const cfg = STORE.notifications
  const out: Reminder[] = []
  for (let i = 0; i <= days; i++) {
    const missions = at(now, cfg.missionsAt, i)
    if (missions > now && out.filter((r) => r.id < 200).length < days)
      out.push({
        id: 100 + i,
        title: 'New missions are in 🐾',
        body: 'Three fresh missions, and your daily chest is waiting.',
        at: missions,
      })
    const weekEnd = at(now, cfg.weekEndsAt, i)
    if (weekEnd.getDay() === 0 && weekEnd > now)
      out.push({
        id: 200 + i,
        title: 'Your week ends tonight',
        body: 'Last chance to finish this week’s goal before it resets.',
        at: weekEnd,
      })
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime())
}

export { dayKey }
