import { Capacitor } from '@capacitor/core'
import { createWebServices } from '~/services'
import { createNativeAds } from '~/services/native/ads'
import { createNativeGameCenter } from '~/services/native/gamecenter'
import { createNativeHaptics } from '~/services/native/haptics'
import { createNativeIap } from '~/services/native/iap'
import { createNativeNotify } from '~/services/native/notify'
import { createNativeSave } from '~/services/native/save'

const TEST_AD_PREFIX = 'ca-app-pub-3940256099942544/'

/**
 * Registers the service implementations: web fakes everywhere, with native versions
 * swapped in when running inside the iOS app (Capacitor).
 */
export default defineNuxtPlugin(() => {
  const services = createWebServices({ debug: import.meta.dev })
  if (Capacitor.isNativePlatform()) {
    const cfg = useRuntimeConfig().public
    services.haptics = createNativeHaptics()
    services.save = createNativeSave()
    services.iap = createNativeIap(cfg.revenuecatKey)
    services.ads = createNativeAds({
      rewarded: cfg.admobRewarded,
      interstitial: cfg.admobInterstitial,
      testing: cfg.admobRewarded.startsWith(TEST_AD_PREFIX),
    })
    services.gamecenter = createNativeGameCenter()
    services.notify = createNativeNotify()
  }
  // Browsers only start audio after a user gesture: unlock on the first tap or key.
  const unlock = () => services.audio.unlock()
  window.addEventListener('pointerdown', unlock, { passive: true, capture: true })
  window.addEventListener('keydown', unlock, { capture: true })
  return { provide: { services } }
})
