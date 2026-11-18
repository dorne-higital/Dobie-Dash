/** World progression by score. Every run starts in world 0 (Bark Park). */
import type { WorldDef } from './config'

export function worldIndexForScore(score: number, worlds: WorldDef[]) {
  let i = 0
  while (i + 1 < worlds.length && score >= worlds[i + 1]!.at) i++
  return i
}

/** How far through the current world (0..1) toward the next target; null in the last world. */
export function worldProgress(score: number, index: number, all: WorldDef[]) {
  const cur = all[index]
  const next = all[index + 1]
  if (!cur || !next) return null
  return Math.max(0, Math.min(1, (score - cur.at) / (next.at - cur.at)))
}
