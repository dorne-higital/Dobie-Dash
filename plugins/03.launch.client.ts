import { countSession } from '~/logic/ads'
import { dayKey } from '~/logic/missions'

/**
 * Once per launch, after the save has loaded: count the session (between-run ads wait for
 * a few), note the first day played (notifications are asked about later), and re-check
 * purchases with the App Store so a hand-edited save can't keep paid things, and sign in
 * to Game Center.
 */
export default defineNuxtPlugin(() => {
  const player = usePlayerStore()
  countSession(player)
  player.notify.firstDay ??= dayKey(new Date())
  // Not awaited: the game shouldn't wait for the App Store.
  void usePurchases()
    .checkEntitlements()
    .catch(() => {})
  // Reminders are a rolling week, so top them up each launch (only if allowed).
  void useReminders()
    .reschedule()
    .catch(() => {})
  // Game Center sign-in shows Apple's own banner or sheet; no account needed beyond that.
  void useGameCenter()
    .signIn()
    .catch(() => {})
})
