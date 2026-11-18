import type { GameCenterService, LeaderboardEntry } from '../types'

/**
 * Web: Game Center only exists in the iPhone app. On the dev server an in-memory board
 * stands in so the League screens can be built.
 */
export function createWebGameCenter(dev: boolean): GameCenterService {
  const scores: { score: number; world: number }[] = []
  return {
    async signIn() {
      return dev ? { playerId: 'local', name: 'You' } : null
    },
    async submitScore(score, bestWorld) {
      scores.push({ score, world: bestWorld })
    },
    async board() {
      return [...scores]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map<LeaderboardEntry>((s, i) => ({ name: 'You', ...s, rank: i + 1, me: true }))
    },
    async reportMedals() {},
    async showLeaderboards() {},
  }
}
