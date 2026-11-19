/**
 * Seeded obstacle and biscuit spawner, plus the fairness validator.
 *
 * Every pattern is checked before it's placed: the validator simulates the dog with the
 * engine's own physics step, hitboxes and step order, and searches for a single tap (plus
 * at most one double-jump tap) that clears the whole pattern, starting only once the dog
 * has landed from the previous pattern. If no such plan exists the pattern is pushed back
 * or downgraded, so every run is always clearable.
 */
import type {
  GameConfig,
  ObstacleType,
  PatternType,
  PlatformsDef,
  TutorialStep,
  WavesTwist,
  WorldDef,
} from './config'
import { maxAirTime, newDog, obstacleBox, stepDog } from './physics'
import { Rng } from './rng'

/** An obstacle as placed in a pattern: screen x at the step it spawns. */
export interface PatternObstacle {
  type: ObstacleType
  x: number
}

export interface ClearPlan {
  /** Steps after spawn at which to tap; null = no tap needed (run underneath). */
  jump: number | null
  double: number | null
  /** Steps after spawn when the dog is back on the ground and free. */
  land: number
}

export interface ValidateOpts {
  speed: number
  /** Steps after spawn before which the dog may still be busy with the previous pattern. */
  ready: number
  /** Ice patches as screen x ranges at spawn time (they move with the ground). */
  ice?: { x0: number; x1: number }[]
  /** Ground jumps from ice go at this fraction of the normal jump speed. */
  iceJumpScale?: number
}

const MAX_DOUBLE_DELAY = 40
/**
 * Extra clear running after a ledge's landing zone: a planned jump can come up to a second
 * (60 steps) before an obstacle arrives, so the dog must be down by then.
 */
const LEDGE_LANDING_SECONDS = 1.1

/**
 * Finds the plan that clears `pattern` and lands soonest, or null if none exists.
 * Mirrors Engine.step: dog physics → movers drift → collide, with obstacles at
 * x0 − speed·dt·k − extra·dt·(k+1) on step k after spawning.
 */
