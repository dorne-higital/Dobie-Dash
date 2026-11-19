/**
 * The game engine: owns the canvas, the fixed 60 Hz loop, input and the renderer.
 * Plain TypeScript with no Vue inside. It talks to the app only through events
 * (run:end, biscuit, world, power) plus an optional feedback port for haptics.
 */
import type { GameConfig, PowerKind, PowerLevels } from './config'
import { activate } from './powerups'
import { recordOf, Replayer, type RunRecord } from './replay'
import type { Accessories, Dog } from './art/dobie'
import { Emitter } from './events'
import type { TrailKind } from './render/trails'
import type { FeedbackCue, FeedbackPort } from './feedback'
import { Renderer, type FrameStats, type View } from './render/renderer'
import { randomSeed } from './rng'
import { Run, type Fx, type RunEvents } from './run'
import { worldProgress } from './worlds'

export type { FeedbackCue, FeedbackPort } from './feedback'

/** A friend's Daily Dash run raced alongside yours, and friends' bests as flags. */
export interface Rivals {
  ghost?: { record: RunRecord; name: string } | null
  flags?: { name: string; score: number }[]
}

export interface EngineOptions {
  /** Highest score so far, shown in the HUD. */
  best?: number
  feedback?: FeedbackPort
  /** Show the frame-time overlay. */
  showFps?: boolean
  reduceMotion?: boolean
  /** Hold to jump higher (Settings). */
  holdToJump?: boolean
  /** Power-up upgrade levels from the save. */
  powerLevels?: PowerLevels
  /** Coach the player's first boss fight. */
  coachFight?: boolean
  /** Big Barks the player has saved (M7). */
  bigBarks?: number
  /** Bot plays (dev: `?bot`). */
  autoplay?: boolean
  invincible?: boolean
  /** The player's dog, accessories and trail (defaults to plain Dobie). */
  look?: { dog: Dog; acc: Accessories; trail: TrailKind | null }
  /** Testing only: start in this world (0-based). */
  startWorld?: number
  /** Testing only (`?power=frisbee`): start with this power on. */
  startPower?: PowerKind
  /** First-run tutorial run. */
  tutorial?: boolean
  /** CSS px of the top safe area (status bar / Dynamic Island). */
  safeTop?: number
  /** CSS px kept clear on the left of the HUD for the pause button. */
  hudInsetLeft?: number
}

/** Sound/haptic cue for each simulation effect ('eat' picks biscuit or golden). */
const FX_CUE: Partial<Record<Fx['type'], FeedbackCue>> = {
  jump: 'jump',
  double: 'double',
  land: 'land',
  smash: 'smash',
  pop: 'shieldPop',
  crash: 'crash',
  splash: 'splash',
  revive: 'revive',
  nearMiss: 'nearMiss',
  stomp: 'smash',
  bark: 'bark',
}

const POWER_BANNER: Record<PowerKind, [string, string]> = {
  zoomies: ['ZOOMIES!', 'Smash through everything'],
  magnet: ['BISCUIT MAGNET', 'Biscuits fly to you'],
  shield: ['BUBBLE SHIELD', 'Survive one crash'],
  frisbee: ['FRISBEE FETCH!', 'Glide over everything'],
  sniff: ['SUPER SNIFF', 'Golden biscuits everywhere'],
}

