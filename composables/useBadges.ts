import { claimableCount, refresh } from '~/logic/missions'
import { canAffordSomething } from '~/logic/shop'

/** Leagues reset at local Monday 00:00 (leagues themselves arrive in v1.1). */
export function msToLeagueEnd(now: Date) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  next.setDate(next.getDate() + ((8 - next.getDay()) % 7 || 7))
  return next.getTime() - now.getTime()
}

/** Tab badges: only when there's something to do. */
export function useBadges() {
  const player = usePlayerStore()
  const now = useNow()
  // Deal today's missions before counting (a new day may have started).
  watchEffect(() => refresh(player, now.value))
  return computed(() => ({
    closet: canAffordSomething(player),
    league: msToLeagueEnd(now.value) < 24 * 3600_000,
    missions: claimableCount(player, now.value),
  }))
}
