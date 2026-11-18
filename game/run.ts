/**
 * One run of the game as a deterministic simulation: no DOM, no canvas, no Vue.
 * The Engine drives it at a fixed 60 Hz and draws it; tests drive it directly.
 */
import {
  playableWorlds,
  type BossKind,
  type Box,
  type GameConfig,
  type ObstacleDef,
  type ObstacleType,
  type TutorialStep,
} from './config'
import { dogBox, newDog, obstacleBox, overlaps, stepDog, type DogBody } from './physics'
import {
  eatBiscuit,
  newPowerState,
  resolveHit,
  speedMultiplier,
  tickPowers,
  type PowerEvent,
  type PowerState,
} from './powerups'
import { metres, score } from './scoring'
import { findClearPlan, Spawner, type PatternObstacle } from './spawner'
import { gateTarget, worldIndexForScore } from './worlds'

export interface Obstacle {
  id: number
  type: ObstacleType
  def: ObstacleDef
  wx: number
  pwx: number
  /** Animation phase offset (tails, wings, wheels). */
  ph: number
  dead: boolean
  /**
   * Spawned during Zoomies: spaced for Zoomies speed, so it stays smashable after
   * Zoomies ends rather than becoming an unfair hit at the slower speed.
   */
  soft: boolean
  /** Closest vertical clearance to Dobie while overlapping him horizontally. */
  minGap: number
  passed: boolean
  /** Knock-away motion once dead (screen-space, relative to wx/ground). */
  kx: number
  ky: number
  kvx: number
  kvy: number
  rot: number
}

export interface Biscuit {
  wx: number
  y: number
  pwx: number
  py: number
  gold: boolean
  ph: number
}

export interface RunSummary {
  score: number
  metres: number
  biscuits: number
  smashes: number
  world: number
  worldName: string
  seconds: number
  seed: number
  /** Gate chases escaped this run, and which bosses. */
  escapes: number
  escaped: BossKind[]
  /** Boss that was chasing when you crashed, if any ("The mail van got you!"). */
  caughtBy: string | null
  continues: number
  nearMisses: number
  /** Taps that jumped (ground and double). */
  jumps: number
  /** Power-ups switched on. */
  powerups: number
  golden: number
  /** Obstacles cleared without touching, by type ("Jump 3 cats in one run"). */
  cleared: Partial<Record<ObstacleType, number>>
}

/** The only events that leave the engine for Vue. */
export interface RunEvents {
  'run:end': RunSummary
  biscuit: { count: number; meter: number; gold: boolean }
  world: { index: number; id: string; name: string }
  power: PowerEvent
  /** Tutorial: a new step started, the player bumped into something, or it's done. */
  tutorial: { step: TutorialStep | 'done'; oops: boolean }
  /** Crashed with continues left: offer "Keep running?" at this biscuit price. */
  continue: { price: number; index: number; countdown: number }
  /** A gate chase started (active) or ended (escaped, or caught when the run crashed). */
  chase: { active: boolean; boss: BossKind; name: string; escaped: boolean }
}
export type RunEvent = { [K in keyof RunEvents]: { type: K; data: RunEvents[K] } }[keyof RunEvents]

/** Visual / haptic cues for the renderer (not part of the Vue contract). */
export type Fx =
  | { type: 'jump' | 'double' | 'land' | 'crash' | 'splash' | 'revive' }
  | { type: 'eat'; x: number; y: number; gold: boolean }
  | { type: 'smash' | 'pop' | 'nearMiss'; x: number; y: number }

/** 'offer': crashed, waiting for the player to keep running (revive) or not (decline). */
export type RunState = 'running' | 'crashed' | 'offer' | 'ended'

export interface RunOptions {
  /** Taps happen on the steps the spawner planned (tests, `?bot`). */
  autoplay?: boolean
  /** Obstacles can't end the run (for `?bot` perf soaks). */
  invincible?: boolean
  /** Testing only (`?world=3`): start in this world (0-based) with its score target banked. */
  startWorld?: number
  /** First-run tutorial: jump, double jump, then biscuits; hits don't end the run until done. */
  tutorial?: boolean
}

export class Run {
  readonly cfg: GameConfig
  readonly seed: number
  readonly worlds = [] as ReturnType<typeof playableWorlds>
  readonly dt: number
  readonly spawner: Spawner
  readonly opts: RunOptions

