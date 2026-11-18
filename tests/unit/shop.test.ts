import { describe, expect, it } from 'vitest'
import { BREED_PRICING, ITEMS, item } from '~/logic/items'
import { lookFor } from '~/logic/look'
import { defaultSave } from '~/logic/save'
import {
  buyBreed,
  buyItem,
  canAffordSomething,
  equip,
  offer,
  owns,
  ownsBreed,
  unequip,
  wornIn,
  worldRewards,
  type Wardrobe,
} from '~/logic/shop'

const wardrobe = (biscuits = 0, bones = 0): Wardrobe => {
  const s = defaultSave()
  s.wallet = { biscuits, bones }
  return s
}

describe('items.json', () => {
  it('every item has exactly one way to get it, and ids are unique', () => {
    const ids = new Set<string>()
    for (const it of ITEMS) {
      expect(ids.has(it.id), it.id).toBe(false)
      ids.add(it.id)
      const ways = [it.default, it.price != null, it.bones != null, !!it.iap, !!it.unlock]
      expect(ways.filter(Boolean).length, it.id).toBe(1)
      expect(it.id.startsWith(`${it.slot}:`), it.id).toBe(true)
    }
  })
  it('breeds: only Dobie is free; the rest cost 80 bones or £0.99', () => {
    expect(BREED_PRICING.free).toEqual(['doberman'])
    expect(BREED_PRICING.bones).toBe(80)
    expect(BREED_PRICING.gbp).toBe('£0.99')
  })
})

describe('buying and equipping', () => {
  it('buying with biscuits takes the price, owns it and equips it', () => {
    const w = wardrobe(1000)
    expect(buyItem(w, 'neck:bandana')).toBe('bought')
    expect(w.wallet.biscuits).toBe(600)
    expect(owns(w, 'neck:bandana')).toBe(true)
    expect(w.equipped.neck).toBe('neck:bandana')
    expect(buyItem(w, 'neck:bandana')).toBe('owned')
    expect(w.wallet.biscuits).toBe(600)
  })

  it("can't buy what you can't afford, and nothing changes", () => {
    const w = wardrobe(399)
    expect(offer(w, item('neck:bandana')!)).toEqual({
      kind: 'biscuits',
      price: 400,
      affordable: false,
    })
    expect(buyItem(w, 'neck:bandana')).toBe('poor')
    expect(w.wallet.biscuits).toBe(399)
    expect(w.owned).toEqual([])
  })

  it('bone items spend bones, not biscuits', () => {
    const w = wardrobe(5000, 50)
    expect(buyItem(w, 'hat:crown')).toBe('poor') // 60 bones
    w.wallet.bones = 60
    expect(buyItem(w, 'hat:crown')).toBe('bought')
    expect(w.wallet).toEqual({ biscuits: 5000, bones: 0 })
  })

  it('real-money and world-reward items are not for sale with biscuits', () => {
    const w = wardrobe(1e6, 1e6)
    expect(buyItem(w, 'collar:gold')).toBe('not-for-sale')
    expect(offer(w, item('collar:gold')!)).toMatchObject({ kind: 'iap', gbp: '£0.99' })
    expect(buyItem(w, 'trail:bubbles')).toBe('not-for-sale')
    expect(offer(w, item('trail:bubbles')!)).toEqual({ kind: 'unlock', world: 2 })
    expect(worldRewards(2).map((i) => i.id)).toEqual(['trail:bubbles'])
  })

  it('defaults are owned and worn until you equip something else; unequip goes back', () => {
    const w = wardrobe(1000)
    expect(wornIn(w, 'collar')?.id).toBe('collar:red')
    expect(wornIn(w, 'trail')?.id).toBe('trail:dust')
    expect(equip(w, 'collar:blue')).toBe(false) // not owned
    buyItem(w, 'collar:blue')
    expect(wornIn(w, 'collar')?.id).toBe('collar:blue')
    unequip(w, 'collar')
    expect(wornIn(w, 'collar')?.id).toBe('collar:red')
    expect(equip(w, 'collar:blue')).toBe(true)
  })

  it('trying on shows an item without owning it', () => {
    const w = wardrobe()
    const look = lookFor(null, w, 'hat:crown')
    expect(look.acc.hat).toBe('crown')
    expect(look.trail).toBe('dust')
    expect(owns(w, 'hat:crown')).toBe(false)
    expect(lookFor(null, w).acc.hat).toBeUndefined()
  })

  it('the Closet badge shows only when your biscuits can buy something new', () => {
    const cheapest = Math.min(...ITEMS.filter((i) => i.price != null).map((i) => i.price!))
    expect(canAffordSomething(wardrobe(cheapest - 1))).toBe(false)
    expect(canAffordSomething(wardrobe(cheapest))).toBe(true)
  })
})

describe('breeds', () => {
  it('Dobie is free; another breed costs bones once', () => {
    const w = wardrobe(0, 100)
    expect(ownsBreed(w, 'doberman')).toBe(true)
    expect(ownsBreed(w, 'corgi')).toBe(false)
    expect(buyBreed(w, 'corgi')).toBe('bought')
    expect(w.wallet.bones).toBe(20)
    expect(ownsBreed(w, 'corgi')).toBe(true)
    expect(buyBreed(w, 'corgi')).toBe('owned')
    expect(buyBreed(w, 'husky')).toBe('poor')
    expect(w.wallet.bones).toBe(20)
  })
})
