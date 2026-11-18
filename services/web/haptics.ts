import type { HapticKind, HapticsService } from '../types'

const PATTERN: Record<HapticKind, number | number[]> = {
  jump: 8,
  biscuit: 4,
  power: [12, 30, 12],
  crash: 40,
  success: [10, 40, 10, 40, 20],
}

/** Uses navigator.vibrate where it exists (Android). iOS Safari has none, so it's a no-op there. */
export function createWebHaptics(): HapticsService {
  let enabled = true
  return {
    play(kind) {
      if (!enabled) return
      try {
        navigator.vibrate?.(PATTERN[kind])
      } catch {
        /* ignore */
      }
    },
    setEnabled(on) {
      enabled = on
    },
  }
}
