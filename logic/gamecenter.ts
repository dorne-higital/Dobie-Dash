/** Game Center ids from content/gamecenter.json, and medals → achievements. */
import gc from '~/content/gamecenter.json'
import { TROPHIES } from './trophies'

export const LEADERBOARDS = gc.leaderboards

export function achievementId(trophy: string, medal: number) {
  return gc.achievementId.replace('{trophy}', trophy).replace('{medal}', gc.medals[medal - 1]!)
}

/** Every medal up to the one earned is complete (gold also completes silver and bronze). */
export function medalAchievements(medals: Record<string, number>) {
  return Object.entries(medals).flatMap(([trophy, m]) =>
    Array.from({ length: Math.min(3, m) }, (_, i) => ({
      id: achievementId(trophy, i + 1),
      percent: 100,
    })),
  )
}

/** All 30 achievement ids, for setting them up in App Store Connect. */
export function allAchievementIds() {
  return TROPHIES.flatMap((t) => [1, 2, 3].map((m) => achievementId(t.id, m)))
}
