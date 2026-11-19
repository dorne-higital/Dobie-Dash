import { describe, expect, it } from 'vitest'
import { loadGameConfig } from '~/game/config'
import { Run } from '~/game/run'

/**
 * Long-session check (the plan's testing checklist: 30 minutes with no memory growth).
 * The simulation must not keep anything that grows with play time: every list of things
 * on screen stays small however long the run lasts. The renderer drains fx and Vue drains
 * events each frame, as here.
 */
describe('long sessions', () => {
  it('30 minutes of play: nothing in the run keeps growing', () => {
    const cfg = loadGameConfig()
    const run = new Run(cfg, 7, cfg.view.logicalWidth, { autoplay: true, invincible: true })
    const steps = 30 * 60 * cfg.loop.hz
    let most = { obstacles: 0, biscuits: 0, ledges: 0, waves: 0 }
    const sizes = () => ({
      obstacles: run.obstacles.length,
      biscuits: run.biscuits.length,
      ledges: run.ledges.length,
      waves: run.waves.length,
    })
    for (let i = 0; i < steps; i++) {
      run.update()
      run.fx.length = 0
      run.events.length = 0
      const s = sizes()
      most = {
        obstacles: Math.max(most.obstacles, s.obstacles),
        biscuits: Math.max(most.biscuits, s.biscuits),
        ledges: Math.max(most.ledges, s.ledges),
        waves: Math.max(most.waves, s.waves),
      }
    }
    expect(run.state).toBe('running')
    expect(run.time).toBeGreaterThan(29 * 60)
    expect(run.worldIndex).toBe(cfg.worlds.length - 1)
    expect(most.obstacles).toBeLessThan(40)
    expect(most.biscuits).toBeLessThan(150)
    expect(most.ledges).toBeLessThan(5)
    expect(most.waves).toBeLessThan(5)
    expect(run.escaped.length).toBeLessThanOrEqual(cfg.worlds.length)
  }, 120_000)
})
