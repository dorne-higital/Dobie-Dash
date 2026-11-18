import { Capacitor } from '@capacitor/core'
import { shouldAskNotifications, upcomingReminders } from '~/logic/notify'

/** Notification permission (asked on day 2) and keeping reminders scheduled. */
export function useReminders() {
  const { notify } = useServices()
  const player = usePlayerStore()

  // iPhone app only (and the dev server, to see it).
  const shouldAsk = () =>
    (Capacitor.isNativePlatform() || import.meta.dev) && shouldAskNotifications(player, new Date())

  async function reschedule() {
    if ((await notify.permission()) !== 'granted') return
    await notify.schedule(upcomingReminders(new Date()))
  }

  async function answer(yes: boolean) {
    player.notify.asked = true
    if (yes && (await notify.request())) await reschedule()
  }

  return { shouldAsk, answer, reschedule }
}
