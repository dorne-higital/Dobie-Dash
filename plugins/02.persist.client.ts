import { migrate, pickSave, SAVE_VERSION, type Save, type SaveV1 } from '~/logic/save'
import { playerState } from '~/stores/player'

/**
 * Loads the save into the stores (migrating older versions) and writes it back whenever
 * it changes. In the iOS app the save is also kept in iCloud: at launch, and whenever
 * another phone updates it, the copy with more play wins (logic/save.ts pickSave).
 * Before the single save file (v1) the player and settings were stored separately.
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
  const local = raw ? migrate(raw) : null
  const cloudRaw = await save.loadCloud?.('save')
  const cloud = cloudRaw ? migrate(cloudRaw) : null
  const picked = pickSave(local, cloud)
  const data = picked?.save ?? migrate(null)
  if (!picked && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    data.settings.reduceMotion = true

  const load = (s: Save) => {
    player.$patch(playerState(s))
    settings.$patch(s.settings)
  }
  load(data)

  const apply = () => {
    haptics.setEnabled(settings.haptics)
    audio.setSfx(settings.sfx)
    audio.setMusic(settings.music)
  }
  apply()

  // When this phone last wrote (kept out of the store so writing doesn't trigger a write).
  let savedAt = data.savedAt
  const current = (): Save => ({
    v: SAVE_VERSION,
    ...player.$state,
    savedAt,
    settings: { ...settings.$state },
  })
  let queued = false
  const write = () => {
    if (queued) return
    queued = true
    // Batch the many small changes at the end of a run into one write.
    queueMicrotask(() => {
      queued = false
      savedAt = Date.now()
      void save.save('save', current())
    })
  }
  if (!raw || (raw as { v: number }).v !== SAVE_VERSION || picked?.from === 'cloud') write()
  player.$subscribe(write, { deep: true })
  settings.$subscribe(() => {
    apply()
    write()
  })

  // Another phone on the same Apple ID saved: take its copy if it has more play.
  save.onCloudChange?.(async () => {
    const c = await save.loadCloud?.('save')
    if (!c) return
    const p = pickSave(current(), migrate(c))
    if (p?.from === 'cloud') load(p.save)
  })
})
