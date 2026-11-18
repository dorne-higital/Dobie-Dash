import { migrate, SAVE_VERSION, type Save, type SaveV1 } from '~/logic/save'
import { playerState } from '~/stores/player'

/**
 * Loads the save file into the stores (migrating older versions) and writes it back
 * whenever it changes. Before the single save file (v1) the player and settings were
 * stored separately; those are read once and folded in.
 */
export default defineNuxtPlugin(async () => {
  const { save, haptics, audio } = useServices()
  const player = usePlayerStore()
  const settings = useSettingsStore()

  let raw: unknown = await save.load('save')
  if (!raw) {
    const [p, s] = await Promise.all([
      save.load<SaveV1['player']>('player'),
      save.load<SaveV1['settings']>('settings'),
    ])
    if (p || s) raw = { v: 1, player: p, settings: s } satisfies SaveV1
  }
  const fresh = !raw
  const data = migrate(raw)
  if (fresh && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    data.settings.reduceMotion = true
  player.$patch(playerState(data))
  settings.$patch(data.settings)

  const apply = () => {
    haptics.setEnabled(settings.haptics)
    audio.setSfx(settings.sfx)
    audio.setMusic(settings.music)
  }
  apply()

  let queued = false
  const write = () => {
    if (queued) return
    queued = true
    // Batch the many small changes at the end of a run into one write.
    queueMicrotask(() => {
      queued = false
      const doc: Save = { v: SAVE_VERSION, ...player.$state, settings: { ...settings.$state } }
      save.save('save', doc)
    })
  }
  if (raw === null || (raw as { v: number }).v !== SAVE_VERSION) write()
  player.$subscribe(write, { deep: true })
  settings.$subscribe(() => {
    apply()
    write()
  })
})