export function findClearPlan(
  pattern: PatternObstacle[],
  cfg: GameConfig,
  opts: ValidateOpts,
): ClearPlan | null {
  const dt = 1 / cfg.loop.hz
  const p = cfg.physics
  const hb = cfg.dog.hitbox
  const dogX = cfg.view.dogX
  const ready = Math.max(0, Math.ceil(opts.ready))
  const n = pattern.length

  // Each obstacle's box at step k: x0/x1 − step·k − drift·(k+1); y fixed. Plain numbers,
  // no allocation, because this runs thousands of times per pattern.
  const bx0 = new Float64Array(n)
  const bx1 = new Float64Array(n)
  const by0 = new Float64Array(n)
  const by1 = new Float64Array(n)
  const vStep = new Float64Array(n)
  const drift = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const def = cfg.obstacles[pattern[i]!.type]
    const b = obstacleBox(pattern[i]!.x, def)
    bx0[i] = b.x0
    bx1[i] = b.x1
    by0[i] = b.y0
    by1[i] = b.y1
    drift[i] = (def.extraSpeed ?? 0) * dt
    vStep[i] = opts.speed * dt + drift[i]!
  }
  const gx0 = dogX + hb.x0
  const gx1 = dogX + hb.x1

  // Ice: is the middle of the dog's feet over a patch on step k? (Patches move with the ground.)
  const ice = opts.ice ?? []
  const iceScale = opts.iceJumpScale ?? 1
  const feetX = dogX + (hb.x0 + hb.x1) / 2
  const groundStep = opts.speed * dt
  const onIce = (k: number) => {
    for (const r of ice) {
      const off = groundStep * k
      if (feetX >= r.x0 - off && feetX <= r.x1 - off) return true
    }
    return false
  }

  /** Does the dog box (at height y) hit any obstacle on step k? */
  const hit = (k: number, y: number) => {
    const dy0 = y + hb.y0
    const dy1 = y + hb.y1
    for (let i = 0; i < n; i++) {
      const off = vStep[i]! * k + drift[i]!
      if (gx1 > bx0[i]! - off && gx0 < bx1[i]! - off && dy1 > by0[i]! && dy0 < by1[i]!) return true
    }
    return false
  }
  const anyAhead = (k: number) => {
    for (let i = 0; i < n; i++) if (bx1[i]! - (vStep[i]! * k + drift[i]!) >= gx0) return true
    return false
  }
  const xOverlap = (k: number) => {
    for (let i = 0; i < n; i++) {
      const off = vStep[i]! * k + drift[i]!
      if (gx1 > bx0[i]! - off && gx0 < bx1[i]! - off) return true
    }
    return false
  }

  // Step after which every obstacle is behind the dog's hitbox.
  let passK = 0
  while (anyAhead(passK) && passK < 2000) passK++

  // First step at which a grounded dog would be hit, and first x-overlap step.
  let groundHitK = Infinity
  let xOverlapK = Infinity
  for (let k = 0; k <= passK; k++) {
    if (xOverlapK === Infinity && xOverlap(k)) xOverlapK = k
    if (hit(k, 0)) {
      groundHitK = k
      break
    }
  }

  // Before `ready` the dog may still be in the air from the previous pattern, at any
  // height, so nothing (a flier especially) may reach its column until it has landed.
  if (xOverlapK < ready) return null

  // Running underneath (e.g. a lone seagull) needs no tap at all.
  if (groundHitK === Infinity) return { jump: null, double: null, land: ready }

  const latest = Math.min(groundHitK, passK + 1)
  const earliest = Math.max(ready, latest - 60)
  const dog = newDog()

  const simulate = (j: number, d2: number): number | null => {
    dog.y = 0
    dog.vy = 0
    dog.grounded = true
    dog.jumps = 0
    dog.buffer = 0
    dog.coyote = 0
    dog.held = 0
    for (let k = j; k < j + 400; k++) {
      // Same rule as Run: feet over ice this step means ground jumps (and a jump buffered
      // on landing) are slippery. Double jumps aren't affected.
      stepDog(
        dog,
        p,
        dt,
        k === j || k === d2,
        ice.length && onIce(k) ? { jumpScale: iceScale } : {},
      )
      if (k > passK) {
        if (dog.grounded) return k
      } else if (hit(k, dog.y)) return null
    }
    return null
  }

  // Prefer one plain jump (soonest landing); fall back to jump + double jump.
  let best: ClearPlan | null = null
  for (let j = earliest; j < latest; j++) {
    const land = simulate(j, -1)
    if (land !== null && (!best || land < best.land)) best = { jump: j, double: null, land }
  }
  if (best) return best
  for (let j = earliest; j < latest; j++) {
    // Jumping later than a found plan only lands later; a few extra tries is plenty.
    if (best && j > (best.jump ?? j) + 4) break
    for (let dd = 2; dd <= MAX_DOUBLE_DELAY; dd += 2) {
      const land = simulate(j, j + dd)
      if (land !== null && (!best || land < best.land)) best = { jump: j, double: j + dd, land }
    }
  }
  return best
}

// ---- spawner ---------------------------------------------------------------------------

export interface SpawnedObstacle {
  type: ObstacleType
  /** World x (screen x = wx − dist). */
  wx: number
}

export interface SpawnedBiscuit {
  wx: number
  /** Height relative to the ground (negative is up). */
  y: number
  gold: boolean
}

export interface PlannedTaps {
  jump: number | null
  double: number | null
}

export interface SpawnBatch {
  obstacles: SpawnedObstacle[]
  biscuits: SpawnedBiscuit[]
  /** Absolute step numbers of the taps that clear this batch (used by bots and tests). */
  plan: PlannedTaps | null
  pattern: PatternType | 'breather' | 'wave' | 'ledge' | 'ice'
  /** World-x span of a wave (Sunny Beach twist). */
  wave?: { wx0: number; wx1: number; slow: number }
  /** An ice patch (Snowy Peaks twist): world-x span and how slippery jumps from it are. */
  ice?: IcePatch
  /** A ledge to run along: world-x span, height of its top and the world's look. */
  ledge?: Ledge
}

