import type { AnalyticsService } from '../types'

/** Logs events to the console in dev. Firebase Analytics comes with the iOS container. */
export function createWebAnalytics(debug: boolean): AnalyticsService {
  return {
    track(event, props) {
      if (debug) console.debug('[analytics]', event, props ?? {})
    },
  }
}
