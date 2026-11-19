import { describe, expect, it } from 'vitest'
import { loadGameConfig } from '~/game/config'
import { recordOf, replay } from '~/game/replay'
import { Run } from '~/game/run'

const cfg = loadGameConfig()
const W = 420

/** A bot run stepped until obstacles are on screen. */
function withObstacles(bigBarks: number) {
  const run = new Run(cfg, 7, W, { autoplay: true, bigBarks })
  for (let i = 0; i < 60 * 60; i++) {
    run.update()
    const onScreen = run.obstacles.filter((o) => !o.dead && o.wx - run.dist < W)
    if (onScreen.length >= 2 && run.state === 'running') break
  }
  return run
}
const onScreen = (run: Run) => run.obstacles.filter((o) => !o.dead && o.wx - run.dist < W)

describe('Big Bark', () => {
  it('knocks away every obstacle on screen, with no points for them', () => {
    const run = withObstacles(3)
    const before = onScreen(run).length
    expect(before).toBeGreaterThan(0)
    const score = run.score
    expect(run.bigBark()).toBe(true)
    expect(onScreen(run)).toHaveLength(0)
    expect(run.score).toBe(score)
    expect(run.events.some((e) => e.type === 'bark' && e.data.cleared === before)).toBe(true)
  })
  it('is one per run, however many are saved', () => {
    const run = withObstacles(5)
    expect(run.barksLeft).toBe(cfg.bigBark.perRun)
    expect(run.bigBark()).toBe(true)
    expect(run.barksLeft).toBe(0)
    expect(run.bigBark()).toBe(false)
  })
  it('needs a saved Big Bark', () => {
    const run = withObstacles(0)
    expect(run.bigBark()).toBe(false)
    expect(run.inputs.some((i) => i[1] === 'b')).toBe(false)
  })
  it('is recorded, and a replay gives the same run', () => {
    const run = new Run(cfg, 11, W, { autoplay: true, bigBarks: 1 })
    let barked = false
    for (let i = 0; i < 60 * 90 && run.state !== 'ended'; i++) {
      if (!barked && i > 60 * 20 && onScreen(run).length) barked = run.bigBark()
      if (run.state === 'offer') run.decline()
      run.update()
    }
    expect(barked).toBe(true)
    run.opts.autoplay = false
    for (let i = 0; i < 60 * 600 && run.state !== 'ended'; i++) {
      if (run.state === 'offer') run.decline()
      run.update()
    }
    const rec = recordOf(run, W)
    expect(rec.inputs.some((i) => i[1] === 'b')).toBe(true)
    expect(rec.opts.bigBarks).toBe(1)
    expect(replay(cfg, rec).summary()).toEqual(run.summary())
    // Without the allowance the bark does nothing, so the replay differs.
    const cheat = replay(cfg, { ...rec, opts: { ...rec.opts, bigBarks: 0 } })
    expect(cheat.inputs.some((i) => i[1] === 'b')).toBe(false)
  })
})
