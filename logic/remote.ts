/**
 * Remote Config: live tuning without an App Store update. Firebase Remote Config holds one
 * JSON parameter, `overrides`, in the shape below. At launch it is checked as a whole and,
 * only if every value makes sense, written into the same /content objects the game reads.
 * Anything missing or wrong leaves the bundled /content values in place.
 *
 * Only tuning numbers can change: world targets, speeds and gaps, the continue prices, the
 * power meter, the endless ramp, item and breed prices, and the ad and starter-offer
 * rules. Fairness doesn't depend on these: the spawner proves every pattern clearable at
 * whatever speed it meets.
 */

export interface RemoteOverrides {
  /** By world id, e.g. "city-streets". */
  worlds?: Record<string, { at?: number; speed?: number; gap?: [number, number]; gate?: number }>
  continuePrices?: number[]
  meter?: { blocks?: number; growBy?: number; maxBlocks?: number }
  endless?: { perThousand?: number; maxSpeed?: number }
  /** By item id: biscuit price and/or Golden Bone price. */
  items?: Record<string, { price?: number; bones?: number }>
  breedBones?: number
  ads?: { minSessions?: number; everyRuns?: number }
  starterAfterRuns?: number
  /** Pup Pass season dates (M7): start as a UTC date, YYYY-MM-DD. */
  pass?: { start?: string; weeks?: number }
  /** Seasonal events by id (M7): move the dates (UTC, end exclusive) or switch one off. */
  events?: Record<string, { start?: string; end?: string; off?: boolean }>
}

/** The parts of the /content files that overrides write into (mutated in place). */
export interface ContentFiles {
  worlds: {
    worlds: { id: string; at: number; speed: number; gap: number[]; gate: number | null }[]
    continue: { prices: number[] }
    meter: { blocks: number; growBy: number; maxBlocks: number }
    endless: { perThousand: number; maxSpeed: number }
  }
  items: { items: { id: string; price?: number; bones?: number }[]; breeds: { bones: number } }
  store: {
    ads: { interstitial: { minSessions: number; everyRuns: number } }
    starterOffer: { afterRuns: number }
  }
  /** content/pass-s1.json (optional so older callers still type-check). */
  pass?: { start: string; weeks: number }
  /** content/events.json (optional, like pass). */
  events?: { events: { id: string; start: string; end: string; off?: boolean }[] }
}

const isDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
const isNum = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max

/**
 * Applies `o` to a copy first and checks it; writes into `files` only if there are no
 * problems. Returns the problems (empty when applied).
 */
export function applyOverrides(files: ContentFiles, o: unknown): string[] {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return ['overrides must be an object']
  const copy = structuredClone(files)
  const problems = writeOverrides(copy, o as RemoteOverrides)
  if (!problems.length) writeOverrides(files, o as RemoteOverrides)
  return problems
}

