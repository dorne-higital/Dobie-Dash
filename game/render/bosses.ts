/**
 * Gate-chase bosses, drawn in code like everything else and baked into sprite frames.
 * Anchor: bottom-left on the ground line, facing right (they chase Dobie).
 */
import type { BossKind } from '../config'
import { dot, ell, rr, text, tri, BODY_FONT, type Ctx } from './draw'
import { drawObstacle } from './obstacles'

export const BOSS_FRAMES = 8
/** Seconds per animation loop. */
export const BOSS_PERIOD = 0.5
/** Baked box: wide enough for the biggest boss plus effects. */
export const BOSS_BOX = { w: 170, h: 120, ox: 20, oy: 100 }

function wheel(c: Ctx, x: number, y: number, r: number, spin: number) {
  dot(c, x, y, r, '#2a1e22')
  dot(c, x, y, r * 0.45, '#9aa3b8')
  c.strokeStyle = '#2a1e22'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(x + Math.cos(spin) * r * 0.45, y + Math.sin(spin) * r * 0.45)
  c.lineTo(x - Math.cos(spin) * r * 0.45, y - Math.sin(spin) * r * 0.45)
  c.stroke()
}

function mower(c: Ctx, t: number) {
  const spin = t * 30
  const b = Math.sin(t * 25) * 1.5
  // Grass clippings flying out the back.
  for (let i = 0; i < 4; i++) {
    const k = (t * 3 + i / 4) % 1
    dot(c, 8 - k * 30, -12 - k * 18 + i * 3, 2.5 * (1 - k), '#5fae45')
  }
  rr(c, 10, -34 + b, 92, 22, 8)
  c.fillStyle = '#3e9b4f'
  c.fill()
  rr(c, 10, -16 + b, 92, 6, 3)
  c.fillStyle = '#2b7a3b'
  c.fill()
  c.fillStyle = '#ffd23f'
  c.fillRect(70, -30 + b, 26, 4)
  wheel(c, 28, -9, 11, spin)
  wheel(c, 88, -7, 8, spin)
  // Park keeper on the seat.
  rr(c, 30, -46 + b, 22, 12, 4)
  c.fillStyle = '#5a3b2e'
  c.fill()
  rr(c, 34, -74 + b, 22, 30, 8)
  c.fillStyle = '#4a6b3a'
  c.fill()
  c.strokeStyle = '#4a6b3a'
  c.lineWidth = 6
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(52, -66 + b)
  c.lineTo(72, -54 + b)
  c.stroke()
  dot(c, 47, -84 + b, 10, '#f0b88a')
  ell(c, 50, -78 + b, 8, 5, 0, '#e8e2d4') // beard
  c.fillStyle = '#6b4a3a'
  rr(c, 36, -96 + b, 22, 7, 3)
  c.fill()
  c.fillRect(40, -94 + b, 26, 3)
  dot(c, 52, -86 + b, 1.6, '#1d1b28')
  // Shaking fist.
  dot(c, 74, -55 + b + Math.sin(t * 20) * 3, 4.5, '#f0b88a')
}

function van(c: Ctx, t: number) {
  const spin = t * 34
  const b = Math.sin(t * 20) * 1.2
  rr(c, 4, -66 + b, 104, 54, 8)
  c.fillStyle = '#e5484d'
  c.fill()
  // Cab, sloping to the front (right).
  c.fillStyle = '#e5484d'
  c.beginPath()
  c.moveTo(108, -66 + b)
  c.lineTo(132, -40 + b)
  c.lineTo(136, -12 + b)
  c.lineTo(104, -12 + b)
  c.closePath()
  c.fill()
  c.fillStyle = '#bfe3f5'
  c.beginPath()
  c.moveTo(110, -60 + b)
  c.lineTo(127, -40 + b)
  c.lineTo(110, -40 + b)
  c.closePath()
  c.fill()
  c.fillStyle = '#ffd23f'
  c.fillRect(4, -30 + b, 132, 5)
  text(c, 'MAIL', 52, -46 + b, 17, '#ffffff', { font: BODY_FONT, weight: 900 })
  dot(c, 134, -20 + b, 3.5, '#fff6c4')
  wheel(c, 28, -10, 11, spin)
  wheel(c, 108, -10, 11, spin)
  // Driver's arm with a parcel, winding up to throw.
  const a = Math.sin(t * 8)
  c.save()
  c.translate(118, -46 + b)
  c.rotate(-0.6 + a * 0.5)
  c.fillStyle = '#3a4a8a'
  c.fillRect(0, -3, 20, 6)
  rr(c, 16, -10, 14, 12, 2)
  c.fillStyle = '#c98f52'
  c.fill()
  c.restore()
}

