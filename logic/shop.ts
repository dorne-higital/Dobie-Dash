/**
 * Owning, buying and equipping Closet items and breeds. Pure functions over the parts of
 * the save they touch, so they're easy to test; the player store wraps them.
 */
import { BREED_PRICING, ITEMS, item, type ItemDef } from './items'
import { SLOTS, type Save, type Slot } from './save'

export type Wardrobe = Pick<Save, 'wallet' | 'owned' | 'equipped' | 'player'>

export function owns(w: Wardrobe, id: string): boolean {
  return !!item(id)?.default || w.owned.includes(id)
}

/** What the buy bar shows for an item you don't own. */
export type Offer =
  | { kind: 'owned' }
  | { kind: 'biscuits'; price: number; affordable: boolean }
  | { kind: 'bones'; price: number; affordable: boolean }
  | { kind: 'iap'; product: string; gbp: string }
  | { kind: 'unlock'; world: number }

export function offer(w: Wardrobe, it: ItemDef): Offer {
  if (owns(w, it.id)) return { kind: 'owned' }
  if (it.price != null)
    return { kind: 'biscuits', price: it.price, affordable: w.wallet.biscuits >= it.price }
  if (it.bones != null)
    return { kind: 'bones', price: it.bones, affordable: w.wallet.bones >= it.bones }
  if (it.iap) return { kind: 'iap', product: it.iap, gbp: it.gbp ?? '' }
  return { kind: 'unlock', world: it.unlock?.world ?? 0 }
}

export type BuyResult = 'bought' | 'owned' | 'poor' | 'not-for-sale' | 'unknown'

/** Buys with biscuits or bones, then equips it. */
export function buyItem(w: Wardrobe, id: string): BuyResult {
  const it = item(id)
  if (!it) return 'unknown'
  const o = offer(w, it)
  if (o.kind === 'owned') return 'owned'
  if (o.kind === 'biscuits' || o.kind === 'bones') {
    if (!o.affordable) return 'poor'
    if (o.kind === 'biscuits') w.wallet.biscuits -= o.price
    else w.wallet.bones -= o.price
    w.owned.push(id)
    equip(w, id)
    return 'bought'
  }
  return 'not-for-sale'
}

/** Gives an item without paying (world rewards, mission rewards, purchases). */
export function grant(w: Wardrobe, id: string) {
  if (!w.owned.includes(id)) w.owned.push(id)
}

export function equip(w: Wardrobe, id: string): boolean {
  const it = item(id)
  if (!it || !owns(w, id)) return false
  w.equipped[it.slot] = id
  return true
}

export function unequip(w: Wardrobe, slot: Slot) {
  w.equipped[slot] = null
}

/** The item showing in a slot: the equipped one, or the slot's default (red collar, dust). */
export function wornIn(w: Wardrobe, slot: Slot): ItemDef | undefined {
  const id = w.equipped[slot]
  if (id) return item(id)
  return ITEMS.find((i) => i.slot === slot && i.default)
}

export function worn(w: Wardrobe): ItemDef[] {
  return SLOTS.map((s) => wornIn(w, s)).filter((i): i is ItemDef => !!i)
}

/** Badge on the Closet tab: something you don't own that your biscuits can buy now. */
export function canAffordSomething(w: Wardrobe): boolean {
  return ITEMS.some((it) => {
    const o = offer(w, it)
    return o.kind === 'biscuits' && o.affordable
  })
}

/** Items earned by reaching a world (0-based), granted the first time you get there. */
export function worldRewards(world: number): ItemDef[] {
  return ITEMS.filter((i) => i.unlock?.world === world)
}

// ---- breeds ----------------------------------------------------------------------------

export function ownsBreed(w: Wardrobe, breed: string): boolean {
  return (
    BREED_PRICING.free.includes(breed) ||
    w.owned.includes(`breed:${breed}`) ||
    w.owned.includes('breed:all')
  )
}

export function buyBreed(w: Wardrobe, breed: string): BuyResult {
  if (ownsBreed(w, breed)) return 'owned'
  if (w.wallet.bones < BREED_PRICING.bones) return 'poor'
  w.wallet.bones -= BREED_PRICING.bones
  w.owned.push(`breed:${breed}`)
  return 'bought'
}