function writeOverrides(f: ContentFiles, o: RemoteOverrides): string[] {
  const bad: string[] = []

  for (const [id, w] of Object.entries(o.worlds ?? {})) {
    const world = f.worlds.worlds.find((x) => x.id === id)
    if (!world) {
      bad.push(`worlds.${id}: no such world`)
      continue
    }
    if (w.at !== undefined) {
      if (isInt(w.at, 0, 1_000_000)) world.at = w.at
      else bad.push(`worlds.${id}.at`)
    }
    if (w.speed !== undefined) {
      if (isNum(w.speed, 150, 800)) world.speed = w.speed
      else bad.push(`worlds.${id}.speed`)
    }
    if (w.gap !== undefined) {
      const g = w.gap
      if (Array.isArray(g) && g.length === 2 && isNum(g[0], 0.5, 5) && isNum(g[1], g[0], 5))
        world.gap = [g[0], g[1]]
      else bad.push(`worlds.${id}.gap`)
    }
    if (w.gate !== undefined) {
      if (world.gate !== null && isInt(w.gate, 1, 1_000_000)) world.gate = w.gate
      else bad.push(`worlds.${id}.gate`)
    }
  }
  // Targets must still climb world by world from 0, and the last gate sit above the last target.
  const ws = f.worlds.worlds
  if (ws[0]!.at !== 0) bad.push('worlds: the first world must start at 0')
  for (let i = 1; i < ws.length; i++)
    if (ws[i]!.at <= ws[i - 1]!.at)
      bad.push(`worlds: ${ws[i]!.id} must start after ${ws[i - 1]!.id}`)
  const last = ws[ws.length - 1]!
  if (last.gate !== null && last.gate <= last.at)
    bad.push(`worlds: ${last.id} gate must be above its target`)

  if (o.continuePrices !== undefined) {
    const p = o.continuePrices
    if (Array.isArray(p) && p.length >= 1 && p.length <= 5 && p.every((x) => isInt(x, 0, 100_000)))
      f.worlds.continue.prices = [...p]
    else bad.push('continuePrices')
  }
  if (o.meter) {
    const m = { ...f.worlds.meter, ...o.meter }
    if (isInt(m.blocks, 1, 100) && isInt(m.growBy, 0, 100) && isInt(m.maxBlocks, m.blocks, 200))
      Object.assign(f.worlds.meter, { blocks: m.blocks, growBy: m.growBy, maxBlocks: m.maxBlocks })
    else bad.push('meter')
  }
  if (o.endless) {
    const e = { ...f.worlds.endless, ...o.endless }
    if (isNum(e.perThousand, 0, 100) && isNum(e.maxSpeed, last.speed, 900))
      Object.assign(f.worlds.endless, { perThousand: e.perThousand, maxSpeed: e.maxSpeed })
    else bad.push('endless')
  }

  for (const [id, p] of Object.entries(o.items ?? {})) {
    const it = f.items.items.find((x) => x.id === id)
    if (!it) {
      bad.push(`items.${id}: no such item`)
      continue
    }
    // Only change the kind of price an item already has (no making paid items free-to-earn).
    for (const k of ['price', 'bones'] as const) {
      if (p[k] === undefined) continue
      if (it[k] !== undefined && isInt(p[k], 1, 1_000_000)) it[k] = p[k]
      else bad.push(`items.${id}.${k}`)
    }
  }
  if (o.breedBones !== undefined) {
    if (isInt(o.breedBones, 1, 10_000)) f.items.breeds.bones = o.breedBones
    else bad.push('breedBones')
  }
  if (o.ads) {
    const a = { ...f.store.ads.interstitial, ...o.ads }
    if (isInt(a.minSessions, 0, 100) && isInt(a.everyRuns, 1, 100))
      Object.assign(f.store.ads.interstitial, {
        minSessions: a.minSessions,
        everyRuns: a.everyRuns,
      })
    else bad.push('ads')
  }
  if (o.starterAfterRuns !== undefined) {
    if (isInt(o.starterAfterRuns, 0, 1000)) f.store.starterOffer.afterRuns = o.starterAfterRuns
    else bad.push('starterAfterRuns')
  }
  if (o.pass) {
    if (!f.pass) bad.push('pass: not loaded')
    else {
      const ps = { ...f.pass, ...o.pass }
      if (isDate(ps.start) && isInt(ps.weeks, 1, 26))
        Object.assign(f.pass, { start: ps.start, weeks: ps.weeks })
      else bad.push('pass')
    }
  }
  for (const [id, e] of Object.entries(o.events ?? {})) {
    const ev = f.events?.events.find((x) => x.id === id)
    if (!ev) {
      bad.push(`events.${id}: no such event`)
      continue
    }
    const next = { start: e.start ?? ev.start, end: e.end ?? ev.end }
    if (
      !isDate(next.start) ||
      !isDate(next.end) ||
      Date.parse(next.end) <= Date.parse(next.start)
    ) {
      bad.push(`events.${id}`)
      continue
    }
    if (e.off !== undefined && typeof e.off !== 'boolean') {
      bad.push(`events.${id}.off`)
      continue
    }
    Object.assign(ev, next, e.off !== undefined ? { off: e.off } : {})
  }
  return bad
}
