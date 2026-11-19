/**
 * The world backgrounds (the first four ported from the prototype's drawBG).
 *
 * The prototype redrew every hill, building and window each frame. Here each parallax layer
 * is drawn once into a tileable strip (period P, items indexed by i mod n so it wraps) and
 * blitted at runtime, which keeps old iPhones at 60 fps.
 */
import type { ThemeKind } from '../config'
import { TAU, dot, ell, grad, hash, makeCanvas, rr, type Ctx } from './draw'

export interface ThemeColors {
  sky: [string, string, string]
  sun: string
  far: string
  far2: string
  mid: string
  ground: string
  dirt: string
  dirt2: string
}

export const THEMES: Record<ThemeKind, ThemeColors> = {
  park: {
    sky: ['#7ccbff', '#bfe8ff', '#e8f8ff'],
    sun: '#fff4b8',
    far: '#a8dc8f',
    far2: '#8fd07a',
    mid: '#4f9e4a',
    ground: '#7cc95b',
    dirt: '#d9a96b',
    dirt2: '#c8955a',
  },
  city: {
    sky: ['#ff8a6b', '#ffb38a', '#ffe0b5'],
    sun: '#fff0c8',
    far: '#a2648c',
    far2: '#7f4a78',
    mid: '#4e2d58',
    ground: '#b9b0c6',
    dirt: '#8f86a0',
    dirt2: '#7d7490',
  },
  beach: {
    sky: ['#4fc3ff', '#9fe0ff', '#fff4d9'],
    sun: '#fffbe0',
    far: '#2fa7d8',
    far2: '#58c4e8',
    mid: '#2e8a4f',
    ground: '#f6dc96',
    dirt: '#ecc678',
    dirt2: '#e0b768',
  },
  snow: {
    sky: ['#8fc4f2', '#c8e3fa', '#f2f8ff'],
    sun: '#fffbe8',
    far: '#b3c7e0',
    far2: '#d7e3f2',
    mid: '#3d6b58',
    ground: '#f4f8ff',
    dirt: '#e2ebf7',
    dirt2: '#c8d7ea',
  },
  night: {
    sky: ['#0b1233', '#1c2460', '#3a3584'],
    sun: '#f4f1d6',
    far: '#262b5c',
    far2: '#1b1f47',
    mid: '#121534',
    ground: '#454b70',
    dirt: '#2f3352',
    dirt2: '#282b47',
  },
}

/** Geometry the layers are drawn against (logical units). */
export interface Frame {
  W: number
  H: number
  GY: number
}

interface LayerDef {
  /** Parallax factor: 1 moves with the ground. */
  factor: number
  spacing: number
  /** Vertical extent relative to the ground line (negative is up). */
  top: (f: Frame) => number
  bottom: (f: Frame) => number
  item: (c: Ctx, x: number, i: number, f: Frame, T: ThemeColors) => void
}

const TARGET_PERIOD = 1200

/** Width of a baked strip for a layer with this item spacing (whole items, ~1200 wide). */
export function stripPeriod(spacing: number) {
  return Math.max(1, Math.ceil(TARGET_PERIOD / spacing)) * spacing
}

/** Street lamps: spacing and the lamp head's x within each item (night lighting uses it). */
export const LAMP_SPACING = 180
export const LAMP_X = 62

const buildingsFar: LayerDef = {
  factor: 0.15,
  spacing: 46,
  top: () => -252,
  bottom: () => 0,
  item: (c, x, i, f, T) => {
    const h = 90 + hash(i) * 160
    c.fillStyle = T.far
    c.fillRect(x, f.GY - h, 44, h)
  },
}

function buildingsNear(night: boolean): LayerDef {
  return {
    factor: 0.35,
    spacing: 60,
    top: () => -182,
    bottom: () => 0,
    item: (c, x, i, f, T) => {
      const h = 60 + hash(i + 11) * 120
      const w = 54
      c.fillStyle = T.far2
      c.fillRect(x, f.GY - h, w, h)
      for (let yy = f.GY - h + 10; yy < f.GY - 14; yy += 14)
        for (let xx = x + 8; xx < x + w - 8; xx += 12) {
          // Window lights hash on position within the building so the strip tiles.
          const on = hash(i * 31 + (xx - x) * 0.7 + (yy - f.GY) * 0.3) > (night ? 0.45 : 0.7)
          c.fillStyle = on ? (night ? '#ffd86b' : 'rgba(255,230,160,.8)') : 'rgba(0,0,0,.18)'
          c.fillRect(xx, yy, 6, 7)
        }
    },
  }
}

