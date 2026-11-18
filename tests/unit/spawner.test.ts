import { describe, expect, it } from 'vitest'
import { loadGameConfig, type GameConfig, type ObstacleType } from '~/game/config'
import { Run } from '~/game/run'
import { apex, newDog, stepDog } from '~/game/physics'
import { findClearPlan, Spawner, type SpawnBatch } from '~/game/spawner'

const W = 600

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
      expect(run.worldIndex).toBe(3)
    }
  }, 60_000)

  it('past the last gate the run keeps going and speeds up, and stays fair', () => {
    const cfg = noPowers()
    const last = cfg.worlds.length - 1
    const gate = cfg.worlds[last]!.gate!
    for (let seed = 1; seed <= 4; seed++) {
      const run = new Run(cfg, seed, W, { autoplay: true, startWorld: last })
      let i = 0
      while (run.state === 'running' && run.score < gate + 4000 && i++ < 600 * 60) run.update()
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
      expect(run.score).toBeGreaterThanOrEqual(gate + 4000)
      expect(run.worldIndex).toBe(last)
      expect(run.speed).toBeGreaterThan(cfg.worlds[last]!.speed + 40)
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
      const waves = batches.filter((s) => s.batch.wave).map((s) => s.batch.wave!)
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
    stepDog(d, p, dt, true, 0) // jump from the ground, up through the ledge
    let landedOnTop = false
    for (let k = 0; k < 120; k++) {
      const floor = d.y <= -100 + 0.5 ? -100 : 0
      stepDog(d, p, dt, false, floor)
      if (d.grounded && d.y === -100) landedOnTop = true
      if (landedOnTop) break
    }
    expect(landedOnTop).toBe(true)
    // The ledge ends: floor drops to the ground and the dog falls to it.
    for (let k = 0; k < 120 && !(d.grounded && d.y === 0); k++) stepDog(d, p, dt, false, 0)
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
        expect(onTop).toBeGreaterThan(60 * 10)
      }
  }, 60_000)
})