  state: RunState = 'running'
  step = 0
  time = 0
  dist = 0
  prevDist = 0
  speed: number
  worldIndex = 0
  dog: DogBody = newDog()
  prevDogY = 0
  runPhase = 0
  obstacles: Obstacle[] = []
  biscuits: Biscuit[] = []
  /** Waves on the path (world x); in one, the speed eases down to `slow`. */
  waves: { wx0: number; wx1: number; slow: number }[] = []
  /** Current wave speed multiplier (1 out of the water). */
  waveMul = 1
  private inWave = false
  private lastSlow = 1
  power: PowerState = newPowerState()
  /** Gate chase in progress: the boss chasing, and the score that escapes it. */
  chase: { boss: BossKind; name: string; target: number; since: number } | null = null
  /** When the last chase ended (run time), so the boss can drop back on screen. */
  chaseEnded: { boss: BossKind; at: number } | null = null
  escapes = 0
  escaped: BossKind[] = []
  continues = 0
  nearMisses = 0
  jumps = 0
  powerupsUsed = 0
  golden = 0
  cleared: Partial<Record<ObstacleType, number>> = {}
  private chased = new Set<number>()
  /** Tutorial progress (null when this isn't a tutorial run). */
  tutorial: { step: TutorialStep | 'done'; count: number; doubled: boolean } | null = null
  biscuitsEaten = 0
  smashes = 0
  score = 0
  crashTime = 0
  events: RunEvent[] = []
  fx: Fx[] = []
  private pressed = false
  private taps = new Set<number>()
  private tapSpeed = 0
  private nextId = 1
  private scoreOffset = 0

  constructor(cfg: GameConfig, seed: number, viewW: number, opts: RunOptions = {}) {
    this.cfg = cfg
    this.seed = seed
    this.opts = opts
    this.worlds = playableWorlds(cfg)
    this.dt = 1 / cfg.loop.hz
    this.spawner = new Spawner(cfg, seed, viewW)
    const sw = Math.min(Math.max(0, opts.startWorld ?? 0), this.worlds.length - 1)
    this.worldIndex = sw
    this.scoreOffset = this.worlds[sw]!.at
    this.speed = this.worlds[sw]!.speed
    if (opts.tutorial) {
      this.tutorial = { step: 'jump', count: 0, doubled: false }
      this.emit('tutorial', { step: 'jump', oops: false })
    }
  }

  private get tutorialActive() {
    return !!this.tutorial && this.tutorial.step !== 'done'
  }

  private tutorialStep(step: TutorialStep | 'done') {
    this.tutorial = { step, count: 0, doubled: false }
    this.emit('tutorial', { step, oops: false })
  }

  /** An obstacle went past untouched: counts toward the jump and double-jump steps. */
  private tutorialCleared() {
    const t = this.tutorial
    if (!t || t.step === 'done' || t.step === 'biscuits') return
    const T = this.cfg.tutorial
    if (t.step === 'jump') {
      if (++t.count >= T.jumpClears) this.tutorialStep('double')
    } else if (t.doubled && ++t.count >= T.doubleClears) this.tutorialStep('biscuits')
  }

  get world() {
    return this.worlds[this.worldIndex]!
  }

  /** Effective scroll speed including Zoomies. */
  get scrollSpeed() {
    return this.speed * speedMultiplier(this.power, this.cfg) * this.waveMul
  }

  press() {
    if (this.state === 'running') this.pressed = true
  }

  summary(): RunSummary {
    return {
      score: this.score,
      metres: metres(this.dist, this.cfg),
      biscuits: this.biscuitsEaten,
      smashes: this.smashes,
      world: this.worldIndex,
      worldName: this.world.name,
      seconds: Math.round(this.time * 10) / 10,
      seed: this.seed,
      escapes: this.escapes,
      escaped: [...this.escaped],
      caughtBy: this.chase?.name ?? null,
      continues: this.continues,
      nearMisses: this.nearMisses,
      jumps: this.jumps,
      powerups: this.powerupsUsed,
      golden: this.golden,
      cleared: { ...this.cleared },
    }
  }

  private emit<K extends keyof RunEvents>(type: K, data: RunEvents[K]) {
    this.events.push({ type, data } as RunEvent)
  }

