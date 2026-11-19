/**
 * Weekend Cups (M7): on from Friday 00:00 to Monday 00:00 UTC. The same rule as the
 * database's current_cup() (supabase/migrations/20261120090000_cups.sql); the app uses it
 * to skip asking the server on Monday to Thursday. `now` is passed in.
 */
const DAY = 86_400_000

/** The Friday (YYYY-MM-DD, UTC) of the cup on now, or null on Monday to Thursday. */
export function cupFriday(now: Date): string | null {
  const dow = now.getUTCDay() // 0 Sunday … 5 Friday, 6 Saturday
  const back = dow === 5 ? 0 : dow === 6 ? 1 : dow === 0 ? 2 : -1
  if (back < 0) return null
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - back * DAY,
  )
  return d.toISOString().slice(0, 10)
}

/** When a cup that started on `friday` ends (Monday 00:00 UTC), epoch ms. */
export function cupEnds(friday: string) {
  return Date.parse(`${friday}T00:00:00Z`) + 3 * DAY
}
