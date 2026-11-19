import type { AnalyticsService } from '../types'

/** Logs events to the console in dev. On iOS, services/native/analytics.ts sends them. */
export function createWebAnalytics(debug: boolean): AnalyticsService {
  return {
    track(event, props) {
      if (debug) console.debug('[analytics]', event, props)
    },
  }
}
