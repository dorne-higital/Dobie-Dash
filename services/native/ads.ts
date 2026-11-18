/**
 * AdMob (through @capacitor-community/admob): rewarded ads the player chooses, and
 * between-run interstitials when logic/ads.ts allows one. Ad unit ids come from the build
 * (Codemagic env vars); the defaults are Google's public test units, so nothing real is in
 * the repo. Apple's tracking prompt (ATT) is asked once, just before the first ad.
 */
import type { PluginListenerHandle } from '@capacitor/core'
import type { AdsService } from '../types'

export interface AdUnits {
  rewarded: string
  interstitial: string
  /** True while using Google's test units. */
  testing: boolean
}

async function sdk() {
  const m = await import('@capacitor-community/admob')
  return { AdMob: m.AdMob, RewardEvents: m.RewardAdPluginEvents }
}

export function createNativeAds(units: AdUnits): AdsService {
  let ready: Promise<void> | null = null
  const init = () =>
    (ready ??= (async () => {
      const { AdMob } = await sdk()
      await AdMob.initialize({ initializeForTesting: units.testing })
    })().catch((e) => {
      ready = null
      throw e
    }))

  return {
    async requestTracking() {
      try {
        const { AdMob } = await sdk()
        const { status } = await AdMob.trackingAuthorizationStatus()
        if (status === 'notDetermined') await AdMob.requestTrackingAuthorization()
      } catch {
        /* older iOS or not available: ads still work, just not personalised */
      }
    },

    async showRewarded() {
      const handles: PluginListenerHandle[] = []
      try {
        await init()
        const { AdMob, RewardEvents } = await sdk()
        let rewarded = false
        const done = new Promise<void>((resolve) => {
          void AdMob.addListener(RewardEvents.Rewarded, () => (rewarded = true)).then((h) =>
            handles.push(h),
          )
          void AdMob.addListener(RewardEvents.Dismissed, () => resolve()).then((h) =>
            handles.push(h),
          )
          void AdMob.addListener(RewardEvents.FailedToShow, () => resolve()).then((h) =>
            handles.push(h),
          )
        })
        await AdMob.prepareRewardVideoAd({ adId: units.rewarded, isTesting: units.testing })
        // Resolves only when the reward is earned, so wait for the ad to close instead.
        AdMob.showRewardVideoAd().catch(() => {})
        await done
        return { rewarded }
      } catch {
        return { rewarded: false } // no fill / offline: the caller says "no ad right now"
      } finally {
        for (const h of handles) void h.remove()
      }
    },

    async showInterstitial() {
      try {
        await init()
        const { AdMob } = await sdk()
        await AdMob.prepareInterstitial({ adId: units.interstitial, isTesting: units.testing })
        await AdMob.showInterstitial()
      } catch {
        /* no fill: skip it */
      }
    },
  }
}
