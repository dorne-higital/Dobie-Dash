/**
 * Draws a Run onto the game canvas. Reads simulation state, never changes it.
 * Positions are interpolated between the last two fixed steps (alpha) so motion stays
 * smooth on 120 Hz ProMotion screens and when a frame runs long.
 */
import type { BossKind, LampsTwist, ThemeKind, TwistDef } from '../config'
import type { Fx, Run } from '../run'
import { clamp, dot, ell, rr, sparkle, text, tri, BODY_FONT, TAU, type Ctx } from './draw'
import { drawTheme } from './backgrounds'
import { BOSS_BOX, BOSS_FRAMES, BOSS_PERIOD } from './bosses'
import {
  bakeDarkness,
  bakeIce,
  bakeLedge,
  bakeWaves,
  drawDarkness,
  drawIce,
  drawLedges,
  drawWaves,
  drawBelts,
  type Darkness,
  type IceSprites,
  type LedgeSprites,
  type WaveSprites,
} from './twists'
import { drawBanner, drawHud, type Banner } from './hud'
import { drawGoldSparkle, OBSTACLE_ANIM } from './obstacles'
import type { Accessories, Dog } from '../art/dobie'
import {
  drawTrailParticle,
  spawnTrail,
  TRAIL_RATE,
  type TrailKind,
  type TrailParticle,
} from './trails'
import { DIZZY_FRAMES, DIZZY_PERIOD, drawSprite, jumpFrame, runFrame, SpriteCache } from './sprites'

export interface View {
  /** Device pixels per logical unit. */
  S: number
  W: number
  H: number
  GY: number
  safeTop: number
  insetLeft: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  col: string
  r: number
  star?: boolean
  txt?: string
}

export interface FrameStats {
  fps: number
  /** Longest gap between frames. */
  worstMs: number
  /** Frames that took longer than 20 ms to arrive. */
  slowFrames: number
  /** CPU time spent simulating and drawing (average / worst). */
  workMs: number
  workWorstMs: number
}

const RAINBOW = ['#ff4fa0', '#ffd23f', '#3ee08f', '#3a86f0', '#8a5cf6']

export class Renderer {
  sprites: SpriteCache
  private parts: Particle[] = []
  private banner: Banner | null = null
  /** Banners wait their turn so a power-up never hides a world change. */
  private bannerQueue: Banner[] = []
  private shake = 0
  private flash = 0
  private squash = 0
  private t = 0
  private theme: ThemeKind = 'park'
  private prevTheme: ThemeKind | null = null
  private fade = 0
  private waveSprites: WaveSprites
  private iceSprites: IceSprites
  private dark: Darkness | null = null
  private ledgeSprites = new Map<string, LedgeSprites>()
  /** Rooftop ledge art per world look and height, baked on first use. */
  private ledge = (theme: string, h: number) => {
    const key = `${theme}:${h}`
    let s = this.ledgeSprites.get(key)
    if (!s) this.ledgeSprites.set(key, (s = bakeLedge(theme, h, this.view.S)))
    return s
  }
  reduceMotion = false

  private trailParts: TrailParticle[] = []
  private trailAcc = 0

  constructor(
    private c: Ctx,
    public view: View,
    /** The player's dog, what it's wearing and its trail. */
    private look: { dog: Dog; acc: Accessories; trail: TrailKind | null } | null = null,
  ) {
    this.sprites = new SpriteCache(view.S, look ?? undefined)
    this.waveSprites = bakeWaves(view.S)
    this.iceSprites = bakeIce(view.S)
  }

  setView(v: View) {
    const rescale = Math.abs(v.S - this.view.S) > 0.001
    this.view = v
    if (rescale) {
      this.sprites = new SpriteCache(v.S, this.look ?? undefined)
      this.waveSprites = bakeWaves(v.S)
      this.iceSprites = bakeIce(v.S)
      this.ledgeSprites.clear()
    }
  }

