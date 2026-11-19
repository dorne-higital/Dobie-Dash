import { describe, expect, it } from 'vitest'
import {
  addXp,
  canClaim,
  claimAll,
  claimTier,
  claimableTiers,
  daysLeft,
  hasPremium,
  PASS,
  runXp,
  seasonEnd,
  seasonPhase,
  seasonStart,
  tierFor,
  tierOf,
  type PassFile,
} from '~/logic/pass'
import { defaultSave } from '~/logic/save'
import { deliver, product, reconcile } from '~/logic/store'
import { item } from '~/logic/items'

const DAY = 86_400_000
const on = () => new Date(seasonStart() + 3 * DAY)
const fresh = () => defaultSave()

describe('Pup Pass content', () => {
  it('is a 6-week season of 30 tiers, each with a free and a premium reward', () => {
    expect(PASS.weeks).toBe(6)
    expect(PASS.tiers).toHaveLength(30)
    for (const t of PASS.tiers) {
      expect(Object.keys(t.free).length).toBeGreaterThan(0)
      expect(Object.keys(t.premium).length).toBeGreaterThan(0)
    }
  })
  it('only gives items that exist, each once across both tracks', () => {
    const ids = PASS.tiers.flatMap((t) => [t.free.item, t.premium.item]).filter(Boolean)
    for (const id of ids) expect(item(id!), id).toBeTruthy()
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('sells the premium track as a non-consumable', () => {
    expect(product(PASS.product)).toMatchObject({ type: 'non-consumable', gbp: '£4.99' })
  })
  it('is finishable in the season by a daily player, but not in a weekend', () => {
    // About 5 decent runs, 3 dailies and the streak a day; a weekly goal each week.
    const perDay = 5 * runXp({ score: 2500 }) + 3 * PASS.xp.dailyMission + PASS.xp.streakDay
    const total = perDay * PASS.weeks * 7 + PASS.weeks * PASS.xp.weeklyMission
    expect(tierFor(total)).toBe(30)
    expect(tierFor(perDay * 2 + 50 * PASS.xp.runCap)).toBeLessThan(15)
  })
})

describe('season dates', () => {
  it('runs from the start date for exactly 6 weeks (UTC)', () => {
    expect(seasonEnd() - seasonStart()).toBe(42 * DAY)
    expect(seasonPhase(new Date(seasonStart() - 1))).toBe('before')
    expect(seasonPhase(new Date(seasonStart()))).toBe('on')
    expect(seasonPhase(new Date(seasonEnd() - 1))).toBe('on')
    expect(seasonPhase(new Date(seasonEnd()))).toBe('after')
    expect(daysLeft(new Date(seasonStart()))).toBe(42)
    expect(daysLeft(new Date(seasonEnd() + DAY))).toBe(0)
  })
  it('follows a moved start date (Remote Config)', () => {
    const p: PassFile = { ...PASS, start: '2027-03-01' }
    expect(seasonPhase(new Date('2027-02-28T23:59:59Z'), p)).toBe('before')
    expect(seasonPhase(new Date('2027-03-01T00:00:00Z'), p)).toBe('on')
    expect(seasonPhase(new Date('2027-04-12T00:00:00Z'), p)).toBe('after')
  })
})

describe('XP and tiers', () => {
  it('a run gives a little for playing plus score, capped', () => {
    expect(runXp({ score: 0 })).toBe(PASS.xp.perRun)
    expect(runXp({ score: 1000 })).toBe(PASS.xp.perRun + 10)
    expect(runXp({ score: 1_000_000 })).toBe(PASS.xp.runCap)
  })
  it('tiers fill every xpPerTier and stop at 30', () => {
    expect(tierFor(0)).toBe(0)
    expect(tierFor(PASS.xpPerTier - 1)).toBe(0)
    expect(tierFor(PASS.xpPerTier)).toBe(1)
    expect(tierFor(PASS.xpPerTier * 99)).toBe(30)
  })
  it('adds XP only while the season is on, and reports tiers reached', () => {
    const s = fresh()
    expect(addXp(s, 1000, new Date(seasonStart() - DAY))).toEqual([])
    expect(s.pass.xp).toBe(0)
    expect(addXp(s, PASS.xpPerTier * 2 + 10, on())).toEqual([0, 1])
    expect(s.pass.season).toBe(PASS.id)
    expect(tierOf(s)).toBe(2)
    expect(addXp(s, 5, new Date(seasonEnd() + DAY))).toEqual([])
  })
  it('progress from another season starts again at zero', () => {
    const s = fresh()
    s.pass = { season: 's0', xp: 5000, free: [0, 1], premium: [0] }
    expect(tierOf(s)).toBe(0)
    addXp(s, 10, on())
    expect(s.pass).toEqual({ season: PASS.id, xp: 10, free: [], premium: [] })
  })
})

describe('claiming', () => {
  it('free rewards claim once each, only when reached', () => {
    const s = fresh()
    addXp(s, PASS.xpPerTier * 2, on())
    expect(canClaim(s, 2, 'free')).toBe(false)
    const before = s.wallet.biscuits
    expect(claimTier(s, 0, 'free')).toEqual(PASS.tiers[0]!.free)
    expect(s.wallet.biscuits).toBe(before + (PASS.tiers[0]!.free.biscuits ?? 0))
    expect(claimTier(s, 0, 'free')).toBeNull()
    expect(claimTier(s, 1, 'free')).toEqual(PASS.tiers[1]!.free)
    expect(s.owned).toContain(PASS.tiers[1]!.free.item)
  })
  it('premium needs the pass; buying it unlocks every premium tier already reached', () => {
    const s = fresh()
    addXp(s, PASS.xpPerTier * 3, on())
    expect(hasPremium(s)).toBe(false)
    expect(claimTier(s, 0, 'premium')).toBeNull()
    expect(claimableTiers(s)).toBe(3)
    deliver(s, PASS.product)
    expect(hasPremium(s)).toBe(true)
    expect(claimableTiers(s)).toBe(6)
    const got = claimAll(s)
    expect(got).toHaveLength(6)
    expect(claimableTiers(s)).toBe(0)
  })
  it('Big Bark rewards are saved up', () => {
    const s = fresh()
    const t = PASS.tiers.findIndex((x) => x.free.bigBark)
    addXp(s, PASS.xpPerTier * (t + 1), on())
    claimTier(s, t, 'free')
    expect(s.bigBarks).toBe(PASS.tiers[t]!.free.bigBark)
  })
  it('a refunded pass stops further premium claims', () => {
    const s = fresh()
    deliver(s, PASS.product)
    addXp(s, PASS.xpPerTier, on())
    reconcile(s, [])
    expect(hasPremium(s)).toBe(false)
    expect(claimTier(s, 0, 'premium')).toBeNull()
  })
})
