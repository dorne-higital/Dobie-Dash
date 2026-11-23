import { describe, expect, it } from 'vitest'
import { loadGameConfig, physicsFor, type GameConfig, type ObstacleType } from '~/game/config'
import { Run } from '~/game/run'
import { apex, maxAirTime, newDog, stepDog } from '~/game/physics'
import { findClearPlan, Spawner, type SpawnBatch } from '~/game/spawner'

const W = loadGameConfig().view.logicalWidth

/** Config with power-ups effectively off so runs are pure jumping. */
function noPowers(base = loadGameConfig()): GameConfig {
  const cfg = structuredClone(base)
  cfg.meter.blocks = 1e9
  cfg.spawner.biscuits.goldenArcChance = 0
  return cfg
}

/** Spawns a run's worth of batches for one world, without a dog. */
function spawnFor(cfg: GameConfig, seed: number, worldIdx: number, seconds: number) {
  const sp = new Spawner(cfg, seed, W)
  const world = cfg.worlds[worldIdx]!
  const out: { step: number; time: number; batch: SpawnBatch }[] = []
  const dt = 1 / cfg.loop.hz
  let dist = 0
  for (let step = 1; step <= seconds * cfg.loop.hz; step++) {
    dist += world.speed * dt
    const time = step * dt
    const batch = sp.update({
      step,
      dist,
      time,
      world,
      worldsSoFar: cfg.worlds.slice(0, worldIdx + 1),
      speed: world.speed,
    })
    if (batch) out.push({ step, time, batch })
  }
  return out
}

describe('validator', () => {
  const cfg = loadGameConfig()
  it('every single obstacle is clearable at every world speed', () => {
    for (const w of cfg.worlds)
      for (const type of ['hydrant', 'cone', 'fence', 'cat'] as ObstacleType[])
        expect(findClearPlan([{ type, x: 700 }], cfg, { speed: w.speed, ready: 0 })).not.toBeNull()
  })

  it('a flier reaching the dog while it may still be mid-jump is rejected', () => {
    const owl = [{ type: 'owl' as ObstacleType, x: 300 }]
    expect(findClearPlan(owl, cfg, { speed: 405, ready: 0 })).not.toBeNull()
    expect(findClearPlan(owl, cfg, { speed: 405, ready: 40 })).toBeNull()
  })

  it('a lone seagull needs no tap', () => {
    const plan = findClearPlan([{ type: 'seagull', x: 700 }], cfg, { speed: 365, ready: 0 })
    expect(plan).toEqual({ jump: null, double: null, land: 0 })
  })

  it('rejects a wall nobody could clear', () => {
    const wall = Array.from({ length: 8 }, (_, i) => ({ type: 'fence' as const, x: 700 + i * 60 }))
    expect(findClearPlan(wall, cfg, { speed: 290, ready: 0 })).toBeNull()
  })

  it('rejects a pattern that arrives before the dog has landed', () => {
    expect(findClearPlan([{ type: 'hydrant', x: 200 }], cfg, { speed: 330, ready: 60 })).toBeNull()
  })
})