function lamps(night: boolean): LayerDef {
  return {
    factor: 1,
    spacing: LAMP_SPACING,
    top: () => -98,
    bottom: () => 0,
    item: (c, x, _i, f, T) => {
      const lx = x + LAMP_X
      c.fillStyle = T.mid
      c.fillRect(lx - 2, f.GY - 78, 5, 78)
      rr(c, lx - 12, f.GY - 84, 26, 8, 4)
      c.fill()
      dot(c, lx, f.GY - 74, 12, night ? 'rgba(255,220,120,.35)' : 'rgba(255,240,200,.25)')
      dot(c, lx, f.GY - 76, 4, '#fff0b0')
    },
  }
}

const roadMarks = (night: boolean): LayerDef[] => [
  {
    factor: 1,
    spacing: 60,
    top: () => 10,
    bottom: (f) => f.H - f.GY,
    item: (c, x, _i, f) => {
      c.fillStyle = 'rgba(0,0,0,.18)'
      c.fillRect(x, f.GY + 10, 2, f.H - f.GY)
    },
  },
  {
    factor: 1,
    spacing: 90,
    top: () => 40,
    bottom: () => 45,
    item: (c, x, _i, f) => {
      c.fillStyle = night ? '#f4d35e' : '#ffffff'
      c.fillRect(x, f.GY + 40, 44, 5)
    },
  },
]

const pebbles: LayerDef = {
  factor: 1,
  spacing: 46,
  top: () => 10,
  bottom: (f) => f.H - f.GY,
  item: (c, x, i, f, T) =>
    ell(
      c,
      x + hash(i) * 40,
      f.GY + 24 + hash(i + 1) * (f.H - f.GY - 40),
      3 + hash(i + 2) * 5,
      2 + hash(i + 3) * 2,
      0,
      T.dirt2,
    ),
}

const LAYERS: Record<ThemeKind, LayerDef[]> = {
  park: [
    {
      factor: 0.15,
      spacing: 260,
      top: () => -104,
      bottom: () => 0,
      item: (c, x, i, f, T) => ell(c, x + 130, f.GY + 10, 170, 60 + hash(i) * 50, 0, T.far),
    },
    {
      factor: 0.3,
      spacing: 200,
      top: () => -58,
      bottom: () => 0,
      item: (c, x, i, f, T) => ell(c, x + 100, f.GY + 20, 140, 40 + hash(i + 2) * 35, 0, T.far2),
    },
    {
      factor: 0.55,
      spacing: 150,
      top: () => -110,
      bottom: () => 0,
      item: (c, x, i, f, T) => {
        if (hash(i) < 0.35) return
        const h = 40 + hash(i + 1) * 30
        c.fillStyle = '#7a4a2a'
        c.fillRect(x + 70, f.GY - h, 8, h)
        dot(c, x + 74, f.GY - h - 10, 24, T.mid)
        dot(c, x + 58, f.GY - h + 2, 16, T.mid)
        dot(c, x + 90, f.GY - h + 2, 17, T.mid)
        dot(c, x + 66, f.GY - h - 16, 10, 'rgba(255,255,255,.12)')
      },
    },
  ],
  city: [buildingsFar, buildingsNear(false), lamps(false)],
  snow: [
    {
      // Far peaks with snowy tops.
      factor: 0.12,
      spacing: 230,
      top: () => -230,
      bottom: () => 0,
      item: (c, x, i, f, T) => {
        const h = 150 + hash(i) * 80
        const cx = x + 115
        c.fillStyle = T.far
        c.beginPath()
        c.moveTo(cx - 150, f.GY)
        c.lineTo(cx, f.GY - h)
        c.lineTo(cx + 150, f.GY)
        c.fill()
        c.fillStyle = '#ffffff'
        c.beginPath()
        c.moveTo(cx - 40, f.GY - h + h * 0.27)
        c.lineTo(cx, f.GY - h)
        c.lineTo(cx + 40, f.GY - h + h * 0.27)
        c.lineTo(cx + 20, f.GY - h + h * 0.22)
        c.lineTo(cx + 4, f.GY - h + h * 0.3)
        c.lineTo(cx - 14, f.GY - h + h * 0.22)
        c.fill()
      },
    },
    {
      // Rolling snowy hills.
      factor: 0.3,
      spacing: 200,
      top: () => -60,
      bottom: () => 0,
      item: (c, x, i, f, T) => ell(c, x + 100, f.GY + 20, 140, 40 + hash(i + 2) * 35, 0, T.far2),
    },
    {
      // Pines with snow on their branches.
      factor: 0.55,
      spacing: 120,
      top: () => -96,
      bottom: () => 0,
      item: (c, x, i, f, T) => {
        if (hash(i) < 0.3) return
        const h = 60 + hash(i + 1) * 30
        const cx = x + 60
        c.fillStyle = '#6b4a2e'
        c.fillRect(cx - 3, f.GY - 12, 6, 12)
        for (let k = 0; k < 3; k++) {
          const top = f.GY - h + k * (h / 4)
          const half = 12 + k * 7
          tri3(c, cx, top, half, h / 2.4, T.mid)
          c.fillStyle = '#ffffff'
          c.beginPath()
          c.moveTo(cx - half * 0.55, top + h / 4.2)
          c.lineTo(cx, top + 2)
          c.lineTo(cx + half * 0.55, top + h / 4.2)
          c.lineTo(cx, top + h / 6)
          c.fill()
        }
      },
    },
  ],
  night: [buildingsFar, buildingsNear(true), lamps(true)],
  beach: [
    {
      factor: 0.25,
      spacing: 40,
      top: () => -46,
      bottom: () => -40,
      item: (c, x, _i, f, T) => {
        c.fillStyle = T.far2
        c.beginPath()
        c.ellipse(x + 20, f.GY - 46, 22, 5, 0, 0, Math.PI)
        c.fill()
      },
    },
    {
      factor: 0.4,
      spacing: 70,
      top: () => -36,
      bottom: () => -8,
      item: (c, x, i, f) => {
        const y = f.GY - 30 + hash(i) * 20
        c.strokeStyle = 'rgba(255,255,255,.55)'
        c.lineWidth = 2
        c.beginPath()
        c.moveTo(x, y)
        c.quadraticCurveTo(x + 10, y - 4, x + 22, y)
        c.stroke()
      },
    },
    {
      factor: 0.6,
      spacing: 190,
      top: () => -142,
      bottom: () => 0,
      item: (c, x, i, f, T) => {
        if (hash(i) < 0.4) return
        const h = 70 + hash(i + 4) * 30
        c.strokeStyle = '#8a5a30'
        c.lineWidth = 7
        c.lineCap = 'round'
        c.beginPath()
        c.moveTo(x + 60, f.GY)
        c.quadraticCurveTo(x + 72, f.GY - h / 2, x + 66, f.GY - h)
        c.stroke()
        c.fillStyle = T.mid
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + (k - 2) * 0.65
          c.beginPath()
          c.ellipse(x + 66 + Math.cos(a) * 18, f.GY - h + Math.sin(a) * 12 + 6, 22, 6, a, 0, TAU)
          c.fill()
        }
        dot(c, x + 62, f.GY - h + 6, 4, '#6b3f1f')
        dot(c, x + 70, f.GY - h + 7, 4, '#6b3f1f')
      },
    },
  ],
}

