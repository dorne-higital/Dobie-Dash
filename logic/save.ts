/**
 * The save file: one versioned JSON document (shape from the plan's "Save data"), stored
 * through the save service so iCloud key-value sync can plug in later.
 *
 * Every change to the shape bumps SAVE_VERSION and adds a step to MIGRATIONS, keyed on the
 * version it upgrades from. Old saves are walked forward one step at a time.
 */
import type { EarStyle, EyeColour, TailStyle } from '~/game/art/dobie'
import { POWER_KINDS, type PowerKind } from '~/game/config'

export const SAVE_VERSION = 5

export type Slot = 'collar' | 'hat' | 'eyes' | 'neck' | 'back' | 'trail'
export const SLOTS: Slot[] = ['collar', 'hat', 'eyes', 'neck', 'back', 'trail']

export interface DogSave {
  name: string
  breed: string
  coat: number
  ears: EarStyle
  tail: TailStyle
  eyes: EyeColour
}

export interface MissionSlot {
  id: string
  /** Progress toward the goal. */
  p: number
  claimed: boolean
}

export interface Stats {
  runs: number
  metres: number
  biscuits: number
  smashes: number
  nearMisses: number
  escapes: number
  jumps: number
  powerups: number
  continues: number
  /** Obstacles cleared (jumped or run under), by obstacle type. */
  cleared: Record<string, number>
  /** Seconds played in runs. */
  seconds: number
}

export interface SettingsSave {
  music: boolean
  sfx: boolean
  haptics: boolean
  reduceMotion: boolean
  /** Frame-time overlay during runs (also on with `?fps`). */
  showFps: boolean
  /** Bigger text and buttons on every screen outside a run (M5). */
  largeText: boolean
  /** Hold the jump to go higher; a tap still jumps as before (M5). */
  holdToJump: boolean
}

/** Upgrade level bought per power-up (0–5). */
export type Upgrades = Record<PowerKind, number>

export function noUpgrades(): Upgrades {
  return Object.fromEntries(POWER_KINDS.map((k) => [k, 0])) as Upgrades
}

export interface SaveV5 extends Omit<SaveV4, 'v'> {
  v: 5
  /** Power-up upgrade levels bought in the Wardrobe (M6). */
  upgrades: Upgrades
}

export interface SaveV4 {
  v: 4
  /** Epoch ms of the last write, for picking between this phone's save and iCloud's. */
  savedAt: number
  /** Non-consumable App Store products whose rewards have been given (once each). */
  purchases: { delivered: string[] }
  /** App launches, runs since the last between-run ad, and whether ATT was asked. */
  ads: { sessions: number; runsSinceAd: number; attAsked: boolean }
  /** First day played (local date) and whether notification permission was asked. */
  notify: { firstDay: string | null; asked: boolean }
  player: { name: string; best: number; bestWorld: number }
  wallet: { biscuits: number; bones: number }
  /** null until the player has made a dog (the dog maker is the first screen). */
  dog: DogSave | null
  /** Item ids from content/items.json, breeds as "breed:<key>", stickers as "sticker:<boss>". */
  owned: string[]
  equipped: Record<Slot, string | null>
  missions: {
    /** Local date (YYYY-MM-DD) the daily missions were dealt for. */
    day: string | null
    daily: MissionSlot[]
    dailyChestClaimed: boolean
    /** Local date of the Monday the weekly goal belongs to. */
    week: string | null
    weekly: MissionSlot[]
    /** Login streak: days collected on the 7-day track, and the last day collected. */
    streak: { count: number; lastDay: string | null }
    /** Epoch ms when the free chest is next ready. */
    freeChestAt: number
  }
  /** Medal reached per trophy: 0 none, 1 bronze, 2 silver, 3 gold. */
  trophies: Record<string, number>
  stats: Stats
  flags: { tutorialDone: boolean; removeAds: boolean; starterSeen: boolean }
  settings: SettingsSave
}

export type Save = SaveV5
/** v3 is v4 without the large-text and hold-to-jump settings (M4). */
export type SaveV3 = Omit<SaveV4, 'v' | 'settings'> & {
  v: 3
  settings: Omit<SettingsSave, 'largeText' | 'holdToJump'>
}
/** v2 is v3 without savedAt, purchases, ads and notify (M3). */
export type SaveV2 = Omit<SaveV3, 'v' | 'savedAt' | 'purchases' | 'ads' | 'notify'> & { v: 2 }

export function emptyStats(): Stats {
  return {
    runs: 0,
    metres: 0,
    biscuits: 0,
    smashes: 0,
    nearMisses: 0,
    escapes: 0,
    jumps: 0,
    powerups: 0,
    continues: 0,
    cleared: {},
    seconds: 0,
  }
}

export function defaultSave(): Save {
  return {
    v: 5,
    upgrades: noUpgrades(),
    savedAt: 0,
    purchases: { delivered: [] },
    ads: { sessions: 0, runsSinceAd: 0, attAsked: false },
    notify: { firstDay: null, asked: false },
    player: { name: '', best: 0, bestWorld: 0 },
    wallet: { biscuits: 0, bones: 0 },
    dog: null,
    owned: [],
    equipped: { collar: null, hat: null, eyes: null, neck: null, back: null, trail: null },
    missions: {
      day: null,
      daily: [],
      dailyChestClaimed: false,
      week: null,
      weekly: [],
      streak: { count: 0, lastDay: null },
      freeChestAt: 0,
    },
    trophies: {},
    stats: emptyStats(),
    flags: { tutorialDone: false, removeAds: false, starterSeen: false },
    settings: {
      music: true,
      sfx: true,
      haptics: true,
      reduceMotion: false,
      showFps: false,
      largeText: false,
      holdToJump: false,
    },
  }
}

