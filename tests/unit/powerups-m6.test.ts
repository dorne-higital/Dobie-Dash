import { describe, expect, it } from 'vitest'
import { loadGameConfig, POWER_KINDS } from '~/game/config'
import {
  activate,
  newPowerState,
  pickPower,
  powerDuration,
  resolveHit,
  shieldBubbles,
  shieldSafeTime,
  tickPowers,
} from '~/game/powerups'
import { Rng } from '~/game/rng'
import { Run } from '~/game/run'
import { dogBox, obstacleBox, overlaps } from '~/game/physics'

const cfg = loadGameConfig()
const P = cfg.powerups

describe('power-up upgrades', () => {
  it('timed powers grow evenly from their base to their max over 5 levels', () => {
    expect(powerDuration('zoomies', 0, cfg)).toBe(6)
    expect(powerDuration('zoomies', 5, cfg)).toBe(10)
    expect(powerDuration('magnet', 5, cfg)).toBe(14)
    expect(powerDuration('frisbee', 0, cfg)).toBe(4)
    expect(powerDuration('frisbee', 5, cfg)).toBe(7)
    expect(powerDuration('sniff', 0, cfg)).toBe(15)
    expect(powerDuration('sniff', 5, cfg)).toBe(25)
    for (const k of ['zoomies', 'magnet', 'frisbee', 'sniff'] as const)
      for (let l = 1; l <= 5; l++)
        expect(powerDuration(k, l, cfg)).toBeGreaterThan(powerDuration(k, l - 1, cfg))
    expect(powerDuration('zoomies', 99, cfg)).toBe(10) // clamped
  })

  it('a run uses the levels it was given: longer powers and two bubbles at the top', () => {
    const s = newPowerState({ magnet: 5, shield: 5, frisbee: 2 })
    activate(s, 'magnet', cfg)
    expect(s.magnet).toBe(14)
    expect(s.full.magnet).toBe(14)
    activate(s, 'frisbee', cfg)
    expect(s.frisbee).toBeCloseTo(4 + (3 * 2) / 5)
    activate(s, 'shield', cfg)
    expect(s.shield).toBe(2)
    expect(shieldBubbles(4, cfg)).toBe(1)
  })

  it('each shield level adds safe time after a pop, from 1.2 s to 2 s', () => {
    expect(shieldSafeTime(0, cfg)).toBeCloseTo(1.2)
    expect(shieldSafeTime(5, cfg)).toBeCloseTo(2)
    const s = newPowerState({ shield: 3 })
    activate(s, 'shield', cfg)
    resolveHit(s, cfg)
    expect(s.grace).toBeCloseTo(1.2 + (0.8 * 3) / 5)
  })

  it('a two-bubble shield survives two hits, then crashes', () => {
    const s = newPowerState({ shield: 5 })
    activate(s, 'shield', cfg)
    for (let hit = 0; hit < 2; hit++) {
      expect(resolveHit(s, cfg)).toBe('shield')
      for (let i = 0; i < 150; i++) tickPowers(s, 1 / 60, cfg)
    }
    expect(resolveHit(s, cfg)).toBe('crash')
  })

  it('costs are 250, 600, 1,200, 2,500 and 5,000 biscuits', () => {
    expect(P.upgrades.costs).toEqual([250, 600, 1200, 2500, 5000])
    expect(P.upgrades.maxLevel).toBe(P.upgrades.costs.length)
  })

  it('the meter can hand out all five powers', () => {
    const rng = new Rng(4)
    const seen = new Set<string>()
    for (let i = 0; i < 400; i++) seen.add(pickPower(newPowerState(), rng))
    expect(seen).toEqual(new Set(POWER_KINDS))
  })
})

describe('Frisbee Fetch', () => {
  it('glides above every obstacle, passes through them, eats a high line, and lands safely', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const c = loadGameConfig()
      c.meter.blocks = 1e9
      const run = new Run(c, seed, c.view.logicalWidth, { autoplay: true, startWorld: 2 })
      for (let i = 0; i < 4 * 60; i++) run.update()
      activate(run.power, 'frisbee', c)
      let highest = 0
      let eatenHigh = 0
      const glideSteps = Math.round(P.frisbee.duration * 60)
      for (let i = 0; i < glideSteps + 6 * 60 && run.state === 'running'; i++) {
        const before = run.biscuitsEaten
        run.update()
        if (i > 30 && i < glideSteps) {
          highest = Math.min(highest, run.dog.y)
          if (run.biscuitsEaten > before) eatenHigh++
          // Up above everything, including fliers.
          const db = dogBox(c.view.dogX, run.dog.y, c.dog.hitbox)
          for (const o of run.obstacles)
            expect(overlaps(db, obstacleBox(o.wx - run.dist, o.def))).toBe(false)
        }
      }
      expect({ seed, state: run.state }).toEqual({ seed, state: 'running' })
      expect(highest).toBeLessThanOrEqual(P.frisbee.glideY + 5)
      expect({ seed, eatenHigh: eatenHigh > 0 }).toEqual({ seed, eatenHigh: true })
      expect(run.dog.grounded).toBe(true)
    }
  }, 30_000)
})

describe('Super Sniff', () => {
  it('golden biscuits turn up about three times as often', () => {
    const count = (sniff: boolean) => {
      let gold = 0
      for (let seed = 1; seed <= 10; seed++) {
        const c = loadGameConfig()
        c.meter.blocks = 1e9
        // Sunny Beach: no boss fight pausing the patterns (and their biscuit arcs).
        const run = new Run(c, seed, c.view.logicalWidth, {
          autoplay: true,
          invincible: true,
          startWorld: 2,
        })
        for (let i = 0; i < 70 * 60; i++) {
          if (sniff && run.power.sniff <= 0) activate(run.power, 'sniff', c)
          run.update()
        }
        gold += run.golden + run.biscuits.filter((b) => b.gold).length
      }
      return gold
    }
    const plain = count(false)
    const sniffed = count(true)
    expect(sniffed).toBeGreaterThan(plain * 2)
  }, 60_000)
})
