/** Trails: a little stream of particles behind the dog, picked in the Closet. Render only. */
import { dot, sparkle, TAU, type Ctx } from './draw'

export type TrailKind =
  | 'dust'
  | 'paws'
  | 'hearts'
  | 'confetti'
  | 'bubbles'
  | 'stars'
  | 'rainbow'
  // M7: Pup Pass, the Party pack and Winter Walkies.
  | 'bones'
  | 'sparkles'
  | 'notes'
  | 'leaves'
  | 'streamers'
  | 'snow'

export interface TrailParticle {
  x: number
  /** Height relative to the ground line. */
  y: number
  vx: number
  vy: number
  /** Gravity (units/s²); negative floats up. */
  g: number
  life: number
  max: number
  col: string
  r: number
  rot: number
  kind: TrailKind
}

/** Particles per second for each trail. */
export const TRAIL_RATE: Record<TrailKind, number> = {
  dust: 14,
  paws: 5,
  hearts: 6,
  confetti: 22,
  bubbles: 8,
  stars: 9,
  rainbow: 30,
  bones: 5,
  sparkles: 16,
  notes: 5,
  leaves: 7,
  streamers: 18,
  snow: 14,
}

const CONFETTI = ['#ff4fa0', '#ffd23f', '#3ee08f', '#3a86f0', '#8a5cf6']
const RAINBOW = ['#ff4fa0', '#ff8a3a', '#ffd23f', '#3ee08f', '#3a86f0', '#8a5cf6']
const LEAVES = ['#e8763a', '#f2a23a', '#c9532e', '#d8b23a']
const NOTES = ['#8a5cf6', '#3a86f0', '#ff4fa0']

/** One new particle behind the dog (dogX, dogY above ground), drifting back at `scroll`. */
export function spawnTrail(
  kind: TrailKind,
  dogX: number,
  dogY: number,
  scroll: number,
  grounded: boolean,
  t: number,
): TrailParticle | null {
  const r = (a: number, b: number) => a + Math.random() * (b - a)
  const base = { x: dogX - 26 + r(-6, 6), vx: -scroll, rot: r(0, TAU), kind }
  switch (kind) {
    case 'dust':
      if (!grounded) return null
      return {
        ...base,
        y: -2,
        vy: r(-40, -10),
        vx: -scroll * 0.6,
        g: 120,
        life: 0.4,
        max: 0.4,
        col: 'rgba(214,180,140,.7)',
        r: r(2, 4),
      }
    case 'paws':
      if (!grounded) return null
      return { ...base, y: 3, vy: 0, g: 0, life: 1.2, max: 1.2, col: 'rgba(60,40,50,.35)', r: 4 }
    case 'hearts':
      return {
        ...base,
        y: dogY - 34,
        vy: r(-60, -30),
        vx: -scroll * 0.5,
        g: -20,
        life: 0.9,
        max: 0.9,
        col: '#ff4fa0',
        r: r(4, 6),
      }
    case 'confetti':
      return {
        ...base,
        y: dogY - 30 + r(-10, 10),
        vy: r(-120, -40),
        vx: -scroll * 0.7,
        g: 300,
        life: 0.8,
        max: 0.8,
        col: CONFETTI[Math.floor(r(0, CONFETTI.length))]!,
        r: r(2, 3.5),
      }
    case 'bubbles':
      return {
        ...base,
        y: dogY - 30 + r(-10, 10),
        vy: r(-70, -30),
        vx: -scroll * 0.5,
        g: -30,
        life: 1,
        max: 1,
        col: 'rgba(170,228,255,.9)',
        r: r(3, 6),
      }
    case 'stars':
      return {
        ...base,
        y: dogY - 34 + r(-14, 14),
        vy: r(-30, 30),
        vx: -scroll * 0.7,
        g: 0,
        life: 0.7,
        max: 0.7,
        col: '#ffd23f',
        r: r(3, 5),
      }
    case 'rainbow':
      return {
        ...base,
        y: dogY - 44 + Math.floor((t * 30) % 6) * 6,
        vy: 0,
        vx: -scroll * 0.9,
        g: 0,
        life: 0.5,
        max: 0.5,
        col: RAINBOW[Math.floor((t * 30) % 6)]!,
        r: 3.5,
      }
    case 'bones':
      if (!grounded) return null
      return { ...base, y: 2, vy: 0, g: 0, life: 1.1, max: 1.1, col: '#fff3d6', r: 4 }
    case 'sparkles':
      return {
        ...base,
        y: dogY - 30 + r(-18, 18),
        vy: r(-20, 20),
        vx: -scroll * 0.75,
        g: 0,
        life: 0.5,
        max: 0.5,
        col: Math.random() < 0.5 ? '#ffffff' : '#bfe9ff',
        r: r(2, 3.5),
      }
    case 'notes':
      return {
        ...base,
        y: dogY - 40 + r(-6, 6),
        vy: r(-50, -25),
        vx: -scroll * 0.55,
        g: -10,
        life: 1,
        max: 1,
        col: NOTES[Math.floor(r(0, NOTES.length))]!,
        r: 4,
      }
    case 'leaves':
      return {
        ...base,
        y: dogY - 30 + r(-10, 10),
        vy: r(-40, 0),
        vx: -scroll * 0.6,
        g: 90,
        life: 1,
        max: 1,
        col: LEAVES[Math.floor(r(0, LEAVES.length))]!,
        r: r(3.5, 5),
      }
    case 'streamers':
      return {
        ...base,
        y: dogY - 32 + r(-8, 8),
        vy: r(-90, -30),
        vx: -scroll * 0.7,
        g: 220,
        life: 0.9,
        max: 0.9,
        col: CONFETTI[Math.floor(r(0, CONFETTI.length))]!,
        r: r(5, 8),
      }
    case 'snow':
      return {
        ...base,
        y: dogY - 30 + r(-14, 14),
        vy: r(-15, 15),
        vx: -scroll * 0.6,
        g: 40,
        life: 1,
        max: 1,
        col: '#ffffff',
        r: r(2, 3.5),
      }
  }
}

