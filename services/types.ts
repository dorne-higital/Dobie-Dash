/**
 * Native-facing services. Each has a web fake in services/web/ for now; the iOS container
 * will provide native implementations (Game Center, StoreKit, AdMob, haptics, iCloud KV …).
 */
import type { EventName, EventProps } from '~/logic/events'
import type { GameConfig } from '~/game/config'
import type { FeedbackCue } from '~/game/feedback'

export interface SaveService {
  load<T>(key: string): Promise<T | null>
  save<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  /** The copy in iCloud (native only), and a hook for when another phone changes it. */
  loadCloud?<T>(key: string): Promise<T | null>
  onCloudChange?(fn: () => void): void
}

export type HapticKind = 'jump' | 'biscuit' | 'power' | 'crash' | 'success'
export interface HapticsService {
  play(kind: HapticKind): void
  setEnabled(on: boolean): void
}

export type SoundCue = FeedbackCue
export interface AudioService {
  /** Call from a user gesture: browsers only start audio after one. */
  unlock(): void
  play(cue: SoundCue): void
  /** Loop for a world (null fades it out); tempo is a multiple of the loop's base tempo. */
  music(world: number | null, tempo: number): void
  setSfx(on: boolean): void
  setMusic(on: boolean): void
}

export interface Product {
  /** Short id from content/store.json ("bones.box"). */
  id: string
  title: string
  /** Localised price from the App Store, e.g. "£8.99". */
  price: string
}

export type PurchaseResult =
  { ok: true; id: string } | { ok: false; id: string; cancelled: boolean; error?: string }

export interface IapService {
  /** Prices from the App Store (empty if it can't be reached). */
  products(): Promise<Product[]>
  purchase(id: string): Promise<PurchaseResult>
  /** Non-consumables this Apple ID owns (short ids); null if the App Store can't be asked. */
  owned(): Promise<string[] | null>
  /** Restore purchases: asks the App Store again, then returns what's owned. */
  restore(): Promise<string[] | null>
}

export type AdPlacement = 'continue' | 'doubleBiscuits' | 'freeChest'
export interface AdsService {
  /** Apple's App Tracking Transparency prompt (once, just before the first ad). */
  requestTracking(): Promise<void>
  showRewarded(placement: AdPlacement): Promise<{ rewarded: boolean }>
  /** Between-run ad. Callers decide whether one is allowed (logic/ads.ts). */
  showInterstitial(): Promise<void>
}

export interface LeaderboardEntry {
  name: string
  score: number
  rank: number
  /** Furthest world reached (0-based), packed into the Game Center score context. */
  world: number
  me: boolean
}
export type Board = 'allTime' | 'weekly'
export interface GameCenterService {
  signIn(): Promise<{ playerId: string; name: string } | null>
  /** Sends a score to the all-time and weekly boards, with the best world beside it. */
  submitScore(score: number, bestWorld: number): Promise<void>
  /** Top rows of a board, with your own row included if it's further down. */
  board(board: Board, scope: 'global' | 'friends'): Promise<LeaderboardEntry[]>
  /** Medal achievements to report: { trophy id: medal 1–3 }. Game Center keeps the best. */
  reportMedals(medals: Record<string, number>): Promise<void>
  showLeaderboards(): Promise<void>
}

export interface NotifyService {
  /** 'prompt' until asked; afterwards whatever the player chose. */
  permission(): Promise<'granted' | 'denied' | 'prompt'>
  request(): Promise<boolean>
  /** Replaces all scheduled reminders. */
  schedule(reminders: { id: number; title: string; body: string; at: Date }[]): Promise<void>
}

export interface AnalyticsService {
  /** Only the events in logic/events.ts, with their properties. */
  track<K extends EventName>(event: K, props: EventProps<K>): void
}

/** Crash reporting (Crashlytics on iOS). JS errors go in as non-fatal reports. */
export interface CrashService {
  recordError(error: unknown, context?: string): void
  /** A breadcrumb shown alongside the next crash report. */
  log(message: string): void
}

export interface ConfigService {
  /** content/worlds.json, with any Remote Config overrides already written into it. */
  game(): GameConfig
  /** Remote Config's `overrides` JSON (logic/remote.ts), or null if none or offline. */
  remoteOverrides(): Promise<unknown | null>
}

export interface Services {
  save: SaveService
  haptics: HapticsService
  audio: AudioService
  iap: IapService
  ads: AdsService
  gamecenter: GameCenterService
  notify: NotifyService
  analytics: AnalyticsService
  crash: CrashService
  config: ConfigService
}
