/** Seeded PRNG (mulberry32). Same seed → same run, which makes runs replayable and testable. */
export class Rng {
  private s: number

  constructor(seed: number) {
    this.s = seed >>> 0 || 0x9e3779b9
  }

  /** 0 ≤ n < 1 */
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  range(a: number, b: number) {
    return a + this.next() * (b - a)
  }

  int(n: number) {
    return Math.floor(this.next() * n)
  }

  chance(p: number) {
    return this.next() < p
  }

  /** Picks a key with probability proportional to its weight. */
  weighted<K extends string>(weights: Partial<Record<K, number>>): K {
    const entries = Object.entries(weights) as [K, number][]
    const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0)
    let r = this.next() * total
    for (const [k, w] of entries) {
      r -= Math.max(0, w)
      if (r < 0) return k
    }
    return entries[entries.length - 1]![0]
  }
}

export function randomSeed() {
  return (Math.random() * 2 ** 32) >>> 0
}