  update() {
    const dt = this.dt
    this.prevDist = this.dist
    this.prevDogY = this.dog.y
    for (const o of this.obstacles) o.pwx = o.wx
    for (const b of this.biscuits) {
      b.pwx = b.wx
      b.py = b.y
    }

    this.updateKnocked(dt)
    if (this.state === 'ended' || this.state === 'offer') return
    if (this.state === 'crashed') {
      this.crashTime += dt
      if (this.crashTime >= this.cfg.crash.endDelay) {
        const C = this.cfg.continue
        if (this.continues < C.prices.length) {
          this.state = 'offer'
          this.emit('continue', {
            price: C.prices[this.continues]!,
            index: this.continues,
            countdown: C.countdown,
          })
        } else this.end()
      }
      return
    }

    this.step++
    this.time += dt

    // Ease toward the current world's speed after a world change.
    const target = this.world.speed
    if (this.speed !== target) {
      const prev = this.worlds[Math.max(0, this.worldIndex - 1)]!.speed
      const rate = Math.abs(target - prev) / this.cfg.worldTransition.speedLerpSeconds || 1e9
      const d = target - this.speed
      this.speed += Math.sign(d) * Math.min(Math.abs(d), rate * dt)
    }

    // Waves: ease the speed down while the dog is in the water, back up after.
    const dogWX = this.dist + this.cfg.view.dogX
    const wave = this.waves.find((w) => dogWX >= w.wx0 && dogWX <= w.wx1)
    const twist = this.world.twist
    const ease = twist?.kind === 'waves' ? twist.ease : 0.35
    const want = wave ? wave.slow : 1
    const step = (dt / ease) * (1 - (wave?.slow ?? this.lastSlow))
    this.waveMul += Math.sign(want - this.waveMul) * Math.min(Math.abs(want - this.waveMul), step)
    if (wave && !this.inWave) this.fx.push({ type: 'splash' })
    if (wave) this.lastSlow = wave.slow
    this.inWave = !!wave
    if (this.waves.length && this.waves[0]!.wx1 < this.dist - 200) this.waves.shift()

    const v = this.scrollSpeed
    this.dist += v * dt
    this.runPhase += (dt * v) / 24

    // Spawn.
    const batch = this.spawner.update({
      step: this.step,
      dist: this.dist,
      time: this.time,
      world: this.world,
      worldsSoFar: this.worlds.slice(0, this.worldIndex + 1),
      speed: this.speed,
      nextSpeed: this.worlds[this.worldIndex + 1]?.speed,
      tutorial: this.tutorialActive ? (this.tutorial!.step as TutorialStep) : null,
      minion:
        this.chase && this.world.chase.minion
          ? { type: this.world.chase.minion, weight: this.world.chase.minionWeight }
          : undefined,
    })
    if (batch) {
      for (const o of batch.obstacles) {
        this.obstacles.push({
          id: this.nextId++,
          type: o.type,
          def: this.cfg.obstacles[o.type],
          wx: o.wx,
          pwx: o.wx,
          ph: this.spawner.rng.next() * Math.PI * 2,
          dead: false,
          soft: this.power.zoomies > 0,
          minGap: Infinity,
          passed: false,
          kx: 0,
          ky: 0,
          kvx: 0,
          kvy: 0,
          rot: 0,
        })
      }
      if (batch.wave) this.waves.push(batch.wave)
      for (const b of batch.biscuits)
        this.biscuits.push({ ...b, pwx: b.wx, py: b.y, ph: (b.wx * 0.37) % (Math.PI * 2) })
    }

    // Dog.
    if (this.opts.autoplay) this.autoplay()
    const r = stepDog(this.dog, this.cfg.physics, dt, this.pressed)
    this.pressed = false
    if (r.jumped) {
      this.jumps++
      if (r.jumped === 'double' && this.tutorial?.step === 'double') this.tutorial.doubled = true
      this.fx.push({ type: r.jumped === 'ground' ? 'jump' : 'double' })
    }
    if (r.landed && !r.jumped) this.fx.push({ type: 'land' })

    // Obstacles: fliers drift toward the dog, then collisions.
    const dogX = this.cfg.view.dogX
    const db = dogBox(dogX, this.dog.y, this.cfg.dog.hitbox)
    for (const o of this.obstacles) {
      if (o.dead) continue
      if (o.def.extraSpeed) o.wx -= o.def.extraSpeed * dt
      const ob = obstacleBox(o.wx - this.dist, o.def)
      if (!overlaps(db, ob)) {
        this.checkNearMiss(o, db, ob)
        continue
      }
      if (this.tutorialActive) {
        // Learning: bump it out of the way and try again.
        this.knock(o)
        this.fx.push({ type: 'pop', x: dogX + 8, y: this.dog.y - 36 })
        this.emit('tutorial', { step: this.tutorial!.step, oops: true })
        continue
      }
      const outcome = this.opts.invincible || o.soft ? 'smash' : resolveHit(this.power, this.cfg)
      if (outcome === 'pass') continue
      if (outcome === 'crash') {
        this.state = 'crashed'
        this.crashTime = 0
        this.fx.push({ type: 'crash' })
        return
      }
      this.knock(o)
      const fy = -(o.def.fly ?? 0) - o.def.h / 2
      if (outcome === 'smash') {
        if (!this.opts.invincible) this.smashes++
        this.fx.push({ type: 'smash', x: o.wx - this.dist + o.def.w / 2, y: fy })
      } else {
        this.fx.push({ type: 'pop', x: dogX + 8, y: this.dog.y - 36 })
        this.emit('power', { kind: 'shield', active: false })
      }
    }

    // Biscuits.
    const mx = dogX + this.cfg.dog.mouth.x
    const my = this.dog.y + this.cfg.dog.mouth.y
    const mag = this.power.magnet > 0 ? this.cfg.powerups.magnet : null
    const reach = this.cfg.dog.biscuitReach
    const kept: Biscuit[] = []
    for (const b of this.biscuits) {
      let sx = b.wx - this.dist
      if (mag) {
        const dx = mx - sx
        const dy = my - b.y
        const d = Math.hypot(dx, dy)
        if (d < mag.radius && d > 1) {
          const k = Math.min(1, (mag.pullSpeed * dt) / d)
          b.wx += dx * k
          b.y += dy * k
          sx = b.wx - this.dist
        }
      }
      if (Math.hypot(mx - sx, my - b.y) < reach) {
        this.biscuitsEaten++
        const pe = eatBiscuit(this.power, b.gold, this.spawner.rng, this.cfg)
        this.fx.push({ type: 'eat', x: sx, y: b.y, gold: b.gold })
        this.emit('biscuit', { count: this.biscuitsEaten, meter: this.power.meter, gold: b.gold })
        if (b.gold) this.golden++
        if (pe) {
          if (pe.active) this.powerupsUsed++
          if (pe.active && this.tutorial?.step === 'biscuits') this.tutorialStep('done')
          this.emit('power', pe)
        }
        continue
      }
      if (sx > -40) kept.push(b)
    }
    this.biscuits = kept

    for (const e of tickPowers(this.power, dt, this.cfg)) this.emit('power', e)

    // Score and world.
    this.score =
      this.scoreOffset +
      score(
        {
          dist: this.dist,
          biscuits: this.biscuitsEaten,
          smashes: this.smashes,
          nearMisses: this.nearMisses,
        },
        this.cfg,
      )
    this.updateChase()
    const wi = worldIndexForScore(this.score, this.worlds)
    if (wi > this.worldIndex) {
      this.worldIndex = wi
      this.emit('world', { index: wi, id: this.world.id, name: this.world.name })
    }
  }

