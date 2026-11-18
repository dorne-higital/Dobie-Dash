/**
 * Typed access to content/worlds.json. Every tuning number lives in that file;
 * code never hard-codes gameplay values.
 */
import raw from '../content/worlds.json'

export type ObstacleType =
  | 'hydrant'
  | 'cone'
  | 'puddle'
  | 'fence'
  | 'cat'
  | 'skateboarder'
  | 'manhole'
  | 'crab'
  | 'sandcastle'
  | 'seagull'
  | 'owl'
  | 'bin'
  | 'fox'

export const OBSTACLE_TYPES: ObstacleType[] = [
  'hydrant',
  'cone',
  'puddle',
  'fence',
  'cat',
  'skateboarder',
  'manhole',
  'crab',
  'sandcastle',
  'seagull',
  'owl',
  'bin',
  'fox',
]
export type PatternType = 'single' | 'pair' | 'triple' | 'flier'
export type ThemeKind = 'park' | 'city' | 'beach' | 'night'
export type PowerKind = 'zoomies' | 'magnet' | 'shield'

export interface Box {
  x0: number
  x1: number
  y0: number
  y1: number
}

export interface ObstacleDef {
  w: number
  h: number
  inset: number
  fly?: number
  extraSpeed?: number
}

export interface WorldDef {
  id: string
  name: string
  at: number
  speed: number
  gap: [number, number]
  enabled: boolean
  theme: ThemeKind
  obstacles: Partial<Record<ObstacleType, number>>
  patterns: Partial<Record<PatternType, number>>
}

export interface PhysicsConfig {
  gravity: number
  jumpVelocity: number
  doubleJumpVelocity: number
  jumpBuffer: number
  coyoteTime: number
}

export interface BiscuitSpawnConfig {
  /** Share of obstacle patterns that come with biscuits. */
  chance: number
  /** Biscuits in an arc (odd numbers keep a top biscuit for the golden one). */
  arcCount: number
  spacing: number
  breatherSpacing: number
  arcChance: number
  lowLineChance: number
  arcHeight: number
  arcHalfWidth: number
  arcLift: number
  lowY: number
  highY: number
  lineAfter: number
  highAfter: number
  goldenArcChance: number
  flierLineY: number
}

export interface SpawnerConfig {
  spawnAhead: number
  firstObstacleAt: number
  introSeconds: number
  introGapScale: number
  breatherEvery: number
  breatherSeconds: number
  pairGap: [number, number]
  /** Weight earlier worlds' obstacles keep, per world back (0.5: last world ×0.5, the one before ×0.25). */
  carryOver: number
  validatorStep: number
  biscuits: BiscuitSpawnConfig
}

export interface GameConfig {
  version: number
  view: {
    logicalWidth: number
    minLogicalHeight: number
    groundRatio: number
    maxPixelRatio: number
    dogX: number
    safeTopRatio: number
  }
  loop: { hz: number; maxStepsPerFrame: number }
  physics: PhysicsConfig
  dog: { hitbox: Box; biscuitReach: number; mouth: { x: number; y: number } }
  scoring: { unitsPerMetre: number; biscuit: number; smash: number }
  crash: { endDelay: number }
  worldTransition: { speedLerpSeconds: number; fadeSeconds: number }
  spawner: SpawnerConfig
  meter: { blocks: number; fillDuringPower: boolean }
  powerups: {
    zoomies: { duration: number; speedMultiplier: number; graceAfter: number; color: string }
    magnet: { duration: number; radius: number; pullSpeed: number; color: string }
    shield: { invulnerableAfterHit: number; color: string }
  }
  obstacles: Record<ObstacleType, ObstacleDef>
  worlds: WorldDef[]
}

/** Deep-ish clone so tests and remote overrides never mutate the bundled JSON. */
export function loadGameConfig(overrides?: Partial<GameConfig>): GameConfig {
  const base = JSON.parse(JSON.stringify(raw)) as GameConfig
  return overrides ? { ...base, ...overrides } : base
}

/** Worlds playable in this build (M1 ships worlds 1–2; 3–4 arrive in M2). */
export function playableWorlds(cfg: GameConfig): WorldDef[] {
  const out: WorldDef[] = []
  for (const w of cfg.worlds) {
    if (!w.enabled) break
    out.push(w)
  }
  return out
}
