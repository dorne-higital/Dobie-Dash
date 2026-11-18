import type { NotifyService } from '../types'

/** Web: reminders are an iPhone app feature. */
export function createWebNotify(): NotifyService {
  return {
    async permission() {
      return 'denied'
    },
    async request() {
      return false
    },
    async schedule() {},
  }
}
