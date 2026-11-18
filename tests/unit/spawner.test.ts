import { describe, expect, it } from 'vitest'
import { loadGameConfig, type GameConfig, type ObstacleType } from '~/game/config'
import { Run } from '~/game/run'
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
  })

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

  it('a player who never taps crashes on the first obstacle', () => {
    const run = new Run(noPowers(), 5, W)
    for (let i = 0; i < 30 * 60 && run.state === 'running'; i++) run.update()
    expect(run.state).toBe('crashed')
    expect(run.time).toBeLessThan(6)
  })
})
