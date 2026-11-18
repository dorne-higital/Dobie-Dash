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
  it('score = metres + biscuits × 5 + smashes × 25', () => {
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
    expect(worldProgress(9000, 3, worlds)).toBeNull()
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
