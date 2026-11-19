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

/** Snowy Peaks: a tumbling wall of snow with rocks caught up in it. */
function avalanche(c: Ctx, t: number) {
  const roll = t * 9
  const lumps: [number, number, number][] = [
    [18, -26, 26],
    [52, -40, 34],
    [92, -32, 30],
    [124, -20, 22],
    [40, -12, 20],
    [80, -10, 22],
    [110, -58, 18],
    [70, -66, 22],
  ]
  for (const [i, [x, y, r]] of lumps.entries()) {
    const b = Math.sin(roll + i * 1.7) * 3
    dot(c, x, y + b, r, i % 3 ? '#f4f8ff' : '#e3edf9')
    dot(c, x - r * 0.3, y + b - r * 0.35, r * 0.35, '#ffffff')
  }
  // Rocks and a tree trunk tumbling in it.
  const spin = roll * 0.7
  for (const [x, y, r] of [
    [60, -24, 7],
    [100, -48, 6],
    [30, -44, 5],
  ] as const) {
    c.save()
    c.translate(x, y)
    c.rotate(spin)
    rr(c, -r, -r * 0.8, r * 2, r * 1.6, 3)
    c.fillStyle = '#8c8a99'
    c.fill()
    c.restore()
  }
  c.save()
  c.translate(84, -78)
  c.rotate(-spin * 0.5)
  c.fillStyle = '#7a4a2a'
  c.fillRect(-16, -3, 32, 6)
  c.restore()
  // Spray off the front.
  for (let i = 0; i < 5; i++) {
    const k = (t * 2 + i / 5) % 1
    dot(c, 140 + k * 26, -30 - i * 9 + k * 10, 4 * (1 - k), 'rgba(255,255,255,.9)')
  }
  // Angry eyes in the snow.
  ell(c, 98, -40, 5, 3.5, 0, '#1d1b28')
  ell(c, 118, -40, 5, 3.5, 0, '#1d1b28')
  c.strokeStyle = '#1d1b28'
  c.lineWidth = 2.5
  c.beginPath()
  c.moveTo(90, -49)
  c.lineTo(102, -45)
  c.moveTo(126, -49)
  c.lineTo(114, -45)
  c.stroke()
}

/** Building Site: a wrecking ball on a little crane truck, swinging at Dobie. */
function wreckingBall(c: Ctx, t: number) {
  const spin = t * 28
  const swing = Math.sin(t * Math.PI * 2 * 2) * 0.35
  // Truck.
  rr(c, 4, -36, 70, 24, 6)
  c.fillStyle = '#ffc61a'
  c.fill()
  rr(c, 46, -58, 26, 24, 5)
  c.fill()
  c.fillStyle = '#9fd4f5'
  rr(c, 52, -54, 15, 12, 3)
  c.fill()
  c.fillStyle = '#1d1b28'
  for (let k = 8; k < 44; k += 12) c.fillRect(k, -26, 6, 4)
  wheel(c, 20, -10, 10, spin)
  wheel(c, 60, -10, 10, spin)
  // Boom and ball.
  c.strokeStyle = '#e8a800'
  c.lineWidth = 6
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(30, -36)
  c.lineTo(96, -96)
  c.stroke()
  const bx = 96 + Math.sin(swing) * 52
  const by = -96 + Math.cos(swing) * 52
  c.strokeStyle = '#3a3f4b'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(96, -96)
  c.lineTo(bx, by)
  c.stroke()
  dot(c, bx, by + 8, 18, '#3a3f4b')
  dot(c, bx - 6, by + 2, 5, 'rgba(255,255,255,.25)')
  // Angry brows on the ball.
  c.strokeStyle = '#ffc61a'
  c.lineWidth = 2.5
  c.beginPath()
  c.moveTo(bx - 9, by + 2)
  c.lineTo(bx - 2, by + 6)
  c.moveTo(bx + 11, by + 2)
  c.lineTo(bx + 4, by + 6)
  c.stroke()
  dot(c, bx - 4, by + 10, 2, '#ffc61a')
  dot(c, bx + 6, by + 10, 2, '#ffc61a')
}

