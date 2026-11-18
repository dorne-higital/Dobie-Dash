import { defineStore } from 'pinia'
import type { RunSummary } from '~/game/run'
import { defaultSave, type Save } from '~/logic/save'

/** Everything in the save except settings. Persisted by plugins/02.persist.client.ts. */
export type PlayerState = Omit<Save, 'v' | 'settings'>

export function playerState(s: Save): PlayerState {
  const rest: Partial<Save> = { ...s }
  delete rest.v
  delete rest.settings
  return rest as PlayerState
}

export const usePlayerStore = defineStore('player', {
  state: (): PlayerState => playerState(defaultSave()),
  getters: {
    best: (s) => s.player.best,
    biscuits: (s) => s.wallet.biscuits,
    bones: (s) => s.wallet.bones,
  },
  actions: {
    /**
     * Spends biscuits mid-run ("Keep running?"). `pending` is this run's biscuits, which
     * count as available but are only banked when the run is recorded.
     */
    spendBiscuits(price: number, pending = 0) {
      if (this.wallet.biscuits + pending < price) return false
      this.wallet.biscuits -= price
      return true
    },
    /** Records a finished run. Returns whether it set a new best. */
    recordRun(r: RunSummary) {
      const newBest = r.score > this.player.best
      if (newBest) this.player.best = r.score
      this.player.bestWorld = Math.max(this.player.bestWorld, r.world)
      this.wallet.biscuits += r.biscuits
      const st = this.stats
      st.runs++
      st.metres += r.metres
      st.biscuits += r.biscuits
      st.smashes += r.smashes
      st.nearMisses += r.nearMisses
      st.escapes += r.escapes
      st.continues += r.continues
      st.seconds += r.seconds
      return newBest
    },
  },
})
