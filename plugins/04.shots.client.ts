import shots from '~/content/shots.json'
import type { PlayerState } from '~/stores/player'

/**
 * Dev tools only (M8): screenshot and preview modes (`?shot=…`, `/shots`, `/preview`) play
 * with a demo save from content/shots.json, which is never written back.
 */
export default defineNuxtPlugin(() => {
  if (!useRuntimeConfig().public.devTools) return
  const shot = new URLSearchParams(location.search).has('shot')
  const page = /^\/(shots|preview)/.test(location.pathname)
  if (!shot && !page) return
  useState('demo-save', () => false).value = true
  const player = usePlayerStore()
  player.$patch(structuredClone(shots.save) as unknown as Partial<PlayerState>)
  player.flags.tutorialDone = true
  player.flags.fightCoached = true
  useSettingsStore().$patch({ showFps: false })
})
