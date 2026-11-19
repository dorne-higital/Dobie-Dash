/**
 * Every analytics event and its properties, in one place (the plan's "Analytics events"
 * table). `track()` only accepts these names with these properties, so the events in
 * Firebase can't drift from what the dashboards expect.
 */
import type { RunSummary } from '~/game/run'

type Value = string | number | boolean

export interface AnalyticsEvents {
  /** Where new players drop off. step: jump | double | biscuits | done. */
  tutorial_step: { step: string; skipped: boolean }
  /** run: the player's run number (1 = first ever). world: start world (0-based). */
  run_start: { run: number; world: number }
  /** Are the world targets right? cause: see runCause(). */
  run_end: { score: number; world: number; cause: string; seconds: number; continues: number }
  /** How many players see each world (0-based), and on which run. */
  world_reached: { world: number; run: number }
  /** Is the continue worth its price? type: what was offered; choice: what they did. */
  continue_offer: { type: string; choice: 'ad' | 'biscuits' | 'declined'; price: number }
  /** Ad income and annoyance. placement: continue | chest | double | interstitial. */
  ad_shown: { placement: string; rewarded: boolean }
  /** Which screens sell. from: the screen the Store or a buy button was opened from. */
  store_view: { from: string }
  purchase: { product: string; from: string }
  /** What players want to wear. price: biscuits or bones, or the App Store price. */
  item_try: { item: string; price: string }
  item_buy: { item: string; price: number; currency: 'biscuits' | 'bones' | 'gbp' }
  /** How boss fights go. result: beaten | escaped (gave up at the target) | caught. */
  boss_fight: { boss: string; result: string; hits: number }
  /** Which power-ups players invest in. level: the level just bought (1–5). */
  upgrade_buy: { power: string; level: number; price: number }
  /** Which missions are too hard. day: days since the player's first day (1 = first). */
  mission_claim: { mission: string; day: number }
  /** Pup Pass engagement (M7). track: free | premium; tier is 1-based. */
  pass_claim: { tier: number; track: string; season: string }
}

export type EventName = keyof AnalyticsEvents
export type EventProps<K extends EventName> = AnalyticsEvents[K] & Record<string, Value>

/** Why a run ended: the boss that caught you, the obstacle you hit, or quitting. */
export function runCause(r: Pick<RunSummary, 'caughtBy' | 'hitBy'>, quit = false): string {
  if (quit) return 'quit'
  if (r.caughtBy) return `boss:${r.caughtBy}`
  if (r.hitBy) return `obstacle:${r.hitBy}`
  return 'unknown'
}

/** Day number since the first day played (1 on the first day). Dates are YYYY-MM-DD. */
export function dayNumber(firstDay: string | null, today: string): number {
  if (!firstDay) return 1
  const ms = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${firstDay}T00:00:00Z`)
  return Math.max(1, Math.floor(ms / 86_400_000) + 1)
}