  /** Darkness for a lamps world, baked on first use (or ahead of time via prepare). */
  private darkness(tw: LampsTwist): Darkness {
    const { W, H, GY } = this.view
    const key = `${W}x${H}x${GY}x${tw.darkness}x${tw.pool}`
    if (this.dark?.key !== key) this.dark = bakeDarkness(tw, W, H, GY)
    return this.dark
  }

  /** Bake this world's boss ahead of its chase, dropping any others. */
  prepareBoss(kind: BossKind) {
    this.sprites.trimBosses([kind])
    this.sprites.boss(kind)
  }

  /** Big banner for a chase starting or being escaped. */
  showChase(name: string, active: boolean) {
    if (active && !this.reduceMotion) this.shake = 6
    this.bannerQueue.unshift(
      active
        ? { a: 'RUN!', b: `${name} is after you`, col: '#ff5a5a', t: 0 }
        : { a: 'ESCAPED!', b: `You lost ${name.replace(/^The /, 'the ')}`, col: '#3ee08f', t: 0 },
    )
    if (this.banner && this.banner.t < 1.6) this.banner.t = 1.6
  }

  prepareTwist(tw: TwistDef | null) {
    if (tw?.kind === 'lamps') this.darkness(tw)
  }

  reset(theme: ThemeKind) {
    this.parts = []
    this.banner = null
    this.bannerQueue = []
    this.trailParts = []
    this.shake = this.flash = this.squash = 0
    this.theme = theme
    this.prevTheme = null
    this.sprites.trimThemes([theme])
  }

  /** Warm the next world's background before it's needed, so the switch doesn't hitch. */
  prepareTheme(kind: ThemeKind) {
    const { W, H, GY } = this.view
    this.sprites.theme(kind, { W, H, GY })
  }

  showWorld(kind: ThemeKind, index: number, name: string, fadeSeconds: number) {
    if (kind !== this.theme) {
      this.prevTheme = this.theme
      this.theme = kind
      this.fade = fadeSeconds
    }
    this.flash = this.reduceMotion ? 0 : 0.6
    // A world change jumps the queue.
    this.bannerQueue.unshift({ a: `WORLD ${index + 1}`, b: name, col: '#ffd23f', t: 0 })
    if (this.banner && this.banner.t < 1.6) this.banner.t = 1.6
  }

  showPower(name: string, desc: string, col: string) {
    this.bannerQueue.push({ a: name, b: desc, col, t: 0 })
  }

