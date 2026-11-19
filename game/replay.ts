/**
 * Replays a recorded run: same config, seed, view width and options, with the player's
 * inputs fed back at the same ticks. The simulation is deterministic, so this gives the
 * same run. Used by the submit-run Edge Function to check a score before it goes on the
 * boards, and by the tests.
 */
import type { GameConfig } from './config'
import { Run, type RunInput, type RunOptions } from './run'

export interface RunRecord {
  seed: number
  viewW: number
  /** Only the options that change the simulation. */
  opts: Pick<RunOptions, 'holdToJump' | 'powerLevels' | 'coachFight' | 'bigBarks'>
  inputs: RunInput[]
  /** Updates the run took (ticks), to stop a replay that never ends. */
  ticks: number
}

export function recordOf(run: Run, viewW: number): RunRecord {
  return {
    seed: run.seed,
    viewW,
    opts: {
      holdToJump: run.opts.holdToJump,
      powerLevels: run.opts.powerLevels,
      coachFight: run.opts.coachFight,
      bigBarks: run.opts.bigBarks,
    },
    inputs: run.inputs.map((i) => [i[0], i[1]]),
    ticks: run.ticks,
  }
}

/** Steps a recorded run one update at a time (a replay, or a friend's ghost). */
export class Replayer {
  readonly run: Run
  private k = 0
  private readonly inputs: RunInput[]

  constructor(cfg: GameConfig, r: RunRecord) {
    this.run = new Run(cfg, r.seed, r.viewW, { ...r.opts })
    this.inputs = [...r.inputs].sort((a, b) => a[0] - b[0])
  }

  get done() {
    return this.run.state === 'ended'
  }

  /** One update. `keep`: leave this step's fx and events on the run (for drawing). */
  step(keep = false) {
    const run = this.run
    if (keep) {
      run.events.length = 0
      run.fx.length = 0
    }
    while (this.k < this.inputs.length && this.inputs[this.k]![0] <= run.ticks) {
      const code = this.inputs[this.k]![1]
      if (code === 'p') run.press()
      else if (code === 'h') run.setHolding(true)
      else if (code === 'u') run.setHolding(false)
      else if (code === 'r') run.revive()
      else if (code === 'd') run.decline()
      else if (code === 'b') run.bigBark()
      this.k++
    }
    run.update()
    if (!keep) {
      run.events.length = 0
      run.fx.length = 0
    }
  }
}

/** Plays the record back and returns the finished run (or where it got to by `ticks`). */
export function replay(cfg: GameConfig, r: RunRecord, maxTicks = r.ticks + 600): Run {
  const p = new Replayer(cfg, r)
  while (!p.done && p.run.ticks < maxTicks) p.step()
  return p.run
}
