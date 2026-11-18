import { describe, expect, it } from 'vitest'
import { loadGameConfig } from '~/game/config'
import {
  eatBiscuit,
  newPowerState,
  pickPower,
  resolveHit,
  speedMultiplier,
  tickPowers,
} from '~/game/powerups'
import { Rng } from '~/game/rng'
import { Run } from '~/game/run'
import { metres, score } from '~/game/scoring'
import { worldIndexForScore, worldProgress } from '~/game/worlds'

const cfg = loadGameConfig()

describe('scoring', () => {
  it('score = metres + biscuits × 5 + smashes × 25 (+ near misses × 10)', () => {
    expect(score({ dist: 12345, biscuits: 0, smashes: 0 }, cfg)).toBe(1234)
    expect(score({ dist: 10000, biscuits: 7, smashes: 2 }, cfg)).toBe(1000 + 35 + 50)
  })
  it('metres floor the distance', () => {
    expect(metres(19.9, cfg)).toBe(1)
  })
})

describe('worlds', () => {
  const worlds = cfg.worlds
  it('changes world at 1,500, 4,000 and 7,500', () => {
    expect(worldIndexForScore(0, worlds)).toBe(0)
    expect(worldIndexForScore(1499, worlds)).toBe(0)
    expect(worldIndexForScore(1500, worlds)).toBe(1)
    expect(worldIndexForScore(4000, worlds)).toBe(2)
    expect(worldIndexForScore(99999, worlds)).toBe(3)
  })
  it('world pill fills toward the next target', () => {
    expect(worldProgress(750, 0, worlds)).toBeCloseTo(0.5)
    expect(worldProgress(1500 + 1250, 1, worlds)).toBeCloseTo(0.5)
    // The last world fills toward its gate (12,000) instead.
    expect(worldProgress(9000, 3, worlds)).toBeCloseTo((9000 - 7500) / (12000 - 7500))
  })
  it('a run starts in Bark Park and changes world at each score target', () => {
    const c = loadGameConfig()
    c.meter.blocks = 1e9
    const run = new Run(c, 11, 600, { autoplay: true })
    expect(run.world.name).toBe('Bark Park')
    const seen: string[] = []
    const at: number[] = []
    while (run.state === 'running' && run.time < 360) {
      run.update()
      for (const e of run.events.splice(0))
        if (e.type === 'world') {
          seen.push(e.data.name)
          at.push(run.score)
        }
    }
    expect(seen).toEqual(['City Streets', 'Sunny Beach', 'Midnight Run'])
    c.worlds.slice(1).forEach((w, i) => expect(at[i]).toBeGreaterThanOrEqual(w.at))
    expect(run.speed).toBe(c.worlds[3]!.speed)
  }, 30_000)
})

describe('gate chases', () => {
  it('a boss chases you in the last 300 points before each target, and you escape it', () => {
    const c = loadGameConfig()
    const run = new Run(c, 3, 600, { autoplay: true, invincible: true })
    const log: string[] = []
    while (run.time < 420 && run.escapes < 4) {
      run.update()
      for (const e of run.events.splice(0))
        if (e.type === 'chase') {
          const target = e.data.active ? run.chase!.target : 0
          if (e.data.active) {
            expect(run.score).toBeGreaterThanOrEqual(target - c.chase.window)
            expect(run.score).toBeLessThan(target)
          }
          log.push(`${e.data.boss}:${e.data.active ? 'on' : 'escaped'}`)
        }
    }
    expect(log).toEqual([
      'mower:on',
      'mower:escaped',
      'van:on',
      'van:escaped',
      'kingCrab:on',
      'kingCrab:escaped',
      'foxPack:on',
      'foxPack:escaped',
    ])
    expect(run.summary().escapes).toBe(4)
  }, 30_000)

  it("the boss's minions only join in during its chase", () => {
    const c = loadGameConfig()
    const run = new Run(c, 5, 600, { autoplay: true, invincible: true, startWorld: 1 })
    let parcelsOutside = 0
    let parcelsDuring = 0
    const seen = new Set<number>()
    while (run.time < 200 && run.worldIndex === 1) {
      run.update()
      for (const o of run.obstacles)
        if (o.type === 'parcel' && !seen.has(o.id)) {
          seen.add(o.id)
          if (run.chase) parcelsDuring++
          else parcelsOutside++
        }
    }
    expect(parcelsDuring).toBeGreaterThan(0)
    expect(parcelsOutside).toBe(0)
  }, 30_000)

  it('crashing during a chase says who got you', () => {
    const c = loadGameConfig()
    const run = new Run(c, 1, 600, { startWorld: 1 })
    run.chase = { boss: 'van', name: 'The mail van', target: 4000, since: 0 }
    while (run.state === 'running') run.update()
    expect(run.summary().caughtBy).toBe('The mail van')
  })
})