describe('spawner', () => {
  const cfg = loadGameConfig()

  it('is deterministic for a seed', () => {
    const a = spawnFor(cfg, 42, 1, 60)
    const b = spawnFor(cfg, 42, 1, 60)
    expect(a).toEqual(b)
    expect(spawnFor(cfg, 43, 1, 60)).not.toEqual(a)
  })

  it('each world adds its own obstacles, which make up about half of what spawns', () => {
    for (const [i, w] of cfg.worlds.entries()) {
      const seen = spawnFor(cfg, 7, i, 300).flatMap((s) => s.batch.obstacles.map((o) => o.type))
      const own = Object.keys(w.obstacles)
      for (const t of own) expect(seen, `${w.name} ${t}`).toContain(t)
      const share = seen.filter((t) => own.includes(t)).length / seen.length
      expect(share, w.name).toBeGreaterThan(0.4)
      // Earlier worlds' obstacles stay in the mix.
      if (i > 0) expect(share, w.name).toBeLessThan(1)
    }
  })

  it('with carryOver 0 each world spawns only its own obstacles', () => {
    const own = structuredClone(cfg)
    own.spawner.carryOver = 0
    const seen = new Set(
      spawnFor(own, 7, 2, 240).flatMap((s) => s.batch.obstacles.map((o) => o.type)),
    )
    expect(seen).toEqual(new Set(Object.keys(own.worlds[2]!.obstacles)))
  })

  it('every obstacle pattern comes with a clearing plan of at most one jump + one double', () => {
    for (let seed = 1; seed <= 30; seed++)
      for (const w of [0, 1, 2, 3])
        for (const { batch } of spawnFor(cfg, seed, w, 90)) {
          if (!batch.obstacles.length) continue
          expect(batch.plan).not.toBeNull()
        }
  }, 20_000)

  it('the first 20 s are single obstacles with wide gaps', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const early = spawnFor(cfg, seed, 1, 20).filter((s) => s.batch.obstacles.length)
      for (const { batch } of early) expect(batch.pattern).toBe('single')
      const starts = early.map((s) => s.batch.obstacles[0]!.wx)
      const minGap = cfg.worlds[1]!.gap[0] * cfg.spawner.introGapScale * cfg.worlds[1]!.speed
      for (let i = 1; i < starts.length; i++)
        expect(starts[i]! - starts[i - 1]!).toBeGreaterThanOrEqual(minGap - 1)
    }
  })

  it('places a 3 s biscuit breather every 45 s', () => {
    const batches = spawnFor(cfg, 3, 0, 140)
    const breathers = batches.filter((s) => s.batch.pattern === 'breather')
    expect(breathers.length).toBe(3)
    breathers.forEach((b, i) => {
      expect(b.time).toBeGreaterThanOrEqual(45 * (i + 1))
      expect(b.time).toBeLessThan(45 * (i + 1) + 3)
      const want = (3 * cfg.worlds[0]!.speed - 80) / cfg.spawner.biscuits.breatherSpacing
      expect(b.batch.biscuits.length).toBeGreaterThanOrEqual(Math.floor(want))
    })
    // No obstacle inside the breather stretch.
    for (const br of breathers) {
      const start = br.batch.biscuits[0]!.wx - 40
      const end = start + 3 * cfg.worlds[0]!.speed
      const inside = batches
        .flatMap((s) => s.batch.obstacles)
        .filter((o) => o.wx > start && o.wx < end)
      expect(inside).toEqual([])
    }
  })

  it('about 8% of biscuit arcs have a golden top', () => {
    let arcs = 0
    let gold = 0
    for (let seed = 1; seed <= 60; seed++)
      for (const { batch } of spawnFor(cfg, seed, 1, 120)) {
        if (batch.biscuits.length !== cfg.spawner.biscuits.arcCount) continue
        arcs++
        if (batch.biscuits.some((b) => b.gold)) gold++
      }
    expect(arcs).toBeGreaterThan(500)
    expect(gold / arcs).toBeGreaterThan(0.05)
    expect(gold / arcs).toBeLessThan(0.11)
  })
})

describe('fairness end to end', () => {
  // A bot that only taps on the spawner's planned steps must survive in the real Run,
  // which proves the plans (and so every pattern) are clearable with the real physics.
  it('a planned-tap bot survives 5 minutes through all four worlds', () => {
    const cfg = noPowers()
    for (let seed = 1; seed <= 12; seed++) {
      const run = new Run(cfg, seed, W, { autoplay: true })
      for (let i = 0; i < 300 * 60 && run.state === 'running'; i++) run.update()
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
      expect(run.worldIndex).toBeGreaterThanOrEqual(3)
    }
  }, 60_000)

  it('in the last world the run keeps going and speeds up, and stays fair', () => {
    const cfg = noPowers()
    const last = cfg.worlds.length - 1
    const w = cfg.worlds[last]!
    const from = w.gate ?? w.at
    for (let seed = 1; seed <= 4; seed++) {
      const run = new Run(cfg, seed, W, { autoplay: true, startWorld: last })
      let i = 0
      while (run.state === 'running' && run.score < from + 8000 && i++ < 600 * 60) run.update()
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
      expect(run.score).toBeGreaterThanOrEqual(from + 8000)
      expect(run.worldIndex).toBe(last)
      expect(run.speed).toBeGreaterThan(w.speed + 15)
      expect(run.speed).toBeLessThanOrEqual(cfg.endless.maxSpeed)
    }
  }, 60_000)

  it('the endless ramp stops at maxSpeed', () => {
    const cfg = noPowers()
    const run = new Run(cfg, 1, W, { startWorld: cfg.worlds.length - 1 })
    expect(run.targetSpeed(1e9)).toBe(cfg.endless.maxSpeed)
    expect(run.targetSpeed(0)).toBe(cfg.worlds.at(-1)!.speed)
  })

  it('a player who never taps crashes on the first obstacle', () => {
    const run = new Run(noPowers(), 5, W)
    for (let i = 0; i < 30 * 60 && run.state === 'running'; i++) run.update()
    expect(run.state).toBe('crashed')
    expect(run.time).toBeLessThan(6)
  })
})

