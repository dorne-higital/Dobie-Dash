import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import type { HapticKind, HapticsService } from '../types'

/** Taptic Engine haptics inside the iOS app (Capacitor). */
export function createNativeHaptics(): HapticsService {
  let enabled = true
  const play: Record<HapticKind, () => Promise<void>> = {
    jump: () => Haptics.impact({ style: ImpactStyle.Light }),
    biscuit: () => Haptics.selectionChanged(),
    power: () => Haptics.impact({ style: ImpactStyle.Medium }),
    crash: () => Haptics.impact({ style: ImpactStyle.Heavy }),
    success: () => Haptics.notification({ type: NotificationType.Success }),
  }
  return {
    play(kind) {
      if (enabled) play[kind]().catch(() => {})
    },
    setEnabled(on) {
      enabled = on
    },
  }
}