function kingCrab(c: Ctx, t: number) {
  const k = Math.sin(t * 16)
  const big = (x: number, dir: number) => {
    c.save()
    c.translate(x, -46)
    c.rotate(dir * (0.25 + Math.abs(k) * 0.35))
    ell(c, 0, -10, 13, 11, 0, '#d63c42')
    tri(c, [dir * 4, -18], [dir * 20, -30], [dir * 14, -8], '#f6dc96')
    tri(c, [dir * 4, -10], [dir * 22, -6], [dir * 8, -2], '#d63c42')
    c.restore()
  }
  c.strokeStyle = '#a92d33'
  c.lineWidth = 4.5
  c.lineCap = 'round'
  for (let i = 0; i < 4; i++) {
    const lx = 36 + i * 15
    c.beginPath()
    c.moveTo(lx, -18)
    c.lineTo(lx - 8 + Math.sin(t * 16 + i) * 4, 0)
    c.stroke()
  }
  ell(c, 60, -28, 40, 22, 0, '#e5484d')
  ell(c, 60, -34, 28, 9, 0, 'rgba(255,255,255,.22)')
  big(18, -1)
  big(104, 1)
  // Eye stalks and crown.
  c.strokeStyle = '#a92d33'
  c.lineWidth = 3
  c.beginPath()
  c.moveTo(52, -46)
  c.lineTo(50, -60)
  c.moveTo(70, -46)
  c.lineTo(72, -60)
  c.stroke()
  for (const ex of [50, 72]) {
    dot(c, ex, -62, 5, '#ffffff')
    dot(c, ex + 1.5, -62, 2.4, '#1d1b28')
  }
  c.fillStyle = '#ffd23f'
  c.beginPath()
  c.moveTo(46, -70)
  c.lineTo(48, -84)
  c.lineTo(55, -76)
  c.lineTo(61, -88)
  c.lineTo(67, -76)
  c.lineTo(74, -84)
  c.lineTo(76, -70)
  c.closePath()
  c.fill()
  dot(c, 61, -76, 2.4, '#e5484d')
  // Angry brows.
  c.strokeStyle = '#1d1b28'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(45, -69)
  c.lineTo(54, -66)
  c.moveTo(77, -69)
  c.lineTo(68, -66)
  c.stroke()
}

function foxPack(c: Ctx, t: number) {
  // Three foxes, staggered, each a little out of step.
  const pack: [number, number, number][] = [
    [0, 0, 0.9],
    [52, -6, 1.15],
    [104, 0, 1],
  ]
  for (const [dx, dy, s] of pack) {
    c.save()
    c.translate(dx, dy)
    c.scale(-s, s) // fox art faces left; bosses face right
    drawObstacle(c, 'fox', -58, 0, t + dx * 0.01)
    c.restore()
  }
  // Glinting eyes in the dark.
  dot(c, 46, -24, 1.8, '#ffd23f')
  dot(c, 112, -27, 1.8, '#ffd23f')
}

export function drawBoss(c: Ctx, kind: BossKind, t: number) {
  if (kind === 'mower') mower(c, t)
  else if (kind === 'van') van(c, t)
  else if (kind === 'kingCrab') kingCrab(c, t)
  else foxPack(c, t)
}
