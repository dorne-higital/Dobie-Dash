/** World progression by score. Every run starts in world 0 (Bark Park). */
import type { WorldDef } from './config'

export function worldIndexForScore(score: number, worlds: WorldDef[]) {
  let i = 0
  while (i + 1 < worlds.length && score >= worlds[i + 1]!.at) i++
  return i
}

/**
 * The score target ahead: the next world's start, the last world's gate, or (in a last
 * world with `chaseEvery`, like Moon Walkies' UFO) the next multiple after `score`.
 */
export function gateTarget(index: number, all: WorldDef[], score = 0): number | null {
  const next = all[index + 1]?.at
  if (next !== undefined) return next
  const cur = all[index]
  if (!cur) return null
  if (cur.gate != null) return cur.gate
  if (cur.chaseEvery) {
    const k = Math.floor(Math.max(0, score - cur.at) / cur.chaseEvery) + 1
    return cur.at + k * cur.chaseEvery
  }
  return null
}

/** How far toward the target ahead (0..1); null when there's none. */
export function worldProgress(score: number, index: number, all: WorldDef[]) {
  const cur = all[index]
  const target = gateTarget(index, all, score)
  if (!cur || target === null) return null
  // Repeating chases fill from the previous one, not from the world's start.
  const from =
    cur.chaseEvery && !all[index + 1] && cur.gate == null ? target - cur.chaseEvery : cur.at
  return Math.max(0, Math.min(1, (score - from) / (target - from)))
}
