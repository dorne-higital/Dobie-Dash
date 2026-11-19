/**
 * Typed access to content/worlds.json. Every tuning number lives in that file;
 * code never hard-codes gameplay values.
 */
import raw from '../content/worlds.json'

/** Every obstacle, in one list: the type, the sprite cache and the tests all come from it. */
export const OBSTACLE_TYPES = [
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
  'parcel',
  'snowman',
  'snowball',
] as const
export type ObstacleType = (typeof OBSTACLE_TYPES)[number]
export type PatternType = 'single' | 'pair' | 'triple' | 'flier'
export type ThemeKind = 'park' | 'city' | 'beach' | 'night' | 'snow'
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

/** Waves wash across the path and slow you down. No obstacles spawn inside a wave. */
export interface WavesTwist {
  kind: 'waves'
  /** Seconds between waves (random in range). */
  every: [number, number]
  /** Time spent in the water at the slowed speed. */
  seconds: number
  /** Speed multiplier while in the water. */
  slow: number
  /** Seconds to ease into and out of the slowdown. */
  ease: number
  /** Clear running (seconds at world speed) before and after a wave. */
  leadIn: number
  after: number
}

/** Darkness everywhere except pools of light under the street lamps. */
export interface LampsTwist {
  kind: 'lamps'
  /** Alpha of the darkness between lamps (obstacles stay visible, just dim). */
  darkness: number
  /** Radius of each lamp's pool of light. */
  pool: number
}

/**
 * Ice patches on the path (Snowy Peaks): you can land on them, but jumps from ice are
 * slippery and lower. Obstacles may sit on or after ice; the spawner proves them clearable
 * with the lower jump wherever the dog would be standing on ice.
 */
export interface IceTwist {
  kind: 'ice'
  /** Seconds between patches (random in range). */
  every: [number, number]
  /** Length of a patch, in seconds of running at world speed (random in range). */
  seconds: [number, number]
  /** Ground jumps from ice go at this fraction of the normal jump speed. */
  jumpScale: number
  /** Clear running (seconds) before a patch starts. */
  leadIn: number
}

export type TwistDef = WavesTwist | LampsTwist | IceTwist

/**
 * Ledges (rooftops of low buildings) to run along: an optional higher path, never needed.
 * You can jump up through one and land on top. Nothing on the ground can reach a dog on
 * it, no fliers spawn under it, and the spawner keeps a landing zone clear after it.
 */
export interface PlatformsDef {
  /** Seconds between ledges (random in range). */
  every: [number, number]
  /** Length, in seconds of running at world speed (random in range). */
  seconds: [number, number]
  /** Height of the top above the ground. */
  height: number
  /** Clear running (seconds) before a ledge starts. */
  leadIn: number
}

export type BossKind = 'mower' | 'van' | 'kingCrab' | 'foxPack' | 'avalanche'

/** Gate chase: in the last `chase.window` points before the target, a boss chases you. */
export interface ChaseDef {
  boss: BossKind
  name: string
  /** Obstacle the boss adds to the mix during the chase (parcels, crabs, foxes). */
  minion: ObstacleType | null
  minionWeight: number
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
  twist: TwistDef | null
  /** Ledges to run along (City Streets, Midnight Run). */
  platforms?: PlatformsDef | null
  chase: ChaseDef
  /** Score target for the chase in the last world (later worlds take over in 1.1). */
  gate: number | null
  /** Shown on the Worlds tab. */
  about: WorldAbout
}

export interface WorldAbout {
  colour: string
  obstacles: string
  twist: string
  boss: string
}

/** Worlds 5–8: shown locked on the Worlds tab until they ship. */
export interface ComingSoonWorld extends WorldAbout {
  name: string
  at: number
}

export interface PhysicsConfig {
  gravity: number
  jumpVelocity: number
  doubleJumpVelocity: number
  jumpBuffer: number
  coyoteTime: number
  /**
   * Hold to jump higher (an accessibility option, off by default): while the jump is held
   * and the dog is still rising, gravity is scaled down, for at most `maxSeconds` per jump.
   * A tap jumps exactly as without it.
   */
  hold: { gravityScale: number; maxSeconds: number }
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
  scoring: { unitsPerMetre: number; biscuit: number; smash: number; nearMiss: number }
  /**
   * Near miss: an obstacle passes within `gap` units without touching. Worth
   * scoring.nearMiss, with `slowMo` seconds of slow motion at `timeScale`, at most once
   * per `slowMoCooldown` seconds. Slow motion slows the engine clock, not the simulation.
   */
  nearMiss: { gap: number; slowMo: number; timeScale: number; slowMoCooldown: number }
  crash: { endDelay: number }
  /**
   * "Keep running?" after a crash: seconds to decide, the biscuit price of each continue
   * in a run (its length is the most continues per run), seconds of grace after reviving,
   * and how far ahead obstacles are cleared.
   */
  continue: { countdown: number; prices: number[]; grace: number; clearAhead: number }
  worldTransition: { speedLerpSeconds: number; fadeSeconds: number }
  /**
   * After the last world's gate the run carries on for ever, getting faster: speed rises by
   * `perThousand` for every 1,000 points past the gate, up to `maxSpeed`.
   */
  endless: { perThousand: number; maxSpeed: number }
  chase: { window: number; enterSeconds: number; exitSeconds: number }
  spawner: SpawnerConfig
  /**
   * Biscuits to fill the power meter: `blocks` for the first power-up in a run, then
   * `growBy` more for each one after, up to `maxBlocks`.
   */
  meter: { blocks: number; growBy: number; maxBlocks: number; fillDuringPower: boolean }
  powerups: {
    zoomies: { duration: number; speedMultiplier: number; graceAfter: number; color: string }
    magnet: { duration: number; radius: number; pullSpeed: number; color: string }
    shield: { invulnerableAfterHit: number; color: string }
  }
  obstacles: Record<ObstacleType, ObstacleDef>
  worlds: WorldDef[]
  comingSoon: ComingSoonWorld[]
  tutorial: TutorialConfig
}

export type TutorialStep = 'jump' | 'double' | 'biscuits'

/** First-run tutorial: clears needed per step, spacing, and the coach's words. */
export interface TutorialConfig {
  jumpClears: number
  doubleClears: number
  gapScale: number
  biscuitLineSeconds: number
  coach: Record<TutorialStep | 'oops' | 'done', { title: string; text: string }>
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
