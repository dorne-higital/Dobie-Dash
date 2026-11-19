import type { Board, LeaderboardEntry } from '~/services/types'

const me = ref<{ playerId: string; name: string } | null>(null)
let signingIn: Promise<void> | null = null

/** Game Center: sign-in once, scores after runs, medals as achievements, boards. */
export function useGameCenter() {
  const { gamecenter } = useServices()
  const player = usePlayerStore()

  function signIn() {
    signingIn ??= gamecenter.signIn().then(async (p) => {
      me.value = p
      if (!p) {
        signingIn = null // let a later tap try again
        return
      }
      // Catch up on medals earned while signed out. (Scores go to the Supabase boards
      // now; Game Center keeps the achievements.)
      await gamecenter.reportMedals(player.trophies)
    })
    return signingIn
  }

  /** After a run: medals as Game Center achievements (scores go to the Supabase boards). */
  async function afterRun(_score: number) {
    if (!me.value) return
    await gamecenter.reportMedals(player.trophies)
  }

  async function board(b: Board, scope: 'global' | 'friends'): Promise<LeaderboardEntry[]> {
    if (!me.value) return []
    return gamecenter.board(b, scope).catch(() => [])
  }

  return { me, signIn, afterRun, board, show: () => gamecenter.showLeaderboards() }
}
