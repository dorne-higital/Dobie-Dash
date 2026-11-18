/** Obstacle and biscuit art, ported from the prototype. Each draws with its bottom-left at (x, y). */
import type { ObstacleType } from '../config'
import { dot, ell, rr, sparkle, tri, type Ctx } from './draw'

/** `t` animates the cat's tail and the pigeon's wings. */
export function drawObstacle(c: Ctx, type: ObstacleType, x: number, y: number, t: number) {
  if (type === 'hydrant') {
    rr(c, x + 1, y - 7, 26, 7, 2)
    c.fillStyle = '#b8323a'
    c.fill()
    rr(c, x + 5, y - 38, 18, 32, 4)
    c.fillStyle = '#e5484d'
    c.fill()
    ell(c, x + 14, y - 38, 10, 6.5, 0, '#c93a3f')
    rr(c, x + 11, y - 47, 6, 6, 2)
    c.fillStyle = '#c93a3f'
    c.fill()
    rr(c, x, y - 29, 6, 8, 2)
    c.fill()
    rr(c, x + 22, y - 29, 6, 8, 2)
    c.fill()
    dot(c, x + 14, y - 24, 3, '#b8323a')
    c.fillStyle = 'rgba(255,255,255,.35)'
    rr(c, x + 8, y - 35, 3, 24, 1.5)
    c.fill()
  } else if (type === 'cone') {
    tri(c, [x + 4, y - 4], [x + 15, y - 36], [x + 26, y - 4], '#ff7a1a')
    c.fillStyle = '#ffffff'
    c.beginPath()
    c.moveTo(x + 9.6, y - 20)
    c.lineTo(x + 20.4, y - 20)
    c.lineTo(x + 22, y - 14)
    c.lineTo(x + 8, y - 14)
    c.fill()
    rr(c, x, y - 5, 30, 5, 2)
    c.fillStyle = '#d95a00'
    c.fill()
  } else if (type === 'fence') {
    c.fillStyle = '#d8cfc0'
    c.fillRect(x + 1, y - 28, 56, 5)
    c.fillRect(x + 1, y - 13, 56, 5)
    for (let i = 0; i < 5; i++) {
      const px = x + 2 + i * 11.5
      c.fillStyle = '#fbf7f0'
      c.beginPath()
      c.moveTo(px, y)
      c.lineTo(px, y - 31)
      c.lineTo(px + 4.5, y - 38)
      c.lineTo(px + 9, y - 31)
      c.lineTo(px + 9, y)
      c.closePath()
      c.fill()
      c.strokeStyle = '#cfc3b0'
      c.lineWidth = 1
      c.stroke()
    }
  } else if (type === 'cat') {
    const tw = Math.sin(t * 4) * 3
    c.strokeStyle = '#8c8a99'
    c.lineWidth = 5
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(x + 32, y - 6)
    c.quadraticCurveTo(x + 44, y - 14, x + 38 + tw, y - 28)
    c.stroke()
    ell(c, x + 22, y - 12, 14, 12, 0, '#8c8a99')
    ell(c, x + 22, y - 8, 8, 7, 0, '#b9b7c6')
    tri(c, [x + 6, y - 28], [x + 8, y - 42], [x + 15, y - 32], '#8c8a99')
    tri(c, [x + 16, y - 32], [x + 22, y - 42], [x + 24, y - 28], '#8c8a99')
    tri(c, [x + 8.5, y - 30], [x + 9.5, y - 38], [x + 13, y - 32], '#ff9fb5')
    dot(c, x + 15, y - 27, 10, '#8c8a99')
    ell(c, x + 11, y - 28, 2.6, 3, 0, '#ffd23f')
    ell(c, x + 19, y - 28, 2.6, 3, 0, '#ffd23f')
    ell(c, x + 11, y - 28, 0.9, 2.6, 0, '#1d1b28')
    ell(c, x + 19, y - 28, 0.9, 2.6, 0, '#1d1b28')
    tri(c, [x + 13.5, y - 24], [x + 16.5, y - 24], [x + 15, y - 22], '#ff8fa8')
  } else if (type === 'pigeon') {
    const fl = Math.sin(t * 22)
    ell(c, x + 18, y - 10, 14, 9, 0, '#9aa3b8')
    ell(c, x + 20, y - 6, 9, 5, 0, '#c7ccd9')
    c.save()
    c.translate(x + 20, y - 14)
    c.rotate(-0.4 + fl * 0.7)
    ell(c, 4, -6, 11, 5, -0.3, '#7d869c')
    c.restore()
    dot(c, x + 6, y - 16, 7, '#7d869c')
    ell(c, x + 7, y - 12, 4, 2.5, 0, '#6fbf9c')
    tri(c, [x, y - 17], [x - 6, y - 15], [x, y - 13], '#ffb347')
    dot(c, x + 4, y - 18, 1.8, '#ffffff')
    dot(c, x + 3.6, y - 18, 1, '#1d1b28')
    tri(c, [x + 30, y - 12], [x + 38, y - 16], [x + 36, y - 8], '#7d869c')
  }
}

/** Animation loop length (seconds) per obstacle; 0 means static. */
export const OBSTACLE_ANIM: Record<ObstacleType, { period: number; frames: number }> = {
  hydrant: { period: 0, frames: 1 },
  cone: { period: 0, frames: 1 },
  fence: { period: 0, frames: 1 },
  cat: { period: (Math.PI * 2) / 4, frames: 16 },
  pigeon: { period: (Math.PI * 2) / 22, frames: 6 },
}

export function bone(c: Ctx, x: number, y: number, s: number, fill: string, edge: string) {
  const knobs: [number, number][] = [
    [-9, -3.5],
    [-9, 3.5],
    [9, -3.5],
    [9, 3.5],
  ]
  c.save()
  c.translate(x, y)
  c.scale(s, s)
  c.fillStyle = edge
  rr(c, -9, -3.6, 18, 8, 3)
  c.fill()
  for (const [a, b] of knobs) dot(c, a, b + 0.8, 4.8, edge)
  c.fillStyle = fill
  rr(c, -9, -4.2, 18, 8, 3)
  c.fill()
  for (const [a, b] of knobs) dot(c, a, b, 4.4, fill)
  c.restore()
}

/** Biscuit centred on (x, y). Gold gets a glow; this is baked into the sprite cache. */
export function drawBiscuit(c: Ctx, x: number, y: number, gold: boolean) {
  c.save()
  if (gold) {
    c.shadowColor = '#ffd23f'
    c.shadowBlur = 14
  }
  bone(c, x, y, 1, gold ? '#ffd23f' : '#e3ad62', gold ? '#d99a00' : '#a8702f')
  c.restore()
}

export function drawGoldSparkle(c: Ctx, x: number, y: number, t: number) {
  sparkle(c, x + 12, y - 10, 4 + Math.sin(t * 8) * 1.5, '#ffffff', t * 2)
}
