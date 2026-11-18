/**
 * Native-facing services. Each has a web fake in services/web/ for now; the iOS container
 * will provide native implementations (Game Center, StoreKit, AdMob, haptics, iCloud KV …).
 */
import type { GameConfig } from '~/game/config'

export interface SaveService {
  load<T>(key: string): Promise<T | null>
  save<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
}

export type HapticKind = 'jump' | 'biscuit' | 'power' | 'crash' | 'success'
export interface HapticsService {
  play(kind: HapticKind): void
  setEnabled(on: boolean): void
}

export interface Product {
  id: string
  title: string
  price: string
  type: 'consumable' | 'non-consumable'
}
export interface IapService {
  products(): Promise<Product[]>
  purchase(id: string): Promise<{ ok: boolean; id: string }>
  restore(): Promise<string[]>
}

export type AdPlacement = 'continue' | 'chest' | 'double' | 'interstitial'
export interface AdsService {
  isRewardedReady(placement: AdPlacement): Promise<boolean>
  showRewarded(placement: AdPlacement): Promise<{ rewarded: boolean }>
}

export interface LeaderboardEntry {
  name: string
  score: number
  rank: number
}
export interface GameCenterService {
  signIn(): Promise<{ playerId: string; name: string } | null>
  submitScore(board: string, score: number): Promise<void>
  topScores(board: string, limit?: number): Promise<LeaderboardEntry[]>
  unlockAchievement(id: string, percent?: number): Promise<void>
}

export interface AnalyticsService {
  track(event: string, props?: Record<string, string | number | boolean>): void
}

export interface ConfigService {
  /** Bundled content/worlds.json merged with any remote overrides. */
  game(): GameConfig
  refresh(): Promise<void>
}

export interface Services {
  save: SaveService
  haptics: HapticsService
  iap: IapService
  ads: AdsService
  gamecenter: GameCenterService
  analytics: AnalyticsService
  config: ConfigService
}
