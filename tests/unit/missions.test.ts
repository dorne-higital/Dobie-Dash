import { describe, expect, it } from 'vitest'
import type { RunSummary } from '~/game/run'
import {
  claim,
  claimableCount,
  collectStreak,
  dailyChestReady,
  dayKey,
  dealDaily,
  freeChestReady,
  MISSIONS,
  missionDef,
  openDailyChest,
  openFreeChest,
  recordMissions,
  refresh,
  streakNextDay,
  weekKey,
} from '~/logic/missions'
import { defaultSave } from '~/logic/save'
import { medalFor, TROPHIES, updateTrophies } from '~/logic/trophies'

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h)

function run(over: Partial<RunSummary> = {}): RunSummary {
  return {
    score: 0,
    metres: 0,
    biscuits: 0,
    smashes: 0,
    world: 0,
    worldName: 'Bark Park',
    seconds: 30,
    seed: 1,
    escapes: 0,
    escaped: [],
    beaten: [],
    fightTip: false,
    caughtBy: null,
    hitBy: null,
    continues: 0,
    nearMisses: 0,
    jumps: 0,
    powerups: 0,
    golden: 0,
    cleared: {},
    ...over,
  }
}

/** A save whose daily missions are exactly these ids. */
function withDaily(ids: string[], now = at(2026, 11, 18)) {
  const s = defaultSave()
  refresh(s, now)
  s.missions.daily = ids.map((id) => ({ id, p: 0, claimed: false }))
  return s
}

describe('dealing and resets', () => {
  it('three different missions a day, the same for everyone on that date', () => {
    const a = dealDaily('2026-11-18')
    expect(a).toHaveLength(3)
    expect(new Set(a.map((m) => m.id)).size).toBe(3)
    expect(dealDaily('2026-11-18')).toEqual(a)
    const days = ['2026-11-19', '2026-11-20', '2026-11-21'].map((d) => JSON.stringify(dealDaily(d)))
    expect(days.some((d) => d !== JSON.stringify(a))).toBe(true)
  })

  it('daily missions reset at local midnight, not before', () => {
    const s = defaultSave()
    refresh(s, at(2026, 11, 18, 0))
    s.missions.daily[0]!.p = 5
    s.missions.dailyChestClaimed = true
    refresh(s, at(2026, 11, 18, 23))
    expect(s.missions.daily[0]!.p).toBe(5)
    refresh(s, new Date(2026, 10, 19, 0, 0, 1))
    expect(s.missions.day).toBe('2026-11-19')
    expect(s.missions.daily.every((m) => m.p === 0 && !m.claimed)).toBe(true)
    expect(s.missions.dailyChestClaimed).toBe(false)
  })

  it('the weekly goal resets on Monday', () => {
    expect(weekKey(at(2026, 11, 18))).toBe('2026-11-16') // Wednesday -> Monday
    expect(weekKey(at(2026, 11, 22))).toBe('2026-11-16') // Sunday
    expect(weekKey(at(2026, 11, 23))).toBe('2026-11-23') // Monday
    const s = defaultSave()
    refresh(s, at(2026, 11, 18))
    s.missions.weekly[0]!.p = 900
    refresh(s, at(2026, 11, 22, 23))
    expect(s.missions.weekly[0]!.p).toBe(900)
    refresh(s, at(2026, 11, 23, 0))
    expect(s.missions.weekly[0]!.p).toBe(0)
  })
})

