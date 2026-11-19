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
  'mixer',
  'girder',
  'pumpkin',
  'bat',
  'ghost',
  'crater',
  'alienCat',
  'clump',
] as const
export type ObstacleType = (typeof OBSTACLE_TYPES)[number]
export type PatternType = 'single' | 'pair' | 'triple' | 'flier'
export type ThemeKind = 'park' | 'city' | 'beach' | 'night' | 'snow' | 'site' | 'haunted' | 'moon'
export const POWER_KINDS = ['zoomies', 'magnet', 'shield', 'frisbee', 'sniff'] as const
export type PowerKind = (typeof POWER_KINDS)[number]
/** Upgrade level per power-up (0 = not upgraded). */
export type PowerLevels = Partial<Record<PowerKind, number>>

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

/**
 * Conveyor belts on the path (Building Site): running on one speeds you up (`fast`) or
 * slows you down (`slow`), eased in and out. Like waves, nothing spawns on a belt, and
 * patterns after one must clear at both belt speeds.
 */
export interface BeltsTwist {
  kind: 'belts'
  /** Seconds between belts (random in range). */
  every: [number, number]
  /** Time spent on a belt at its speed. */
  seconds: number
  /** Speed multipliers for the two kinds of belt. */
  fast: number
  slow: number
  /** Chance a belt is a fast one. */
  fastChance: number
  /** Seconds to ease into and out of the belt's speed. */
  ease: number
  /** Clear running (seconds at world speed) before and after a belt. */
  leadIn: number
  after: number
}

/**
 * Ghosts (Haunted Hollow) drift between faint and solid as they come. It's only how they
 * look: they're always solid to hit, and they turn fully solid when they get close.
 */
export interface GhostsTwist {
  kind: 'ghosts'
  /** Faintest a ghost gets (alpha). */
  minAlpha: number
  /** Seconds for one fade out and back in. */
  period: number
  /** Within this many points of the dog a ghost is always fully solid. */
  solidWithin: number
}

/**
 * Low gravity (Moon Walkies): everything falls slower, so jumps go higher and float
 * longer. The run, the fairness check and the bot all use the world's own physics.
 */
export interface LowGravityTwist {
  kind: 'lowGravity'
  /** Gravity is multiplied by this (less than 1). */
  gravityScale: number
}

export type TwistDef =
  WavesTwist | LampsTwist | IceTwist | BeltsTwist | GhostsTwist | LowGravityTwist

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

export type BossKind =
  'mower' | 'van' | 'kingCrab' | 'foxPack' | 'avalanche' | 'wreckingBall' | 'ghostHound' | 'ufo'

/** Gate chase: in the last `chase.window` points before the target, a boss chases you. */
export interface ChaseDef {
  boss: BossKind
  name: string
  /** Obstacle the boss adds to the mix during the chase (parcels, crabs, foxes). */
  minion: ObstacleType | null
  minionWeight: number
  /** A boss fight instead of a chase (M6, the mower first): see FightConfig. */
  fight?: BossFightDef
}

/** One boss's fight: its size, where you can stomp it, and its attacks in order. */
export interface BossFightDef {
  /** Width of the boss (facing left, as it fights), in points. */
  w: number
  /** Stomp surface, from the boss's left edge (facing left): x range and height above ground. */
  stomp: { x0: number; x1: number; top: number }
  /** Attack patterns: the nth attack uses attacks[n] (the last one repeats). */
  attacks: ObstacleType[][]
}

/** Boss fights (see the plan's "Boss fights"): timings, the stomp, rewards and the coach. */
export interface FightConfig {
  /** The fight starts this many points before the score target. */
  window: number
  /** Stomps to knock a boss out. */
  hits: number
  enterSeconds: number
  /** The red "!" shows this long before an attack. */
  warnSeconds: number
  /** Seconds after the attack has passed the dog before the boss tires. */
  afterAttack: number
  /** How long the tired boss takes to drift back past the dog (the stomp chance). */
  tiredSeconds: number
  hurtSeconds: number
  returnSeconds: number
  leaveSeconds: number
  /** Where the boss stands while attacking: this far from the right edge (its left edge). */
  frontFromRight: number
  /** The dog bounces off a stomp at this vertical speed. */
  stompBounce: number
  beatBonus: number
  /** Extra points for a knock-out without losing a shield bubble or continuing. */
  flawlessBonus: number
  /** Golden Bones for a knock-out. */
  bones: number
  /** Words for a player's first fight. */
  coach: Record<'dodge' | 'stomp' | 'hit' | 'win', { title: string; text: string }> & {
    tip: string
  }
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
  /** Score target for the chase in the last world, if it has one (null otherwise). */
  gate: number | null
  /**
   * The last world can have a chase every this many points instead of a gate (Moon
   * Walkies: a UFO every 4,000), counting from the world's start.
   */
  chaseEvery?: number | null
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
  fight: FightConfig
  /** Big Bark (M7): how many saved Big Barks can be used in one run. */
  bigBark: { perRun: number }
  spawner: SpawnerConfig
  /**
   * Biscuits to fill the power meter: `blocks` for the first power-up in a run, then
   * `growBy` more for each one after, up to `maxBlocks`.
   */
  meter: { blocks: number; growBy: number; maxBlocks: number; fillDuringPower: boolean }
  powerups: {
    /** `duration` at level 0, rising evenly to `maxDuration` at the top upgrade level. */
    zoomies: {
      duration: number
      maxDuration: number
      speedMultiplier: number
      graceAfter: number
      color: string
    }
    magnet: {
      duration: number
      maxDuration: number
      radius: number
      pullSpeed: number
      color: string
    }
    /** At the top level the shield starts with `maxLevelBubbles` bubbles. */
    shield: {
      invulnerableAfterHit: number
      /** Safe time after a pop at the top level (rises evenly from invulnerableAfterHit). */
      maxInvulnerable: number
      maxLevelBubbles: number
      color: string
    }
    /**
     * Frisbee Fetch: the dog rises to `glideY` and glides above everything, eating a high
     * line of biscuits. After it, `graceAfter` seconds of pass-through cover the fall, and
     * the spawner leaves `landingClear` seconds clear after that.
     */
    frisbee: {
      duration: number
      maxDuration: number
      glideY: number
      riseSeconds: number
      graceAfter: number
      landingClear: number
      color: string
    }
    /** Super Sniff: golden biscuits `goldenMultiplier` times as often, and glowing. */
    sniff: { duration: number; maxDuration: number; goldenMultiplier: number; color: string }
    /** Upgrade levels 1..maxLevel cost costs[level - 1] biscuits. */
    upgrades: { maxLevel: number; costs: number[] }
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

const worldPhysics = new WeakMap<WorldDef, { base: PhysicsConfig; p: PhysicsConfig }>()

/** The physics in a world: the shared physics, with low gravity applied on the moon. */
export function physicsFor(cfg: GameConfig, world: WorldDef | null | undefined): PhysicsConfig {
  const tw = world?.twist
  if (!world || tw?.kind !== 'lowGravity') return cfg.physics
  const hit = worldPhysics.get(world)
  if (hit && hit.base === cfg.physics) return hit.p
  const p = { ...cfg.physics, gravity: cfg.physics.gravity * tw.gravityScale }
  worldPhysics.set(world, { base: cfg.physics, p })
  return p
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
