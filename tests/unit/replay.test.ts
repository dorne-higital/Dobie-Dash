import { describe, expect, it } from 'vitest'
import { loadGameConfig } from '~/game/config'
import { recordOf, replay } from '~/game/replay'
import { Run } from '~/game/run'

const cfg = loadGameConfig()
const W = cfg.view.logicalWidth

/** Plays a run with the bot (recording its taps), continuing once if it crashes. */
function played(seed: number, startOpts: ConstructorParameters<typeof Run>[3] = {}) {
  const run = new Run(cfg, seed, W, { autoplay: true, ...startOpts })
  for (let i = 0; i < 200 * 60 && run.state !== 'ended'; i++) {
    // A "player" who holds now and then, and continues once after a crash.
    if (i % 97 === 5) run.setHolding(true)
    if (i % 97 === 9) run.setHolding(false)
    if (run.state === 'offer') {
      if (run.continues === 0) run.revive()
      else run.decline()
    }
    run.update()
  }
  if (run.state !== 'ended') {
    // Finish it: crash by never tapping again is not possible with the bot, so end here.
    return { run, finished: false }
  }
  return { run, finished: true }
}

describe('replaying a recorded run', () => {
  it('gives exactly the same run: score, distance, biscuits, bosses', () => {
    for (const seed of [1, 2, 3]) {
      const { run } = played(seed, { holdToJump: true, powerLevels: { magnet: 3, shield: 5 } })
      const again = replay(cfg, recordOf(run, W), run.ticks)
      expect(again.ticks).toBe(run.ticks)
      expect(again.summary()).toEqual(run.summary())
      expect(again.dist).toBe(run.dist)
    }
  }, 120_000)

  it('a crashed, continued and declined run replays to the same end', () => {
    // A player who taps a few times then stops: crashes, continues once, crashes, declines.
    const run = new Run(cfg, 9, W)
    for (let i = 0; i < 120 * 60 && run.state !== 'ended'; i++) {
      if (i < 600 && i % 70 === 0) run.press()
      if (run.state === 'offer') {
        if (run.continues === 0) run.revive()
        else run.decline()
      }
      run.update()
    }
    expect(run.state).toBe('ended')
    expect(run.continues).toBe(1)
    const again = replay(cfg, JSON.parse(JSON.stringify(recordOf(run, W))))
    expect(again.state).toBe('ended')
    expect(again.summary()).toEqual(run.summary())
  })

  it('changed inputs give a different run (a forged score is caught)', () => {
    const { run } = played(4)
    const rec = recordOf(run, W)
    rec.inputs = rec.inputs.filter((_, k) => k % 3 !== 0)
    const forged = replay(cfg, rec, run.ticks)
    expect(forged.score).not.toBe(run.score)
  }, 60_000)
})
