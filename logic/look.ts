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

/** Another player's dog from the boards (breed, coat, ears, tail, eyes, hat, collar). */
export function lookFromBoard(dog: Record<string, unknown> | null | undefined): Look {
  const d = dog ?? {}
  const str = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : undefined)
  const save: DogSave = {
    ...dobie(),
    name: '',
    ...(str('breed') ? { breed: str('breed')! } : {}),
    ...(typeof d.coat === 'number' ? { coat: d.coat } : {}),
    ...(str('ears') ? { ears: str('ears') as DogSave['ears'] } : {}),
    ...(str('tail') ? { tail: str('tail') as DogSave['tail'] } : {}),
    ...(str('eyes') ? { eyes: str('eyes') as DogSave['eyes'] } : {}),
  }
  const w = {
    wallet: { biscuits: 0, bones: 0 },
    owned: [],
    player: { name: '', best: 0, bestWorld: 0 },
    equipped: {
      collar: str('collar') ?? null,
      hat: str('hat') ?? null,
      eyes: null,
      neck: null,
      back: null,
      trail: null,
    },
  }
  return lookFor(save, w)
}