describe('near misses', () => {
  it('tight passes count as near misses and add +10 each to the score', () => {
    const c = loadGameConfig()
    c.meter.blocks = 1e9
    const run = new Run(c, 6, 600, { autoplay: true })
    let fx = 0
    while (run.state === 'running' && run.time < 120) {
      run.update()
      fx += run.fx.splice(0).filter((f) => f.type === 'nearMiss').length
    }
    expect(run.nearMisses).toBeGreaterThan(3)
    expect(fx).toBe(run.nearMisses)
    expect(run.score).toBe(
      score(
        {
          dist: run.dist,
          biscuits: run.biscuitsEaten,
          smashes: run.smashes,
          nearMisses: run.nearMisses,
        },
        c,
      ),
    )
  }, 30_000)

  it('a wider gap setting finds more near misses (it is a clearance threshold)', () => {
    const count = (gap: number) => {
      const c = loadGameConfig()
      c.nearMiss.gap = gap
      const run = new Run(c, 6, 600, { autoplay: true })
      while (run.state === 'running' && run.time < 60) run.update()
      return run.nearMisses
    }
    expect(count(0)).toBeLessThanOrEqual(count(5))
    expect(count(5)).toBeLessThan(count(20))
  }, 30_000)
})

describe('keep running?', () => {
  /** Runs a non-tapping dog until it crashes and the continue offer (or the end) arrives. */
  function untilOffer(run: Run) {
    for (let i = 0; i < 60 * 60; i++) {
      run.update()
      const e = run.events.splice(0).find((e) => e.type === 'continue' || e.type === 'run:end')
      if (e) return e
    }
    throw new Error('no offer')
  }

  it('offers continues at 50, 100, then 200 biscuits, then the run ends', () => {
    const c = loadGameConfig()
    expect(c.continue.prices).toEqual([50, 100, 200])
    const run = new Run(c, 2, 600)
    const prices: number[] = []
    for (;;) {
      const e = untilOffer(run)
      if (e.type === 'run:end') {
        expect(e.data.continues).toBe(3)
        break
      }
      if (e.type !== 'continue') throw new Error()
      expect(run.state).toBe('offer')
      expect(e.data.countdown).toBe(5)
      prices.push(e.data.price)
      run.revive()
    }
    expect(prices).toEqual([50, 100, 200])
  })

  it('reviving clears what is just ahead and gives a grace period', () => {
    const c = loadGameConfig()
    const run = new Run(c, 4, 600)
    untilOffer(run)
    run.revive()
    expect(run.state).toBe('running')
    expect(run.power.grace).toBeCloseTo(c.continue.grace)
    expect(run.dog.grounded).toBe(true)
    const dogX = c.view.dogX
    const near = run.obstacles.filter(
      (o) => !o.dead && o.wx - run.dist < dogX + c.continue.clearAhead,
    )
    expect(near).toEqual([])
  })

  it('declining ends the run', () => {
    const run = new Run(loadGameConfig(), 4, 600)
    untilOffer(run)
    run.decline()
    expect(run.state).toBe('ended')
    expect(run.events.some((e) => e.type === 'run:end')).toBe(true)
  })

  it('a revived bot run is still fair: it survives on after continuing', () => {
    const c = loadGameConfig()
    c.meter.blocks = 1e9
    for (let seed = 1; seed <= 8; seed++) {
      const run = new Run(c, seed, 600)
      // Crash on purpose (no taps), continue, then let the bot play.
      untilOffer(run)
      run.revive()
      ;(run.opts as { autoplay?: boolean }).autoplay = true
      for (let i = 0; i < 90 * 60 && run.state === 'running'; i++) run.update()
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
    }
  }, 30_000)
})

