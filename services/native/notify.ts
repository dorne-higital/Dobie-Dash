/** Local notifications (missions reset, the week ending) via @capacitor/local-notifications. */
import type { NotifyService } from '../types'

async function sdk() {
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  return { LocalNotifications }
}

export function createNativeNotify(): NotifyService {
  return {
    async permission() {
      const { LocalNotifications } = await sdk()
      const { display } = await LocalNotifications.checkPermissions()
      return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt'
    },
    async request() {
      const { LocalNotifications } = await sdk()
      const { display } = await LocalNotifications.requestPermissions()
      return display === 'granted'
    },
    async schedule(reminders) {
      const { LocalNotifications } = await sdk()
      const { notifications } = await LocalNotifications.getPending()
      if (notifications.length)
        await LocalNotifications.cancel({ notifications: notifications.map((n) => ({ id: n.id })) })
      if (!reminders.length) return
      await LocalNotifications.schedule({
        notifications: reminders.map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          schedule: { at: r.at, allowWhileIdle: true },
        })),
      })
    },
  }
}
