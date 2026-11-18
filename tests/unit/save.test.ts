import { describe, expect, it } from 'vitest'
import { defaultSave, migrate, SAVE_VERSION, type SaveV1 } from '~/logic/save'

describe('save migrations', () => {
  it('a missing or broken save starts fresh at the current version', () => {
    for (const raw of [null, undefined, 42, 'x', {}, { v: 'two' }]) {
      const s = migrate(raw)
      expect(s).toEqual(defaultSave())
      expect(s.v).toBe(SAVE_VERSION)
      expect(s.dog).toBeNull()
      expect(s.flags.tutorialDone).toBe(false)
    }
  })

  it('a save from a newer app version is not guessed at', () => {
    expect(migrate({ v: SAVE_VERSION + 1, wallet: { biscuits: 9 } })).toEqual(defaultSave())
  })

  it('v1 (separate player and settings) moves into the single v2 file', () => {
    const v1: SaveV1 = {
      v: 1,
      player: {
        best: 5210,
        bestWorld: 2,
        biscuits: 1240,
        stats: { runs: 34, metres: 41200, biscuits: 1893, smashes: 12 },
      },
      settings: { music: false, reduceMotion: true },
    }
    const s = migrate(v1)
    expect(s.v).toBe(2)
    expect(s.player).toEqual({ name: 'Dobie', best: 5210, bestWorld: 2 })
    expect(s.wallet).toEqual({ biscuits: 1240, bones: 0 })
    expect(s.stats).toMatchObject({ runs: 34, metres: 41200, biscuits: 1893, smashes: 12 })
    expect(s.stats.nearMisses).toBe(0)
    expect(s.settings).toMatchObject({ music: false, sfx: true, reduceMotion: true })
    // Existing players keep playing as Dobie and skip the tutorial.
    expect(s.dog?.breed).toBe('doberman')
    expect(s.flags.tutorialDone).toBe(true)
  })

  it('a v1 save with no runs yet still gets the dog maker and tutorial', () => {
    const s = migrate({ v: 1, player: { best: 0, stats: { runs: 0 } }, settings: null })
    expect(s.dog).toBeNull()
    expect(s.flags.tutorialDone).toBe(false)
  })

  it('a current save round-trips, and missing fields come back with defaults', () => {
    const s = defaultSave()
    s.wallet.bones = 35
    s.owned = ['neck:bandana']
    s.stats.cleared = { cat: 4 }
    expect(migrate(JSON.parse(JSON.stringify(s)))).toEqual(s)

    const partial = { v: 2, wallet: { biscuits: 10 }, missions: { day: '2026-11-18' } }
    const m = migrate(partial)
    expect(m.wallet).toEqual({ biscuits: 10, bones: 0 })
    expect(m.missions.day).toBe('2026-11-18')
    expect(m.missions.streak).toEqual({ count: 0, lastDay: null })
    expect(m.equipped.trail).toBeNull()
    expect(m.settings.sfx).toBe(true)
  })

  it('migrating never mutates the input', () => {
    const v1 = { v: 1, player: { best: 10, stats: { runs: 1 } } }
    const copy = structuredClone(v1)
    migrate(v1)
    expect(v1).toEqual(copy)
  })
})
