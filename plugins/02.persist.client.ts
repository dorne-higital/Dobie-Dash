import type { PlayerSave } from '~/stores/player'
import type { SettingsSave } from '~/stores/settings'

/** Loads saved state into the stores and writes it back whenever it changes. */
export default defineNuxtPlugin(async () => {
  const { save, haptics } = useServices()
  const player = usePlayerStore()
  const settings = useSettingsStore()

  const [p, s] = await Promise.all([
    save.load<PlayerSave>('player'),
    save.load<SettingsSave>('settings'),
  ])
  if (p?.v === 1) player.$patch(p)
  if (s?.v === 1) settings.$patch(s)
  else if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    settings.reduceMotion = true

  haptics.setEnabled(settings.haptics)
  player.$subscribe((_m, state) => save.save('player', state))
  settings.$subscribe((_m, state) => {
    haptics.setEnabled(state.haptics)
    save.save('settings', state)
  })
})
