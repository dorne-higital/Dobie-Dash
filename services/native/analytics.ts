/** Firebase Analytics via @capacitor-firebase/analytics. */
import type { AnalyticsService } from '../types'

export function createNativeAnalytics(): AnalyticsService {
  const sdk = import('@capacitor-firebase/analytics')
  return {
    track(event, props) {
      void sdk
        .then(({ FirebaseAnalytics }) => FirebaseAnalytics.logEvent({ name: event, params: props }))
        .catch(() => {})
    },
  }
}
