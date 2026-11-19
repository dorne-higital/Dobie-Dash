/** Typed access to content/items.json: Closet items, breed prices and boss stickers. */
import raw from '~/content/items.json'
import type { Accessories } from '~/game/art/dobie'
import type { Slot } from './save'

import type { TrailKind } from '~/game/render/trails'

export type { TrailKind }

export interface ItemDef {
  id: string
  slot: Slot
  name: string
  /** Owned by everyone from the start. */
  default?: boolean
  /** Biscuit price. */
  price?: number
  /** Golden Bone price. */
  bones?: number
  /** App Store product (bought with real money, M4), and its display price. */
  iap?: string
  gbp?: string
  /** Earned, not bought: reaching a world (0-based index). */
  /** `text`: how to get it (Pup Pass, an event); `label`: the short tile tag. */
  unlock?: { world?: number; text?: string; label?: string }
  art: Accessories & { trail?: TrailKind }
}

export interface BreedPricing {
  free: string[]
  bones: number
  iap: string
  gbp: string
  bundle: { iap: string; gbp: string }
}

export interface StickerDef {
  id: string
  boss: string
  name: string
}

interface ItemsFile {
  version: number
  breeds: BreedPricing
  items: ItemDef[]
  stickers: StickerDef[]
}

const data = raw as unknown as ItemsFile

export const ITEMS: ItemDef[] = data.items
export const BREED_PRICING: BreedPricing = data.breeds
export const STICKERS: StickerDef[] = data.stickers

const byId = new Map(ITEMS.map((i) => [i.id, i]))
export function item(id: string | null | undefined): ItemDef | undefined {
  return id ? byId.get(id) : undefined
}

export function itemsFor(slots: Slot[]): ItemDef[] {
  return ITEMS.filter((i) => slots.includes(i.slot))
}
