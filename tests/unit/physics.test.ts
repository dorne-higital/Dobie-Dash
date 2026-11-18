import { describe, expect, it } from 'vitest'
import { loadGameConfig } from '~/game/config'
import {
  apex,
  dogBox,
  leaveGround,
  newDog,
  obstacleBox,
  overlaps,
  stepDog,
  timeToGround,
} from '~/game/physics'

const cfg = loadGameConfig()
const p = cfg.physics
const DT = 1 / cfg.loop.hz

function runUntilLanded(d = newDog(), maxSteps = 600) {
  let peak = 0
  let steps = 0
  for (; steps < maxSteps; steps++) {
    const r = stepDog(d, p, DT, false)
    peak = Math.min(peak, d.y)
    if (r.landed) break
  }
  return { peak, steps }
}

describe('config', () => {
  it('uses the spec values', () => {
    expect(p.gravity).toBe(2350)
    expect(p.jumpVelocity).toBe(-780)
    expect(p.doubleJumpVelocity).toBe(-700)
    expect(p.jumpBuffer).toBe(0.12)
  })
})

describe('jump', () => {
  it('a tap on the ground jumps to about the analytic apex and lands', () => {
    const d = newDog()
    expect(stepDog(d, p, DT, true).jumped).toBe('ground')
    const { peak, steps } = runUntilLanded(d)
    expect(-peak).toBeGreaterThan(apex(p.jumpVelocity, p.gravity) - 10)
    expect(-peak).toBeLessThan(apex(p.jumpVelocity, p.gravity) + 2)
    const air = (2 * -p.jumpVelocity) / p.gravity
    expect(steps * DT).toBeCloseTo(air, 1)
    expect(d.grounded).toBe(true)
    expect(d.jumps).toBe(0)
  })

  it('allows exactly one double jump in the air', () => {
    const d = newDog()
    stepDog(d, p, DT, true)
    for (let i = 0; i < 10; i++) stepDog(d, p, DT, false)
    expect(stepDog(d, p, DT, true).jumped).toBe('double')
    expect(d.vy).toBeGreaterThan(p.doubleJumpVelocity) // gravity applied this step
    for (let i = 0; i < 5; i++) stepDog(d, p, DT, false)
    expect(stepDog(d, p, DT, true).jumped).toBe(null)
    expect(d.jumps).toBe(2)
  })

  it('a double jump goes higher than a single jump', () => {
    const single = runUntilLanded(
      (() => {
        const d = newDog()
        stepDog(d, p, DT, true)
        return d
      })(),
    ).peak
    const d = newDog()
    stepDog(d, p, DT, true)
    for (let i = 0; i < 20; i++) stepDog(d, p, DT, false)
    stepDog(d, p, DT, true)
    const double = runUntilLanded(d).peak
    expect(double).toBeLessThan(single - 60)
  })
})

describe('jump buffer', () => {
  function fallingAfterDouble() {
    const d = newDog()
    stepDog(d, p, DT, true)
    stepDog(d, p, DT, true) // double jump straight away
    while (timeToGround(d, p) > 0.1 || d.vy < 0) stepDog(d, p, DT, false)
    return d
  }

  it('a tap up to 0.12 s before landing jumps on landing', () => {
    const d = fallingAfterDouble()
    expect(timeToGround(d, p)).toBeLessThanOrEqual(0.12)
    stepDog(d, p, DT, true)
    let jumpedOnLanding = false
    for (let i = 0; i < 20 && !jumpedOnLanding; i++) {
      const r = stepDog(d, p, DT, false)
      if (r.landed) jumpedOnLanding = r.jumped === 'ground'
    }
    expect(jumpedOnLanding).toBe(true)
    expect(d.vy).toBe(p.jumpVelocity)
  })

  it('a tap too early is forgotten', () => {
    const d = newDog()
    stepDog(d, p, DT, true)
    stepDog(d, p, DT, true)
    while (d.vy < 0) stepDog(d, p, DT, false) // at the apex, ~0.3 s from the ground
    stepDog(d, p, DT, true)
    let jumped = false
    for (let i = 0; i < 60; i++) if (stepDog(d, p, DT, false).jumped) jumped = true
    expect(jumped).toBe(false)
    expect(d.grounded).toBe(true)
  })

  it('a tap just before landing keeps the double jump and jumps from the ground', () => {
    const d = newDog()
    stepDog(d, p, DT, true)
    while (d.vy < 0 || timeToGround(d, p) > 0.08) stepDog(d, p, DT, false)
    const r = stepDog(d, p, DT, true)
    expect(r.jumped).toBe(null)
    expect(d.jumps).toBe(1)
    let groundJump = false
    for (let i = 0; i < 10; i++) if (stepDog(d, p, DT, false).jumped === 'ground') groundJump = true
    expect(groundJump).toBe(true)
  })
})

describe('coyote time', () => {
  it('a tap shortly after leaving the ground is still a full ground jump', () => {
    const d = newDog()
    d.y = -80 // walking off a ledge
    leaveGround(d, p)
    stepDog(d, p, DT, false)
    stepDog(d, p, DT, false)
    expect(stepDog(d, p, DT, true).jumped).toBe('ground')
    expect(d.jumps).toBe(1)
  })

  it('after coyote time runs out, a tap only gets the air jump', () => {
    const d = newDog()
    d.y = -80 // walking off a ledge
    leaveGround(d, p)
    const steps = Math.ceil(p.coyoteTime / DT) + 1
    for (let i = 0; i < steps; i++) stepDog(d, p, DT, false)
    expect(stepDog(d, p, DT, true).jumped).toBe('double')
  })
})

describe('hitboxes', () => {
  const hb = cfg.dog.hitbox
  it('dog box excludes ears and tail (narrower than the drawn dog)', () => {
    const b = dogBox(130, 0, hb)
    expect(b.x1 - b.x0).toBeLessThanOrEqual(60)
    expect(b.y1).toBeLessThan(0)
  })
  it('a hydrant directly under a grounded dog overlaps', () => {
    expect(overlaps(dogBox(130, 0, hb), obstacleBox(130, cfg.obstacles.hydrant))).toBe(true)
  })
  it('a seagull passes over a grounded dog', () => {
    expect(overlaps(dogBox(130, 0, hb), obstacleBox(130, cfg.obstacles.seagull))).toBe(false)
  })
  it('a dog at single-jump apex clears every ground obstacle', () => {
    const y = -apex(p.jumpVelocity, p.gravity)
    for (const t of ['hydrant', 'cone', 'fence', 'cat'] as const)
      expect(overlaps(dogBox(130, y, hb), obstacleBox(130, cfg.obstacles[t]))).toBe(false)
  })
})
