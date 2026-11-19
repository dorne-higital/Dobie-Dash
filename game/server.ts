/**
 * Everything the submit-run Edge Function needs from the game, bundled into
 * supabase/functions/_shared/game.js by `npm run functions:build` (esbuild).
 */
import { loadGameConfig } from './config'
import { replay, type RunRecord } from './replay'

export { loadGameConfig, replay }
export { nameProblem } from '../logic/names'
export type { RunRecord }

/**
 * A short fingerprint of the gameplay config. The app sends it with each run; the server
 * only replays runs played with the same numbers it has (after a Remote Config change to
 * gameplay, redeploy the functions with it).
 */
export function configFingerprint(cfg = loadGameConfig()): string {
  const json = JSON.stringify(cfg)
  let h = 2166136261
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h.toString(36)
}
