/**
 * One run of the game as a deterministic simulation: no DOM, no canvas, no Vue.
 * The Engine drives it at a fixed 60 Hz and draws it; tests drive it directly.
 */
import {
  physicsFor,
  playableWorlds,
  type BossFightDef,
  type PowerLevels,
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
  goldenScale,
  type PowerEvent,
  type PowerState,
} from './powerups'
import { metres, score } from './scoring'
import {
  findClearPlan,
  iceOpts,
  Spawner,
  type IcePatch,
  type Ledge,
  type PatternObstacle,
} from './spawner'
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
  /** Bosses knocked out in a fight this run. */
  beaten: BossKind[]
  /** A coached first fight ended with no hits: show the stomp tip on the results card. */
  fightTip: boolean
  /** Boss that was chasing when you crashed, if any ("The mail van got you!"). */
  caughtBy: string | null
  /** The obstacle that ended the run (the last crash), if any. */
  hitBy: ObstacleType | null
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
  /**
   * Boss fight moments: it started, attacks are coming (dodge), it's tired (stomp), a hit,
   * knocked out (win), or it gave up at the target (leave). `coach`: first fight, explain.
   */
  fight: {
    step: 'start' | 'dodge' | 'stomp' | 'hit' | 'win' | 'leave'
    boss: BossKind
    hits: number
    need: number
    coach: boolean
  }
}
export type RunEvent = { [K in keyof RunEvents]: { type: K; data: RunEvents[K] } }[keyof RunEvents]

/** Visual / haptic cues for the renderer (not part of the Vue contract). */
export type Fx =
  | { type: 'jump' | 'double' | 'land' | 'crash' | 'splash' | 'revive' | 'skid' }
  | { type: 'eat'; x: number; y: number; gold: boolean }
  | { type: 'smash' | 'pop' | 'nearMiss' | 'stomp'; x: number; y: number }

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
  /** Hold to jump higher (Settings). */
  holdToJump?: boolean
  /** Power-up upgrade levels bought in the Wardrobe (longer powers, a second bubble). */
  powerLevels?: PowerLevels
  /** Coach the first boss fight of this run (the player's first fight ever). */
  coachFight?: boolean
  /** Bot only: stomp tired bosses (default true; false proves dodging alone survives). */
  botStomps?: boolean
}

export type FightPhase =
  'enter' | 'warn' | 'attack' | 'tired' | 'hurt' | 'return' | 'beaten' | 'leave'

/** A boss fight in progress (see content/worlds.json "fight" and the world's chase.fight). */
export interface Fight {
  boss: BossKind
  name: string
  def: BossFightDef
  phase: FightPhase
  /** Seconds in this phase. */
  t: number
  /** Boss's left edge on screen (it faces left, toward the dog). */
  bx: number
  /** Where bx started this phase (for eased moves). */
  bx0: number
  hits: number
  attacks: number
  /** No shield bubble lost and no continue during the fight. */
  flawless: boolean
  coach: boolean
  /** Seconds since the attack passed the dog. */
  clearFor: number
  /** Has the stomp been explained yet (first tired moment)? */
  toldStomp: boolean
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
  /** Speed zones: waves (Sunny Beach) and conveyor belts (Building Site, `belt`). */
  waves: { wx0: number; wx1: number; slow: number; belt?: boolean }[] = []
  /** Rooftop ledges in play (City Streets, Midnight Run). */
  ledges: Ledge[] = []
  /** World x the Frisbee biscuit line has been laid up to. */
  private glideLineTo = 0
  /** Ice patches in play (Snowy Peaks). */
  ice: IcePatch[] = []
  /** Current wave speed multiplier (1 out of the water). */
  waveMul = 1
  /** The multiplier waveMul is easing toward (1 outside a zone). */
  private zoneWant = 1
  private inWave = false
  private lastSlow = 1
  power: PowerState = newPowerState()
  /** Gate chase in progress: the boss chasing, and the score that escapes it. */
  chase: { boss: BossKind; name: string; target: number; since: number } | null = null
  /** When the last chase ended (run time), so the boss can drop back on screen. */
  chaseEnded: { boss: BossKind; at: number } | null = null
  escapes = 0
  escaped: BossKind[] = []
  beaten: BossKind[] = []
  fightTip = false
  /** Boss fight in progress, if any. */
  fight: Fight | null = null
  private fightAttack: ObstacleType[] | null = null
  private fightAttackIds: number[] = []
  private coachUsed = false
  private readonly viewW: number
  continues = 0
  hitBy: ObstacleType | null = null
  nearMisses = 0
  jumps = 0
  powerupsUsed = 0
  golden = 0
  cleared: Partial<Record<ObstacleType, number>> = {}
  /** The last score target a chase started for (targets only go up). */
  private lastChased = -1
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
    this.power = newPowerState(opts.powerLevels)
    this.worlds = playableWorlds(cfg)
    this.dt = 1 / cfg.loop.hz
    this.spawner = new Spawner(cfg, seed, viewW)
    this.viewW = viewW
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

