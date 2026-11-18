import { defineStore } from 'pinia'
import type { RunSummary } from '~/game/run'

export interface PlayerSave {
  v: 1
  best: number
  bestWorld: number
  biscuits: number
  stats: { runs: number; metres: number; biscuits: number; smashes: number }
}

export const usePlayerStore = defineStore('player', {
  state: (): PlayerSave => ({
    v: 1,
    best: 0,
    bestWorld: 0,
    biscuits: 0,
    stats: { runs: 0, metres: 0, biscuits: 0, smashes: 0 },
  }),
  actions: {
    /**
     * Spends biscuits mid-run ("Keep running?"). `pending` is this run's biscuits, which
     * count as available but are only banked when the run is recorded.
     */
    spendBiscuits(price: number, pending = 0) {
      if (this.biscuits + pending < price) return false
      this.biscuits -= price
      return true
    },
    /** Records a finished run. Returns whether it set a new best. */
    recordRun(r: RunSummary) {
      const newBest = r.score > this.best
      if (newBest) this.best = r.score
      this.bestWorld = Math.max(this.bestWorld, r.world)
      this.biscuits += r.biscuits
      this.stats.runs++
      this.stats.metres += r.metres
      this.stats.biscuits += r.biscuits
      this.stats.smashes += r.smashes
      return newBest
    },
  },
})