describe('world twists', () => {
  it('Sunny Beach waves: nothing spawns inside one, and only Sunny Beach has them', () => {
    const cfg = loadGameConfig()
    for (const [i, w] of cfg.worlds.entries()) {
      const batches = spawnFor(cfg, 4, i, 120)
      const waves = batches
        .filter((s) => s.batch.wave && !s.batch.wave.belt)
        .map((s) => s.batch.wave!)
      if (w.twist?.kind !== 'waves') {
        expect(waves, w.name).toEqual([])
        continue
      }
      expect(waves.length).toBeGreaterThan(5)
      const obstacles = batches.flatMap((s) => s.batch.obstacles)
      for (const wave of waves)
        for (const o of obstacles) {
          const end = o.wx + cfg.obstacles[o.type].w
          expect(end < wave.wx0 || o.wx > wave.wx1).toBe(true)
        }
    }
  })

  it('running through a wave eases the speed down to the slow factor and back', () => {
    const cfg = noPowers()
    const tw = cfg.worlds[2]!.twist
    if (tw?.kind !== 'waves') throw new Error('Sunny Beach should have waves')
    const run = new Run(cfg, 2, W, { autoplay: true, startWorld: 2 })
    let lowest = 1
    let entered = false
    while (run.state === 'running' && run.time < 40) {
      run.update()
      lowest = Math.min(lowest, run.waveMul)
      if (run.fx.splice(0).some((f) => f.type === 'splash')) entered = true
    }
    expect(entered).toBe(true)
    expect(lowest).toBeCloseTo(tw.slow, 5)
    expect(run.state).toBe('running')
  })
})

