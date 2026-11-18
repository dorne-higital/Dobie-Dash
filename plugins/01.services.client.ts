import { Capacitor } from '@capacitor/core'
import { createWebServices } from '~/services'
import { createNativeHaptics } from '~/services/native/haptics'

/**
 * Registers the service implementations: web fakes everywhere, with native versions
 * swapped in when running inside the iOS app (Capacitor).
 */
export default defineNuxtPlugin(() => {
  const services = createWebServices({ debug: import.meta.dev })
  if (Capacitor.isNativePlatform()) services.haptics = createNativeHaptics()
  return { provide: { services } }
})
