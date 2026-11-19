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

// ---- rooftop ledges --------------------------------------------------------------------

/** A low building whose roof is the ledge: tileable middle plus a left end (mirrored). */
export interface LedgeSprites {
  tile: HTMLCanvasElement
  cap: HTMLCanvasElement
  h: number
  scale: number
}

const LEDGE_TILE = 64
const LEDGE_CAP = 14
const LEDGE_PAD = 6 // above the roof line, for the outline
const LEDGE_LOOK: Record<string, { body: string; window: string; slab: string }> = {
  // Warm brick, so it stands out from the purple skyline behind it.
  city: { body: '#e08f6e', window: '#fff1c9', slab: '#8a3f4f' },
  night: { body: '#5a4a8c', window: '#ffd23f', slab: '#2a1f55' },
}
const PLUM = '#2a1530'

function ledgeBody(c: Ctx, x0: number, w: number, h: number, look: (typeof LEDGE_LOOK)[string]) {
  c.fillStyle = look.body
  c.fillRect(x0, 10, w, h - 10)
  c.fillStyle = look.window
  for (let y = 26; y < h - 14; y += 30)
    for (let x = x0 + 12; x < x0 + w - 8; x += 28) c.fillRect(x, y, 12, 14)
  // Roof slab: cream trim on top, dark band, plum outline top and bottom.
  c.fillStyle = look.slab
  c.fillRect(x0, -2, w, 12)
  c.fillStyle = '#fff1dc'
  c.fillRect(x0, -2, w, 4)
  c.fillStyle = PLUM
  c.fillRect(x0, -5, w, 3)
  c.fillRect(x0, 10, w, 2)
}

export function bakeLedge(theme: string, h: number, scale: number): LedgeSprites {
  const look = LEDGE_LOOK[theme] ?? { body: '#a99bbd', window: '#fff3c4', slab: '#5a4a70' }
  const t = makeCanvas(LEDGE_TILE, h + LEDGE_PAD, scale)
  t.c.translate(0, LEDGE_PAD)
  ledgeBody(t.c, 0, LEDGE_TILE, h, look)
  const k = makeCanvas(LEDGE_CAP, h + LEDGE_PAD, scale)
  k.c.translate(0, LEDGE_PAD)
  ledgeBody(k.c, 4, LEDGE_CAP - 4, h, { ...look, window: look.body })
  // The slab overhangs the wall a little; outline down the wall's edge.
  k.c.fillStyle = look.slab
  k.c.fillRect(0, -2, 4, 12)
  k.c.fillStyle = PLUM
  k.c.fillRect(0, -5, 4, 3)
  k.c.fillRect(0, -5, 2, 17)
  k.c.fillRect(4, 10, 2.5, h - 10)
  return { tile: t.cv, cap: k.cv, h, scale }
}

export function drawLedges(
  c: Ctx,
  sprites: (theme: string, h: number) => LedgeSprites,
  ledges: { wx0: number; wx1: number; h: number; theme: string }[],
  dist: number,
  GY: number,
  W: number,
) {
  for (const l of ledges) {
    const x0 = l.wx0 - dist
    const x1 = l.wx1 - dist
    if (x1 < -LEDGE_CAP || x0 > W + LEDGE_CAP) continue
    const s = sprites(l.theme, l.h)
    const y = GY - l.h - LEDGE_PAD
    const full = l.h + LEDGE_PAD
    const from = Math.max(x0, -LEDGE_TILE)
    const start = x0 + Math.floor((from - x0) / LEDGE_TILE) * LEDGE_TILE
    for (let x = start; x < Math.min(x1, W); x += LEDGE_TILE) {
      const tw = Math.min(LEDGE_TILE, x1 - x)
      c.drawImage(s.tile, 0, 0, tw * s.scale, full * s.scale, x, y, tw, full)
    }
    c.drawImage(s.cap, x0 - LEDGE_CAP + 4, y, LEDGE_CAP, full)
    c.save()
    c.translate(x1 + LEDGE_CAP - 4, y)
    c.scale(-1, 1)
    c.drawImage(s.cap, 0, 0, LEDGE_CAP, full)
    c.restore()
  }
}

// ---- ice patches (Snowy Peaks) --------------------------------------------------------

/** A glossy strip of ice along the path: tileable middle and a rounded end (mirrored). */
export interface IceSprites {
  tile: HTMLCanvasElement
  cap: HTMLCanvasElement
  scale: number
}

const ICE_TILE = 96
const ICE_CAP = 12
const ICE_TOP = 4 // above the ground line
const ICE_H = 16

function iceBody(c: Ctx, x0: number, w: number) {
  const g = c.createLinearGradient(0, -ICE_TOP, 0, ICE_H - ICE_TOP)
  g.addColorStop(0, '#f2fbff')
  g.addColorStop(0.4, '#bfe6fb')
  g.addColorStop(1, '#8cc9ee')
  c.fillStyle = g
  c.fillRect(x0, -ICE_TOP, w, ICE_H)
  // Shine streaks (spacing divides the tile width so it tiles).
  c.fillStyle = 'rgba(255,255,255,.9)'
  for (let x = x0 + 10; x < x0 + w; x += 32) {
    c.beginPath()
    c.moveTo(x, -ICE_TOP + 2)
    c.lineTo(x + 10, -ICE_TOP + 2)
    c.lineTo(x + 4, ICE_H - ICE_TOP - 3)
    c.lineTo(x - 6, ICE_H - ICE_TOP - 3)
    c.fill()
  }
  c.fillStyle = 'rgba(255,255,255,.95)'
  c.fillRect(x0, -ICE_TOP, w, 1.5)
}

export function bakeIce(scale: number): IceSprites {
  const t = makeCanvas(ICE_TILE, ICE_H, scale)
  t.c.translate(0, ICE_TOP)
  iceBody(t.c, 0, ICE_TILE)
  const k = makeCanvas(ICE_CAP, ICE_H, scale)
  k.c.translate(0, ICE_TOP)
  k.c.save()
  k.c.beginPath()
  k.c.ellipse(ICE_CAP, ICE_H / 2 - ICE_TOP, ICE_CAP, ICE_H / 2, 0, Math.PI / 2, Math.PI * 1.5)
  k.c.clip()
  iceBody(k.c, 0, ICE_CAP)
  k.c.restore()
  return { tile: t.cv, cap: k.cv, scale }
}

export function drawIce(
  c: Ctx,
  sp: IceSprites,
  patches: { wx0: number; wx1: number }[],
  dist: number,
  GY: number,
  W: number,
) {
  const y = GY - ICE_TOP
  for (const p of patches) {
    const x0 = p.wx0 - dist
    const x1 = p.wx1 - dist
    if (x1 < -ICE_CAP || x0 > W + ICE_CAP) continue
    for (let x = x0; x < Math.min(x1, W); x += ICE_TILE) {
      const tw = Math.min(ICE_TILE, x1 - x)
      c.drawImage(sp.tile, 0, 0, tw * sp.scale, ICE_H * sp.scale, x, y, tw, ICE_H)
    }
    c.drawImage(sp.cap, x0 - ICE_CAP, y, ICE_CAP, ICE_H)
    c.save()
    c.translate(x1 + ICE_CAP, y)
    c.scale(-1, 1)
    c.drawImage(sp.cap, 0, 0, ICE_CAP, ICE_H)
    c.restore()
  }
}
