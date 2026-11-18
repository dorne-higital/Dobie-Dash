import { describe, expect, it } from 'vitest'
import { defaultSave, migrate, pickSave, SAVE_VERSION, type SaveV1 } from '~/logic/save'

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
    expect(s.v).toBe(SAVE_VERSION)
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

    const partial = { v: 3, wallet: { biscuits: 10 }, missions: { day: '2026-11-18' } }
    const m = migrate(partial)
    expect(m.wallet).toEqual({ biscuits: 10, bones: 0 })
    expect(m.missions.day).toBe('2026-11-18')
    expect(m.missions.streak).toEqual({ count: 0, lastDay: null })
    expect(m.equipped.trail).toBeNull()
    expect(m.settings.sfx).toBe(true)
  })

  it('v2 (M3) gains purchases, ad counters, notifications and savedAt; keeps the rest', () => {
    const v2 = { ...defaultSave(), v: 2 } as Record<string, unknown>
    delete v2.purchases
    delete v2.ads
    delete v2.notify
    delete v2.savedAt
    ;(v2.wallet as { biscuits: number }).biscuits = 777
    ;(v2 as { owned: string[] }).owned = ['collar:blue']
    const s = migrate(v2)
    expect(s.v).toBe(3)
    expect(s.wallet.biscuits).toBe(777)
    expect(s.owned).toEqual(['collar:blue'])
    expect(s.purchases).toEqual({ delivered: [] })
    expect(s.ads).toEqual({ sessions: 0, runsSinceAd: 0, attAsked: false })
    expect(s.notify).toEqual({ firstDay: null, asked: false })
  })

  it('migrating never mutates the input', () => {
    const v1 = { v: 1, player: { best: 10, stats: { runs: 1 } } }
    const copy = structuredClone(v1)
    migrate(v1)
    expect(v1).toEqual(copy)
  })
})

describe('iCloud: which save wins', () => {
  const at = (seconds: number, runs: number, savedAt: number) => {
    const s = defaultSave()
    s.stats.seconds = seconds
    s.stats.runs = runs
    s.savedAt = savedAt
    return s
  }

  it('a fresh install never overwrites progress in iCloud', () => {
    const fresh = at(0, 0, 999)
    const cloud = at(3600, 40, 100)
    expect(pickSave(fresh, cloud)?.from).toBe('cloud')
  })

  it('the copy with more play wins, whichever is newer', () => {
    expect(pickSave(at(500, 10, 1), at(400, 9, 2))?.from).toBe('local')
    expect(pickSave(at(400, 9, 2), at(500, 10, 1))?.from).toBe('cloud')
  })

  it('same play: the newer write wins; missing copies fall back', () => {
    expect(pickSave(at(10, 1, 5), at(10, 1, 6))?.from).toBe('cloud')
    expect(pickSave(at(10, 1, 6), at(10, 1, 5))?.from).toBe('local')
    expect(pickSave(at(1, 1, 1), null)?.from).toBe('local')
    expect(pickSave(null, at(1, 1, 1))?.from).toBe('cloud')
    expect(pickSave(null, null)).toBeNull()
  })
})
