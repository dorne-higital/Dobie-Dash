/** Game Center through the app's own GameCenterPlugin (ios/App/App/GameCenterPlugin.swift). */
import { registerPlugin } from '@capacitor/core'
import { LEADERBOARDS, medalAchievements } from '~/logic/gamecenter'
import type { Board, GameCenterService, LeaderboardEntry } from '../types'

interface Row {
  name: string
  score: number
  rank: number
  context: number
  me: boolean
}
interface GameCenterPlugin {
  authenticate(): Promise<{
    authenticated: boolean
    playerId?: string
    name?: string
    error?: string
  }>
  submitScore(o: { leaderboardIds: string[]; score: number; context: number }): Promise<void>
  loadEntries(o: {
    leaderboardId: string
    scope: 'global' | 'friends'
    limit?: number
  }): Promise<{ entries: Row[]; local?: Row }>
  reportAchievements(o: { achievements: { id: string; percent: number }[] }): Promise<void>
  showLeaderboards(o?: { leaderboardId?: string }): Promise<void>
}

const GameCenter = registerPlugin<GameCenterPlugin>('GameCenter')

export function createNativeGameCenter(): GameCenterService {
  let signedIn = false
  return {
    async signIn() {
      try {
        const r = await GameCenter.authenticate()
        signedIn = r.authenticated
        return r.authenticated ? { playerId: r.playerId ?? '', name: r.name ?? 'You' } : null
      } catch {
        return null
      }
    },
    async submitScore(score, bestWorld) {
      if (!signedIn) return
      await GameCenter.submitScore({
        leaderboardIds: [LEADERBOARDS.allTime, LEADERBOARDS.weekly],
        score,
        context: bestWorld,
      }).catch(() => {})
    },
    async board(board: Board, scope) {
      if (!signedIn) return []
      const r = await GameCenter.loadEntries({
        leaderboardId: LEADERBOARDS[board],
        scope,
        limit: 25,
      })
      const rows = r.entries.map<LeaderboardEntry>((e) => ({ ...e, world: e.context }))
      if (r.local && !rows.some((e) => e.me)) rows.push({ ...r.local, world: r.local.context })
      return rows
    },
    async reportMedals(medals) {
      if (!signedIn) return
      const achievements = medalAchievements(medals)
      if (achievements.length) await GameCenter.reportAchievements({ achievements }).catch(() => {})
    },
    async showLeaderboards() {
      await GameCenter.showLeaderboards({ leaderboardId: LEADERBOARDS.allTime }).catch(() => {})
    },
  }
}
