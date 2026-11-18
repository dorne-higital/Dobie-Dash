import { describe, expect, it } from 'vitest'
import { loadGameConfig } from '~/game/config'
import { Run } from '~/game/run'

describe('first-run tutorial', () => {
  it('goes jump → double jump → biscuits → done, and the run carries on', () => {
    const cfg = loadGameConfig()
    for (let seed = 1; seed <= 6; seed++) {
      const run = new Run(cfg, seed, 600, { tutorial: true, autoplay: true })
      const steps: string[] = []
      while (run.time < 120 && run.tutorial?.step !== 'done') {
        run.update()
        for (const e of run.events.splice(0))
          if (e.type === 'tutorial' && !e.data.oops) steps.push(e.data.step)
      }
      expect({ seed, steps }).toEqual({ seed, steps: ['jump', 'double', 'biscuits', 'done'] })
      expect(run.state).toBe('running')
    }
  }, 30_000)

  it("bumping into things while learning doesn't end the run", () => {
    const run = new Run(loadGameConfig(), 3, 600, { tutorial: true })
    let oops = 0
    for (let i = 0; i < 20 * 60; i++) {
      run.update()
      oops += run.events.splice(0).filter((e) => e.type === 'tutorial' && e.data.oops).length
    }
    expect(oops).toBeGreaterThan(0)
    expect(run.state).toBe('running')
    expect(run.tutorial?.step).toBe('jump')
  })

  it('the double-jump step only spawns patterns that need a double jump', () => {
    const cfg = loadGameConfig()
    const run = new Run(cfg, 9, 600, { tutorial: true, autoplay: true })
    let doubles = 0
    while (run.time < 60 && run.tutorial?.step !== 'biscuits') {
      run.update()
      if (run.fx.some((f) => f.type === 'double')) doubles++
      run.fx.length = 0
    }
    expect(run.tutorial?.step).toBe('biscuits')
    expect(doubles).toBeGreaterThanOrEqual(1)
  }, 30_000)

  it('after the tutorial, crashing works normally', () => {
    const cfg = loadGameConfig()
    const run = new Run(cfg, 4, 600, { tutorial: true, autoplay: true })
    while (run.time < 120 && run.tutorial?.step !== 'done') run.update()
    ;(run.opts as { autoplay?: boolean }).autoplay = false
    for (let i = 0; i < 60 * 60 && run.state === 'running'; i++) run.update()
    expect(run.state).not.toBe('running')
  }, 30_000)
})