describe('testing start world', () => {
  it('startWorld begins in that world with its target banked and no world event', () => {
    const c = loadGameConfig()
    const run = new Run(c, 1, 600, { startWorld: 3 })
    expect(run.world.name).toBe('Midnight Run')
    expect(run.speed).toBe(c.worlds[3]!.speed)
    run.update()
    expect(run.score).toBeGreaterThanOrEqual(c.worlds[3]!.at)
    expect(run.events.some((e) => e.type === 'world')).toBe(false)
  })
})

describe('pacing', () => {
  it('a near-perfect run (the bot) reaches Midnight Run in roughly 3–4 minutes', () => {
    const cfg = loadGameConfig()
    const times: number[] = []
    for (let seed = 1; seed <= 6; seed++) {
      const run = new Run(cfg, seed, 600, { autoplay: true })
      while (run.state === 'running' && run.worldIndex < 3 && run.time < 400) run.update()
      times.push(run.time)
    }
    times.sort((a, b) => a - b)
    const median = times[3]!
    expect(median).toBeGreaterThan(160)
    expect(median).toBeLessThan(260)
  }, 60_000)
})

describe('power meter', () => {
  it('fills one block per biscuit and fires a power at 8', () => {
    const s = newPowerState()
    const rng = new Rng(1)
    for (let i = 0; i < 7; i++) expect(eatBiscuit(s, false, rng, cfg)).toBeNull()
    expect(s.meter).toBe(7)
    const ev = eatBiscuit(s, false, rng, cfg)
    expect(ev?.active).toBe(true)
    expect(s.meter).toBe(0)
  })

  it('does not fill while Zoomies or Magnet is running', () => {
    const s = newPowerState()
    s.magnet = 3
    eatBiscuit(s, false, new Rng(1), cfg)
    expect(s.meter).toBe(0)
    s.magnet = 0
    eatBiscuit(s, false, new Rng(1), cfg)
    expect(s.meter).toBe(1)
  })

  it('obstacles spawned during Zoomies stay smashable after it ends', () => {
    const c = loadGameConfig()
    c.meter.blocks = 1e9
    let soft = 0
    for (let seed = 1; seed <= 15; seed++) {
      const run = new Run(c, seed, 600, { autoplay: true })
      while (run.state === 'running' && run.time < 150) {
        run.update()
        if (run.power.zoomies === 0) for (const o of run.obstacles) if (o.soft && !o.dead) soft++
      }
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
    }
    expect(soft).toBeGreaterThan(0)
  }, 30_000)

  it('a golden biscuit gives instant Zoomies without touching the meter', () => {
    const s = newPowerState()
    s.meter = 3
    expect(eatBiscuit(s, true, new Rng(1), cfg)).toEqual({ kind: 'zoomies', active: true })
    expect(s.zoomies).toBe(6)
    expect(s.meter).toBe(3)
  })

  it('never picks a power that is already running', () => {
    const rng = new Rng(9)
    const s = newPowerState()
    s.magnet = 3
    s.shield = true
    for (let i = 0; i < 50; i++) expect(pickPower(s, rng)).toBe('zoomies')
  })

  it('picks all three powers over time', () => {
    const rng = new Rng(2)
    const seen = new Set<string>()
    for (let i = 0; i < 100; i++) seen.add(pickPower(newPowerState(), rng))
    expect(seen).toEqual(new Set(['zoomies', 'magnet', 'shield']))
  })
})