export function drawTrailParticle(c: Ctx, p: TrailParticle, GY: number) {
  const y = GY + p.y
  c.globalAlpha = Math.max(0, Math.min(1, p.life / p.max))
  switch (p.kind) {
    case 'paws':
      dot(c, p.x, y, p.r, p.col)
      for (let i = 0; i < 3; i++) dot(c, p.x - 4 + i * 4, y - 5, 1.6, p.col)
      break
    case 'hearts':
      dot(c, p.x - p.r * 0.45, y, p.r * 0.55, p.col)
      dot(c, p.x + p.r * 0.45, y, p.r * 0.55, p.col)
      c.fillStyle = p.col
      c.beginPath()
      c.moveTo(p.x - p.r, y + p.r * 0.15)
      c.lineTo(p.x, y + p.r * 1.1)
      c.lineTo(p.x + p.r, y + p.r * 0.15)
      c.fill()
      break
    case 'confetti':
      c.save()
      c.translate(p.x, y)
      c.rotate(p.rot + p.life * 8)
      c.fillStyle = p.col
      c.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r)
      c.restore()
      break
    case 'bubbles':
      c.strokeStyle = p.col
      c.lineWidth = 1.5
      c.beginPath()
      c.arc(p.x, y, p.r, 0, TAU)
      c.stroke()
      break
    case 'stars':
      sparkle(c, p.x, y, p.r * 1.4, p.col, p.rot)
      break
    case 'bones':
      // A little bone print on the ground: two knobs each end and a bar.
      c.fillStyle = p.col
      c.fillRect(p.x - p.r, y - 1.2, p.r * 2, 2.4)
      for (const [a, b] of [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ] as const)
        dot(c, p.x + a * p.r, y + b * 1.6, 1.8, p.col)
      break
    case 'sparkles':
      sparkle(c, p.x, y, p.r * 1.6, p.col, p.rot + p.life * 4)
      break
    case 'notes':
      c.fillStyle = p.col
      c.strokeStyle = p.col
      c.lineWidth = 1.4
      c.beginPath()
      c.ellipse(p.x, y, p.r * 0.75, p.r * 0.55, -0.4, 0, TAU)
      c.fill()
      c.beginPath()
      c.moveTo(p.x + p.r * 0.65, y)
      c.lineTo(p.x + p.r * 0.65, y - p.r * 2.4)
      c.lineTo(p.x + p.r * 1.6, y - p.r * 1.8)
      c.stroke()
      break
    case 'leaves':
      c.save()
      c.translate(p.x, y)
      c.rotate(p.rot + p.life * 3)
      c.fillStyle = p.col
      c.beginPath()
      c.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, TAU)
      c.fill()
      c.restore()
      break
    case 'streamers':
      c.save()
      c.translate(p.x, y)
      c.rotate(p.rot + p.life * 5)
      c.strokeStyle = p.col
      c.lineWidth = 2
      c.beginPath()
      c.moveTo(-p.r, 0)
      c.quadraticCurveTo(-p.r / 2, -3, 0, 0)
      c.quadraticCurveTo(p.r / 2, 3, p.r, 0)
      c.stroke()
      c.restore()
      break
    case 'snow':
      dot(c, p.x, y, p.r, p.col)
      dot(c, p.x, y, p.r * 0.5, '#e6f3ff')
      break
    default:
      dot(c, p.x, y, p.r, p.col)
  }
  c.globalAlpha = 1
}
