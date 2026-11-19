import { describe, expect, it } from 'vitest'
import items from '~/content/items.json'
import store from '~/content/store.json'
import worlds from '~/content/worlds.json'
import { loadGameConfig } from '~/game/config'
import { BREED_PRICING, item } from '~/logic/items'
import { applyOverrides, type ContentFiles } from '~/logic/remote'
import { STORE } from '~/logic/store'

/** Fresh copies of the real /content files. */
const files = (): ContentFiles =>
  structuredClone({ worlds, items, store }) as unknown as ContentFiles

describe('remote config overrides', () => {
  it('applies world targets, speeds, gaps, prices and ad rules', () => {
    const f = files()
    const problems = applyOverrides(f, {
      worlds: {
        'city-streets': { at: 1800, speed: 320, gap: [1.2, 1.9] },
        'snowy-peaks': { gate: 18000 },
      },
      continuePrices: [40, 80, 160],
      meter: { growBy: 3 },
      items: { 'collar:blue': { price: 120 }, 'hat:crown': { bones: 50 } },
      breedBones: 70,
      ads: { everyRuns: 4 },
      starterAfterRuns: 8,
    })
    expect(problems).toEqual([])
    const city = f.worlds.worlds.find((w) => w.id === 'city-streets')!
    expect([city.at, city.speed, city.gap]).toEqual([1800, 320, [1.2, 1.9]])
    expect(f.worlds.worlds.at(-1)!.gate).toBe(18000)
    expect(f.worlds.continue.prices).toEqual([40, 80, 160])
    expect(f.worlds.meter).toMatchObject({ blocks: 8, growBy: 3, maxBlocks: 40 })
    expect(f.items.items.find((i) => i.id === 'collar:blue')!.price).toBe(120)
    expect(f.items.items.find((i) => i.id === 'hat:crown')!.bones).toBe(50)
    expect(f.items.breeds.bones).toBe(70)
    expect(f.store.ads.interstitial).toEqual({ minSessions: 3, everyRuns: 4 })
    expect(f.store.starterOffer.afterRuns).toBe(8)
  })

  it('changes nothing at all if any value is wrong', () => {
    const f = files()
    const before = JSON.stringify(f)
    const problems = applyOverrides(f, {
      worlds: { 'city-streets': { speed: 330 }, 'sunny-beach': { at: 1000 } }, // before City Streets
      continuePrices: [50, -1],
      items: { 'collar:red': { price: 100 } }, // free item: can't be given a price
      ads: { everyRuns: 0 },
    })
    expect(problems).toEqual(
      expect.arrayContaining([
        'worlds: sunny-beach must start after city-streets',
        'continuePrices',
        'items.collar:red.price',
        'ads',
      ]),
    )
    expect(JSON.stringify(f)).toBe(before)
  })

  it('rejects unknown worlds and items, silly speeds and non-objects', () => {
    expect(applyOverrides(files(), { worlds: { 'moon-walkies': { at: 32000 } } })).toEqual([
      'worlds.moon-walkies: no such world',
    ])
    expect(applyOverrides(files(), { worlds: { 'bark-park': { speed: 5000 } } })).toEqual([
      'worlds.bark-park.speed',
    ])
    expect(applyOverrides(files(), [])).toEqual(['overrides must be an object'])
    expect(applyOverrides(files(), {})).toEqual([])
  })

  it('written into the live /content objects, the game and shop read the new values', () => {
    const live = { worlds, items, store } as unknown as ContentFiles
    const saved = structuredClone(live)
    try {
      expect(
        applyOverrides(live, {
          worlds: { 'city-streets': { at: 1600 } },
          items: { 'neck:bandana': { price: 350 } },
          breedBones: 75,
          ads: { everyRuns: 5 },
        }),
      ).toEqual([])
      expect(loadGameConfig().worlds[1]!.at).toBe(1600)
      expect(item('neck:bandana')!.price).toBe(350)
      expect(BREED_PRICING.bones).toBe(75)
      expect(STORE.ads.interstitial.everyRuns).toBe(5)
    } finally {
      applyOverrides(live, {
        worlds: { 'city-streets': { at: saved.worlds.worlds[1]!.at } },
        items: { 'neck:bandana': { price: 400 } },
        breedBones: saved.items.breeds.bones,
        ads: { everyRuns: saved.store.ads.interstitial.everyRuns },
      })
    }
  })
})
