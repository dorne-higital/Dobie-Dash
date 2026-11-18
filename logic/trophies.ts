/** Ten trophies, each with bronze, silver and gold medals, from content/trophies.json. */
import raw from '~/content/trophies.json'
import type { Save } from './save'

export interface TrophyDef {
  id: string
  name: string
  text: string
  /** A Stats field, or "best" / "bestWorld" from the player. */
  stat: string
  /** Bronze, silver, gold thresholds. */
  tiers: [number, number, number]
}

export const TROPHIES = (raw as unknown as { trophies: TrophyDef[] }).trophies
export const MEDALS = ['None', 'Bronze', 'Silver', 'Gold'] as const

export function trophyValue(s: Pick<Save, 'stats' | 'player'>, stat: string): number {
  if (stat === 'best') return s.player.best
  if (stat === 'bestWorld') return s.player.bestWorld
  const v = (s.stats as unknown as Record<string, unknown>)[stat]
  return typeof v === 'number' ? v : 0
}

/** 0 none, 1 bronze, 2 silver, 3 gold. */
export function medalFor(t: TrophyDef, value: number) {
  return t.tiers.filter((x) => value >= x).length
}

/** Updates the saved medals; returns the trophies that just went up a medal. */
export function updateTrophies(s: Pick<Save, 'stats' | 'player' | 'trophies'>) {
  const up: { trophy: TrophyDef; medal: number }[] = []
  for (const t of TROPHIES) {
    const m = medalFor(t, trophyValue(s, t.stat))
    if (m > (s.trophies[t.id] ?? 0)) {
      s.trophies[t.id] = m
      up.push({ trophy: t, medal: m })
    }
  }
  return up
}
