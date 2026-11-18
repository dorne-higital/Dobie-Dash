/** World progression by score. Every run starts in world 0 (Bark Park). */
import type { WorldDef } from './config'

export function worldIndexForScore(score: number, worlds: WorldDef[]) {
  let i = 0
  while (i + 1 < worlds.length && score >= worlds[i + 1]!.at) i++
  return i
}

/** The score target ahead of this world: the next world's start, or the last world's gate. */
export function gateTarget(index: number, all: WorldDef[]): number | null {
  return all[index + 1]?.at ?? all[index]?.gate ?? null
}

/** How far through the current world (0..1) toward its target; null when there's none. */
export function worldProgress(score: number, index: number, all: WorldDef[]) {
  const cur = all[index]
  const target = gateTarget(index, all)
  if (!cur || target === null) return null
  return Math.max(0, Math.min(1, (score - cur.at) / (target - cur.at)))
}
