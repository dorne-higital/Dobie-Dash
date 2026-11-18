/** Turns the saved dog and what it's wearing into the art's Dog and Accessories. */
import { makeDog, type Accessories, type Dog } from '~/game/art/dobie'
import { worn, type Wardrobe } from './shop'
import { item, type TrailKind } from './items'
import { dobie, type DogSave } from './save'

export interface Look {
  dog: Dog
  acc: Accessories
  trail: TrailKind | null
}

export function dogArt(d: DogSave | null): Dog {
  const s = d ?? dobie()
  return makeDog(s.breed, { coat: s.coat, ears: s.ears, tail: s.tail, eye: s.eyes })
}

/** `tryOn` overrides one slot for the Closet preview. */
export function lookFor(d: DogSave | null, w: Wardrobe, tryOn?: string | null): Look {
  const acc: Accessories = {}
  let trail: TrailKind | null = null
  const t = item(tryOn)
  const items = t ? [...worn(w).filter((i) => i.slot !== t.slot), t] : worn(w)
  for (const it of items) {
    const { trail: tr, ...a } = it.art
    Object.assign(acc, a)
    if (tr) trail = tr
  }
  return { dog: dogArt(d), acc, trail }
}