  /** Scrapes past an obstacle without touching it: +10 and a moment of slow motion. */
  private checkNearMiss(o: Obstacle, db: Box, ob: Box) {
    if (o.passed) return
    if (ob.x1 > db.x0 && ob.x0 < db.x1) {
      o.minGap = Math.min(o.minGap, Math.max(ob.y0 - db.y1, db.y0 - ob.y1))
      return
    }
    if (ob.x1 > db.x0) return // not reached yet
    o.passed = true
    this.cleared[o.type] = (this.cleared[o.type] ?? 0) + 1
    this.tutorialCleared()
    if (o.minGap > this.cfg.nearMiss.gap || o.soft) return
    if (this.power.zoomies > 0 || this.power.grace > 0) return
    this.nearMisses++
    this.fx.push({ type: 'nearMiss', x: this.cfg.view.dogX, y: this.dog.y - 60 })
  }

  private end() {
    this.state = 'ended'
    this.emit('run:end', this.summary())
  }

  /** "Keep running?" accepted: clear what's just ahead, back on your feet, brief grace. */
  revive() {
    if (this.state !== 'offer') return
    this.continues++
    const C = this.cfg.continue
    const dogX = this.cfg.view.dogX
    for (const o of this.obstacles)
      if (!o.dead && o.wx - this.dist < dogX + C.clearAhead) this.knock(o)
    this.dog = newDog()
    this.taps.clear()
    this.power.grace = Math.max(this.power.grace, C.grace)
    this.spawner.holdUntil(this.dist + this.cfg.view.dogX + C.clearAhead)
    this.state = 'running'
    this.fx.push({ type: 'revive' })
  }

