/**
 * Daily missions, the weekly goal, the login streak and chests. Pure functions over the
 * save; `now` and a random source are passed in so tests control time and rolls.
 */
import raw from '~/content/missions.json'
import type { RunSummary } from '~/game/run'
import { Rng } from '~/game/rng'
import type { MissionSlot, Save } from './save'
import { grant } from './shop'

export interface Reward {
  biscuits?: number
  bones?: number
  item?: string
}

export interface MissionDef {
  id: string
  text: string
  /** A RunSummary field ("score", "biscuits", "cleared.cat", "world", "runs" …). */
  stat: string
  /** 'run': best single run counts. 'total': adds up over the day (or week). */
  scope: 'run' | 'total'
  goal: number
  reward: Reward
}

interface ChestDef {
  biscuits: [number, number]
  bones: [number, number]
  boneChance: number
}

interface MissionsFile {
  version: number
  dailyCount: number
  daily: MissionDef[]
  weekly: MissionDef[]
  streak: { days: number; rewards: Reward[] }
  chests: { daily: ChestDef; free: ChestDef & { everyHours: number } }
}

export const MISSIONS = raw as unknown as MissionsFile

const defs = new Map([...MISSIONS.daily, ...MISSIONS.weekly].map((m) => [m.id, m]))
export function missionDef(id: string) {
  return defs.get(id)
}

export type MissionState = Pick<Save, 'missions' | 'wallet' | 'owned' | 'equipped' | 'player'>

// ---- dates (local time) ----------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, '0')
/** Local calendar date, YYYY-MM-DD: missions reset at the player's own midnight. */
export function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
/** The Monday that starts this local week. */
export function weekKey(d: Date) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
  return dayKey(m)
}
function seedOf(key: string) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Missions for a day: the same three for everyone on that date, no repeats. */
export function dealDaily(day: string): MissionSlot[] {
  const rng = new Rng(seedOf(`daily:${day}`))
  const pool = [...MISSIONS.daily]
  const out: MissionSlot[] = []
  for (let i = 0; i < MISSIONS.dailyCount && pool.length; i++) {
    const [m] = pool.splice(rng.int(pool.length), 1)
    out.push({ id: m!.id, p: 0, claimed: false })
  }
  return out
}

export function dealWeekly(week: string): MissionSlot[] {
  const rng = new Rng(seedOf(`weekly:${week}`))
  const m = MISSIONS.weekly[rng.int(MISSIONS.weekly.length)]!
  return [{ id: m.id, p: 0, claimed: false }]
}

/** New day: fresh missions and daily chest. New week: a fresh weekly goal. */
export function refresh(s: MissionState, now: Date) {
  const m = s.missions
  const day = dayKey(now)
  if (m.day !== day) {
    m.day = day
    m.daily = dealDaily(day)
    m.dailyChestClaimed = false
  }
  const week = weekKey(now)
  if (m.week !== week) {
    m.week = week
    m.weekly = dealWeekly(week)
  }
}

// ---- progress ---------------------------------------------------------------------------

/** The value a run contributes to a stat. "runs" counts the run itself. */
export function statOf(r: RunSummary, stat: string): number {
  if (stat === 'runs') return 1
  if (stat.startsWith('cleared.'))
    return r.cleared[stat.slice(8) as keyof RunSummary['cleared']] ?? 0
  const v = (r as unknown as Record<string, unknown>)[stat]
  return typeof v === 'number' ? v : 0
}

function advance(slot: MissionSlot, r: RunSummary) {
  const d = missionDef(slot.id)
  if (!d || slot.claimed) return
  const v = statOf(r, d.stat)
  slot.p = Math.min(d.goal, d.scope === 'run' ? Math.max(slot.p, v) : slot.p + v)
}

/** Adds a finished run to today's missions and this week's goal. */
export function recordMissions(s: MissionState, r: RunSummary, now: Date) {
  refresh(s, now)
  for (const slot of s.missions.daily) advance(slot, r)
  for (const slot of s.missions.weekly) advance(slot, r)
}