/** Dobie: the free default dog, used for players who had a save before the dog maker. */
export function dobie(): DogSave {
  return { name: 'Dobie', breed: 'doberman', coat: 0, ears: 'down', tail: 'up', eyes: 'brown' }
}

/**
 * v1 was two separate documents (M1–M2): `player` and `settings`. The loader passes them
 * here as { v: 1, player, settings }.
 */
export interface SaveV1 {
  v: 1
  player?: {
    best?: number
    bestWorld?: number
    biscuits?: number
    stats?: { runs?: number; metres?: number; biscuits?: number; smashes?: number }
  } | null
  settings?: Partial<SettingsSave> | null
}

type AnySave = { v: number } & Record<string, unknown>

const MIGRATIONS: Record<number, (s: AnySave) => AnySave> = {
  1: (raw) => {
    const s = raw as unknown as SaveV1
    const next = defaultSave()
    const p = s.player
    if (p) {
      next.player.best = p.best ?? 0
      next.player.bestWorld = p.bestWorld ?? 0
      next.wallet.biscuits = p.biscuits ?? 0
      next.stats.runs = p.stats?.runs ?? 0
      next.stats.metres = p.stats?.metres ?? 0
      next.stats.biscuits = p.stats?.biscuits ?? 0
      next.stats.smashes = p.stats?.smashes ?? 0
      // They've already been playing as Dobie and know the controls.
      if (next.stats.runs > 0) {
        next.dog = dobie()
        next.player.name = 'Dobie'
        next.flags.tutorialDone = true
      }
    }
    Object.assign(next.settings, s.settings ?? {})
    // v1 → v2: next is already the full current shape; mark it v2 so the v2 step runs.
    return { ...next, v: 2 } as unknown as AnySave
  },
  2: (raw) => {
    const d = defaultSave()
    return {
      ...raw,
      v: 3,
      savedAt: 0,
      purchases: d.purchases,
      ads: d.ads,
      notify: d.notify,
    } as unknown as AnySave
  },
  3: (raw) => {
    const s = raw as unknown as SaveV3
    return {
      ...s,
      v: 4,
      settings: { ...s.settings, largeText: false, holdToJump: false },
    } as unknown as AnySave
  },
  4: (raw) => ({ ...raw, v: 5, upgrades: noUpgrades() }) as unknown as AnySave,
}

/** Walks any older save forward to the current version, filling missing fields. */
export function migrate(raw: unknown): Save {
  if (!raw || typeof raw !== 'object' || typeof (raw as AnySave).v !== 'number')
    return defaultSave()
  let s = structuredClone(raw) as AnySave
  if (s.v > SAVE_VERSION) return defaultSave() // from a newer app: don't guess
  while (s.v < SAVE_VERSION) {
    const step = MIGRATIONS[s.v]
    if (!step) return defaultSave()
    s = step(s)
  }
  return fillDefaults(s as unknown as Save)
}

/** Fields added within a version (or lost to a bad write) come back with defaults. */
function fillDefaults(s: Save): Save {
  const d = defaultSave()
  return {
    ...d,
    ...s,
    player: { ...d.player, ...s.player },
    wallet: { ...d.wallet, ...s.wallet },
    equipped: { ...d.equipped, ...s.equipped },
    missions: {
      ...d.missions,
      ...s.missions,
      streak: { ...d.missions.streak, ...s.missions?.streak },
    },
    stats: { ...d.stats, ...s.stats, cleared: { ...s.stats?.cleared } },
    flags: { ...d.flags, ...s.flags },
    upgrades: { ...d.upgrades, ...s.upgrades },
    settings: { ...d.settings, ...s.settings },
    owned: [...(s.owned ?? [])],
    trophies: { ...s.trophies },
    purchases: { delivered: [...(s.purchases?.delivered ?? [])] },
    ads: { ...d.ads, ...s.ads },
    notify: { ...d.notify, ...s.notify },
  }
}

/**
 * Two copies of the save (this phone, iCloud): keep the one with more play in it, so a
 * fresh install never overwrites real progress. Same play time: the newer write wins.
 * Returns which side won, or null when there's nothing to load.
 */
export function pickSave(
  local: Save | null,
  cloud: Save | null,
): { save: Save; from: 'local' | 'cloud' } | null {
  if (!local && !cloud) return null
  if (!cloud) return { save: local!, from: 'local' }
  if (!local) return { save: cloud, from: 'cloud' }
  const play = (s: Save) => s.stats.seconds + s.stats.runs
  if (play(cloud) !== play(local))
    return play(cloud) > play(local)
      ? { save: cloud, from: 'cloud' }
      : { save: local, from: 'local' }
  return cloud.savedAt > local.savedAt
    ? { save: cloud, from: 'cloud' }
    : { save: local, from: 'local' }
}
