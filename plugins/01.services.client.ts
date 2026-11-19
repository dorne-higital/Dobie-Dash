import { Capacitor } from '@capacitor/core'
import items from '~/content/items.json'
import store from '~/content/store.json'
import worlds from '~/content/worlds.json'
import { applyOverrides, type ContentFiles } from '~/logic/remote'
import { createWebServices } from '~/services'
import { createNativeAds } from '~/services/native/ads'
import { createNativeAnalytics } from '~/services/native/analytics'
import { createNativeConfig } from '~/services/native/config'
import { createNativeCrash } from '~/services/native/crash'
import { createNativeGameCenter } from '~/services/native/gamecenter'
import { createNativeHaptics } from '~/services/native/haptics'
import { createNativeIap } from '~/services/native/iap'
import { createNativeNotify } from '~/services/native/notify'
import { createNativeSave } from '~/services/native/save'

const TEST_AD_PREFIX = 'ca-app-pub-3940256099942544/'
/** Longest the app waits for Remote Config at launch before using what it has. */
const REMOTE_WAIT_MS = 2000

/**
 * Registers the service implementations: web fakes everywhere, with native versions
 * swapped in when running inside the iOS app (Capacitor).
 */
export default defineNuxtPlugin(async (nuxtApp) => {
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
    services.config = createNativeConfig()
  }
  // Any JS error becomes a non-fatal crash report (so it counts against crash-free users).
  const crash = services.crash
  nuxtApp.vueApp.config.errorHandler = (err, _vm, info) => crash.recordError(err, `vue: ${info}`)
  window.addEventListener('error', (e) => crash.recordError(e.error ?? e.message, 'window'))
  window.addEventListener('unhandledrejection', (e) => crash.recordError(e.reason, 'promise'))

  // Remote Config: live tuning written into /content before any screen reads it. Waits at
  // most REMOTE_WAIT_MS; offline or invalid overrides leave the bundled values.
  const remote = await Promise.race([
    services.config.remoteOverrides().catch((e: unknown) => {
      crash.recordError(e, 'remote config')
      return null
    }),
    new Promise<null>((r) => setTimeout(() => r(null), REMOTE_WAIT_MS)),
  ])
  if (remote) {
    const files = { worlds, items, store } as unknown as ContentFiles
    const problems = applyOverrides(files, remote)
    if (problems.length) crash.log(`Remote Config ignored: ${problems.join(', ')}`)
  }
  // Browsers only start audio after a user gesture: unlock on the first tap or key.
  const unlock = () => services.audio.unlock()
  window.addEventListener('pointerdown', unlock, { passive: true, capture: true })
  window.addEventListener('keydown', unlock, { capture: true })
  return { provide: { services } }
})
