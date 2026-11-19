import { Capacitor } from '@capacitor/core'
import { createWebServices } from '~/services'
import { createNativeAds } from '~/services/native/ads'
import { createNativeAnalytics } from '~/services/native/analytics'
import { createNativeCrash } from '~/services/native/crash'
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
export default defineNuxtPlugin((nuxtApp) => {
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
    services.analytics = createNativeAnalytics()
    services.crash = createNativeCrash()
  }
  // Any JS error becomes a non-fatal crash report (so it counts against crash-free users).
  const crash = services.crash
  nuxtApp.vueApp.config.errorHandler = (err, _vm, info) => crash.recordError(err, `vue: ${info}`)
  window.addEventListener('error', (e) => crash.recordError(e.error ?? e.message, 'window'))
  window.addEventListener('unhandledrejection', (e) => crash.recordError(e.reason, 'promise'))
  // Browsers only start audio after a user gesture: unlock on the first tap or key.
  const unlock = () => services.audio.unlock()
  window.addEventListener('pointerdown', unlock, { passive: true, capture: true })
  window.addEventListener('keydown', unlock, { capture: true })
  return { provide: { services } }
})