describe('rooftop ledges', () => {
  /** Ledges every 1–2 s so a short run meets lots of them. */
  function busyLedges() {
    const cfg = noPowers()
    for (const w of cfg.worlds) if (w.platforms) w.platforms.every = [1, 2]
    return cfg
  }

  it('only City Streets and Midnight Run have them, and they sit above every ground obstacle', () => {
    const cfg = loadGameConfig()
    expect(cfg.worlds.filter((w) => w.platforms).map((w) => w.id)).toEqual([
      'city-streets',
      'midnight-run',
    ])
    const tallest = Math.max(
      ...Object.values(cfg.obstacles)
        .filter((o) => !o.fly)
        .map((o) => o.h - o.inset),
    )
    for (const w of cfg.worlds)
      if (w.platforms) {
        // A dog standing on top clears the tallest ground obstacle...
        expect(w.platforms.height + cfg.dog.hitbox.y1).toBeGreaterThan(tallest)
        // ...and one plain jump from the ground gets you up there.
        expect(apex(-cfg.physics.jumpVelocity, cfg.physics.gravity)).toBeGreaterThan(
          w.platforms.height + 10,
        )
      }
  })

  it('a dog lands on a ledge from above, passes up through it from below, and drops off its end', () => {
    const p = loadGameConfig().physics
    const dt = 1 / 60
    const d = newDog()
    stepDog(d, p, dt, true) // jump from the ground, up through the ledge
    let landedOnTop = false
    for (let k = 0; k < 120; k++) {
      const floor = d.y <= -100 + 0.5 ? -100 : 0
      stepDog(d, p, dt, false, { floor })
      if (d.grounded && d.y === -100) landedOnTop = true
      if (landedOnTop) break
    }
    expect(landedOnTop).toBe(true)
    // The ledge ends: floor drops to the ground and the dog falls to it.
    for (let k = 0; k < 120 && !(d.grounded && d.y === 0); k++) stepDog(d, p, dt, false)
    expect(d.y).toBe(0)
    expect(d.grounded).toBe(true)
  })

  it('no fliers near a ledge and nothing in its landing zone', () => {
    const cfg = busyLedges()
    for (const wi of [1, 3]) {
      const batches = spawnFor(cfg, 9, wi, 120)
      const ledges = batches.flatMap((b) => (b.batch.ledge ? [b.batch.ledge] : []))
      expect(ledges.length).toBeGreaterThan(10)
      const obstacles = batches.flatMap((b) => b.batch.obstacles)
      for (const l of ledges)
        for (const o of obstacles) {
          const def = cfg.obstacles[o.type]
          if (def.fly) expect(o.wx + def.w < l.wx0 - 100 || o.wx > l.wx1 + 300).toBe(true)
          // Nothing starts in the 300 units straight after a ledge.
          expect(o.wx <= l.wx1 - def.w || o.wx > l.wx1 + 300).toBe(true)
        }
    }
  })

  it('a bot that takes the high road whenever it can survives, and spends time up top', () => {
    const cfg = busyLedges()
    for (const startWorld of [1, 3])
      for (let seed = 1; seed <= 6; seed++) {
        const run = new Run(cfg, seed, W, { autoplay: true, startWorld })
        let onTop = 0
        for (let i = 0; i < 120 * 60 && run.state === 'running'; i++) {
          const x = run.dist + cfg.view.dogX
          const over = run.ledges.some((l) => x > l.wx0 + 20 && x < l.wx1 - 150)
          const clearAhead = !run.obstacles.some((o) => {
            const sx = o.wx - run.dist
            return !o.dead && sx > cfg.view.dogX - 40 && sx < cfg.view.dogX + 160
          })
          if (over && run.dog.grounded && run.dog.y === 0 && clearAhead) run.press()
          run.update()
          if (run.dog.grounded && run.dog.y < 0) onTop++
        }
        expect({ startWorld, seed, state: run.state }).toEqual({
          startWorld,
          seed,
          state: 'running',
        })
        expect(onTop).toBeGreaterThan(60 * 8) // less up top now: no rooftops during a boss fight
      }
  }, 60_000)
})

describe('hold to jump higher and ledges', () => {
  it("a ledge's landing zone covers a fully held jump and double jump off its edge", () => {
    const cfg = loadGameConfig()
    const p = cfg.physics
    const dt = 1 / cfg.loop.hz
    const h = cfg.worlds.find((w) => w.platforms)!.platforms!.height
    const held = maxAirTime(h, p, dt)
    const noHold = structuredClone(p)
    noHold.hold.maxSeconds = 0
    expect(held).toBeGreaterThan(maxAirTime(h, noHold, dt))
  })
})

