import type { AdsService } from '../types'

/** Web: no ad network. Rewarded "ads" play for a second and always reward. */
export function createWebAds(): AdsService {
  return {
    async requestTracking() {},
    async showRewarded() {
      await new Promise((r) => setTimeout(r, 1000))
      return { rewarded: true }
    },
    async showInterstitial() {},
  }
}
