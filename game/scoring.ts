import type { GameConfig } from './config'

export interface ScoreParts {
  /** World distance in logical units. */
  dist: number
  biscuits: number
  smashes: number
  nearMisses?: number
}

export function metres(dist: number, cfg: GameConfig) {
  return Math.floor(dist / cfg.scoring.unitsPerMetre)
}

/** Score = metres + biscuits × 5 + smashes × 25 + near misses × 10 (from config). */
export function score(p: ScoreParts, cfg: GameConfig) {
  return (
    metres(p.dist, cfg) +
    p.biscuits * cfg.scoring.biscuit +
    p.smashes * cfg.scoring.smash +
    (p.nearMisses ?? 0) * cfg.scoring.nearMiss
  )
}