export interface IcePatch {
  wx0: number
  wx1: number
  /** Ground jumps from this patch go at this fraction of the normal jump speed. */
  jumpScale: number
}

/** Ice patches (world x) as the validator's options at distance `dist`. */
export function iceOpts(
  patches: IcePatch[],
  dist: number,
): Pick<ValidateOpts, 'ice' | 'iceJumpScale'> {
  if (!patches.length) return {}
  return {
    ice: patches.map((r) => ({ x0: r.wx0 - dist, x1: r.wx1 - dist })),
    iceJumpScale: Math.min(...patches.map((r) => r.jumpScale)),
  }
}

export interface Ledge {
  wx0: number
  wx1: number
  h: number
  theme: string
}

export interface SpawnerState {
  /** Simulation step number. */
  step: number
  /** World distance scrolled. */
  dist: number
  /** Run time in seconds. */
  time: number
  world: WorldDef
  /** Every world up to and including the current one (their obstacles stack). */
  worldsSoFar: WorldDef[]
  /** Base world speed (zoomies multiplier excluded). */
  speed: number
  /** Next world's speed, if any: patterns must stay clearable through a speed-up. */
  nextSpeed?: number
  /** During a gate chase, the boss's minion joins the mix (parcels, crabs, foxes). */
  minion?: { type: ObstacleType; weight: number }
  /** First-run tutorial step: a scripted, gentler sequence. */
  tutorial?: TutorialStep | null
}

export class Spawner {
  readonly rng: Rng
  private nextAt: number
  private nextBreather: number
  /** Absolute step at which the dog has landed from the last placed pattern. */
  private readyStep = 0
  private viewW: number
  private nextWave = Infinity
  private waveWorld = ''
  private nextLedge = Infinity
  private ledgeWorld = ''
  private nextIce = Infinity
  private iceWorld = ''
  /** Ice patches placed so far that may still be under or ahead of the dog (world x). */
  private icePatches: IcePatch[] = []
  /** The latest ledge: no fliers near it, and nothing in the landing zone up to clearTo. */
  private ledge: { wx0: number; wx1: number; clearTo: number } | null = null

  constructor(
    private cfg: GameConfig,
    seed: number,
    viewW: number,
  ) {
    this.rng = new Rng(seed)
    this.viewW = viewW
    this.nextAt = viewW * cfg.spawner.firstObstacleAt
    this.nextBreather = cfg.spawner.breatherEvery
  }

  /** After a continue: nothing new until world x `wx` (the cleared stretch stays clear). */
  holdUntil(wx: number) {
    this.nextAt = Math.max(this.nextAt, wx)
    this.readyStep = 0
  }