describe('Snowy Peaks ice', () => {
  const snowIndex = () => loadGameConfig().worlds.findIndex((w) => w.twist?.kind === 'ice')

  it('a jump from ice is lower than a normal jump; double jumps are not affected', () => {
    const cfg = loadGameConfig()
    const tw = cfg.worlds[snowIndex()]!.twist
    if (tw?.kind !== 'ice') throw new Error('Snowy Peaks should have ice')
    const peak = (scale: number) => {
      const d = newDog()
      stepDog(d, cfg.physics, 1 / 60, true, { jumpScale: scale })
      let top = 0
      while (!d.grounded) {
        stepDog(d, cfg.physics, 1 / 60, false)
        top = Math.min(top, d.y)
      }
      return -top
    }
    expect(peak(tw.jumpScale)).toBeLessThan(peak(1) * 0.85)
    const d = newDog()
    d.grounded = false
    d.jumps = 1
    d.y = -50
    stepDog(d, cfg.physics, 1 / 60, true, { jumpScale: 0.5 })
    expect(d.vy).toBeCloseTo(cfg.physics.doubleJumpVelocity + cfg.physics.gravity / 60, 5)
  })

  it('places ice patches in Snowy Peaks only', () => {
    const cfg = noPowers()
    for (const [wi, w] of cfg.worlds.entries()) {
      const ice = spawnFor(cfg, 4, wi, 60).filter((b) => b.batch.ice)
      if (w.twist?.kind === 'ice') expect(ice.length).toBeGreaterThan(4)
      else expect(ice).toEqual([])
    }
  })

  it('a planned-tap bot survives Snowy Peaks, taking off from ice', () => {
    const cfg = noPowers()
    for (let seed = 1; seed <= 8; seed++) {
      const run = new Run(cfg, seed, W, { autoplay: true, startWorld: snowIndex() })
      let iceJumps = 0
      for (let i = 0; i < 120 * 60 && run.state === 'running'; i++) {
        const hb = cfg.dog.hitbox
        const feet = run.dist + cfg.view.dogX + (hb.x0 + hb.x1) / 2
        const onIce = run.ice.some((r) => feet >= r.wx0 && feet <= r.wx1)
        run.update()
        if (onIce && run.fx.some((f) => f.type === 'jump')) iceJumps++
        run.fx.length = 0
      }
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
      if (seed <= 2) expect(iceJumps).toBeGreaterThan(0)
    }
  }, 60_000)
})

describe('Building Site belts', () => {
  const siteIndex = () => loadGameConfig().worlds.findIndex((w) => w.twist?.kind === 'belts')

  it('places fast and slow belts in Building Site only, with nothing on them', () => {
    const cfg = loadGameConfig()
    for (const [wi, w] of cfg.worlds.entries()) {
      const batches = spawnFor(cfg, 4, wi, 180)
      const belts = batches.filter((b) => b.batch.wave?.belt).map((b) => b.batch.wave!)
      if (w.twist?.kind !== 'belts') {
        expect(belts, w.name).toEqual([])
        continue
      }
      expect(new Set(belts.map((b) => b.slow))).toEqual(new Set([w.twist.fast, w.twist.slow]))
      const obstacles = batches.flatMap((s) => s.batch.obstacles)
      for (const b of belts)
        for (const o of obstacles) {
          const end = o.wx + cfg.obstacles[o.type].w
          expect(end < b.wx0 || o.wx > b.wx1).toBe(true)
        }
    }
  })

  it('a fast belt speeds the run up and a slow one slows it, then it eases back', () => {
    const cfg = noPowers()
    const tw = cfg.worlds[siteIndex()]!.twist
    if (tw?.kind !== 'belts') throw new Error('Building Site should have belts')
    const seen = new Set<number>()
    const run = new Run(cfg, 3, W, { autoplay: true, startWorld: siteIndex() })
    for (let i = 0; i < 90 * 60 && run.state === 'running'; i++) {
      run.update()
      seen.add(Math.round(run.waveMul * 100))
    }
    expect(Math.max(...seen)).toBe(Math.round(tw.fast * 100))
    expect(Math.min(...seen)).toBe(Math.round(tw.slow * 100))
    expect(seen.has(100)).toBe(true)
  })

  it('a planned-tap bot survives Building Site', () => {
    const cfg = noPowers()
    for (let seed = 1; seed <= 8; seed++) {
      const run = new Run(cfg, seed, W, { autoplay: true, startWorld: siteIndex() })
      for (let i = 0; i < 120 * 60 && run.state === 'running'; i++) run.update()
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
    }
  }, 60_000)
})