/** Progress as it would be if the run in progress ended now (pause sheet). */
export function previewProgress(s: MissionState, r: RunSummary) {
  return s.missions.daily.map((slot) => {
    const d = missionDef(slot.id)!
    const copy = { ...slot }
    advance(copy, r)
    return { ...copy, def: d, done: copy.p >= d.goal }
  })
}

export function isDone(slot: MissionSlot) {
  const d = missionDef(slot.id)
  return !!d && slot.p >= d.goal
}

export function applyReward(s: MissionState, r: Reward) {
  s.wallet.biscuits += r.biscuits ?? 0
  s.wallet.bones += r.bones ?? 0
  if (r.item) grant(s, r.item)
}

/** Claims a finished mission's reward. Returns it, or null if it can't be claimed. */
export function claim(s: MissionState, id: string): Reward | null {
  const slot = [...s.missions.daily, ...s.missions.weekly].find((m) => m.id === id)
  if (!slot || slot.claimed || !isDone(slot)) return null
  slot.claimed = true
  const reward = missionDef(id)!.reward
  applyReward(s, reward)
  return reward
}

// ---- streak -----------------------------------------------------------------------------

/**
 * 7-day login track. Each new day you play collects the next day's reward. Missing days
 * pauses the track (it never resets); after day 7 it starts again at day 1.
 */
export function streakReady(s: MissionState, now: Date) {
  return s.missions.streak.lastDay !== dayKey(now)
}

/** The day (1–7) the next collect would give. */
export function streakNextDay(s: MissionState) {
  return (s.missions.streak.count % MISSIONS.streak.days) + 1
}

export function collectStreak(s: MissionState, now: Date): { day: number; reward: Reward } | null {
  if (!streakReady(s, now)) return null
  const day = streakNextDay(s)
  s.missions.streak = { count: day, lastDay: dayKey(now) }
  const reward = MISSIONS.streak.rewards[day - 1] ?? {}
  applyReward(s, reward)
  return { day, reward }
}

// ---- chests -----------------------------------------------------------------------------

export type Random = () => number

function roll(c: ChestDef, rand: Random): Reward {
  const [b0, b1] = c.biscuits
  const reward: Reward = { biscuits: Math.round(b0 + rand() * (b1 - b0)) }
  if (rand() < c.boneChance) {
    const [n0, n1] = c.bones
    reward.bones = n0 + Math.floor(rand() * (n1 - n0 + 1))
  }
  return reward
}

/** The daily chest opens once all of today's missions are claimed. */
export function dailyChestReady(s: MissionState) {
  const d = s.missions.daily
  return d.length > 0 && d.every((m) => m.claimed) && !s.missions.dailyChestClaimed
}

export function openDailyChest(s: MissionState, rand: Random = Math.random): Reward | null {
  if (!dailyChestReady(s)) return null
  s.missions.dailyChestClaimed = true
  const reward = roll(MISSIONS.chests.daily, rand)
  applyReward(s, reward)
  return reward
}

export function freeChestReady(s: MissionState, now: Date) {
  return now.getTime() >= s.missions.freeChestAt
}

export function openFreeChest(s: MissionState, now: Date, rand: Random = Math.random) {
  if (!freeChestReady(s, now)) return null
  const c = MISSIONS.chests.free
  s.missions.freeChestAt = now.getTime() + c.everyHours * 3600_000
  const reward = roll(c, rand)
  applyReward(s, reward)
  return reward
}

/** Missions tab badge: things waiting to be claimed. */
export function claimableCount(s: MissionState, now: Date) {
  const done = [...s.missions.daily, ...s.missions.weekly].filter(
    (m) => !m.claimed && isDone(m),
  ).length
  return done + (streakReady(s, now) ? 1 : 0) + (dailyChestReady(s) ? 1 : 0)
}
