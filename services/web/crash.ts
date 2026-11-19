import type { CrashService } from '../types'

/** Logs to the console. On iOS, services/native/crash.ts sends reports to Crashlytics. */
export function createWebCrash(): CrashService {
  return {
    recordError(error, context) {
      console.error('[crash]', context ?? '', error)
    },
    log() {},
  }
}
