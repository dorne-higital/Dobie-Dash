import { describe, expect, it } from 'vitest'
import { shouldAskNotifications, upcomingReminders } from '~/logic/notify'
import { defaultSave } from '~/logic/save'

describe('notifications', () => {
  it('not on the first day, then once from day 2', () => {
    const s = defaultSave()
    s.notify.firstDay = '2026-11-18'
    expect(shouldAskNotifications(s, new Date(2026, 10, 18, 23, 59))).toBe(false)
    expect(shouldAskNotifications(s, new Date(2026, 10, 19, 0, 1))).toBe(true)
    s.notify.asked = true
    expect(shouldAskNotifications(s, new Date(2026, 10, 25))).toBe(false)
  })

  it('a week of morning mission reminders and one Sunday week-end reminder', () => {
    const now = new Date(2026, 10, 18, 12, 0) // Wednesday noon
    const r = upcomingReminders(now)
    const missions = r.filter((x) => x.id < 200)
    const weekEnds = r.filter((x) => x.id >= 200)
    expect(missions).toHaveLength(7)
    expect(missions[0]!.at).toEqual(new Date(2026, 10, 19, 9, 0)) // not today: 9am passed
    expect(weekEnds.map((x) => x.at)).toEqual([new Date(2026, 10, 22, 18, 0)])
    expect(new Set(r.map((x) => x.id)).size).toBe(r.length)
    expect(r.every((x) => x.at > now)).toBe(true)
  })
})