const GROUND_LAYERS: Record<ThemeKind, LayerDef[]> = {
  park: [
    pebbles,
    {
      factor: 1,
      spacing: 38,
      top: () => -12,
      bottom: () => 0,
      item: (c, x, i, f) => {
        c.fillStyle = '#5fae45'
        c.beginPath()
        c.moveTo(x, f.GY)
        c.lineTo(x + 3, f.GY - 7 - hash(i) * 4)
        c.lineTo(x + 6, f.GY)
        c.fill()
      },
    },
  ],
  beach: [
    pebbles,
    {
      factor: 1,
      spacing: 130,
      top: () => 12,
      bottom: () => 24,
      item: (c, x, i, f) => {
        if (hash(i) < 0.5) return
        ell(c, x + 30, f.GY + 18, 5, 3.5, 0, '#ffb3a7')
        ell(c, x + 30, f.GY + 17, 3, 1.6, 0, '#ffd7cf')
      },
    },
  ],
  city: roadMarks(false),
  night: roadMarks(true),
  snow: [
    {
      // Snow lumps and blue shadows on the path.
      factor: 1,
      spacing: 46,
      top: () => 6,
      bottom: (f) => f.H - f.GY,
      item: (c, x, i, f) =>
        ell(
          c,
          x + hash(i) * 40,
          f.GY + 20 + hash(i + 1) * (f.H - f.GY - 36),
          4 + hash(i + 2) * 7,
          1.5 + hash(i + 3) * 2,
          0,
          'rgba(150,180,220,.35)',
        ),
    },
  ],
}

export interface Strip {
  cv: HTMLCanvasElement
  factor: number
  period: number
  top: number
  height: number
}

function buildStrip(def: LayerDef, f: Frame, T: ThemeColors, scale: number): Strip {
  const period = stripPeriod(def.spacing)
  const n = period / def.spacing
  const top = f.GY + def.top(f)
  const height = Math.max(1, def.bottom(f) - def.top(f))
  const { cv, c } = makeCanvas(period, height, scale)
  c.translate(0, -top)
  // Draw a few items either side so anything overhanging the edges wraps cleanly.
  for (let i = -3; i < n + 3; i++) def.item(c, i * def.spacing, ((i % n) + n) % n, f, T)
  return { cv, factor: def.factor, period, top, height }
}