describe('power-ups', () => {
  it('Zoomies lasts 6 s at 1.55× speed, smashes, then gives a short grace', () => {
    const s = newPowerState()
    eatBiscuit(s, true, new Rng(1), cfg)
    expect(speedMultiplier(s, cfg)).toBe(1.55)
    expect(resolveHit(s, cfg)).toBe('smash')
    let ended = false
    let t = 0
    while (!ended) {
      t += 1 / 60
      ended = tickPowers(s, 1 / 60, cfg).some((e) => e.kind === 'zoomies' && !e.active)
    }
    expect(t).toBeCloseTo(6, 1)
    expect(speedMultiplier(s, cfg)).toBe(1)
    expect(resolveHit(s, cfg)).toBe('pass')
    for (let i = 0; i < 60; i++) tickPowers(s, 1 / 60, cfg)
    expect(resolveHit(s, cfg)).toBe('crash')
  })

  it('Magnet lasts 8 s', () => {
    const s = newPowerState()
    s.magnet = cfg.powerups.magnet.duration
    let steps = 0
    while (s.magnet > 0) {
      tickPowers(s, 1 / 60, cfg)
      steps++
    }
    expect(steps / 60).toBeCloseTo(8, 1)
  })

  it('Magnet pulls biscuits within 320 to the dog', () => {
    const c = loadGameConfig()
    const run = new Run(c, 1, 600)
    run.power.magnet = 8
    const mouthX = c.view.dogX + c.dog.mouth.x
    run.biscuits.push({ wx: mouthX + 300, y: -150, pwx: 0, py: 0, gold: false, ph: 0 })
    run.biscuits.push({ wx: mouthX + 500, y: -150, pwx: 0, py: 0, gold: false, ph: 0 })
    for (let i = 0; i < 20; i++) run.update()
    expect(run.biscuitsEaten).toBe(1)
  })

  it('Bubble Shield survives exactly one hit', () => {
    const s = newPowerState()
    s.shield = true
    expect(resolveHit(s, cfg)).toBe('shield')
    expect(s.shield).toBe(false)
    expect(resolveHit(s, cfg)).toBe('pass') // brief invulnerability
    for (let i = 0; i < 90; i++) tickPowers(s, 1 / 60, cfg)
    expect(resolveHit(s, cfg)).toBe('crash')
  })

  it('in a run, a shield turns a crash into a pop', () => {
    const c = loadGameConfig()
    const run = new Run(c, 5, 600)
    run.power.shield = true
    const kinds: string[] = []
    while (run.state === 'running' && run.time < 30) {
      run.update()
      for (const e of run.events.splice(0))
        if (e.type === 'power') kinds.push(`${e.data.kind}:${e.data.active}`)
    }
    expect(kinds[0]).toBe('shield:false')
    expect(run.state).not.toBe('running')
  })
})

describe('run events', () => {
  it('emits biscuit events, then run:end with the summary after the crash delay', () => {
    const c = loadGameConfig()
    c.continue.prices = [] // no "Keep running?" offer
    const run = new Run(c, 21, 600)
    const evs: string[] = []
    let end: unknown = null
    for (let i = 0; i < 60 * 60 && run.state !== 'ended'; i++) {
      run.update()
      for (const e of run.events.splice(0)) {
        evs.push(e.type)
        if (e.type === 'run:end') end = e.data
      }
    }
    expect(run.state).toBe('ended')
    expect(evs[evs.length - 1]).toBe('run:end')
    expect(end).toMatchObject({ world: 0, worldName: 'Bark Park', seed: 21 })
    expect((end as { score: number }).score).toBe(run.score)
  })

  it('same seed and same taps give the same run', () => {
    const play = () => {
      const r = new Run(loadGameConfig(), 77, 600, { autoplay: true })
      for (let i = 0; i < 90 * 60 && r.state === 'running'; i++) r.update()
      return r.summary()
    }
    expect(play()).toEqual(play())
  })
})