  /**
   * The speed to run at: the world's own, except in the last world past its gate (or from
   * its start, if it has no gate), where it keeps climbing with score up to a cap
   * (content/worlds.json "endless").
   */
  targetSpeed(score = this.score): number {
    const w = this.world
    const from = w.gate ?? w.at
    if (this.worldIndex < this.worlds.length - 1 || score <= from) return w.speed
    const e = this.cfg.endless
    return Math.min(e.maxSpeed, w.speed + (e.perThousand * (score - from)) / 1000)
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

  /** The jump is being held down (only counts with hold to jump higher on). */
  holding = false

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
      beaten: [...this.beaten],
      fightTip: this.fightTip,
      caughtBy: this.chase?.name ?? null,
      hitBy: this.hitBy,
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

    // Ease toward the current world's speed after a world change (or the endless ramp).
    const target = this.targetSpeed()
    if (this.speed !== target) {
      const prev = this.worlds[Math.max(0, this.worldIndex - 1)]!.speed
      const rate = Math.abs(target - prev) / this.cfg.worldTransition.speedLerpSeconds || 1e9
      const d = target - this.speed
      this.speed += Math.sign(d) * Math.min(Math.abs(d), rate * dt)
    }

    // Waves and belts: ease the speed to the zone's multiplier while the dog is in it, back
    // to normal after. The ease takes `ease` seconds whichever way it goes.
    const dogWX = this.dist + this.cfg.view.dogX
    const wave = this.waves.find((w) => dogWX >= w.wx0 && dogWX <= w.wx1)
    const twist = this.world.twist
    const ease = twist?.kind === 'waves' || twist?.kind === 'belts' ? twist.ease : 0.35
    const want = wave ? wave.slow : 1
    this.zoneWant = want
    const step = (dt / ease) * Math.abs(1 - (wave?.slow ?? this.lastSlow))
    this.waveMul += Math.sign(want - this.waveMul) * Math.min(Math.abs(want - this.waveMul), step)
    if (wave && !this.inWave && !wave.belt) this.fx.push({ type: 'splash' })
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
      // Patterns must stay clearable at the speed they may meet: the next world's, or a
      // little further up the endless ramp (500 points is far more than a pattern's life).
      nextSpeed: this.worlds[this.worldIndex + 1]?.speed ?? this.targetSpeed(this.score + 500),
      nextWorld: this.worlds[this.worldIndex + 1],
      goldenScale: goldenScale(this.power, this.cfg),
      clear: this.landingClear(),
      tutorial: this.tutorialActive ? (this.tutorial!.step as TutorialStep) : null,
      fight: this.fightOn() ? { attack: this.fightAttack } : undefined,
      minion:
        this.chase && !this.fight && this.world.chase.minion
          ? { type: this.world.chase.minion, weight: this.world.chase.minionWeight }
          : undefined,
    })
    if (batch) {
      if (batch.pattern === 'attack') {
        this.fightAttack = null
        this.fightAttackIds = batch.obstacles.map((_, i) => this.nextId + i)
      }
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
      if (batch.ledge) this.ledges.push(batch.ledge)
      if (batch.ice) this.ice.push(batch.ice)
      // Frisbee Fetch: biscuits along the glide move up to where the dog's mouth is.
      const glide = this.glideSpan()
      for (const b0 of batch.biscuits) {
        const b = glide && b0.wx > glide.wx0 && b0.wx < glide.wx1 ? { ...b0, y: glide.y } : b0
        this.biscuits.push({ ...b, pwx: b.wx, py: b.y, ph: (b.wx * 0.37) % (Math.PI * 2) })
      }
    }

    // Frisbee Fetch: a high line of biscuits all along the glide.
    const glide = this.glideSpan()
    if (glide) {
      const sp = this.cfg.spawner.biscuits.spacing * 1.5
      let x = Math.max(this.glideLineTo, glide.wx0 + 60)
      for (; x < glide.wx1 - 20; x += sp)
        this.biscuits.push({
          wx: x,
          y: glide.y,
          gold: false,
          pwx: x,
          py: glide.y,
          ph: (x * 0.37) % (Math.PI * 2),
        })
      this.glideLineTo = x
    } else this.glideLineTo = 0

    // Dog.
    if (this.opts.autoplay) this.autoplay()
    const slip = this.iceUnderDog()
    const prevY = this.dog.y
    const r =
      this.power.frisbee > 0
        ? this.glide(dt)
        : stepDog(this.dog, physicsFor(this.cfg, this.world), dt, this.pressed, {
            floor: this.floorUnderDog(),
            holding: !!this.opts.holdToJump && this.holding,
            jumpScale: slip?.jumpScale ?? 1,
          })
    if (r.landed && slip) this.fx.push({ type: 'skid' })
    this.checkStomp(prevY)
    if (this.ice.length && this.ice[0]!.wx1 < this.dist - 300) this.ice.shift()
    if (this.ledges.length && this.ledges[0]!.wx1 < this.dist - 300) this.ledges.shift()
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
        this.hitBy = o.type
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
        if (this.fight) this.fight.flawless = false
        this.fx.push({ type: 'pop', x: dogX + 8, y: this.dog.y - 36 })
        if (this.power.shield <= 0) this.emit('power', { kind: 'shield', active: false })
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
    this.updateFight(dt)
    const wi = worldIndexForScore(this.score, this.worlds)
    if (wi > this.worldIndex) {
      this.worldIndex = wi
      this.emit('world', { index: wi, id: this.world.id, name: this.world.name })
    }
  }

  /** The surface under the dog: a ledge's top if the dog is over one and above it, else 0. */
  private floorUnderDog(): number {
    const hb = this.cfg.dog.hitbox
    const x = this.dist + this.cfg.view.dogX
    for (const l of this.ledges)
      if (x + hb.x1 > l.wx0 + 8 && x + hb.x0 < l.wx1 - 8 && this.dog.y <= -l.h + 0.5) return -l.h
    return 0
  }

  /**
   * Frisbee Fetch: rise to the glide height and hold it; taps do nothing. When it ends the
   * dog falls with one jump left (a double jump), covered by the power's grace.
   */
  private glide(dt: number) {
    const fr = this.cfg.powerups.frisbee
    const d = this.dog
    d.y += (fr.glideY - d.y) * Math.min(1, (dt / fr.riseSeconds) * 3)
    d.vy = 0
    d.grounded = false
    d.jumps = 1
    d.coyote = 0
    d.buffer = 0
    d.held = 0
    return { jumped: null, landed: false }
  }

  /** World-x span the dog will glide over (Frisbee Fetch), and the biscuit height there. */
  private glideSpan() {
    if (this.power.frisbee <= 0) return null
    const fr = this.cfg.powerups.frisbee
    const x = this.dist + this.cfg.view.dogX
    return {
      wx0: x,
      wx1: x + this.power.frisbee * this.scrollSpeed,
      y: fr.glideY + this.cfg.dog.mouth.y,
    }
  }

  /**
   * Where the dog comes down after Frisbee Fetch (world x): no new obstacles there, so the
   * landing is always safe. Padded for Zoomies starting or stopping during the glide.
   */
  private landingClear() {
    if (this.power.frisbee <= 0) return undefined
    const fr = this.cfg.powerups.frisbee
    const x = this.dist + this.cfg.view.dogX
    const slow = this.speed * this.waveMul
    const fast = this.speed * this.cfg.powerups.zoomies.speedMultiplier * Math.max(1, this.waveMul)
    return {
      wx0: x + this.power.frisbee * slow - 150,
      wx1: x + (this.power.frisbee + fr.graceAfter + fr.landingClear) * fast,
    }
  }

  /** The ice patch under the middle of the dog's feet, if any (same rule as the spawner). */
  private iceUnderDog(): IcePatch | undefined {
    const hb = this.cfg.dog.hitbox
    const x = this.dist + this.cfg.view.dogX + (hb.x0 + hb.x1) / 2
    return this.ice.find((r) => x >= r.wx0 && x <= r.wx1)
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
    if (this.fight) this.fight.flawless = false
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

  /**
   * Starts a boss chase in the last stretch before a target; passing the target escapes it.
   * Bosses with a `fight` fight instead (see updateFight); passing the target ends that too.
   */
  private updateChase() {
    const c = this.chase
    if (c && this.score >= c.target) {
      this.endChase()
      if (this.fight && this.fight.phase !== 'beaten') {
        // Not knocked out: it gives up and drives off. First fight with no hits: a tip.
        if (this.fight.coach && this.fight.hits === 0) this.fightTip = true
        this.fightPhase('leave')
        this.fightEmit('leave')
      }
      return
    }
    if (c) return
    const target = gateTarget(this.worldIndex, this.worlds, this.score)
    if (target === null || target <= this.lastChased) return
    const def = this.world.chase
    const window = def.fight ? this.cfg.fight.window : this.cfg.chase.window
    if (this.score < target - window || this.score >= target) return
    this.lastChased = target
    this.chase = { boss: def.boss, name: def.name, target, since: this.time }
    this.emit('chase', { active: true, boss: def.boss, name: def.name, escaped: false })
    if (def.fight) {
      const coach = !!this.opts.coachFight && !this.coachUsed
      this.coachUsed ||= coach
      const behind = -def.fight.w - 40
      this.fight = {
        boss: def.boss,
        name: def.name,
        def: def.fight,
        phase: 'enter',
        t: 0,
        bx: behind,
        bx0: behind,
        hits: 0,
        // A boss that comes back (the UFO) starts one attack further along each time.
        attacks: Math.min(
          this.escaped.filter((b) => b === def.boss).length,
          def.fight.attacks.length - 1,
        ),
        flawless: true,
        coach,
        clearFor: 0,
        toldStomp: false,
      }
      this.fightEmit('start')
    }
  }

  /** The chase is over (escaped or knocked out): counts as an escape either way. */
  private endChase() {
    const c = this.chase
    if (!c) return
    this.chase = null
    if (!this.fight) this.chaseEnded = { boss: c.boss, at: this.time }
    this.escapes++
    this.escaped.push(c.boss)
    this.emit('chase', { active: false, boss: c.boss, name: c.name, escaped: true })
  }

  /** The fight is running (not knocked out or leaving): only its attacks spawn. */
  private fightOn() {
    const p = this.fight?.phase
    return !!p && p !== 'beaten' && p !== 'leave'
  }

  private fightEmit(step: RunEvents['fight']['step']) {
    const f = this.fight!
    this.emit('fight', {
      step,
      boss: f.boss,
      hits: f.hits,
      need: this.cfg.fight.hits,
      coach: f.coach,
    })
  }

  private fightPhase(p: FightPhase) {
    const f = this.fight!
    f.phase = p
    f.t = 0
    f.bx0 = f.bx
  }

  /** Where the boss stands to attack (its left edge). */
  private get fightFront() {
    return this.viewW - this.cfg.fight.frontFromRight
  }

  /** The tired boss's position `t` seconds into its drift back past the dog. */
  private tiredX(t: number) {
    const f = this.fight!
    const behind = -f.def.w - 40
    return (
      this.fightFront + (behind - this.fightFront) * Math.min(1, t / this.cfg.fight.tiredSeconds)
    )
  }

  /**
   * The fight, one step: the boss overtakes you, warns, attacks (through the spawner, so
   * every attack is proven clearable), tires and drifts back past you (stomp it!), then
   * returns to the front and goes again, until it's knocked out or you reach the target.
   */
  private updateFight(dt: number) {
    const f = this.fight
    if (!f) return
    const F = this.cfg.fight
    const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, k), 3)
    f.t += dt
    switch (f.phase) {
      case 'enter':
        f.bx = f.bx0 + (this.fightFront - f.bx0) * ease(f.t / F.enterSeconds)
        if (f.t >= F.enterSeconds) {
          this.fightPhase('warn')
          this.fightEmit('dodge')
        }
        break
      case 'warn':
        f.bx = this.fightFront
        if (f.t >= F.warnSeconds) {
          const list = f.def.attacks
          this.fightAttack = [...list[Math.min(f.attacks, list.length - 1)]!]
          this.fightAttackIds = []
          f.attacks++
          f.clearFor = 0
          this.fightPhase('attack')
        }
        break
      case 'attack': {
        f.bx = this.fightFront
        const hb = this.cfg.dog.hitbox
        const dogL = this.cfg.view.dogX + hb.x0
        const passed =
          !this.fightAttack &&
          this.fightAttackIds.every((id) => {
            const o = this.obstacles.find((x) => x.id === id)
            return !o || o.dead || o.wx - this.dist + o.def.w < dogL - 4
          })
        f.clearFor = passed ? f.clearFor + dt : 0
        if (f.clearFor >= F.afterAttack) {
          this.fightPhase('tired')
          if (!f.toldStomp) {
            f.toldStomp = true
            this.fightEmit('stomp')
          }
        }
        break
      }
      case 'tired':
        f.bx = this.tiredX(f.t)
        if (f.t >= F.tiredSeconds) this.fightPhase('return')
        break
      case 'hurt':
        if (f.t >= F.hurtSeconds) this.fightPhase('return')
        break
      case 'return':
        f.bx = f.bx0 + (this.fightFront - f.bx0) * ease(f.t / F.returnSeconds)
        if (f.t >= F.returnSeconds) this.fightPhase('warn')
        break
      case 'beaten':
      case 'leave':
        f.bx += (f.phase === 'beaten' ? 260 : 420) * dt
        if (f.t >= F.leaveSeconds) this.fight = null
        break
    }
  }

  /** A falling dog that crosses the tired boss's top while over it stomps it. */
  private checkStomp(prevY: number) {
    const f = this.fight
    if (!f || f.phase !== 'tired') return
    const d = this.dog
    if (!this.stompHits(prevY, d.y, d.vy, f.bx, f)) return
    const F = this.cfg.fight
    d.y = -f.def.stomp.top
    d.vy = F.stompBounce
    d.grounded = false
    d.jumps = 1
    d.coyote = 0
    d.buffer = 0
    this.taps.clear()
    f.hits++
    this.fx.push({ type: 'stomp', x: this.cfg.view.dogX, y: d.y })
    if (f.hits >= F.hits) {
      this.scoreOffset += F.beatBonus + (f.flawless ? F.flawlessBonus : 0)
      this.beaten.push(f.boss)
      this.fightPhase('beaten')
      this.fightEmit('win')
      this.endChase()
      // Obstacles come back now, but the dog is still bouncing off the knock-out (a long
      // float on the moon): nothing may arrive before it has landed.
      const land = this.stepsToLand()
      const v = this.scrollSpeed
      this.spawner.holdUntil(
        this.dist + this.cfg.view.dogX + (land * this.dt + 0.6) * v + 60,
        this.step + land,
      )
    } else {
      this.fightPhase('hurt')
      this.fightEmit('hit')
    }
  }

  /**
   * Bot: if the dog would land on (or fly into) an obstacle, the step to double jump on
   * that avoids it until it lands; null when no tap is needed or none helps.
   */
  private rescueTap(): number | null {
    const p = physicsFor(this.cfg, this.world)
    const hb = this.cfg.dog.hitbox
    const dogX = this.cfg.view.dogX
    const v = this.scrollSpeed
    const dt = this.dt
    const live = this.obstacles.filter((o) => !o.dead && o.wx - this.dist < dogX + 700)
    if (!live.length) return null
    const hits = (k: number | null) => {
      const d = { ...this.dog }
      for (let i = 0; i < 300; i++) {
        stepDog(d, p, dt, i === k)
        const db = dogBox(dogX, d.y, hb)
        for (const o of live) {
          const x = o.wx - this.dist - (v + (o.def.extraSpeed ?? 0)) * dt * (i + 1)
          if (overlaps(db, obstacleBox(x, o.def))) return true
        }
        if (d.grounded && (k === null || i > k)) return false
      }
      return false
    }
    if (!hits(null)) return null
    for (let k = 0; k < 90; k++) if (!hits(k)) return k
    return null
  }

  /** Steps until the dog lands if nobody taps (physics as in this world). */
  private stepsToLand() {
    const d = { ...this.dog }
    const p = physicsFor(this.cfg, this.world)
    let n = 0
    while (!d.grounded && n < 600) {
      stepDog(d, p, this.dt, false)
      n++
    }
    return n
  }

  private stompHits(prevY: number, y: number, vy: number, bx: number, f: Fight) {
    const top = -f.def.stomp.top
    if (vy <= 0 || prevY > top || y < top) return false
    const hb = this.cfg.dog.hitbox
    const dogX = this.cfg.view.dogX
    return dogX + hb.x1 >= bx + f.def.stomp.x0 && dogX + hb.x0 <= bx + f.def.stomp.x1
  }

  /** Bot: the tap (steps from now) that lands the dog on the tired boss, if any. */
  private planStomp(): number | null {
    const f = this.fight!
    const p = physicsFor(this.cfg, this.world)
    const dt = this.dt
    for (let k = 0; k < 150; k++) {
      const d = { ...this.dog }
      for (let i = 0; i < 240; i++) {
        if (f.t + i * dt >= this.cfg.fight.tiredSeconds) break
        const prev = d.y
        stepDog(d, p, dt, i === k)
        if (this.stompHits(prev, d.y, d.vy, this.tiredX(f.t + i * dt), f)) return k
        if (i > k && d.grounded) break
      }
    }
    return null
  }

  /**
   * Bot: whenever the dog is on the ground with nothing scheduled, plan taps for the next
   * group of obstacles from the live state, using the same validator as the spawner.
   */
  private autoplay() {
    // Boss tired: go for the stomp.
    if (this.fight?.phase === 'tired' && this.opts.botStomps !== false) {
      if (this.dog.grounded && this.taps.size === 0) {
        const k = this.planStomp()
        if (k !== null) this.taps.add(this.step + k)
      }
      if (this.taps.delete(this.step)) this.pressed = true
      return
    }
    // In the air with the double jump left and about to land on something: use it.
    if (!this.dog.grounded && this.dog.jumps < 2 && this.taps.size === 0) {
      const k = this.rescueTap()
      if (k !== null) this.taps.add(this.step + k)
    }
    // Taps planned at one speed go stale while a world change ramps the speed: replan.
    if (this.dog.grounded && this.scrollSpeed !== this.tapSpeed) this.taps.clear()
    // Leaving a wave or belt, the speed is still easing: plans made now would be for a
    // speed that's about to change, so wait until it settles (a player waits a beat too).
    const easing = this.waveMul !== this.zoneWant
    if (this.taps.size === 0 && this.dog.grounded && !easing) {
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
      // many clusters (inside 0.75 s, longer where jumps float) as two taps can clear, but
      // never split a cluster.
      const horizon = (0.75 * this.cfg.physics.gravity) / physicsFor(this.cfg, this.world).gravity
      const group: PatternObstacle[] = []
      const cuts: number[] = []
      let end = -Infinity
      for (const o of ahead) {
        const x = o.wx - this.dist
        const t = arrive(x, o)
        if (group.length && t - end > horizon) break
        if (group.length && t - end > 160 / v) cuts.push(group.length)
        // Runs before this step's physics, so this step is the validator's step 0.
        group.push({ type: o.type, x })
        end = Math.max(end, arrive(x + o.def.w, o))
      }
      cuts.push(group.length)
      // Ice for the planner: the patches as they are now, moving at the current speed.
      const ice = iceOpts(this.ice, this.dist)
      const physics = physicsFor(this.cfg, this.world)
      if (group.length && group[0]!.x - dogX < 520) {
        let plan = null
        for (let i = cuts.length - 1; i >= 0 && !plan; i--)
          plan = findClearPlan(group.slice(0, cuts[i]), this.cfg, {
            speed: v,
            ready: 0,
            physics,
            ...ice,
          })
        // Last resort: clear what two taps can, but only commit once that jump is due,
        // so waiting never throws away a better plan.
        for (let n = group.length - 1; n > 0 && !plan; n--) {
          const p = findClearPlan(group.slice(0, n), this.cfg, {
            speed: v,
            ready: 0,
            physics,
            ...ice,
          })
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
