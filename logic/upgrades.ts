/**
 * Power-up upgrades (M6): five levels per power-up, bought with biscuits in the Wardrobe.
 * Prices come from content/worlds.json (powerups.upgrades); the effects live in
 * game/powerups.ts. Pure: pass the save in, get a new state back.
 */
import type { PowerKind } from '~/game/config'
import type { Save } from './save'

export interface UpgradePrices {
  maxLevel: number
  costs: number[]
}

/** Biscuits for the next level, or null at the top. */
export function nextUpgradeCost(level: number, p: UpgradePrices): number | null {
  if (level >= p.maxLevel) return null
  return p.costs[Math.max(0, level)] ?? null
}

export type UpgradeResult =
  { ok: true; level: number; cost: number } | { ok: false; reason: 'max' | 'biscuits' }

/** Buys the next level of `kind` if the player can afford it. Changes `save` in place. */
export function buyUpgrade(save: Save, kind: PowerKind, p: UpgradePrices): UpgradeResult {
  const level = save.upgrades[kind] ?? 0
  const cost = nextUpgradeCost(level, p)
  if (cost === null) return { ok: false, reason: 'max' }
  if (save.wallet.biscuits < cost) return { ok: false, reason: 'biscuits' }
  save.wallet.biscuits -= cost
  save.upgrades[kind] = level + 1
  return { ok: true, level: level + 1, cost }
}

/** Biscuits spent on all upgrades so far (for stats). */
export function spentOnUpgrades(save: Save, p: UpgradePrices): number {
  let n = 0
  for (const l of Object.values(save.upgrades)) for (let i = 0; i < l; i++) n += p.costs[i] ?? 0
  return n
}
