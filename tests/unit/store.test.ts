import { describe, expect, it } from 'vitest'
import { afterRun, countSession, needsTrackingPrompt } from '~/logic/ads'
import { defaultSave } from '~/logic/save'
import { equip, ownsBreed } from '~/logic/shop'
import {
  ALL_BREEDS,
  breedProduct,
  deliver,
  product,
  PRODUCTS,
  reconcile,
  shouldOfferStarter,
  STORE,
  storeId,
} from '~/logic/store'

describe('products', () => {
  it('the M4 list: ids, types and what they give', () => {
    const want: [string, string, Record<string, unknown>][] = [
      ['removeads', 'non-consumable', { flag: 'removeAds' }],
      ['starter', 'non-consumable', { biscuits: 1000, item: 'neck:bandana' }],
      ['biscuits.bag', 'consumable', { biscuits: 2000 }],
      ['biscuits.barrel', 'consumable', { biscuits: 12000 }],
      ['bones.pouch', 'consumable', { bones: 80 }],
      ['bones.box', 'consumable', { bones: 450 }],
      ['bones.crate', 'consumable', { bones: 1000 }],
      ['collar.gold', 'non-consumable', { item: 'collar:gold' }],
    ]
    for (const [id, type, grants] of want) {
      const p = product(id)!
      expect(p.type, id).toBe(type)
      expect(p.grants, id).toEqual(grants)
    }
    const prices = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.gbp]))
    expect(prices).toMatchObject({
      removeads: '£2.99',
      starter: '£0.99',
      'biscuits.bag': '£1.99',
      'biscuits.barrel': '£8.99',
      'bones.pouch': '£1.99',
      'bones.box': '£8.99',
      'bones.crate': '£17.99',
      'collar.gold': '£0.99',
      'breeds.all': '£4.99',
    })
  })

  it('App Store ids are prefixed with the bundle id, and either form looks up', () => {
    expect(storeId('removeads')).toBe('uk.co.danhorne.dobiedash.removeads')
    expect(product('uk.co.danhorne.dobiedash.bones.box')?.id).toBe('bones.box')
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length)
  })

  it('every breed except Dobie has a £0.99 product', () => {
    for (const b of ALL_BREEDS.filter((b) => b !== 'doberman'))
      expect(product(breedProduct(b))?.gbp, b).toBe('£0.99')
    expect(product(breedProduct('doberman'))).toBeUndefined()
  })
})

describe('delivering purchases', () => {
  it('consumables pay out every time', () => {
    const s = defaultSave()
    deliver(s, 'biscuits.bag')
    deliver(s, storeId('biscuits.bag'))
    deliver(s, 'bones.crate')
    expect(s.wallet).toEqual({ biscuits: 4000, bones: 1000 })
  })

  it('non-consumables pay out once (the starter pack can’t be farmed by restoring)', () => {
    const s = defaultSave()
    expect(deliver(s, 'starter')).toEqual({ biscuits: 1000, item: 'neck:bandana' })
    expect(deliver(s, 'starter')).toBeNull()
    expect(s.wallet.biscuits).toBe(1000)
    expect(s.owned).toContain('neck:bandana')
    expect(s.flags.starterSeen).toBe(true)
  })

  it('Remove Ads, the Gold Collar and breeds', () => {
    const s = defaultSave()
    deliver(s, 'removeads')
    deliver(s, 'collar.gold')
    deliver(s, 'breed.corgi')
    expect(s.flags.removeAds).toBe(true)
    expect(equip(s, 'collar:gold')).toBe(true)
    expect(ownsBreed(s, 'corgi')).toBe(true)
    expect(ownsBreed(s, 'husky')).toBe(false)
    deliver(s, 'breeds.all')
    expect(ALL_BREEDS.every((b) => ownsBreed(s, b))).toBe(true)
  })
})

describe('entitlement checks at launch', () => {
  it('a hand-edited save loses paid things the App Store says it never bought', () => {
    const s = defaultSave()
    s.flags.removeAds = true
    s.owned.push('collar:gold', 'breed:all', 'neck:bandana', 'breed:husky')
    s.equipped.collar = 'collar:gold'
    s.purchases.delivered.push('collar.gold')
    const r = reconcile(s, [])
    expect(s.flags.removeAds).toBe(false)
    expect(s.owned).toEqual(['neck:bandana', 'breed:husky']) // also earnable in-game
    expect(s.equipped.collar).toBeNull()
    expect(s.purchases.delivered).toEqual([])
    expect(r.revoked.sort()).toEqual(['breeds.all', 'collar.gold', 'removeads'])
  })

  it('restoring on a new phone gives back non-consumables once, and keeps them', () => {
    const s = defaultSave()
    const owned = ['uk.co.danhorne.dobiedash.removeads', 'uk.co.danhorne.dobiedash.starter']
    const r = reconcile(s, owned)
    expect(r.restored.sort()).toEqual(['removeads', 'starter'])
    expect(s.flags.removeAds).toBe(true)
    expect(s.wallet.biscuits).toBe(1000)
    expect(reconcile(s, owned)).toEqual({ restored: [], revoked: [] })
    expect(s.wallet.biscuits).toBe(1000)
  })

  it('consumables are never taken back', () => {
    const s = defaultSave()
    deliver(s, 'bones.box')
    reconcile(s, [])
    expect(s.wallet.bones).toBe(450)
  })
})

describe('starter pack offer', () => {
  it('once, after run 10, and never if already bought', () => {
    const s = defaultSave()
    s.stats.runs = STORE.starterOffer.afterRuns - 1
    expect(shouldOfferStarter(s)).toBe(false)
    s.stats.runs++
    expect(shouldOfferStarter(s)).toBe(true)
    s.flags.starterSeen = true
    expect(shouldOfferStarter(s)).toBe(false)
    const bought = defaultSave()
    bought.stats.runs = 50
    deliver(bought, 'starter')
    expect(shouldOfferStarter(bought)).toBe(false)
  })
})

describe('between-run ads', () => {
  const rule = STORE.ads.interstitial
  /** Plays `runs` runs and returns which ones (1-based) showed an ad. */
  function play(s: ReturnType<typeof defaultSave>, runs: number, bestOn: number[] = []) {
    const shown: number[] = []
    for (let i = 1; i <= runs; i++) if (afterRun(s, { newBest: bestOn.includes(i) })) shown.push(i)
    return shown
  }

  it('none in the first 3 sessions', () => {
    const s = defaultSave()
    for (let i = 0; i < rule.minSessions; i++) countSession(s)
    expect(play(s, 30)).toEqual([])
  })

  it('then at most one every 3 runs', () => {
    const s = defaultSave()
    for (let i = 0; i <= rule.minSessions; i++) countSession(s)
    expect(play(s, 9)).toEqual([3, 6, 9])
  })

  it('never straight after a new best (it waits for the next run)', () => {
    const s = defaultSave()
    for (let i = 0; i <= rule.minSessions; i++) countSession(s)
    expect(play(s, 6, [3])).toEqual([4])
  })

  it('never with Remove Ads', () => {
    const s = defaultSave()
    for (let i = 0; i < 10; i++) countSession(s)
    s.flags.removeAds = true
    expect(play(s, 30)).toEqual([])
  })

  it('the tracking prompt is asked once', () => {
    const s = defaultSave()
    expect(needsTrackingPrompt(s)).toBe(true)
    s.ads.attAsked = true
    expect(needsTrackingPrompt(s)).toBe(false)
  })
})