describe('progress and claiming', () => {
  it('"in one run" missions take the best run; totals add up', () => {
    const s = withDaily(['eat40run', 'eat100', 'jump3cats'])
    const now = at(2026, 11, 18)
    recordMissions(s, run({ biscuits: 30, cleared: { cat: 2 } }), now)
    recordMissions(s, run({ biscuits: 25, cleared: { cat: 1 } }), now)
    const [one, total, cats] = s.missions.daily
    expect(one!.p).toBe(30) // best single run, not 55
    expect(total!.p).toBe(55)
    expect(cats!.p).toBe(2) // 2 then 1: never 3 in one run
    recordMissions(s, run({ biscuits: 90, cleared: { cat: 3 } }), now)
    expect(one!.p).toBe(40) // capped at the goal
    expect(total!.p).toBe(100)
    expect(cats!.p).toBe(3)
  })

  it('claiming pays once, only when done', () => {
    const s = withDaily(['score2000', 'runs5', 'escape1'])
    const now = at(2026, 11, 18)
    expect(claim(s, 'score2000')).toBeNull()
    recordMissions(s, run({ score: 2500 }), now)
    const before = s.wallet.biscuits
    expect(claim(s, 'score2000')).toEqual(missionDef('score2000')!.reward)
    expect(s.wallet.biscuits).toBe(before + missionDef('score2000')!.reward.biscuits!)
    expect(claim(s, 'score2000')).toBeNull()
    expect(s.wallet.biscuits).toBe(before + missionDef('score2000')!.reward.biscuits!)
    // Claimed missions stop counting.
    recordMissions(s, run({ score: 9000 }), now)
    expect(s.missions.daily[0]!.p).toBe(2000)
  })

  it('the weekly goal pays its item, bones and a Big Bark', () => {
    const s = defaultSave()
    const now = at(2026, 11, 18)
    refresh(s, now)
    s.missions.weekly = [{ id: 'km10', p: 0, claimed: false }]
    recordMissions(s, run({ metres: 6000 }), now)
    recordMissions(s, run({ metres: 4500 }), now)
    expect(claim(s, 'km10')).toEqual({ item: 'neck:bowtie', bones: 10, bigBark: 1 })
    expect(s.owned).toContain('neck:bowtie')
    expect(s.wallet.bones).toBe(10)
    expect(s.bigBarks).toBe(1)
  })

  it('the daily chest opens once, after all three missions are claimed', () => {
    const s = withDaily(['runs5', 'escape1', 'golden2'])
    const now = at(2026, 11, 18)
    for (let i = 0; i < 5; i++) recordMissions(s, run({ escapes: 1, golden: 1 }), now)
    claim(s, 'runs5')
    claim(s, 'escape1')
    expect(dailyChestReady(s)).toBe(false)
    claim(s, 'golden2')
    expect(dailyChestReady(s)).toBe(true)
    const r = openDailyChest(s, () => 0)
    expect(r?.biscuits).toBe(MISSIONS.chests.daily.biscuits[0])
    expect(r?.bones).toBe(MISSIONS.chests.daily.bones[0])
    expect(openDailyChest(s)).toBeNull()
  })

  it('the free chest is ready every 4 hours', () => {
    const s = defaultSave()
    const t0 = at(2026, 11, 18, 9)
    expect(freeChestReady(s, t0)).toBe(true)
    expect(openFreeChest(s, t0, () => 0.9999)?.biscuits).toBe(MISSIONS.chests.free.biscuits[1])
    expect(openFreeChest(s, new Date(t0.getTime() + 3.99 * 3600_000))).toBeNull()
    expect(freeChestReady(s, new Date(t0.getTime() + 4 * 3600_000))).toBe(true)
  })

  it('the Missions badge counts what can be claimed', () => {
    const s = withDaily(['runs5', 'escape1', 'golden2'])
    const now = at(2026, 11, 18)
    expect(claimableCount(s, now)).toBe(1) // today's streak day
    collectStreak(s, now)
    expect(claimableCount(s, now)).toBe(0)
    recordMissions(s, run({ escapes: 1 }), now)
    expect(claimableCount(s, now)).toBe(1)
  })
})

describe('login streak', () => {
  it('one collect per day; day 7 gives 5 bones; then it starts again', () => {
    const s = defaultSave()
    for (let d = 1; d <= 7; d++) {
      const now = at(2026, 11, d)
      expect(collectStreak(s, now)?.day).toBe(d)
      expect(collectStreak(s, now)).toBeNull() // once per day
    }
    expect(s.wallet.bones).toBe(5)
    expect(s.wallet.biscuits).toBe(50 + 75 + 100 + 125 + 150 + 200)
    expect(collectStreak(s, at(2026, 11, 8))?.day).toBe(1)
  })

  it('missing days pauses the streak instead of resetting it', () => {
    const s = defaultSave()
    collectStreak(s, at(2026, 11, 1))
    collectStreak(s, at(2026, 11, 2))
    collectStreak(s, at(2026, 11, 3))
    expect(streakNextDay(s)).toBe(4)
    // Away for a week.
    expect(collectStreak(s, at(2026, 11, 11))?.day).toBe(4)
    expect(s.missions.streak).toEqual({ count: 4, lastDay: dayKey(at(2026, 11, 11)) })
  })
})

describe('trophies', () => {
  it('ten trophies, each with three rising medal tiers', () => {
    expect(TROPHIES).toHaveLength(10)
    for (const t of TROPHIES) {
      expect(t.tiers).toHaveLength(3)
      expect(t.tiers[0]! < t.tiers[1]! && t.tiers[1]! < t.tiers[2]!).toBe(true)
    }
  })

  it('medals go bronze, silver, gold and are reported once', () => {
    const marathon = TROPHIES.find((t) => t.id === 'marathon')!
    expect([0, 9999, 10000, 100000, 5e6].map((v) => medalFor(marathon, v))).toEqual([0, 0, 1, 2, 3])
    const s = defaultSave()
    s.stats.metres = 150000
    s.player.best = 2500
    const up = updateTrophies(s)
    expect(up.map((u) => [u.trophy.id, u.medal])).toEqual([
      ['marathon', 2],
      ['highscore', 1],
    ])
    expect(updateTrophies(s)).toEqual([])
  })
})

describe('recording a run in the player store', () => {
  it('grants world rewards and boss stickers the first time only', async () => {
    const { createPinia, setActivePinia } = await import('pinia')
    const { usePlayerStore } = await import('~/stores/player')
    setActivePinia(createPinia())
    const p = usePlayerStore()
    const now = at(2026, 11, 18)
    const r1 = p.recordRun(
      run({ world: 2, score: 4200, biscuits: 40, escapes: 2, escaped: ['mower', 'van'] }),
      now,
    )
    expect(r1.newBest).toBe(true)
    expect(r1.unlocked).toEqual(['trail:confetti', 'trail:bubbles', 'sticker:mower', 'sticker:van'])
    expect(p.wallet.biscuits).toBe(40)
    expect(p.stats.runs).toBe(1)
    expect(r1.medals.map((m) => m.trophy.id)).toContain('highscore')
    const r2 = p.recordRun(run({ world: 2, escaped: ['mower'] }), now)
    expect(r2.unlocked).toEqual([])
    expect(r2.newBest).toBe(false)
  })
})