/** Haunted Hollow: a huge see-through hound with glowing eyes, bounding after Dobie. */
function ghostHound(c: Ctx, t: number) {
  const run = t * Math.PI * 4
  const b = Math.abs(Math.sin(run)) * 5
  c.save()
  c.globalAlpha = 0.85
  // Wispy tail of mist.
  for (let i = 0; i < 5; i++) {
    const k = (t * 2 + i / 5) % 1
    dot(c, 10 - k * 26, -40 - i * 4 + k * 8, 9 * (1 - k), 'rgba(200,190,255,.55)')
  }
  // Legs.
  c.strokeStyle = '#d9d2ff'
  c.lineWidth = 9
  c.lineCap = 'round'
  for (const [hx, ph] of [
    [40, 0],
    [56, Math.PI],
    [104, 1.6],
    [118, 1.6 + Math.PI],
  ] as const) {
    c.beginPath()
    c.moveTo(hx, -34 - b)
    c.lineTo(hx + Math.sin(run + ph) * 14, -6)
    c.stroke()
  }
  ell(c, 80, -46 - b, 50, 22, 0, '#e8e3ff')
  ell(c, 72, -40 - b, 30, 10, 0, 'rgba(160,140,230,.35)')
  // Head and ears.
  ell(c, 132, -66 - b, 22, 18, 0, '#e8e3ff')
  tri(c, [118, -78 - b], [122, -98 - b], [132, -80 - b], '#d9d2ff')
  ell(c, 152, -60 - b, 12, 8, 0, '#e8e3ff')
  dot(c, 162, -62 - b, 3.5, '#2e2440')
  c.restore()
  // Eyes glow at full strength.
  dot(c, 136, -70 - b, 7, 'rgba(120,255,200,.35)')
  dot(c, 136, -70 - b, 3.5, '#7dffcf')
  c.strokeStyle = '#2e2440'
  c.lineWidth = 2.5
  c.beginPath()
  c.moveTo(128, -78 - b)
  c.lineTo(142, -74 - b)
  c.stroke()
}

/** Moon Walkies: a flying saucer with a tractor beam, little alien cat at the controls. */
function ufo(c: Ctx, t: number) {
  const hover = Math.sin(t * Math.PI * 4) * 4
  const y = -70 + hover
  // Tractor beam.
  c.fillStyle = 'rgba(160,255,200,.22)'
  c.beginPath()
  c.moveTo(66, y + 10)
  c.lineTo(96, y + 10)
  c.lineTo(126, 0)
  c.lineTo(36, 0)
  c.closePath()
  c.fill()
  // Dome and pilot.
  c.fillStyle = 'rgba(190,225,255,.5)'
  c.beginPath()
  c.arc(81, y - 6, 22, Math.PI, 0)
  c.fill()
  dot(c, 81, y - 10, 9, '#5fd47a')
  tri(c, [73, y - 15], [74, y - 23], [79, y - 18], '#5fd47a')
  tri(c, [83, y - 18], [88, y - 23], [89, y - 15], '#5fd47a')
  dot(c, 78, y - 10, 1.8, '#1d1b28')
  dot(c, 84, y - 10, 1.8, '#1d1b28')
  // Saucer.
  ell(c, 81, y, 60, 14, 0, '#9aa3b8')
  ell(c, 81, y - 3, 56, 8, 0, '#c3cad8')
  ell(c, 81, y + 7, 34, 6, 0, '#6b7287')
  for (let i = 0; i < 6; i++) {
    const on = Math.floor(t * 8 + i) % 2 === 0
    dot(c, 36 + i * 18, y + 2, 3.2, on ? '#ffd23f' : '#ff4fa0')
  }
}

export function drawBoss(c: Ctx, kind: BossKind, t: number) {
  if (kind === 'mower') mower(c, t)
  else if (kind === 'van') van(c, t)
  else if (kind === 'kingCrab') kingCrab(c, t)
  else if (kind === 'avalanche') avalanche(c, t)
  else if (kind === 'wreckingBall') wreckingBall(c, t)
  else if (kind === 'ghostHound') ghostHound(c, t)
  else if (kind === 'ufo') ufo(c, t)
  else foxPack(c, t)
}
