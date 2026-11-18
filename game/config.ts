/**
 * Typed access to content/worlds.json. Every tuning number lives in that file;
 * code never hard-codes gameplay values.
 */
import raw from '../content/worlds.json'

export type ObstacleType = 'hydrant' | 'cone' | 'fence' | 'cat' | 'pigeon'
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
  spacing: number
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
  pigeonLineY: number
}

export interface SpawnerConfig {
  spawnAhead: number
  firstObstacleAt: number
  introSeconds: number
  introGapScale: number
  breatherEvery: number
  breatherSeconds: number
  pairGap: [number, number]
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
  meter: { blocks: number }
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