export class Engine {
  readonly events = new Emitter<RunEvents>()
  private ctx: CanvasRenderingContext2D
  private renderer: Renderer
  private run: Run | null = null
  private raf = 0
  private last = 0
  private acc = 0
  /** Real seconds of near-miss slow motion left, and when the last one started. */
  private slowMo = 0
  private lastSlowMo = -Infinity
  private paused = false
  private destroyed = false
  private ro: ResizeObserver | null = null
  private best: number
  private stats = { frames: 0, time: 0, work: 0, workWorst: 0, worst: 0, slow: 0 }
  private shownStats: FrameStats | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    private cfg: GameConfig,
    private opts: EngineOptions = {},
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.best = opts.best ?? 0
    this.renderer = new Renderer(this.ctx, this.measure(), opts.look ?? null)
    this.renderer.reduceMotion = !!opts.reduceMotion
    this.ro = new ResizeObserver(() => this.renderer.setView(this.measure()))
    this.ro.observe(canvas)
    canvas.addEventListener('pointerdown', this.onPointer, { passive: false })
    window.addEventListener('pointerup', this.onRelease)
    window.addEventListener('pointercancel', this.onRelease)
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('keyup', this.onKeyUp)
  }

  on<K extends keyof RunEvents>(type: K, fn: (d: RunEvents[K]) => void) {
    return this.events.on(type, fn)
  }

  /**
   * This run's record for the boards (seed, view width, options, every input), or null
   * for runs that don't count there (tutorial, bot, test worlds and powers).
   */
  record(): RunRecord | null {
    const r = this.run
    const o = this.opts
    if (!r || o.tutorial || o.autoplay || o.startWorld !== undefined || o.startPower) return null
    return recordOf(r, this.renderer.view.W)
  }

  private ghost: { p: Replayer; name: string } | null = null
  private rivals: Rivals = {}
  private passed = new Set<string>()

  /** Friends to race: a Daily Dash ghost, and flags where their bests are. */
  setRivals(r: Rivals) {
    this.rivals = r
  }

  /** Starts a fresh run (every run starts in Bark Park). */
  start(seed = randomSeed()) {
    this.run = new Run(this.cfg, seed, this.renderer.view.W, {
      autoplay: this.opts.autoplay,
      invincible: this.opts.invincible,
      startWorld: this.opts.startWorld,
      tutorial: this.opts.tutorial,
      holdToJump: this.opts.holdToJump,
      powerLevels: this.opts.powerLevels,
      coachFight: this.opts.coachFight,
      bigBarks: this.opts.tutorial ? 0 : this.opts.bigBarks,
    })
    if (this.opts.startPower) activate(this.run.power, this.opts.startPower, this.cfg)
    const g = this.rivals.ghost
    this.ghost =
      g && g.record.seed === seed ? { p: new Replayer(this.cfg, g.record), name: g.name } : null
    this.passed.clear()
    this.renderer.reset(this.run.world.theme)
    const next = this.run.worlds[this.run.worldIndex + 1]
    if (next) this.renderer.prepareTheme(next.theme)
    this.renderer.prepareTwist(this.run.world.twist ?? next?.twist ?? null)
    this.renderer.prepareBoss(this.run.world.chase.boss)
    this.acc = 0
    this.paused = false
    this.loop()
  }

  get isPaused() {
    return this.paused
  }

  get isRunning() {
    return this.run?.state === 'running'
  }

  pause() {
    if (!this.run || this.run.state !== 'running' || this.paused) return
    this.paused = true
    cancelAnimationFrame(this.raf)
    this.raf = 0
    this.opts.feedback?.music?.(null, 1)
    this.draw(0) // leave a still frame behind the pause sheet
  }

  resume() {
    if (!this.paused) return
    this.paused = false
    this.loop()
  }

  /** Read-only summary for the pause sheet. */
  status() {
    const run = this.run
    if (!run) return null
    return {
      score: run.score,
      worldName: run.world.name,
      progress: worldProgress(run.score, run.worldIndex, run.worlds),
      nextWorld: run.worlds[run.worldIndex + 1]?.name ?? null,
      caughtBy: run.chase?.name ?? null,
      /** The run so far, as if it ended now (mission progress on the pause sheet). */
      summary: run.summary(),
    }
  }

  setBest(best: number) {
    this.best = best
  }

  /** Whether the next start() is a tutorial run. */
  setTutorial(on: boolean) {
    this.opts.tutorial = on
  }

  /** Big Barks saved for the next start() (the save's count can change between runs). */
  setBigBarks(n: number) {
    this.opts.bigBarks = n
  }

  /** Big Bark button: clears the screen. False if none are left or the run isn't on. */
  bigBark() {
    if (this.paused || !this.run) return false
    const ok = this.run.bigBark()
    if (ok) this.drain(this.run)
    return ok
  }

  /** "Keep running?" accepted (ad watched or biscuits spent). */
  revive() {
    this.run?.revive()
  }

  /** "Keep running?" declined or timed out: the run ends. */
  decline() {
    this.run?.decline()
  }

  press() {
    if (!this.paused) this.run?.press()
  }

  destroy() {
    this.opts.feedback?.music?.(null, 1)
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.ro?.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onPointer)
    window.removeEventListener('pointerup', this.onRelease)
    window.removeEventListener('pointercancel', this.onRelease)
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('keyup', this.onKeyUp)
    this.events.clear()
  }

  // ---- internals ------------------------------------------------------------------------

  private onPointer = (e: PointerEvent) => {
    e.preventDefault()
    this.press()
    this.run?.setHolding(true)
  }

  private onRelease = () => {
    this.run?.setHolding(false)
  }

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') this.onRelease()
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault()
      if (!e.repeat) {
        this.press()
        this.run?.setHolding(true)
      }
    }
  }

  /** Sizes the canvas (pixel ratio capped) and derives logical units like the prototype. */
  private measure(): View {
    const v = this.cfg.view
    const dpr = Math.min(v.maxPixelRatio, window.devicePixelRatio || 1)
    const r = this.canvas.getBoundingClientRect()
    const cw = Math.max(1, Math.round(r.width * dpr))
    const ch = Math.max(1, Math.round(r.height * dpr))
    if (this.canvas.width !== cw) this.canvas.width = cw
    if (this.canvas.height !== ch) this.canvas.height = ch
    const S = Math.min(ch / v.minLogicalHeight, cw / v.logicalWidth)
    const W = cw / S
    const H = ch / S
    const cssToLogical = dpr / S
    return {
      S,
      W,
      H,
      GY: Math.round(H * v.groundRatio),
      safeTop: Math.max((this.opts.safeTop ?? 0) * cssToLogical, H * v.safeTopRatio),
      insetLeft: (this.opts.hudInsetLeft ?? 0) * cssToLogical,
    }
  }

  private loop() {
    if (this.destroyed || this.raf) return
    this.last = performance.now()
    const tick = (now: number) => {
      this.raf = 0
      if (this.destroyed || this.paused) return
      const frameMs = now - this.last
      this.last = now
      const t0 = performance.now()
      this.frame(Math.min(frameMs, 250) / 1000)
      if (this.opts.showFps) this.track(frameMs, performance.now() - t0)
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  /** Passing a friend's best: a banner (once each per run). */
  private checkFlags(run: Run) {
    for (const f of this.rivals.flags ?? []) {
      if (run.score < f.score || this.passed.has(f.name)) continue
      this.passed.add(f.name)
      // Only friends you were behind when the run started count as passed.
      if (f.score > 0) this.renderer.showPassed(f.name)
    }
  }

  private frame(dt: number) {
    const run = this.run!
    const step = 1 / this.cfg.loop.hz
    // Near-miss slow motion: the fixed-step simulation just runs fewer steps per second,
    // so runs stay deterministic.
    const slow = this.slowMo > 0
    this.slowMo = Math.max(0, this.slowMo - dt)
    this.acc += slow ? dt * this.cfg.nearMiss.timeScale : dt
    let steps = 0
    while (this.acc >= step && steps < this.cfg.loop.maxStepsPerFrame) {
      run.update()
      if (this.ghost && !this.ghost.p.done && run.state === 'running') this.ghost.p.step()
      this.drain(run)
      this.checkFlags(run)
      this.acc -= step
      steps++
    }
    if (steps === this.cfg.loop.maxStepsPerFrame) this.acc = 0 // too far behind: drop time
    // Music follows the run: the world's loop, a little faster as the speed rises.
    const playing = run.state === 'running'
    this.opts.feedback?.music?.(
      playing ? run.worldIndex : null,
      Math.sqrt(run.scrollSpeed / run.world.speed),
    )
    this.draw(dt)
  }

  private draw(dt: number) {
    if (!this.run) return
    const alpha = Math.min(1, this.acc * this.cfg.loop.hz)
    this.renderer.draw(this.run, alpha, dt, this.best, this.opts.showFps ? this.shownStats : null, {
      ghost: this.ghost ? { run: this.ghost.p.run, name: this.ghost.name } : null,
      flags: this.rivals.flags ?? [],
    })
  }

  private drain(run: Run) {
    const fb = this.opts.feedback
    for (const fx of run.fx) {
      this.renderer.addFx(fx, run)
      const cue = FX_CUE[fx.type]
      if (fx.type === 'eat') fb?.play(fx.gold ? 'golden' : 'biscuit')
      else if (cue) fb?.play(cue)
      if (fx.type === 'nearMiss') {
        const now = performance.now() / 1000
        if (now - this.lastSlowMo >= this.cfg.nearMiss.slowMoCooldown) {
          this.slowMo = this.cfg.nearMiss.slowMo
          this.lastSlowMo = now
        }
      }
    }
    run.fx.length = 0
    for (const e of run.events) {
      if (e.type === 'world') {
        const w = run.worlds[e.data.index]!
        this.renderer.showWorld(w.theme, e.data.index, w.name, this.cfg.worldTransition.fadeSeconds)
        this.renderer.prepareBoss(w.chase.boss)
        const next = run.worlds[e.data.index + 1]
        if (next) {
          this.renderer.prepareTheme(next.theme)
          this.renderer.prepareTwist(next.twist)
        }
        fb?.play('world')
      } else if (e.type === 'power') {
        if (e.data.active) {
          const [a, b] = POWER_BANNER[e.data.kind]
          this.renderer.showPower(a, b, this.cfg.powerups[e.data.kind].color)
          fb?.play('powerOn')
        } else if (e.data.kind !== 'shield') fb?.play('powerOff')
      } else if (e.type === 'chase') {
        // Boss fights have their own banners (below).
        if (!run.fight) this.renderer.showChase(e.data.name, e.data.active)
        fb?.play(e.data.active ? 'bossGrowl' : 'escape')
      } else if (e.type === 'fight') {
        const f = run.fight
        const F = this.cfg.fight
        const bonus = F.beatBonus + (f?.flawless ? F.flawlessBonus : 0)
        // In a coached first fight the coach box says it instead (they'd overlap).
        if (!e.data.coach || e.data.step === 'leave')
          this.renderer.showFight(
            e.data.step,
            f?.name ?? 'The boss',
            e.data.hits,
            e.data.need,
            bonus,
          )
        // First fight: slow motion while the boss is tired, so there's time to read and stomp.
        if (e.data.step === 'stomp' && e.data.coach) this.slowMo = F.tiredSeconds * 0.6
      } else if (e.type === 'run:end') {
        this.best = Math.max(this.best, e.data.score)
      }
      this.events.emit(e.type, e.data as never)
    }
    run.events.length = 0
  }

  /** Frame interval tells you the fps; work time tells you the headroom left in 16.7 ms. */
  private track(frameMs: number, workMs: number) {
    const s = this.stats
    s.frames++
    s.time += frameMs
    s.work += workMs
    s.workWorst = Math.max(s.workWorst, workMs)
    s.worst = Math.max(s.worst, frameMs)
    if (frameMs > 20) s.slow++
    if (s.time >= 1000) {
      this.shownStats = {
        fps: (s.frames * 1000) / s.time,
        worstMs: s.worst,
        slowFrames: s.slow,
        workMs: s.work / s.frames,
        workWorstMs: s.workWorst,
      }
      this.stats = { frames: 0, time: 0, work: 0, workWorst: 0, worst: 0, slow: 0 }
    }
  }
}
