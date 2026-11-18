/** Small canvas helpers shared by every draw function (ported from the prototype). */
export type Ctx = CanvasRenderingContext2D

export const TAU = Math.PI * 2

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/** Stable pseudo-random 0..1 from an integer, used for scenery placement. */
export const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** Ease-out-back, used for banner pops. */
export const back = (x: number) => {
  const k = 1.7
  return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2)
}

export function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  if (c.roundRect) c.roundRect(x, y, w, h, r)
  else c.rect(x, y, w, h)
}

export function dot(c: Ctx, x: number, y: number, r: number, f: string) {
  c.fillStyle = f
  c.beginPath()
  c.arc(x, y, r, 0, TAU)
  c.fill()
}

export function ell(c: Ctx, x: number, y: number, rx: number, ry: number, rot: number, f: string) {
  c.fillStyle = f
  c.beginPath()
  c.ellipse(x, y, rx, ry, rot, 0, TAU)
  c.fill()
}

export type Pt = [number, number]
export function tri(c: Ctx, a: Pt, b: Pt, d: Pt, f: string) {
  c.fillStyle = f
  c.beginPath()
  c.moveTo(a[0], a[1])
  c.lineTo(b[0], b[1])
  c.lineTo(d[0], d[1])
  c.closePath()
  c.fill()
}

export function grad(c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: string[]) {
  const g = c.createLinearGradient(x0, y0, x1, y1)
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s))
  return g
}

export function sparkle(c: Ctx, x: number, y: number, r: number, col: string, rot = 0) {
  c.fillStyle = col
  c.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * Math.PI) / 4
    const q = i % 2 ? r * 0.32 : r
    c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q)
  }
  c.closePath()
  c.fill()
}

export const DISPLAY_FONT = '"Lilita One","Arial Rounded MT Bold",sans-serif'
export const BODY_FONT = '"Nunito",sans-serif'

export interface TextOpts {
  weight?: number | string
  font?: string
  align?: CanvasTextAlign
  base?: CanvasTextBaseline
  stroke?: string
  sw?: number
}

export function text(
  c: Ctx,
  str: string,
  x: number,
  y: number,
  size: number,
  col: string,
  o: TextOpts = {},
) {
  c.font = `${o.weight ?? ''} ${size}px ${o.font ?? DISPLAY_FONT}`
  c.textAlign = o.align ?? 'center'
  c.textBaseline = o.base ?? 'middle'
  if (o.stroke) {
    c.lineJoin = 'round'
    c.lineWidth = o.sw ?? size * 0.22
    c.strokeStyle = o.stroke
    c.strokeText(str, x, y)
  }
  c.fillStyle = col
  c.fillText(str, x, y)
}

/** Creates a canvas sized for `w × h` logical units at `scale` device px per unit. */
export function makeCanvas(w: number, h: number, scale: number) {
  const cv = document.createElement('canvas')
  cv.width = Math.max(1, Math.ceil(w * scale))
  cv.height = Math.max(1, Math.ceil(h * scale))
  const c = cv.getContext('2d')!
  c.scale(scale, scale)
  return { cv, c }
}
