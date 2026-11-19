/**
 * The Pup Pass (M7): a 6-week season of 30 tiers with a free track and a premium track
 * (the pass.s1 purchase). XP comes from runs and missions. Pure functions over the save;
 * `now` is passed in. Season content and every number: content/pass-s1.json.
 */
import raw from '~/content/pass-s1.json'
import type { RunSummary } from '~/game/run'
import { applyReward, type Reward } from './missions'
import type { Save } from './save'

/** The same reward shape as missions: biscuits, bones, an item and/or Big Barks. */
export type PassReward = Reward

export interface PassFile {
  id: string
  name: string
  /** App Store product for the premium track. */
  product: string
  /** UTC date the season starts (YYYY-MM-DD). Remote Config can move it (pass.start). */
  start: string
  weeks: number
  xpPerTier: number
  xp: {
    perRun: number
    scorePerXp: number
    runCap: number
    dailyMission: number
    weeklyMission: number
    streakDay: number
  }
  tiers: { free: PassReward; premium: PassReward }[]
}

export const PASS = raw as unknown as PassFile
export type Track = 'free' | 'premium'
export type PassState = Pick<
  Save,
  'pass' | 'wallet' | 'owned' | 'equipped' | 'player' | 'purchases' | 'bigBarks'
>

const DAY = 86_400_000

export function seasonStart(p: PassFile = PASS) {
  return Date.parse(`${p.start}T00:00:00Z`)
}
export function seasonEnd(p: PassFile = PASS) {
  return seasonStart(p) + p.weeks * 7 * DAY
}
/** 'before' the season, 'on', or 'after' it ends. */
export function seasonPhase(now: Date, p: PassFile = PASS): 'before' | 'on' | 'after' {
  const t = now.getTime()
  if (t < seasonStart(p)) return 'before'
  return t < seasonEnd(p) ? 'on' : 'after'
}
/** Whole days left in the season (0 when over). */
export function daysLeft(now: Date, p: PassFile = PASS) {
  return Math.max(0, Math.ceil((seasonEnd(p) - now.getTime()) / DAY))
}

/** Progress on a save from an earlier season starts again at zero. */
function current(s: PassState, p: PassFile = PASS) {
  if (s.pass.season !== p.id) s.pass = { season: p.id, xp: 0, free: [], premium: [] }
  return s.pass
}

/** Tiers reached (0–30) for an amount of XP. */
export function tierFor(xp: number, p: PassFile = PASS) {
  return Math.min(p.tiers.length, Math.floor(xp / p.xpPerTier))
}
export function tierOf(s: PassState, p: PassFile = PASS) {
  return s.pass.season === p.id ? tierFor(s.pass.xp, p) : 0
}
/** XP into the current tier, and the tier's size (for the progress bar). */
export function tierProgress(s: PassState, p: PassFile = PASS) {
  const xp = s.pass.season === p.id ? s.pass.xp : 0
  if (tierFor(xp, p) >= p.tiers.length) return { into: p.xpPerTier, of: p.xpPerTier }
  return { into: xp % p.xpPerTier, of: p.xpPerTier }
}

/** A run's XP: a little for playing, plus score, capped so one long run can't finish the pass. */
export function runXp(r: Pick<RunSummary, 'score'>, p: PassFile = PASS) {
  return Math.min(p.xp.runCap, p.xp.perRun + Math.floor(r.score / p.xp.scorePerXp))
}

/** Adds XP while the season is on. Returns the tiers newly reached (0-based). */
export function addXp(s: PassState, xp: number, now: Date, p: PassFile = PASS): number[] {
  if (xp <= 0 || seasonPhase(now, p) !== 'on') return []
  const pass = current(s, p)
  const before = tierFor(pass.xp, p)
  pass.xp += Math.floor(xp)
  const after = tierFor(pass.xp, p)
  return Array.from({ length: after - before }, (_, i) => before + i)
}

/** The premium track is owned (bought this season's pass). */
export function hasPremium(s: Pick<Save, 'purchases'>, p: PassFile = PASS) {
  return s.purchases.delivered.includes(p.product)
}

export function canClaim(s: PassState, tier: number, track: Track, p: PassFile = PASS) {
  if (s.pass.season !== p.id || tier < 0 || tier >= tierFor(s.pass.xp, p)) return false
  if (track === 'premium' && !hasPremium(s, p)) return false
  return !s.pass[track].includes(tier)
}

/** Claims one tier's reward on a track. Returns it, or null if it can't be claimed. */
export function claimTier(s: PassState, tier: number, track: Track, p: PassFile = PASS) {
  if (!canClaim(s, tier, track, p)) return null
  s.pass[track].push(tier)
  const r = p.tiers[tier]![track]
  applyReward(s, r)
  return r
}

/** Claims everything reached on both tracks (premium only if owned). */
export function claimAll(s: PassState, p: PassFile = PASS): PassReward[] {
  const got: PassReward[] = []
  for (let t = 0; t < p.tiers.length; t++)
    for (const track of ['free', 'premium'] as const) {
      const r = claimTier(s, t, track, p)
      if (r) got.push(r)
    }
  return got
}

/** Rewards waiting to be claimed (for the Missions badge). */
export function claimableTiers(s: PassState, p: PassFile = PASS) {
  let n = 0
  for (let t = 0; t < p.tiers.length; t++)
    for (const track of ['free', 'premium'] as const) if (canClaim(s, t, track, p)) n++
  return n
}