  /** Call once per step after `dist` advances. Returns anything that should appear now. */
  update(s: SpawnerState): SpawnBatch | null {
    const sc = this.cfg.spawner
    const spawnEdge = s.dist + this.viewW + sc.spawnAhead
    if (this.nextAt > spawnEdge) return null

    const tut = s.tutorial ?? null
    if (tut === 'biscuits') {
      // Tutorial step 3: a long low line of biscuits and nothing to jump.
      const len = this.cfg.tutorial.biscuitLineSeconds * s.speed
      const b = this.cfg.spawner.biscuits
      const biscuits: SpawnedBiscuit[] = []
      for (let x = 20; x < len; x += b.spacing * 1.5)
        biscuits.push({ wx: this.nextAt + x, y: b.lowY, gold: false })
      this.nextAt += len
      this.readyStep = 0
      return { obstacles: [], biscuits, plan: null, pattern: 'breather' }
    }

    // Breather: a stretch with no obstacles and lots of biscuits.
    if (!tut && s.time >= this.nextBreather) {
      this.nextBreather += sc.breatherEvery
      const len = sc.breatherSeconds * s.speed
      const biscuits = this.breatherBiscuits(this.nextAt, len)
      this.nextAt += len
      return { obstacles: [], biscuits, plan: null, pattern: 'breather' }
    }

    const tw = s.world.twist
    if (!tut && tw?.kind === 'waves') {
      if (this.waveWorld !== s.world.id) {
        this.waveWorld = s.world.id
        this.nextWave = s.time + this.rng.range(tw.every[0], tw.every[1])
      } else if (s.time >= this.nextWave) {
        this.nextWave = s.time + this.rng.range(tw.every[0], tw.every[1])
        return this.makeWave(tw, s)
      }
    }

    if (!tut && tw?.kind === 'ice') {
      if (this.iceWorld !== s.world.id) {
        this.iceWorld = s.world.id
        this.nextIce = s.time + this.rng.range(tw.every[0], tw.every[1])
      } else if (s.time >= this.nextIce) {
        this.nextIce = s.time + this.rng.range(tw.every[0], tw.every[1])
        const wx0 = this.nextAt + tw.leadIn * s.speed
        const wx1 = wx0 + this.rng.range(tw.seconds[0], tw.seconds[1]) * s.speed
        const patch = { wx0, wx1, jumpScale: tw.jumpScale }
        this.icePatches.push(patch)
        return { obstacles: [], biscuits: [], plan: null, pattern: 'ice', ice: patch }
      }
    }
    // Patches the dog has left behind no longer matter.
    while (this.icePatches.length && this.icePatches[0]!.wx1 < s.dist) this.icePatches.shift()

    // No rooftops during a boss chase: it should stay busy, and the landing zone after a
    // ledge would empty it.
    const pf = s.minion ? null : s.world.platforms
    if (!tut && pf) {
      if (this.ledgeWorld !== s.world.id) {
        this.ledgeWorld = s.world.id
        this.nextLedge = s.time + this.rng.range(pf.every[0], pf.every[1])
      } else if (s.time >= this.nextLedge && (!this.ledge || this.nextAt >= this.ledge.clearTo)) {
        this.nextLedge = s.time + this.rng.range(pf.every[0], pf.every[1])
        return this.makeLedge(pf, s)
      }
    }

    const intro = s.time < sc.introSeconds
    const base = this.nextAt
    const x0 = base - s.dist // screen x at this step
    const ready = this.readyStep - s.step

    // Ice in screen x at this step, and how slippery it is, for every check below.
    const ice = iceOpts(this.icePatches, s.dist)
    const check = (pat: PatternObstacle[]) => {
      const plan = findClearPlan(pat, this.cfg, { speed: s.speed, ready, ...ice })
      if (!plan) return null
      // The pattern may reach the dog at another speed: the one this world is ramping
      // to, or the next world's if the score target is close. It must clear at those too.
      // A wave just behind it may still be easing the speed back up.
      const slowed = tw?.kind === 'waves' ? s.speed * tw.slow : undefined
      for (const v of [s.world.speed, s.nextSpeed, slowed])
        if (v && v !== s.speed && !findClearPlan(pat, this.cfg, { speed: v, ready: 0, ...ice }))
          return null
      return plan
    }
    let kind: PatternType = intro || tut ? 'single' : this.rng.weighted(s.world.patterns)
    // Near a ledge only ground obstacles: a flier could reach a dog standing on top.
    const L = this.ledge
    const nearLedge = !!L && base < L.clearTo && base + 400 > L.wx0
    if (nearLedge && kind === 'flier') kind = 'single'
    let pattern: PatternObstacle[]
    let plan: ClearPlan | null
    if (tut === 'double') {
      // Tutorial step 2: only patterns that really need the double jump.
      kind = 'pair'
      const needsDouble = (p: ClearPlan | null) => (p && p.double !== null ? p : null)
      pattern = this.makePattern(kind, x0, s)
      plan = needsDouble(check(pattern))
      for (let tries = 0; !plan && tries < 24; tries++) {
        kind = tries % 2 ? 'triple' : 'pair'
        pattern = this.makePattern(kind, x0, s)
        plan = needsDouble(check(pattern))
      }
    } else {
      pattern = this.makePattern(kind, x0, s)
      plan = check(pattern)
      for (let tries = 0; !plan && tries < 3; tries++) {
        pattern = this.makePattern(kind, x0, s)
        plan = check(pattern)
      }
    }
    if (!plan && kind !== 'single') {
      kind = 'single'
      pattern = this.makePattern(kind, x0, s)
      plan = check(pattern)
    }
    if (plan && nearLedge) {
      // Nothing may run past the ledge's end into its landing zone.
      const last = pattern[pattern.length - 1]!
      const endW = last.x + this.cfg.obstacles[last.type].w + s.dist
      if (endW > L!.wx1) {
        this.nextAt = Math.max(this.nextAt, L!.clearTo)
        return null
      }
    }
    if (!plan) {
      // Still busy with the previous pattern: try again a little later.
      this.nextAt += 24
      return null
    }

    this.readyStep = s.step + plan.land + 1
    const obstacles = pattern.map((o) => ({ type: o.type, wx: o.x + s.dist }))
    const start = obstacles[0]!.wx
    const last = obstacles[obstacles.length - 1]!
    const end = last.wx + this.cfg.obstacles[last.type].w

    let [g0, g1] = s.world.gap
    const scale = tut ? this.cfg.tutorial.gapScale : intro ? sc.introGapScale : 1
    g0 *= scale
    g1 *= scale
    this.nextAt = start + this.rng.range(g0, g1) * s.speed
    this.nextAt = Math.max(this.nextAt, end + 60)

    const biscuits = this.patternBiscuits(kind, start, end).filter((b) => b.wx < this.nextAt - 40)
    return {
      obstacles,
      biscuits,
      plan: {
        jump: plan.jump === null ? null : s.step + plan.jump,
        double: plan.double === null ? null : s.step + plan.double,
      },
      pattern: kind,
    }
  }

