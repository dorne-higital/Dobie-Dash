import type { IapService, Product } from '../types'

const PRODUCTS: Product[] = [
  { id: 'dobiedash.removeads', title: 'Remove Ads', price: '£2.99', type: 'non-consumable' },
  { id: 'dobiedash.starter', title: 'Starter Pack', price: '£0.99', type: 'non-consumable' },
  { id: 'dobiedash.biscuits.bag', title: 'Bag of Biscuits', price: '£1.99', type: 'consumable' },
  { id: 'dobiedash.collar.gold', title: 'Gold Collar', price: '£0.99', type: 'non-consumable' },
]

/** Fake store: every purchase succeeds after a short delay. */
export function createWebIap(): IapService {
  const owned = new Set<string>()
  return {
    async products() {
      return PRODUCTS
    },
    async purchase(id) {
      await new Promise((r) => setTimeout(r, 300))
      const p = PRODUCTS.find((x) => x.id === id)
      if (!p) return { ok: false, id }
      if (p.type === 'non-consumable') owned.add(id)
      return { ok: true, id }
    },
    async restore() {
      return [...owned]
    },
  }
}