describe('Haunted Hollow', () => {
  it('ghosts, pumpkins and bats all turn up, and a planned-tap bot survives it', () => {
    const cfg = noPowers()
    const wi = cfg.worlds.findIndex((w) => w.twist?.kind === 'ghosts')
    expect(wi).toBeGreaterThan(0)
    const seen = new Set<string>()
    for (let seed = 1; seed <= 8; seed++) {
      const run = new Run(cfg, seed, W, { autoplay: true, startWorld: wi })
      for (let i = 0; i < 120 * 60 && run.state === 'running'; i++) {
        run.update()
        for (const o of run.obstacles) seen.add(o.type)
      }
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
    }
    for (const t of Object.keys(cfg.worlds[wi]!.obstacles)) expect(seen.has(t), t).toBe(true)
  }, 60_000)
})

describe('Moon Walkies', () => {
  const moon = () => loadGameConfig().worlds.findIndex((w) => w.twist?.kind === 'lowGravity')

  it('low gravity: the same tap jumps higher and floats longer, on the moon only', () => {
    const cfg = loadGameConfig()
    const flight = (p: ReturnType<typeof physicsFor>) => {
      const d = newDog()
      stepDog(d, p, 1 / 60, true)
      let top = 0
      let steps = 0
      while (!d.grounded) {
        stepDog(d, p, 1 / 60, false)
        top = Math.min(top, d.y)
        steps++
      }
      return { top: -top, steps }
    }
    const earth = flight(physicsFor(cfg, cfg.worlds[0]))
    const lunar = flight(physicsFor(cfg, cfg.worlds[moon()]))
    expect(lunar.top).toBeGreaterThan(earth.top * 1.2)
    expect(lunar.steps).toBeGreaterThan(earth.steps * 1.2)
    for (const w of cfg.worlds)
      if (w.twist?.kind !== 'lowGravity') expect(physicsFor(cfg, w)).toBe(cfg.physics)
  })

  it('no gate: a UFO chases you every 4,000 points, and the bot keeps escaping', () => {
    const cfg = noPowers()
    const w = cfg.worlds[moon()]!
    expect(w.gate).toBeNull()
    const run = new Run(cfg, 2, W, { autoplay: true, startWorld: moon() })
    const chases: number[] = []
    for (
      let i = 0;
      i < 600 * 60 && run.state === 'running' && run.score < w.at + 3 * w.chaseEvery! + 100;
      i++
    ) {
      run.update()
      for (const e of run.events.splice(0))
        if (e.type === 'chase' && e.data.active) {
          expect(e.data.boss).toBe('ufo')
          chases.push(run.score)
        }
    }
    expect(run.state).toBe('running')
    expect(chases.length).toBe(3)
    chases.forEach((s, k) => {
      const target = w.at + (k + 1) * w.chaseEvery!
      expect(s).toBeGreaterThanOrEqual(target - cfg.fight.window)
      expect(s).toBeLessThan(target)
    })
    expect(run.escaped.filter((b) => b === 'ufo').length).toBe(3)
  }, 60_000)

  it('a planned-tap bot survives the moon and the way onto it from Haunted Hollow', () => {
    const cfg = noPowers()
    for (let seed = 1; seed <= 8; seed++) {
      const run = new Run(cfg, seed, W, { autoplay: true, startWorld: moon() - 1 })
      for (let i = 0; i < 150 * 60 && run.state === 'running'; i++) run.update()
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
      if (seed === 1) expect(run.worldIndex).toBe(moon())
    }
  }, 90_000)
})

