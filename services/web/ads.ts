import type { AdsService } from '../types'

/** Fake rewarded ads: always ready, "plays" for a second, always rewards. */
export function createWebAds(): AdsService {
  return {
    async isRewardedReady() {
      return true
    },
    async showRewarded() {
      await new Promise((r) => setTimeout(r, 1000))
      return { rewarded: true }
    },
  }
}
