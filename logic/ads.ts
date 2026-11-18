/**
 * When ads may appear. Rewarded ads are always the player's choice (continue, double
 * biscuits, the 4-hour chest). Between-run (interstitial) ads follow strict rules:
 * none in the first sessions, at most one every few runs, never straight after a new
 * best, and never with Remove Ads. Numbers in content/store.json.
 */
import type { Save } from './save'
import { STORE } from './store'

export type AdState = Pick<Save, 'ads' | 'flags'>

/** Call once per app launch. */
export function countSession(s: AdState) {
  s.ads.sessions++
}

/**
 * Call when a run ends (before showing the results card). Returns whether a between-run
 * ad should show now; if so, the run counter resets.
 */
export function afterRun(s: AdState, o: { newBest: boolean }): boolean {
  s.ads.runsSinceAd++
  const rule = STORE.ads.interstitial
  if (s.flags.removeAds) return false
  if (s.ads.sessions <= rule.minSessions) return false
  if (o.newBest) return false
  if (s.ads.runsSinceAd < rule.everyRuns) return false
  s.ads.runsSinceAd = 0
  return true
}

/** ATT is asked once, just before the first ad of any kind. */
export function needsTrackingPrompt(s: AdState) {
  return !s.ads.attAsked
}
