import type { GameCenterService, LeaderboardEntry } from '../types'

/** In-memory leaderboard so League screens have something to show. */
export function createWebGameCenter(): GameCenterService {
  const boards = new Map<string, number[]>()
  return {
    async signIn() {
      return { playerId: 'local', name: 'You' }
    },
    async submitScore(board, score) {
      const list = boards.get(board) ?? []
      list.push(score)
      boards.set(board, list)
    },
    async topScores(board, limit = 10) {
      const list = [...(boards.get(board) ?? [])].sort((a, b) => b - a).slice(0, limit)
      return list.map<LeaderboardEntry>((score, i) => ({ name: 'You', score, rank: i + 1 }))
    },
    async unlockAchievement() {},
  }
}
