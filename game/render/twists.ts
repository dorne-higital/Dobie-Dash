/**
 * World twists that need their own drawing: Sunny Beach waves and Midnight Run's
 * lamp-post lighting. Both are baked once into offscreen canvases; each frame only blits.
 */
import type { LampsTwist } from '../config'
import { LAMP_SPACING, LAMP_X, stripPeriod } from './backgrounds'
import { dot, ell, makeCanvas, TAU, type Ctx } from './draw'

// ---- waves -----------------------------------------------------------------------------

/** Tileable stretch of water across the path, anchored at the ground line. */
export interface WaveSprites {
  tile: HTMLCanvasElement
  cap: HTMLCanvasElement
  scale: number
}

const TILE_W = 120
const CAP_W = 30
const TOP = 14 // above the ground line
const BOTTOM = 22 // below it

function water(c: Ctx, x0: number, w: number) {
  const g = c.createLinearGradient(0, -TOP, 0, BOTTOM)
  g.addColorStop(0, 'rgba(120,214,255,.95)')
  g.addColorStop(0.35, 'rgba(58,170,232,.9)')
  g.addColorStop(1, 'rgba(36,124,196,.85)')
  c.fillStyle = g
  c.fillRect(x0, -6, w, BOTTOM + 6)
  // Foam scallops along the top (spacing divides the tile width so it tiles).
  for (let x = x0 + 7.5; x < x0 + w; x += 15) {
    dot(c, x, -6, 8, 'rgba(255,255,255,.95)')
    dot(c, x + 2, -3, 5, 'rgba(190,236,255,1)')
  }
  for (let x = x0 + 20; x < x0 + w; x += 40) ell(c, x, 8, 10, 1.6, 0, 'rgba(255,255,255,.45)')
}

export function bakeWaves(scale: number): WaveSprites {
  const t = makeCanvas(TILE_W, TOP + BOTTOM, scale)
  t.c.translate(0, TOP)
  water(t.c, 0, TILE_W)
  // Rounded front edge, drawn facing left; mirrored for the back edge.
  const k = makeCanvas(CAP_W, TOP + BOTTOM, scale)
  k.c.translate(0, TOP)
  k.c.save()
  k.c.beginPath()
  k.c.ellipse(CAP_W, 8, CAP_W, 16, 0, Math.PI / 2, Math.PI * 1.5)
  k.c.lineTo(CAP_W, BOTTOM)
  k.c.clip()
  water(k.c, 0, CAP_W)
  k.c.restore()
  dot(k.c, CAP_W - 4, -5, 8, 'rgba(255,255,255,.95)')
  return { tile: t.cv, cap: k.cv, scale }
}

export function drawWaves(
  c: Ctx,
  ws: WaveSprites,
  waves: { wx0: number; wx1: number }[],
  dist: number,
  GY: number,
  W: number,
  t: number,
) {
  const h = TOP + BOTTOM
  const y = GY - TOP + Math.sin(t * 3) * 1.5
  for (const w of waves) {
    const x0 = w.wx0 - dist
    const x1 = w.wx1 - dist
    if (x1 < -CAP_W || x0 > W + CAP_W) continue
    for (let x = x0; x < x1; x += TILE_W) {
      const tw = Math.min(TILE_W, x1 - x)
      c.drawImage(ws.tile, 0, 0, tw * ws.scale, h * ws.scale, x, y, tw, h)
    }
    c.drawImage(ws.cap, x0 - CAP_W, y, CAP_W, h)
    c.save()
    c.translate(x1 + CAP_W, y)
    c.scale(-1, 1)
    c.drawImage(ws.cap, 0, 0, CAP_W, h)
    c.restore()
  }
}

// ---- lamp-post lighting ----------------------------------------------------------------

export interface Darkness {
  cv: HTMLCanvasElement
  period: number
  W: number
  H: number
  key: string
}

/**
 * Darkness over the path with a pool of light under every street lamp. Same period and
 * parallax as the lamp layer, so the pools stay under the lamps. Baked at low resolution
 * because it's all soft gradients.
 */
export function bakeDarkness(tw: LampsTwist, W: number, H: number, GY: number): Darkness {
  const period = stripPeriod(LAMP_SPACING)
  const { cv, c } = makeCanvas(period, H, 0.5)
  const g = c.createLinearGradient(0, GY - 230, 0, GY - 120)
  g.addColorStop(0, 'rgba(8,6,30,0)')
  g.addColorStop(1, `rgba(8,6,30,${tw.darkness})`)
  c.fillStyle = g
  c.fillRect(0, 0, period, H)
  c.globalCompositeOperation = 'destination-out'
  for (let i = -1; i <= period / LAMP_SPACING; i++) {
    const lx = i * LAMP_SPACING + LAMP_X
    const r = c.createRadialGradient(lx, GY - 30, 0, lx, GY - 30, tw.pool)
    r.addColorStop(0, 'rgba(0,0,0,1)')
    r.addColorStop(0.55, 'rgba(0,0,0,.8)')
    r.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = r
    c.beginPath()
    c.arc(lx, GY - 30, tw.pool, 0, TAU)
    c.fill()
  }
  c.globalCompositeOperation = 'source-over'
  // A warm tint inside each pool.
  for (let i = -1; i <= period / LAMP_SPACING; i++) {
    const lx = i * LAMP_SPACING + LAMP_X
    const r = c.createRadialGradient(lx, GY - 20, 0, lx, GY - 20, tw.pool * 0.8)
    r.addColorStop(0, 'rgba(255,214,120,.18)')
    r.addColorStop(1, 'rgba(255,214,120,0)')
    c.fillStyle = r
    c.fillRect(lx - tw.pool, GY - 20 - tw.pool, tw.pool * 2, tw.pool * 2)
  }
  return { cv, period, W, H, key: `${W}x${H}x${GY}x${tw.darkness}x${tw.pool}` }
}

export function drawDarkness(c: Ctx, d: Darkness, dist: number, alpha: number) {
  const off = dist % d.period
  c.globalAlpha = alpha
  for (let x = -off; x < d.W; x += d.period) c.drawImage(d.cv, x, 0, d.period, d.H)
  c.globalAlpha = 1
}
