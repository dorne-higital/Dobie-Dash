import { describe, expect, it } from 'vitest'
import worlds from '~/content/worlds.json'
import { defaultSave } from '~/logic/save'
import { buyUpgrade, nextUpgradeCost, spentOnUpgrades } from '~/logic/upgrades'

const P = worlds.powerups.upgrades

describe('power-up upgrades in the Wardrobe', () => {
  it('each level costs the next price, and the top level has none', () => {
    expect([0, 1, 2, 3, 4, 5].map((l) => nextUpgradeCost(l, P))).toEqual([
      250,
      600,
      1200,
      2500,
      5000,
      null,
    ])
  })

  it('buying takes the biscuits and raises the level, one at a time', () => {
    const s = defaultSave()
    s.wallet.biscuits = 900
    expect(buyUpgrade(s, 'magnet', P)).toEqual({ ok: true, level: 1, cost: 250 })
    expect(buyUpgrade(s, 'magnet', P)).toEqual({ ok: true, level: 2, cost: 600 })
    expect(s.wallet.biscuits).toBe(50)
    expect(buyUpgrade(s, 'magnet', P)).toEqual({ ok: false, reason: 'biscuits' })
    expect(s.upgrades.magnet).toBe(2)
    expect(s.wallet.biscuits).toBe(50)
    expect(spentOnUpgrades(s, P)).toBe(850)
  })

  it('stops at level 5', () => {
    const s = defaultSave()
    s.wallet.biscuits = 1e6
    for (let i = 0; i < 5; i++) expect(buyUpgrade(s, 'frisbee', P).ok).toBe(true)
    expect(buyUpgrade(s, 'frisbee', P)).toEqual({ ok: false, reason: 'max' })
    expect(s.wallet.biscuits).toBe(1e6 - 9550)
  })
})
