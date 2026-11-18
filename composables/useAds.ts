import { afterRun, needsTrackingPrompt } from '~/logic/ads'
import type { AdPlacement } from '~/services/types'

/**
 * Ads with the rules applied: Apple's tracking prompt once, right before the first ad;
 * rewarded ads only when the player asks; between-run ads only when logic/ads.ts allows.
 */
export function useAds() {
  const { ads, analytics } = useServices()
  const player = usePlayerStore()

  async function trackingFirst() {
    if (!needsTrackingPrompt(player)) return
    player.ads.attAsked = true
    await ads.requestTracking()
  }

  async function rewarded(placement: AdPlacement) {
    await trackingFirst()
    const r = await ads.showRewarded(placement)
    analytics.track('ad_shown', { placement, rewarded: r.rewarded })
    return r.rewarded
  }

  /** Call when a run ends. Shows a between-run ad if the rules allow one. */
  async function betweenRuns(o: { newBest: boolean }) {
    if (!afterRun(player, o)) return false
    await trackingFirst()
    await ads.showInterstitial()
    analytics.track('ad_shown', { placement: 'interstitial', rewarded: false })
    return true
  }

  return { rewarded, betweenRuns }
}
