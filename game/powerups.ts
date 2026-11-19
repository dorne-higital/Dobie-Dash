/**
 * Power meter and power-ups. Pure state + functions so the rules can be unit-tested.
 *
 * - Each biscuit fills the meter. When it's full, a power-up fires and the next one needs
 *   more biscuits (8, 12, 16 … up to a cap; see `meterNeeded`).
 * - A golden biscuit gives Zoomies instantly (and still counts as a biscuit).
 * - Zoomies: faster, and obstacles are smashed for points. A short grace follows.
 * - Magnet: biscuits within a radius fly to the dog.
 * - Bubble Shield: survives one hit (two at the top level), then briefly invulnerable.
 * - Frisbee Fetch: glide above everything; a grace covers the fall afterwards.
 * - Super Sniff: golden biscuits turn up more often, and glow.
 * Timed powers last longer with each upgrade level (see `powerDuration`).
 */
import type { GameConfig, PowerKind, PowerLevels } from './config'
import type { Rng } from './rng'

export type TimedPower = 'zoomies' | 'magnet' | 'frisbee' | 'sniff'
export const TIMED_POWERS: TimedPower[] = ['zoomies', 'magnet', 'frisbee', 'sniff']

export interface PowerState {
  meter: number
  /** Times the meter has filled this run (each fill makes the next one longer). */
  fills: number
  zoomies: number
  magnet: number
  frisbee: number
  sniff: number
  /** Shield bubbles left (0 = no shield). */
  shield: number
  /** Seconds of pass-through after Zoomies or Frisbee ends, or the shield pops. */
  grace: number
  /** Full length of each timed power as it started (for the HUD timers). */
  full: Record<TimedPower, number>
  /** Upgrade levels this run was started with. */
  levels: PowerLevels
}

export type PowerEvent = { kind: PowerKind; active: boolean }

export function newPowerState(levels: PowerLevels = {}): PowerState {
  return {
    meter: 0,
    fills: 0,
    zoomies: 0,
    magnet: 0,
    frisbee: 0,
    sniff: 0,
    shield: 0,
    grace: 0,
    full: { zoomies: 0, magnet: 0, frisbee: 0, sniff: 0 },
    levels: { ...levels },
  }
}

/** Clamps an upgrade level to 0..maxLevel. */
export function powerLevel(levels: PowerLevels, kind: PowerKind, cfg: GameConfig): number {
  const l = Math.floor(levels[kind] ?? 0)
  return Math.max(0, Math.min(cfg.powerups.upgrades.maxLevel, Number.isFinite(l) ? l : 0))
}

/** How long a timed power lasts at an upgrade level: evenly from duration to maxDuration. */
export function powerDuration(kind: TimedPower, level: number, cfg: GameConfig): number {
  const d = cfg.powerups[kind]
  const max = cfg.powerups.upgrades.maxLevel
  const l = Math.max(0, Math.min(max, level))
  return d.duration + ((d.maxDuration - d.duration) * l) / max
}

/** Safe seconds after a bubble pops: rises evenly with the shield's level. */
export function shieldSafeTime(level: number, cfg: GameConfig): number {
  const s = cfg.powerups.shield
  const max = cfg.powerups.upgrades.maxLevel
  const l = Math.max(0, Math.min(max, level))
  return s.invulnerableAfterHit + ((s.maxInvulnerable - s.invulnerableAfterHit) * l) / max
}

/** Shield bubbles at an upgrade level: one, or `maxLevelBubbles` at the top level. */
export function shieldBubbles(level: number, cfg: GameConfig): number {
  return level >= cfg.powerups.upgrades.maxLevel ? cfg.powerups.shield.maxLevelBubbles : 1
}

export function activate(s: PowerState, kind: PowerKind, cfg: GameConfig): PowerEvent {
  const level = powerLevel(s.levels, kind, cfg)
  if (kind === 'shield') s.shield = shieldBubbles(level, cfg)
  else {
    const d = powerDuration(kind, level, cfg)
    s[kind] = d
    s.full[kind] = d
  }
  return { kind, active: true }
}

/** Is this power running? */
export function isOn(s: PowerState, kind: PowerKind): boolean {
  return kind === 'shield' ? s.shield > 0 : s[kind] > 0
}

/** Picks a power that isn't already running, so a full meter is never wasted. */
export function pickPower(s: PowerState, rng: Rng): PowerKind {
  const all: PowerKind[] = ['zoomies', 'magnet', 'shield', 'frisbee', 'sniff']
  const options = all.filter((k) => !isOn(s, k))
  if (!options.length) return 'zoomies'
  return options[rng.int(options.length)]!
}

/** Biscuits needed to fill the meter now: grows with every fill this run. */
export function meterNeeded(s: PowerState, cfg: GameConfig): number {
  const m = cfg.meter
  return Math.max(m.blocks, Math.min(m.maxBlocks, m.blocks + m.growBy * s.fills))
}

/** Eats a biscuit. Returns any power that switched on. */
export function eatBiscuit(
  s: PowerState,
  gold: boolean,
  rng: Rng,
  cfg: GameConfig,
): PowerEvent | null {
  if (gold) return activate(s, 'zoomies', cfg)
  if (!cfg.meter.fillDuringPower && (s.zoomies > 0 || s.magnet > 0 || s.frisbee > 0)) return null
  s.meter++
  if (s.meter < meterNeeded(s, cfg)) return null
  s.meter = 0
  s.fills++
  return activate(s, pickPower(s, rng), cfg)
}

/** Advances timers. Returns powers that just switched off. */
export function tickPowers(s: PowerState, dt: number, cfg: GameConfig): PowerEvent[] {
  const ended: PowerEvent[] = []
  s.grace = Math.max(0, s.grace - dt)
  for (const k of TIMED_POWERS) {
    if (s[k] <= 0) continue
    s[k] -= dt
    if (s[k] > 0) continue
    s[k] = 0
    if (k === 'zoomies') s.grace = Math.max(s.grace, cfg.powerups.zoomies.graceAfter)
    if (k === 'frisbee') s.grace = Math.max(s.grace, cfg.powerups.frisbee.graceAfter)
    ended.push({ kind: k, active: false })
  }
  return ended
}

export type HitOutcome = 'smash' | 'pass' | 'shield' | 'crash'

/** What happens when the dog touches an obstacle. */
export function resolveHit(s: PowerState, cfg: GameConfig): HitOutcome {
  if (s.zoomies > 0) return 'smash'
  if (s.grace > 0 || s.frisbee > 0) return 'pass'
  if (s.shield > 0) {
    s.shield--
    s.grace = shieldSafeTime(powerLevel(s.levels, 'shield', cfg), cfg)
    return 'shield'
  }
  return 'crash'
}

export function speedMultiplier(s: PowerState, cfg: GameConfig) {
  return s.zoomies > 0 ? cfg.powerups.zoomies.speedMultiplier : 1
}

/** How much more often golden biscuits turn up (Super Sniff). */
export function goldenScale(s: PowerState, cfg: GameConfig) {
  return s.sniff > 0 ? cfg.powerups.sniff.goldenMultiplier : 1
}