  /** Turns simulation cues into particles and screen effects. */
  addFx(fx: Fx, run: Run) {
    const { dogX } = run.cfg.view
    const r = (a: number, b: number) => a + Math.random() * (b - a)
    switch (fx.type) {
      case 'jump':
      case 'double':
        for (let i = 0; i < 5; i++)
          this.parts.push({
            x: dogX + r(-14, 14),
            y: run.dog.y - 4,
            vx: r(-90, -20),
            vy: r(-60, 10),
            life: 0.4,
            max: 0.4,
            col: 'rgba(255,255,255,.8)',
            r: r(2, 4),
          })
        break
      case 'land':
        this.squash = 1
        break
      case 'skid':
        // Landing on ice: a spray of snow sliding off the back.
        this.squash = 1
        for (let i = 0; i < 6; i++)
          this.parts.push({
            x: dogX + r(-16, 10),
            y: run.dog.y - 2,
            vx: r(-160, -60),
            vy: r(-50, 0),
            life: 0.35,
            max: 0.35,
            col: 'rgba(235,246,255,.95)',
            r: r(1.5, 3.5),
          })
        break
      case 'eat':
        for (let i = 0; i < 7; i++)
          this.parts.push({
            x: fx.x,
            y: fx.y,
            vx: r(-120, 80),
            vy: r(-160, 40),
            life: 0.45,
            max: 0.45,
            col: fx.gold ? '#ffd23f' : '#d9a05a',
            r: r(1.5, 3),
          })
        this.parts.push({
          x: fx.x,
          y: fx.y - 12,
          vx: -40,
          vy: -70,
          life: 0.6,
          max: 0.6,
          col: fx.gold ? '#ffd23f' : '#ffffff',
          r: 0,
          txt: fx.gold ? 'GOLDEN!' : `+${run.cfg.scoring.biscuit}`,
        })
        break
      case 'stomp':
        this.squash = 1
        if (!this.reduceMotion) this.shake = 5
        for (let i = 0; i < 8; i++)
          this.parts.push({
            x: fx.x + r(-20, 20),
            y: fx.y,
            vx: r(-160, 160),
            vy: r(-200, -40),
            life: 0.5,
            max: 0.5,
            col: '#ffd23f',
            r: r(3, 6),
            star: true,
          })
        break
      case 'smash':
      case 'pop':
        if (!this.reduceMotion) this.shake = 4
        for (let i = 0; i < 6; i++)
          this.parts.push({
            x: fx.x,
            y: fx.y,
            vx: r(-60, 200),
            vy: r(-260, -60),
            life: 0.6,
            max: 0.6,
            col: fx.type === 'pop' ? '#b4fff5' : '#ffd23f',
            r: r(3, 6),
            star: true,
          })
        if (fx.type === 'smash')
          this.parts.push({
            x: fx.x,
            y: fx.y - 30,
            vx: 30,
            vy: -60,
            life: 0.9,
            max: 0.9,
            col: '#ffffff',
            r: 0,
            txt: `+${run.cfg.scoring.smash}`,
          })
        break
      case 'crash':
        if (!this.reduceMotion) this.shake = 10
        break
      case 'nearMiss':
        this.parts.push({
          x: fx.x + 24,
          y: fx.y,
          vx: 0,
          vy: -50,
          life: 0.9,
          max: 0.9,
          col: '#3ee08f',
          r: 0,
          txt: `CLOSE! +${run.cfg.scoring.nearMiss}`,
        })
        break
      case 'revive':
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * TAU
          this.parts.push({
            x: dogX + 8,
            y: -36,
            vx: Math.cos(a) * 220,
            vy: Math.sin(a) * 220,
            life: 0.7,
            max: 0.7,
            col: i % 2 ? '#ffd23f' : '#ff4fa0',
            r: 4,
            star: true,
          })
        }
        this.flash = this.reduceMotion ? 0 : 0.4
        break
      case 'splash':
        for (let i = 0; i < 12; i++)
          this.parts.push({
            x: dogX + r(-10, 30),
            y: -4,
            vx: r(-160, 60),
            vy: r(-320, -140),
            life: 0.6,
            max: 0.6,
            col: i % 3 ? 'rgba(170,228,255,.95)' : '#ffffff',
            r: r(2, 4.5),
          })
        break
    }
  }

  draw(run: Run, alpha: number, frameDt: number, best: number, stats: FrameStats | null) {
    const c = this.c
    const V = this.view
    const { W, H, GY } = V
    this.t += frameDt
    const t = this.t

    // Render-only animation (doesn't touch the simulation).
    for (const p of this.parts) {
      p.x += p.vx * frameDt
      p.y += p.vy * frameDt
      if (!p.txt) p.vy += 500 * frameDt
      p.life -= frameDt
    }
    this.parts = this.parts.filter((p) => p.life > 0)
    this.updateTrail(run, frameDt)
    if (this.banner) {
      this.banner.t += frameDt
      if (this.banner.t > 2) this.banner = null
    }
    if (!this.banner && this.bannerQueue.length) this.banner = this.bannerQueue.shift()!
    this.flash = Math.max(0, this.flash - frameDt * 2)
    this.shake = Math.max(0, this.shake - frameDt * 30)
    this.squash = Math.max(0, this.squash - frameDt * 6)
    this.fade = Math.max(0, this.fade - frameDt)

    const lerp = (a: number, b: number) => a + (b - a) * alpha
    const dist = lerp(run.prevDist, run.dist)
    const dogY = lerp(run.prevDogY, run.dog.y)

    c.setTransform(V.S, 0, 0, V.S, 0, 0)
    c.save()
    if (this.shake > 0)
      c.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake)

    // Background, cross-fading after a world change.
    const frame = { W, H, GY }
    if (this.prevTheme && this.fade > 0) {
      drawTheme(c, this.sprites.theme(this.prevTheme, frame), dist, this.sprites.cloud)
      c.globalAlpha = 1 - this.fade / run.cfg.worldTransition.fadeSeconds
    } else if (this.prevTheme) {
      this.sprites.trimThemes([this.theme])
      this.prevTheme = null
    }
    drawTheme(c, this.sprites.theme(this.theme, frame), dist, this.sprites.cloud)
    c.globalAlpha = 1

    if (run.power.zoomies > 0 && run.state === 'running' && !this.reduceMotion) {
      // Zoomies speed lines streaking past.
      c.fillStyle = 'rgba(255,255,255,.55)'
      for (let i = 0; i < 9; i++) {
        const y = GY * (0.18 + ((i * 0.37) % 0.72))
        const len = 60 + ((i * 53) % 90)
        const x = W - ((t * (900 + i * 70) + i * 211) % (W + len * 2))
        c.fillRect(x, y, len, 2.5)
      }
    }

    if (run.waves.length) {
      drawWaves(c, this.waveSprites, run.waves, dist, GY, W, t)
      drawBelts(c, run.waves, dist, GY, W, t)
    }
    if (run.ledges.length) drawLedges(c, this.ledge, run.ledges, dist, GY, W)
    if (run.ice.length) drawIce(c, this.iceSprites, run.ice, dist, GY, W)

    // Obstacles.
    // Haunted Hollow: ghosts fade between faint and solid (only how they look; they're
    // always solid to hit) and are fully solid once they're close.
    const gt = run.world.twist?.kind === 'ghosts' ? run.world.twist : null
    const dogX = run.cfg.view.dogX
    for (const o of run.obstacles) {
      const x = lerp(o.pwx, o.wx) - dist
      const fly = o.def.fly ?? 0
      const anim = OBSTACLE_ANIM[o.type]
      const frames = this.sprites.obstacles[o.type]
      const k = anim.period
        ? Math.floor((((t + o.ph) % anim.period) / anim.period) * frames.length)
        : 0
      const spr = frames[k % frames.length]!
      if (o.dead) {
        const cx = x + o.kx + o.def.w / 2
        const cy = GY - fly + o.ky - o.def.h / 2
        c.save()
        c.translate(cx, cy)
        c.rotate(o.rot)
        drawSprite(c, spr, -o.def.w / 2, o.def.h / 2)
        c.restore()
        continue
      }
      if (!fly) {
        c.fillStyle = 'rgba(0,0,0,.16)'
        c.beginPath()
        c.ellipse(x + o.def.w / 2, GY + 2, o.def.w * 0.55, 4, 0, 0, TAU)
        c.fill()
      }
      if (o.type === 'parcel' && x > W * 0.68) {
        // Thrown by the mail van: still falling while it's far ahead (the hitbox is on the
        // ground all along, but it's nowhere near Dobie yet).
        const up = (x - W * 0.68) * 0.9
        c.save()
        c.translate(x + o.def.w / 2, GY - up - o.def.h / 2)
        c.rotate(up * 0.02)
        drawSprite(c, spr, -o.def.w / 2, o.def.h / 2)
        c.restore()
        continue
      }
      if (gt && o.type === 'ghost') {
        const near = x - dogX < gt.solidWithin
        const wave = 0.5 + 0.5 * Math.cos(((t + o.ph) / gt.period) * TAU)
        c.globalAlpha = near ? 1 : gt.minAlpha + (1 - gt.minAlpha) * wave
        drawSprite(c, spr, x, GY - fly)
        c.globalAlpha = 1
      } else drawSprite(c, spr, x, GY - fly)
    }

    // Midnight Run: only the lamps light the path (fades in with the world).
    const tw = run.world.twist
    if (tw?.kind === 'lamps') {
      const a = this.prevTheme ? 1 - this.fade / run.cfg.worldTransition.fadeSeconds : 1
      drawDarkness(c, this.darkness(tw), dist, clamp(a, 0, 1))
    }

    // Biscuits (drawn over the darkness so they still glint).
    for (const b of run.biscuits) {
      const x = lerp(b.pwx, b.wx) - dist
      const y = GY + lerp(b.py, b.y) + Math.sin(t * 4 + b.ph) * 3
      c.save()
      c.translate(x, y)
      c.rotate(Math.sin(t * 3 + b.ph) * 0.25)
      drawSprite(c, b.gold ? this.sprites.goldBiscuit : this.sprites.biscuit, 0, 0)
      c.restore()
      if (b.gold) drawGoldSparkle(c, x, y, t)
    }
    // Super Sniff: golden biscuits glow so you can see them coming.
    if (run.power.sniff > 0)
      for (const b of run.biscuits) {
        if (!b.gold) continue
        const x = lerp(b.pwx, b.wx) - dist
        const y = GY + lerp(b.py, b.y)
        const pulse = this.reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 6 + b.ph)
        c.globalAlpha = 0.25 + 0.2 * pulse
        dot(c, x, y, 22 + pulse * 6, '#ffd23f')
        c.globalAlpha = 1
      }

    this.drawBoss(run, t)
    for (const p of this.trailParts) drawTrailParticle(c, p, GY)
    this.drawDog(run, dogY, t)

    // Particles.
    for (const p of this.parts) {
      c.globalAlpha = clamp(p.life / p.max, 0, 1)
      const y = GY + p.y
      if (p.txt) text(c, p.txt, p.x, y, 16, p.col, { stroke: 'rgba(40,20,40,.7)', sw: 4 })
      else if (p.star) sparkle(c, p.x, y, p.r * 1.4, p.col, t * 6)
      else dot(c, p.x, y, p.r, p.col)
    }
    c.globalAlpha = 1
    c.restore()

    if (this.flash > 0) {
      c.fillStyle = `rgba(255,255,255,${this.flash * 0.6})`
      c.fillRect(0, 0, W, H)
    }

    drawHud(c, run, best, run.cfg, this.sprites, {
      W,
      safeTop: V.safeTop,
      insetLeft: V.insetLeft,
    })
    if (this.banner) drawBanner(c, this.banner, W, GY)
    if (stats) this.drawStats(stats)
  }

  private updateTrail(run: Run, dt: number) {
    for (const p of this.trailParts) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += p.g * dt
      p.life -= dt
    }
    this.trailParts = this.trailParts.filter((p) => p.life > 0)
    const kind = this.look?.trail
    if (!kind || run.state !== 'running' || this.reduceMotion) return
    this.trailAcc += dt * TRAIL_RATE[kind]
    while (this.trailAcc >= 1) {
      this.trailAcc--
      const p = spawnTrail(
        kind,
        run.cfg.view.dogX,
        run.dog.y,
        run.scrollSpeed,
        run.dog.grounded,
        this.t,
      )
      if (p) this.trailParts.push(p)
    }
  }

  /** The chasing boss: rushes in from the left, lunges, then drops back once escaped. */
  private drawBoss(run: Run, t: number) {
    if (run.fight) {
      this.drawFight(run, t)
      return
    }
    const C = run.cfg.chase
    const home = run.cfg.view.dogX - 150
    const out = -BOSS_BOX.w
    let x: number
    let kind: BossKind
    if (run.chase) {
      const k = clamp((run.time - run.chase.since) / C.enterSeconds, 0, 1)
      x = out + (home - out) * (1 - Math.pow(1 - k, 3)) + Math.sin(t * 2.2) * 8 * k
      kind = run.chase.boss
    } else if (run.chaseEnded && run.time - run.chaseEnded.at < C.exitSeconds) {
      const k = (run.time - run.chaseEnded.at) / C.exitSeconds
      x = home + (out - home) * k * k
      kind = run.chaseEnded.boss
    } else return
    const frames = this.sprites.boss(kind)
    const f = Math.floor(((t % BOSS_PERIOD) / BOSS_PERIOD) * BOSS_FRAMES) % BOSS_FRAMES
    drawSprite(this.c, frames[f]!, x, this.view.GY)
  }

  /**
   * A boss fight: the boss faces Dobie from the front. A red "!" warns of an attack, a
   * tired boss sweats (and, in a first fight, a bouncing arrow says where to land), a hit
   * flashes, and a knock-out sends it tumbling away.
   */
  private drawFight(run: Run, t: number) {
    const f = run.fight!
    const c = this.c
    const GY = this.view.GY
    const w = f.def.w
    const frames = this.sprites.boss(f.boss)
    const still = f.phase === 'tired' || f.phase === 'hurt'
    const k = Math.floor((((still ? t * 0.4 : t) % BOSS_PERIOD) / BOSS_PERIOD) * BOSS_FRAMES)
    c.save()
    c.translate(f.bx + w, GY)
    if (f.phase === 'beaten') {
      // Knocked out: flips and arcs up and away.
      c.translate(-w / 2, -40 - f.t * 260 + f.t * f.t * 300)
      c.rotate(this.reduceMotion ? 0 : f.t * 7)
      c.translate(w / 2, 40)
    }
    c.scale(-1, 1)
    if (f.phase === 'hurt' && Math.floor(t * 20) % 2) c.globalAlpha = 0.45
    drawSprite(c, frames[k % BOSS_FRAMES]!, 0, 0)
    c.restore()

    const cx = f.bx + (f.def.stomp.x0 + f.def.stomp.x1) / 2
    const top = GY - f.def.stomp.top
    const busy = f.phase !== 'beaten' && f.phase !== 'leave'
    // Hits so far: pips above the boss.
    if (busy) {
      const need = run.cfg.fight.hits
      for (let i = 0; i < need; i++)
        dot(
          c,
          cx + (i - (need - 1) / 2) * 14,
          top - 58,
          5,
          i < f.hits ? '#ffd23f' : 'rgba(255,255,255,.55)',
        )
    }
    if (f.phase === 'warn' && Math.floor(t * 8) % 2 === 0) {
      rr(c, cx - 15, top - 46, 30, 30, 10)
      c.fillStyle = '#e5484d'
      c.fill()
      text(c, '!', cx, top - 30, 24, '#ffffff')
    }
    if (f.phase === 'tired') {
      // Sweat drops and a puff of breath: it's worn out.
      for (let i = 0; i < 2; i++) {
        const q = (t * 1.5 + i / 2) % 1
        ell(c, cx + 18 + i * 10, top - 20 + q * 16, 2.5, 3.5, 0, `rgba(120,200,255,${1 - q})`)
      }
      if (f.coach) {
        // First fight: a bouncing arrow at the spot to land on.
        const b = this.reduceMotion ? 0 : Math.abs(Math.sin(t * 6)) * 10
        tri(c, [cx - 12, top - 40 - b], [cx + 12, top - 40 - b], [cx, top - 22 - b], '#ff4fa0')
        rr(c, cx - 5, top - 62 - b, 10, 24, 4)
        c.fillStyle = '#ff4fa0'
        c.fill()
      }
    }
    if (f.phase === 'hurt')
      for (let i = 0; i < 3; i++) {
        const a = t * 6 + (i * TAU) / 3
        sparkle(c, cx + Math.cos(a) * 22, top - 14 + Math.sin(a) * 6, 5, '#ffd23f', t * 4)
      }
  }

  /** Banners for a boss fight's big moments. */
  showFight(step: string, name: string, hits: number, need: number, bonus: number) {
    const B: Record<string, Banner | undefined> = {
      start: { a: 'BOSS FIGHT!', b: `${name} wants a fight`, col: '#ff5a5a', t: 0 },
      hit: {
        a: `HIT ${hits}/${need}`,
        b: need - hits === 1 ? 'One more!' : 'Again!',
        col: '#ffd23f',
        t: 0,
      },
      win: { a: 'KNOCKED OUT!', b: `+${bonus} points`, col: '#3ee08f', t: 0 },
      leave: { a: 'ESCAPED!', b: `${name} gave up`, col: '#3ee08f', t: 0 },
    }
    const b = B[step]
    if (!b) return
    if (step !== 'leave' && !this.reduceMotion) this.shake = step === 'hit' ? 5 : 7
    this.bannerQueue.unshift(b)
    if (this.banner && this.banner.t < 1.6) this.banner.t = 1.6
  }

  private drawDog(run: Run, dogY: number, t: number) {
    const c = this.c
    const { dogX } = run.cfg.view
    const GY = this.view.GY
    const playing = run.state === 'running'
    const D = this.sprites.dog
    c.save()
    c.translate(dogX, GY + dogY)
    if (playing && run.power.zoomies > 0) {
      c.globalAlpha = 0.8
      RAINBOW.forEach((col, i) => {
        c.fillStyle = col
        c.fillRect(-120, -48 + i * 7, 100, 7)
      })
      c.globalAlpha = 1
    }
    if (playing && run.power.shield) {
      c.save()
      c.globalAlpha = 0.25 + 0.08 * Math.sin(t * 6)
      dot(c, 8, -36, 46, '#2fd0c0')
      c.restore()
      c.strokeStyle = 'rgba(180,255,245,.85)'
      c.lineWidth = 2.5
      c.beginPath()
      c.arc(8, -36, 46, 0, TAU)
      c.stroke()
      dot(c, -10, -62, 6, 'rgba(255,255,255,.5)')
    }
    if (playing && run.power.magnet > 0) {
      c.setLineDash([5, 7])
      c.lineDashOffset = -t * 40
      c.strokeStyle = 'rgba(58,134,240,.7)'
      c.lineWidth = 2
      c.beginPath()
      c.arc(10, -34, 60 + Math.sin(t * 5) * 4, 0, TAU)
      c.stroke()
      c.setLineDash([])
    }
    if (playing && run.power.grace > 0 && Math.floor(t * 12) % 2) c.globalAlpha = 0.55
    const sq = this.squash
    c.scale(1 + sq * 0.14, 1 - sq * 0.14)
    let spr
    if (!playing) spr = D.dizzy[Math.floor(((t % DIZZY_PERIOD) / DIZZY_PERIOD) * DIZZY_FRAMES)]!
    else if (!run.dog.grounded) spr = D.jump[jumpFrame(clamp(run.dog.vy / 3000, -0.18, 0.2))]!
    else spr = D.run[runFrame(run.runPhase)]!
    drawSprite(c, spr, 0, 0)
    if (playing && run.power.frisbee > 0) {
      // Frisbee Fetch: the frisbee in Dobie's mouth, with a rush of air underneath.
      const m = run.cfg.dog.mouth
      ell(c, m.x + 10, m.y + 3, 14, 4.5, -0.1, '#ffc61a')
      ell(c, m.x + 10, m.y + 2, 8, 2.4, -0.1, '#ffe48a')
      if (!this.reduceMotion) {
        c.strokeStyle = 'rgba(255,255,255,.7)'
        c.lineWidth = 2
        for (let i = 0; i < 3; i++) {
          const k = (t * 3 + i / 3) % 1
          c.beginPath()
          c.moveTo(-20 - k * 40, 6 + i * 6)
          c.lineTo(-4 - k * 40, 6 + i * 6)
          c.stroke()
        }
      }
    }
    c.restore()
  }

  private drawStats(s: FrameStats) {
    const c = this.c
    const { H } = this.view
    const x = 12
    const y = H - 92
    c.fillStyle = 'rgba(0,0,0,.6)'
    rr(c, x, y, 200, 62, 10)
    c.fill()
    const col = s.fps >= 58 ? '#5be37d' : s.fps >= 50 ? '#ffd23f' : '#ff5a5a'
    const o = { align: 'left' as const, font: BODY_FONT, weight: 900 }
    text(c, `${s.fps.toFixed(0)} fps`, x + 10, y + 15, 16, col, o)
    const gap = `gap worst ${s.worstMs.toFixed(1)} ms · slow ${s.slowFrames}`
    const work = `work ${s.workMs.toFixed(1)} ms · worst ${s.workWorstMs.toFixed(1)}`
    text(c, gap, x + 10, y + 34, 11, '#fff', o)
    text(c, work, x + 10, y + 50, 11, '#fff', o)
  }
}