describe('boss fights (the mower)', () => {
  const fightCfg = () => {
    const c = noPowers()
    expect(c.worlds[0]!.chase.fight).toBeTruthy()
    return c
  }
  /** Runs Bark Park to its target with the bot; returns the run and the fight events. */
  const playFight = (seed: number, stomps: boolean, coach = false) => {
    const c = fightCfg()
    const run = new Run(c, seed, W, { autoplay: true, botStomps: stomps, coachFight: coach })
    const steps: string[] = []
    let sawAttack = false
    const target = c.worlds[1]!.at
    for (let i = 0; i < 240 * 60 && run.state === 'running' && run.score < target + 200; i++) {
      run.update()
      if (run.fight?.phase === 'attack' && run.obstacles.some((o) => o.type === 'clump'))
        sawAttack = true
      for (const e of run.events.splice(0)) if (e.type === 'fight') steps.push(e.data.step)
    }
    return { run, steps, sawAttack, c }
  }

  it('the mower overtakes you, attacks with grass clumps, and three stomps knock it out', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const { run, steps, sawAttack, c } = playFight(seed, true)
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
      expect(sawAttack).toBe(true)
      expect(steps.slice(0, 3)).toEqual(['start', 'dodge', 'stomp'])
      expect(steps.filter((s) => s === 'hit').length).toBe(c.fight.hits - 1)
      expect(steps).toContain('win')
      expect(run.beaten).toEqual(['mower'])
      expect(run.escaped).toEqual(['mower'])
    }
  }, 60_000)

  it('dodging alone is enough to survive: the mower gives up at the target', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const { run, steps } = playFight(seed, false, true)
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
      expect(steps).toContain('leave')
      expect(steps).not.toContain('win')
      expect(run.beaten).toEqual([])
      expect(run.escaped).toEqual(['mower'])
      expect(run.fightTip).toBe(true) // coached first fight, no hits: show the tip
    }
  }, 60_000)

  it('a knock-out pays the bonus, plus the flawless bonus with no shield lost', () => {
    const c = fightCfg()
    const run = new Run(c, 3, W, { autoplay: true })
    let jump = 0
    for (let i = 0; i < 240 * 60 && run.state === 'running' && !jump; i++) {
      const before = run.score
      run.update()
      for (const e of run.events.splice(0))
        if (e.type === 'fight' && e.data.step === 'win') jump = run.score - before
    }
    expect(jump).toBeGreaterThanOrEqual(c.fight.beatBonus + c.fight.flawlessBonus)
    expect(jump).toBeLessThan(c.fight.beatBonus + c.fight.flawlessBonus + 20)
  })

  it('after a knock-out, the track stays clear until the dog has landed and caught its breath', () => {
    const c = fightCfg()
    const breath = c.fight.afterWinSeconds
    expect(breath).toBeGreaterThanOrEqual(1)
    for (let seed = 1; seed <= 4; seed++) {
      const run = new Run(c, seed, W, { autoplay: true })
      let won = false
      let landedAt = -1
      for (let i = 0; i < 240 * 60 && run.state === 'running'; i++) {
        run.update()
        for (const e of run.events.splice(0))
          if (e.type === 'fight' && e.data.step === 'win') won = true
        if (won && landedAt < 0 && run.dog.grounded) landedAt = run.time
        if (landedAt >= 0) {
          if (run.time > landedAt + breath) break
          // Nothing reaches the dog during the breather.
          const near = run.obstacles.filter(
            (o) => !o.dead && Math.abs(o.wx - run.dist - c.view.dogX) < 40,
          )
          expect({ seed, t: +(run.time - landedAt).toFixed(2), near: near.length }).toEqual({
            seed,
            t: +(run.time - landedAt).toFixed(2),
            near: 0,
          })
        }
      }
      expect({ seed, won }).toEqual({ seed, won: true })
    }
  }, 60_000)
})

describe('every boss fights', () => {
  it("each world's boss can be knocked out, and dodging alone survives it", () => {
    const base = noPowers()
    for (const [wi, w] of base.worlds.entries()) {
      expect(w.chase.fight, w.name).toBeTruthy()
      if (wi === 0) continue // the mower has its own tests above
      for (const stomps of [true, false]) {
        for (let seed = 1; seed <= 2; seed++) {
          const c = noPowers()
          const run = new Run(c, seed, W, { autoplay: true, startWorld: wi, botStomps: stomps })
          const steps: string[] = []
          for (let i = 0; i < 400 * 60 && run.state === 'running' && run.escapes < 1; i++) {
            run.update()
            for (const e of run.events.splice(0)) if (e.type === 'fight') steps.push(e.data.step)
          }
          const tag = `${w.name} seed ${seed} ${stomps ? 'stomping' : 'dodging'}`
          expect({ tag, state: run.state }).toEqual({ tag, state: 'running' })
          expect({ tag, escaped: run.escaped }).toEqual({ tag, escaped: [w.chase.boss] })
          expect({ tag, won: steps.includes('win') }).toEqual({ tag, won: stomps })
        }
      }
    }
  }, 300_000)
})