  /** "Keep running?" declined or timed out. */
  decline() {
    if (this.state === 'offer') this.end()
  }

  /** Starts a boss chase in the last stretch before a target; passing the target escapes it. */
  private updateChase() {
    const c = this.chase
    if (c && this.score >= c.target) {
      this.chase = null
      this.chaseEnded = { boss: c.boss, at: this.time }
      this.escapes++
      this.escaped.push(c.boss)
      this.emit('chase', { active: false, boss: c.boss, name: c.name, escaped: true })
      return
    }
    if (c) return
    const target = gateTarget(this.worldIndex, this.worlds)
    if (target === null || this.chased.has(target)) return
    if (this.score < target - this.cfg.chase.window || this.score >= target) return
    this.chased.add(target)
    const def = this.world.chase
    this.chase = { boss: def.boss, name: def.name, target, since: this.time }
    this.emit('chase', { active: true, boss: def.boss, name: def.name, escaped: false })
  }

  /**
   * Bot: whenever the dog is on the ground with nothing scheduled, plan taps for the next
   * group of obstacles from the live state, using the same validator as the spawner.
   */
  private autoplay() {
    // Taps planned at one speed go stale while a world change ramps the speed: replan.
    if (this.dog.grounded && this.scrollSpeed !== this.tapSpeed) this.taps.clear()
    if (this.taps.size === 0 && this.dog.grounded) {
      this.tapSpeed = this.scrollSpeed
      const dogX = this.cfg.view.dogX
      const hb = this.cfg.dog.hitbox
      const ahead = this.obstacles
        .filter((o) => !o.dead && o.wx - this.dist + o.def.w - o.def.inset > dogX + hb.x0)
        .sort((a, b) => a.wx - b.wx)
      // Group by when things reach the dog, not by screen gap: a fox or skateboarder
      // closes on whatever is in front of it.
      const v = this.scrollSpeed
      const arrive = (x: number, o: Obstacle) => (x - dogX) / (v + (o.def.extraSpeed ?? 0))
      ahead.sort((a, b) => arrive(a.wx - this.dist, a) - arrive(b.wx - this.dist, b))
      // Clusters: obstacles that reach the dog within 160 px of each other. Plan for as
      // many clusters (inside 0.75 s) as two taps can clear, but never split a cluster.
      const group: PatternObstacle[] = []
      const cuts: number[] = []
      let end = -Infinity
      for (const o of ahead) {
        const x = o.wx - this.dist
        const t = arrive(x, o)
        if (group.length && t - end > 0.75) break
        if (group.length && t - end > 160 / v) cuts.push(group.length)
        // Runs before this step's physics, so this step is the validator's step 0.
        group.push({ type: o.type, x })
        end = Math.max(end, arrive(x + o.def.w, o))
      }
      cuts.push(group.length)
      if (group.length && group[0]!.x - dogX < 520) {
        let plan = null
        for (let i = cuts.length - 1; i >= 0 && !plan; i--)
          plan = findClearPlan(group.slice(0, cuts[i]), this.cfg, { speed: v, ready: 0 })
        // Last resort: clear what two taps can, but only commit once that jump is due,
        // so waiting never throws away a better plan.
        for (let n = group.length - 1; n > 0 && !plan; n--) {
          const p = findClearPlan(group.slice(0, n), this.cfg, { speed: v, ready: 0 })
          if (p) {
            if ((p.jump ?? 0) <= 1) plan = p
            break
          }
        }
        const base = this.step
        if (plan?.jump != null) this.taps.add(base + plan.jump)
        if (plan?.double != null) this.taps.add(base + plan.double)
      }
    }
    if (this.taps.delete(this.step)) this.pressed = true
    for (const t of this.taps) if (t < this.step) this.taps.delete(t)
  }

  private knock(o: Obstacle) {
    o.dead = true
    o.kvx = 220 + this.spawner.rng.next() * 160
    o.kvy = -(500 + this.spawner.rng.next() * 200)
  }

  private updateKnocked(dt: number) {
    for (const o of this.obstacles) {
      if (!o.dead) continue
      o.kx += o.kvx * dt
      o.kvy += 1400 * dt
      o.ky += o.kvy * dt
      o.rot += dt * 10
    }
    this.obstacles = this.obstacles.filter((o) => o.wx - this.dist + o.kx > -140 && o.ky < 600)
  }
}
