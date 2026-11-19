/**
 * In-app purchases: what each product gives, delivering it once, and the launch-time
 * entitlement check. Pure functions over the save; the purchase plugin (RevenueCat on iOS,
 * a fake on the web) only says what was bought.
 */
import raw from '~/content/store.json'
import { BREEDS } from '~/game/art/dobie'
import { BREED_PRICING } from './items'
import type { Save } from './save'
import { grant } from './shop'

export type ProductKind = 'consumable' | 'non-consumable'

export interface ProductGrants {
  biscuits?: number
  bones?: number
  item?: string
  /** Several items at once (outfit packs, M7). */
  items?: string[]
  flag?: 'removeAds'
  /** A breed key, or "all". */
  breeds?: string
}

export interface ProductDef {
  /** Short id ("removeads"); the App Store id is idPrefix + id. */
  id: string
  type: ProductKind
  title: string
  /** Fallback display price when the App Store hasn't answered (offline, web). */
  gbp: string
  grants: ProductGrants
  blurb?: string
}

interface StoreFile {
  version: number
  idPrefix: string
  products: ProductDef[]
  starterOffer: { afterRuns: number }
  ads: {
    interstitial: { minSessions: number; everyRuns: number }
    rewarded: Record<string, boolean>
  }
  notifications: { askOnDay: number; missionsAt: string; weekEndsAt: string }
}

export const STORE = raw as unknown as StoreFile
export const PRODUCTS = STORE.products

const byShort = new Map(PRODUCTS.map((p) => [p.id, p]))
export const storeId = (shortId: string) => STORE.idPrefix + shortId
export function product(id: string): ProductDef | undefined {
  return byShort.get(id.startsWith(STORE.idPrefix) ? id.slice(STORE.idPrefix.length) : id)
}

export type StoreState = Pick<
  Save,
  'wallet' | 'owned' | 'equipped' | 'player' | 'flags' | 'purchases'
>

/** The App Store product for a breed, from items.json ("breed.{breed}"). */
export function breedProduct(breed: string) {
  return BREED_PRICING.iap.replace('{breed}', breed)
}

function applyGrants(s: StoreState, g: ProductGrants) {
  s.wallet.biscuits += g.biscuits ?? 0
  s.wallet.bones += g.bones ?? 0
  if (g.item) grant(s, g.item)
  for (const id of g.items ?? []) grant(s, id)
  if (g.flag === 'removeAds') s.flags.removeAds = true
  if (g.breeds === 'all') grant(s, 'breed:all')
  else if (g.breeds) grant(s, `breed:${g.breeds}`)
}

/**
 * Gives a just-bought product. Consumables give every time; non-consumables only the
 * first time (a restore or a second phone won't pay out the starter's biscuits again).
 * Returns what was given, or null if there was nothing new.
 */
export function deliver(s: StoreState, id: string): ProductGrants | null {
  const p = product(id)
  if (!p) return null
  if (p.type === 'non-consumable') {
    if (s.purchases.delivered.includes(p.id)) return null
    s.purchases.delivered.push(p.id)
    if (p.id === 'starter') s.flags.starterSeen = true
  }
  applyGrants(s, p.grants)
  return p.grants
}

/** Things only real money can unlock, so a hand-edited save can't keep them. */
function paidOnly(p: ProductDef): { items: string[]; flag?: 'removeAds' } {
  const g = p.grants
  return {
    items: [
      // The bandana (starter) can also be bought with biscuits, so it isn't paid-only.
      ...(g.item === 'collar:gold' ? [g.item] : []),
      // Outfit pack items are only sold in their pack.
      ...(g.items ?? []),
      ...(g.breeds === 'all' ? ['breed:all'] : []),
    ],
    flag: g.flag,
  }
}

/**
 * Launch check against what the App Store says this Apple ID owns (`owned`: product ids,
 * short or full). Owned but not yet delivered (restore, new phone): delivered now.
 * Delivered or present in the save but not owned (refund, hand-edited save): taken away.
 * Single breeds stay: they can also be unlocked with Golden Bones.
 */
export function reconcile(s: StoreState, owned: Iterable<string>) {
  const have = new Set([...owned].map((id) => product(id)?.id).filter(Boolean) as string[])
  const restored: string[] = []
  const revoked: string[] = []
  for (const p of PRODUCTS) {
    if (p.type !== 'non-consumable') continue
    if (have.has(p.id)) {
      if (deliver(s, p.id)) restored.push(p.id)
      continue
    }
    const paid = paidOnly(p)
    let took = s.purchases.delivered.includes(p.id)
    s.purchases.delivered = s.purchases.delivered.filter((d) => d !== p.id)
    if (paid.flag === 'removeAds' && s.flags.removeAds) {
      s.flags.removeAds = false
      took = true
    }
    for (const id of paid.items) {
      if (s.owned.includes(id)) {
        s.owned = s.owned.filter((o) => o !== id)
        for (const slot of Object.keys(s.equipped) as (keyof typeof s.equipped)[])
          if (s.equipped[slot] === id) s.equipped[slot] = null
        took = true
      }
    }
    if (took) revoked.push(p.id)
  }
  return { restored, revoked }
}

/** Show the starter pack offer once, after this many runs, if it hasn't been bought. */
export function shouldOfferStarter(s: Pick<Save, 'stats' | 'flags' | 'purchases'>) {
  return (
    s.stats.runs >= STORE.starterOffer.afterRuns &&
    !s.flags.starterSeen &&
    !s.purchases.delivered.includes('starter')
  )
}

/** Does every breed come with "Every Breed", or does this one need its own unlock? */
export function ownsAllBreeds(s: Pick<Save, 'owned'>) {
  return s.owned.includes('breed:all')
}

export const ALL_BREEDS = Object.keys(BREEDS)
