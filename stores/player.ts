import { defineStore } from 'pinia'
import type { RunSummary } from '~/game/run'
import { defaultSave, type DogSave, type Save, type Slot } from '~/logic/save'
import { recordMissions } from '~/logic/missions'
import { buyBreed, buyItem, equip, grant, unequip, worldRewards } from '~/logic/shop'
import { updateTrophies } from '~/logic/trophies'
import { buyUpgrade } from '~/logic/upgrades'
import { addXp, runXp } from '~/logic/pass'
import type { PowerKind } from '~/game/config'
import worlds from '~/content/worlds.json'

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
    buy(id: string) {
      return buyItem(this, id)
    },
    equip(id: string) {
      return equip(this, id)
    },
    unequip(slot: Slot) {
      unequip(this, slot)
    },
    grant(id: string) {
      grant(this, id)
    },
    buyBreed(breed: string) {
      return buyBreed(this, breed)
    },
    /** Buys the next level of a power-up with biscuits (content/worlds.json prices). */
    buyUpgrade(kind: PowerKind) {
      return buyUpgrade(this, kind, worlds.powerups.upgrades)
    },
    setDog(dog: DogSave) {
      this.dog = { ...dog }
      if (!this.player.name) this.player.name = dog.name
    },
    /**
     * Spends biscuits mid-run ("Keep running?"). `pending` is this run's biscuits, which
     * count as available but are only banked when the run is recorded.
     */
    spendBiscuits(price: number, pending = 0) {
      if (this.wallet.biscuits + pending < price) return false
      this.wallet.biscuits -= price
      return true
    },
    /**
     * Records a finished run: wallet, best, stats, missions, trophies, and first-time
     * rewards (a world's item, a boss's sticker). Returns what to celebrate.
     */
    recordRun(r: RunSummary, now = new Date()) {
      const newBest = r.score > this.player.best
      if (newBest) this.player.best = r.score
      const prevWorld = this.player.bestWorld
      this.player.bestWorld = Math.max(prevWorld, r.world)
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
      st.jumps += r.jumps
      st.powerups += r.powerups
      for (const [k, v] of Object.entries(r.cleared)) st.cleared[k] = (st.cleared[k] ?? 0) + v
      recordMissions(this, r, now)
      // Pup Pass XP (only while a season is on). Tiers reached go on the results card.
      const passTiers = addXp(this, runXp(r), now)

      const unlocked: string[] = []
      for (let w = prevWorld + 1; w <= r.world; w++)
        for (const it of worldRewards(w))
          if (!this.owned.includes(it.id)) {
            grant(this, it.id)
            unlocked.push(it.id)
          }
      for (const boss of r.escaped) {
        const id = `sticker:${boss}`
        if (!this.owned.includes(id)) {
          grant(this, id)
          unlocked.push(id)
        }
      }
      // Knocked-out bosses: Golden Bones each time, and a gold sticker the first time.
      const bones = (r.beaten ?? []).length * worlds.fight.bones
      this.wallet.bones += bones
      for (const boss of r.beaten ?? []) {
        const id = `sticker-gold:${boss}`
        if (!this.owned.includes(id)) {
          grant(this, id)
          unlocked.push(id)
        }
      }
      const medals = updateTrophies(this)
      return { newBest, unlocked, medals, bones, passTiers }
    },
  },
})