  private pool(s: SpawnerState, ground: boolean): Partial<Record<ObstacleType, number>> {
    const pool: Partial<Record<ObstacleType, number>> = {}
    // Earlier worlds' obstacles stay in the mix, fading by carryOver per world back.
    const last = s.worldsSoFar.length - 1
    for (const [i, w] of s.worldsSoFar.entries()) {
      const scale = Math.pow(this.cfg.spawner.carryOver, last - i)
      if (!scale) continue
      for (const [k, v] of Object.entries(w.obstacles) as [ObstacleType, number][]) {
        if (ground && this.cfg.obstacles[k].fly) continue
        pool[k] = (pool[k] ?? 0) + v * scale
      }
    }
    const m = s.minion
    if (m && !(ground && this.cfg.obstacles[m.type].fly))
      pool[m.type] = (pool[m.type] ?? 0) + m.weight
    return pool
  }

  private makePattern(kind: PatternType, x0: number, s: SpawnerState): PatternObstacle[] {
    const ground = this.pool(s, true)
    if (kind === 'flier') {
      const flier = this.pool(s, false)
      const fliers = Object.keys(flier).filter((k) => this.cfg.obstacles[k as ObstacleType].fly)
      if (fliers.length)
        return [{ type: fliers[this.rng.int(fliers.length)] as ObstacleType, x: x0 }]
      kind = 'single'
    }
    const n = kind === 'pair' ? 2 : kind === 'triple' ? 3 : 1
    const out: PatternObstacle[] = []
    let x = x0
    for (let i = 0; i < n; i++) {
      const type = this.rng.weighted(ground)
      out.push({ type, x })
      x += this.cfg.obstacles[type].w + this.rng.range(...this.cfg.spawner.pairGap)
    }
    return out
  }

