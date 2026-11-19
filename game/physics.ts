/**
 * Dog physics and hitboxes. Pure functions, no DOM: shared by the engine, the spawner's
 * fairness validator and the tests, so "clearable" always means the same thing.
 *
 * Coordinates are logical units. y is relative to the ground line, negative is up.
 * `floor` is the surface under the dog: 0 for the ground, or a ledge's top (negative).
 */
import type { Box, ObstacleDef, PhysicsConfig } from './config'

export interface DogBody {
  y: number
  vy: number
  grounded: boolean
  /** Jumps used since last touching the ground (0, 1 or 2). */
  jumps: number
  /** Seconds left on a buffered tap. */
  buffer: number
  /** Seconds left in which a ground jump is still allowed after leaving the ground. */
  coyote: number
  /** Seconds of this jump spent held (hold to jump higher). */
  held: number
}

export type JumpKind = 'ground' | 'double' | null

export interface StepResult {
  jumped: JumpKind
  landed: boolean
}

export function newDog(): DogBody {
  return { y: 0, vy: 0, grounded: true, jumps: 0, buffer: 0, coyote: 0, held: 0 }
}

/** Seconds until an airborne dog reaches the floor (ground by default) on its current arc. */
export function timeToGround(d: DogBody, p: PhysicsConfig, floor = 0): number {
  if (d.grounded) return 0
  const disc = d.vy * d.vy - 2 * p.gravity * (d.y - floor)
  return (-d.vy + Math.sqrt(Math.max(0, disc))) / p.gravity
}

function tryJump(d: DogBody, p: PhysicsConfig, floor: number): JumpKind {
  if (d.grounded || d.coyote > 0) {
    d.vy = p.jumpVelocity
    d.grounded = false
    d.coyote = 0
    d.jumps = 1
    d.held = 0
    return 'ground'
  }
  if (d.jumps < 2) {
    // A tap just before landing should be a fresh jump off the ground, not waste the
    // double jump on the last few pixels of the fall. Keep it buffered instead.
    const falling = d.vy > 0
    if (falling && timeToGround(d, p, floor) <= d.buffer) return null
    d.vy = p.doubleJumpVelocity
    d.jumps = 2
    d.held = 0
    return 'double'
  }
  return null
}

/**
 * Advances the dog by one fixed step. `pressed` is true if the player tapped since the
 * previous step. `floor` is the surface under the dog (0, or a ledge top it is above).
 * `holding`: the jump is held down (only when hold to jump higher is on).
 */
export function stepDog(
  d: DogBody,
  p: PhysicsConfig,
  dt: number,
  pressed: boolean,
  floor = 0,
  holding = false,
): StepResult {
  let jumped: JumpKind = null
  let landed = false
  if (pressed) d.buffer = p.jumpBuffer
  // Ran off the end of a ledge: fall, with coyote time for a late jump.
  if (d.grounded && d.y < floor) leaveGround(d, p)

  if (d.buffer > 0) {
    jumped = tryJump(d, p, floor)
    if (jumped) d.buffer = 0
  }

  if (!d.grounded) {
    const held = holding && d.vy < 0 && d.held < p.hold.maxSeconds
    if (held) d.held += dt
    d.vy += p.gravity * (held ? p.hold.gravityScale : 1) * dt
    d.y += d.vy * dt
    d.coyote = Math.max(0, d.coyote - dt)
    if (d.y >= floor) {
      d.y = floor
      d.vy = 0
      d.grounded = true
      d.jumps = 0
      landed = true
      // Buffered tap: jump straight off the landing.
      if (d.buffer > 0) {
        jumped = tryJump(d, p, floor)
        d.buffer = 0
      }
    }
  }

  d.buffer = Math.max(0, d.buffer - dt)
  return { jumped, landed }
}

/**
 * Leaves the ground without jumping (a ledge, ice, a bounce). Starts coyote time, during
 * which a tap still counts as a ground jump. Flat v1.0 worlds never call this; later
 * worlds (ice, conveyor belts) will.
 */
export function leaveGround(d: DogBody, p: PhysicsConfig) {
  if (!d.grounded) return
  d.grounded = false
  d.coyote = p.coyoteTime
  d.jumps = 1
}

/**
 * Longest a dog can stay in the air after leaving a ledge `h` high: a held jump off its
 * edge and a held double jump at the top. The spawner keeps this much clear after a ledge.
 */
export function maxAirTime(h: number, p: PhysicsConfig, dt: number): number {
  const d: DogBody = { y: -h, vy: 0, grounded: true, jumps: 0, buffer: 0, coyote: 0, held: 0 }
  stepDog(d, p, dt, true, 0, true)
  let k = 1
  let doubled = false
  while (!d.grounded && k < 1000) {
    const press = !doubled && d.vy >= 0
    if (press) doubled = true
    stepDog(d, p, dt, press, 0, true)
    k++
  }
  return k * dt
}

/** Apex height of a jump starting with upward speed |v|. */
export function apex(v: number, gravity: number) {
  return (v * v) / (2 * gravity)
}

// ---- hitboxes --------------------------------------------------------------------------

/** The dog's hitbox at screen x `dogX`. Ears, tail and snout tip are outside it. */
export function dogBox(dogX: number, y: number, hb: Box): Box {
  return { x0: dogX + hb.x0, x1: dogX + hb.x1, y0: y + hb.y0, y1: y + hb.y1 }
}

/** An obstacle's hitbox, shrunk by its inset so edges are forgiving. */
export function obstacleBox(x: number, def: ObstacleDef): Box {
  const bottom = -(def.fly ?? 0)
  return {
    x0: x + def.inset,
    x1: x + def.w - def.inset,
    y0: bottom - def.h + def.inset,
    y1: bottom,
  }
}

export function overlaps(a: Box, b: Box) {
  return a.x1 > b.x0 && a.x0 < b.x1 && a.y1 > b.y0 && a.y0 < b.y1
}
