/**
 * Power meter and power-ups. Pure state + functions so the rules can be unit-tested.
 *
 * - Each biscuit fills one block of the meter. When it's full, a power-up fires.
 * - A golden biscuit gives Zoomies instantly (and still counts as a biscuit).
 * - Zoomies: faster, and obstacles are smashed for points. A short grace follows.
 * - Magnet: biscuits within a radius fly to the dog.
 * - Bubble Shield: survives one hit, then briefly invulnerable.
 */
import type { GameConfig, PowerKind } from './config'
import type { Rng } from './rng'

export interface PowerState {
  meter: number
  zoomies: number
  magnet: number
  shield: boolean
  /** Seconds of pass-through after Zoomies ends or the shield pops. */
  grace: number
}

export type PowerEvent = { kind: PowerKind; active: boolean }

export function newPowerState(): PowerState {
  return { meter: 0, zoomies: 0, magnet: 0, shield: false, grace: 0 }
}

export function activate(s: PowerState, kind: PowerKind, cfg: GameConfig): PowerEvent {
  if (kind === 'zoomies') s.zoomies = cfg.powerups.zoomies.duration
  else if (kind === 'magnet') s.magnet = cfg.powerups.magnet.duration
  else s.shield = true
  return { kind, active: true }
}

/** Picks a power that isn't already running, so a full meter is never wasted. */
export function pickPower(s: PowerState, rng: Rng): PowerKind {
  const options: PowerKind[] = []
  if (s.zoomies <= 0) options.push('zoomies')
  if (s.magnet <= 0) options.push('magnet')
  if (!s.shield) options.push('shield')
  if (!options.length) return 'zoomies'
  return options[rng.int(options.length)]!
}

/** Eats a biscuit. Returns any power that switched on. */
export function eatBiscuit(
  s: PowerState,
  gold: boolean,
  rng: Rng,
  cfg: GameConfig,
): PowerEvent | null {
  if (gold) return activate(s, 'zoomies', cfg)
  if (!cfg.meter.fillDuringPower && (s.zoomies > 0 || s.magnet > 0)) return null
  s.meter++
  if (s.meter < cfg.meter.blocks) return null
  s.meter = 0
  return activate(s, pickPower(s, rng), cfg)
}

/** Advances timers. Returns powers that just switched off. */
export function tickPowers(s: PowerState, dt: number, cfg: GameConfig): PowerEvent[] {
  const ended: PowerEvent[] = []
  s.grace = Math.max(0, s.grace - dt)
  if (s.zoomies > 0) {
    s.zoomies -= dt
    if (s.zoomies <= 0) {
      s.zoomies = 0
      s.grace = Math.max(s.grace, cfg.powerups.zoomies.graceAfter)
      ended.push({ kind: 'zoomies', active: false })
    }
  }
  if (s.magnet > 0) {
    s.magnet -= dt
    if (s.magnet <= 0) {
      s.magnet = 0
      ended.push({ kind: 'magnet', active: false })
    }
  }
  return ended
}

export type HitOutcome = 'smash' | 'pass' | 'shield' | 'crash'

/** What happens when the dog touches an obstacle. */
export function resolveHit(s: PowerState, cfg: GameConfig): HitOutcome {
  if (s.zoomies > 0) return 'smash'
  if (s.grace > 0) return 'pass'
  if (s.shield) {
    s.shield = false
    s.grace = cfg.powerups.shield.invulnerableAfterHit
    return 'shield'
  }
  return 'crash'
}

export function speedMultiplier(s: PowerState, cfg: GameConfig) {
  return s.zoomies > 0 ? cfg.powerups.zoomies.speedMultiplier : 1
}