  private patternBiscuits(kind: PatternType, start: number, end: number): SpawnedBiscuit[] {
    const b = this.cfg.spawner.biscuits
    const out: SpawnedBiscuit[] = []
    if (kind === 'flier') {
      // A low line under the bird: stay on the ground to eat it.
      for (let i = 0; i < 4; i++)
        out.push({ wx: start - 30 + i * b.spacing, y: b.flierLineY, gold: false })
      return out
    }
    if (!this.rng.chance(b.chance)) return out
    const r = this.rng.next()
    if (r < b.arcChance) {
      const mid = (start + end) / 2
      const golden = this.rng.chance(b.goldenArcChance)
      const half = Math.floor(b.arcCount / 2)
      for (let i = -half; i <= half; i++) {
        const dx = i * b.spacing
        const h = Math.max(0, b.arcHeight * (1 - Math.pow(dx / b.arcHalfWidth, 2)))
        out.push({ wx: mid + dx, y: -h - b.arcLift, gold: golden && i === 0 })
      }
    } else if (r < b.arcChance + b.lowLineChance) {
      const n = 3 + this.rng.int(3)
      for (let i = 0; i < n; i++)
        out.push({ wx: end + b.lineAfter + i * b.spacing, y: b.lowY, gold: false })
    } else {
      for (let i = 0; i < 3; i++)
        out.push({ wx: end + b.highAfter + i * b.spacing, y: b.highY, gold: false })
    }
    return out
  }

  /**
   * A ledge: the rooftop of a low building, with biscuits along the top. Obstacles keep
   * spawning on the ground underneath as usual (ground ones only); after it ends, the
   * ground stays clear long enough for any jump off its edge to land.
   */
  private makeLedge(pf: PlatformsDef, s: SpawnerState): SpawnBatch {
    const wx0 = this.nextAt + pf.leadIn * s.speed
    const wx1 = wx0 + this.rng.range(pf.seconds[0], pf.seconds[1]) * s.speed
    const hb = this.cfg.dog.hitbox
    const fastest = Math.max(s.speed, s.nextSpeed ?? 0) + this.maxExtraSpeed()
    const air = maxAirTime(pf.height, this.cfg.physics, 1 / this.cfg.loop.hz)
    const clearTo = wx1 + (hb.x1 - hb.x0) + fastest * (air + LEDGE_LANDING_SECONDS)
    this.ledge = { wx0, wx1, clearTo }
    const b = this.cfg.spawner.biscuits
    const biscuits: SpawnedBiscuit[] = []
    const mid = (wx0 + wx1) / 2
    const golden = this.rng.chance(b.goldenArcChance * 2)
    for (let x = wx0 + 50; x < wx1 - 30; x += b.spacing * 1.5)
      biscuits.push({ wx: x, y: -pf.height + b.lowY, gold: false })
    if (golden && biscuits.length) {
      let k = 0
      for (let i = 1; i < biscuits.length; i++)
        if (Math.abs(biscuits[i]!.wx - mid) < Math.abs(biscuits[k]!.wx - mid)) k = i
      biscuits[k]!.gold = true
    }
    return {
      obstacles: [],
      biscuits,
      plan: null,
      pattern: 'ledge',
      ledge: { wx0, wx1, h: pf.height, theme: s.world.theme },
    }
  }

  private maxExtraSpeed() {
    let m = 0
    for (const d of Object.values(this.cfg.obstacles)) m = Math.max(m, d.extraSpeed ?? 0)
    return m
  }

  /** A wave: clear water to run through (slowly), with a low line of biscuits. */
  private makeWave(tw: WavesTwist, s: SpawnerState): SpawnBatch {
    const wx0 = this.nextAt + tw.leadIn * s.speed
    const wx1 = wx0 + tw.seconds * s.speed * tw.slow
    const b = this.cfg.spawner.biscuits
    const biscuits: SpawnedBiscuit[] = []
    for (let x = wx0 + 40; x < wx1 - 30; x += b.breatherSpacing)
      biscuits.push({ wx: x, y: b.lowY, gold: false })
    this.nextAt = wx1 + tw.after * s.speed
    return {
      obstacles: [],
      biscuits,
      plan: null,
      pattern: 'wave',
      wave: { wx0, wx1, slow: tw.slow },
    }
  }

  private breatherBiscuits(start: number, len: number): SpawnedBiscuit[] {
    const b = this.cfg.spawner.biscuits
    const out: SpawnedBiscuit[] = []
    for (let x = 40; x < len - 40; x += b.breatherSpacing) {
      const wave = (Math.sin((x / len) * Math.PI * 4) + 1) / 2
      out.push({ wx: start + x, y: b.lowY - wave * 70, gold: false })
    }
    return out
  }
}
