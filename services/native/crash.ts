/** Crashlytics via @capacitor-firebase/crashlytics. Native crashes are caught by the SDK. */
import type { CrashService } from '../types'

export function createNativeCrash(): CrashService {
  const sdk = import('@capacitor-firebase/crashlytics')
  return {
    recordError(error, context) {
      const e = error instanceof Error ? error : new Error(String(error))
      void sdk
        .then(async ({ FirebaseCrashlytics }) => {
          if (context) await FirebaseCrashlytics.log({ message: context })
          await FirebaseCrashlytics.recordException({ message: `${e.name}: ${e.message}` })
        })
        .catch(() => {})
    },
    log(message) {
      void sdk
        .then(({ FirebaseCrashlytics }) => FirebaseCrashlytics.log({ message }))
        .catch(() => {})
    },
  }
}