export interface ThemeCache {
  kind: ThemeKind
  colors: ThemeColors
  sky: HTMLCanvasElement
  strips: Strip[]
  ground: Strip[]
  frame: Frame
}

export function buildTheme(kind: ThemeKind, f: Frame, scale: number): ThemeCache {
  const T = THEMES[kind]
  const { cv: sky, c } = makeCanvas(f.W, f.GY + 2, scale)
  c.fillStyle = grad(c, 0, 0, 0, f.GY, T.sky)
  c.fillRect(0, 0, f.W, f.GY + 2)
  if (kind === 'night') {
    for (let i = 0; i < 110; i++) {
      const x = hash(i) * f.W
      const y = hash(i + 99) * f.GY * 0.85
      c.globalAlpha = 0.35 + 0.65 * hash(i + 41)
      dot(c, x, y, hash(i + 7) > 0.85 ? 1.8 : 1, '#ffffff')
    }
    c.globalAlpha = 1
    dot(c, f.W * 0.76, f.GY * 0.3, 34, T.sun)
    dot(c, f.W * 0.76 + 11, f.GY * 0.3 - 7, 30, T.sky[1])
  } else {
    const sy = kind === 'city' ? f.GY * 0.66 : f.GY * 0.3
    const sr = kind === 'city' ? 52 : 34
    dot(c, f.W * 0.76, sy, sr * 1.6, 'rgba(255,255,255,.18)')
    dot(c, f.W * 0.76, sy, sr, T.sun)
  }
  if (kind === 'snow') {
    // Falling snow (still, baked into the sky).
    for (let i = 0; i < 70; i++)
      dot(c, hash(i + 3) * f.W, hash(i + 77) * f.GY, 1 + hash(i + 9) * 1.6, 'rgba(255,255,255,.85)')
  }
  if (kind === 'beach') {
    c.fillStyle = T.far
    c.fillRect(0, f.GY - 46, f.W, 48)
  }
  return {
    kind,
    colors: T,
    sky,
    frame: { ...f },
    strips: LAYERS[kind].map((d) => buildStrip(d, f, T, scale)),
    ground: GROUND_LAYERS[kind].map((d) => buildStrip(d, f, T, scale)),
  }
}

/** A triangle of pine needles: apex at (cx, top), `half` wide each side, `h` tall. */
function tri3(c: Ctx, cx: number, top: number, half: number, h: number, col: string) {
  c.fillStyle = col
  c.beginPath()
  c.moveTo(cx, top)
  c.lineTo(cx + half, top + h)
  c.lineTo(cx - half, top + h)
  c.fill()
}

function blitStrip(c: Ctx, s: Strip, dist: number, W: number) {
  const off = (dist * s.factor) % s.period
  for (let x = -off; x < W; x += s.period) c.drawImage(s.cv, x, s.top, s.period, s.height)
}

export function cloud(c: Ctx, x: number, y: number, s: number, col: string) {
  c.fillStyle = col
  const parts: [number, number, number][] = [
    [0, 0, 14],
    [16, -7, 18],
    [34, 0, 13],
    [17, 4, 15],
  ]
  for (const [dx, dy, r] of parts) {
    c.beginPath()
    c.arc(x + dx * s, y + dy * s, r * s, 0, TAU)
    c.fill()
  }
}

/** Draws a cached theme. `cloudSprite` is a pre-rendered cloud (see SpriteCache). */
export function drawTheme(
  c: Ctx,
  th: ThemeCache,
  dist: number,
  cloudSprite: { cv: HTMLCanvasElement; ox: number; oy: number; w: number; h: number } | null,
) {
  const { W, H, GY } = th.frame
  const T = th.colors
  c.drawImage(th.sky, 0, 0, W, GY + 2)
  if (th.kind !== 'night' && cloudSprite) {
    const off = dist * 0.06
    const sp = 240
    const start = Math.floor(off / sp) - 1
    const end = start + Math.ceil(W / sp) + 3
    for (let i = start; i < end; i++) {
      const s = 0.9 + hash(i + 5) * 0.7
      const x = i * sp - off + hash(i) * 80
      const y = GY * (0.14 + hash(i + 3) * 0.42)
      c.drawImage(
        cloudSprite.cv,
        x - cloudSprite.ox * s,
        y - cloudSprite.oy * s,
        cloudSprite.w * s,
        cloudSprite.h * s,
      )
    }
  }
  for (const s of th.strips) blitStrip(c, s, dist, W)
  c.fillStyle = T.dirt
  c.fillRect(0, GY, W, H - GY)
  c.fillStyle = T.ground
  c.fillRect(0, GY - 2, W, 12)
  c.fillStyle = 'rgba(255,255,255,.22)'
  c.fillRect(0, GY - 2, W, 3)
  for (const s of th.ground) blitStrip(c, s, dist, W)
}
