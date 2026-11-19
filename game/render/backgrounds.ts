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
  moon: {
    sky: ['#05060f', '#0e1130', '#23264a'],
    sun: '#ffffff',
    far: '#3a3d55',
    far2: '#55587a',
    mid: '#6e7191',
    ground: '#a5a8bb',
    dirt: '#8c8fa3',
    dirt2: '#74778c',
  },
  haunted: {
    sky: ['#1a0f2e', '#3b1f5c', '#6b3f8a'],
    sun: '#f4f0d0',
    far: '#2a1a44',
    far2: '#3a2558',
    mid: '#24162f',
    ground: '#4a3a5c',
    dirt: '#2f2440',
    dirt2: '#3d3054',
  },
  site: {
    sky: ['#7cc0ee', '#b4dcf5', '#fde9c4'],
    sun: '#fff3c4',
    far: '#9fb2c6',
    far2: '#c7b49a',
    mid: '#f2a93b',
    ground: '#c99a5b',
    dirt: '#b5844a',
    dirt2: '#8f6535',
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
  moon: [
    {
      // Far grey mountains.
      factor: 0.12,
      spacing: 210,
      top: () => -120,
      bottom: () => 0,
      item: (c, x, i, f, T) => {
        const h = 70 + hash(i) * 50
        c.fillStyle = T.far
        c.beginPath()
        c.moveTo(x - 40, f.GY)
        c.lineTo(x + 70, f.GY - h)
        c.lineTo(x + 105, f.GY - h * 0.8)
        c.lineTo(x + 250, f.GY)
        c.fill()
      },
    },
    {
      // Rolling dusty hills with craters.
      factor: 0.3,
      spacing: 200,
      top: () => -60,
      bottom: () => 0,
      item: (c, x, i, f, T) => {
        ell(c, x + 100, f.GY + 20, 140, 40 + hash(i + 2) * 30, 0, T.far2)
        ell(c, x + 80, f.GY - 14, 16, 4, 0, 'rgba(0,0,0,.18)')
      },
    },
    {
      // A lander and a flag now and then, rocks otherwise.
      factor: 0.6,
      spacing: 160,
      top: () => -70,
      bottom: () => 0,
      item: (c, x, i, f, T) => {
        const k = hash(i)
        if (k > 0.82) {
          c.fillStyle = '#c9cfdb'
          c.fillRect(x + 60, f.GY - 30, 30, 18)
          c.fillStyle = '#ffc61a'
          c.fillRect(x + 56, f.GY - 14, 38, 6)
          c.strokeStyle = '#c9cfdb'
          c.lineWidth = 2.5
          c.beginPath()
          c.moveTo(x + 60, f.GY - 10)
          c.lineTo(x + 50, f.GY)
          c.moveTo(x + 90, f.GY - 10)
          c.lineTo(x + 100, f.GY)
          c.stroke()
          dot(c, x + 75, f.GY - 34, 6, '#9fd4f5')
        } else if (k > 0.66) {
          c.fillStyle = '#d8d8d8'
          c.fillRect(x + 70, f.GY - 56, 2, 56)
          c.fillStyle = '#ff4fa0'
          c.fillRect(x + 72, f.GY - 56, 22, 14)
          c.fillStyle = '#ffffff'
          c.beginPath()
          c.arc(x + 83, f.GY - 49, 4, 0, Math.PI * 2)
          c.fill()
        } else if (k > 0.25) {
          ell(c, x + 50, f.GY - 4, 10 + hash(i + 1) * 8, 6, 0, T.mid)
        }
      },
    },
  ],
  haunted: [
    {
      // Dark hills with a crooked house on some of them.
      factor: 0.15,
      spacing: 260,
      top: () => -150,
      bottom: () => 0,
      item: (c, x, i, f, T) => {
        ell(c, x + 130, f.GY + 10, 170, 60 + hash(i) * 40, 0, T.far)
        if (hash(i + 5) < 0.55) return
        const hx = x + 110
        const hy = f.GY - 60 - hash(i) * 30
        c.fillStyle = T.far2
        c.save()
        c.translate(hx, hy)
        c.rotate(-0.05)
        c.fillRect(-26, -40, 52, 42)
        c.beginPath()
        c.moveTo(-32, -40)
        c.lineTo(0, -70)
        c.lineTo(32, -40)
        c.fill()
        c.fillRect(12, -76, 8, 24)
        c.fillStyle = '#ffd86b'
        c.fillRect(-16, -30, 8, 9)
        c.fillRect(8, -30, 8, 9)
        c.fillRect(-4, -54, 7, 7)
        c.restore()
      },
    },
    {
      // Bare twisted trees.
      factor: 0.4,
      spacing: 170,
      top: () => -120,
      bottom: () => 0,
      item: (c, x, i, f, T) => {
        if (hash(i) < 0.35) return
        const cx = x + 80
        const h = 80 + hash(i + 1) * 30
        c.strokeStyle = T.mid
        c.lineCap = 'round'
        c.lineWidth = 8
        c.beginPath()
        c.moveTo(cx, f.GY)
        c.quadraticCurveTo(cx - 6, f.GY - h * 0.5, cx + 4, f.GY - h)
        c.stroke()
        c.lineWidth = 4
        for (const [a, b, d] of [
          [0.55, -1, 34],
          [0.7, 1, 30],
          [0.85, -1, 22],
          [0.4, 1, 26],
        ] as const) {
          const y = f.GY - h * a
          c.beginPath()
          c.moveTo(cx, y)
          c.quadraticCurveTo(cx + b * d * 0.6, y - 4, cx + b * d, y - 16)
          c.stroke()
        }
      },
    },
    {
      // Gravestones.
      factor: 0.7,
      spacing: 90,
      top: () => -34,
      bottom: () => 0,
      item: (c, x, i, f) => {
        const k = hash(i)
        // No background pumpkins: they'd look like the real ones you have to jump.
        if (k < 0.3) return
        const gx = x + 30 + hash(i + 2) * 30
        const h = 22 + hash(i + 3) * 10
        c.fillStyle = '#6b6280'
        rr(c, gx, f.GY - h, 18, h + 2, 8)
        c.fill()
        c.fillStyle = 'rgba(0,0,0,.25)'
        c.fillRect(gx + 5, f.GY - h + 8, 8, 2)
        c.fillRect(gx + 5, f.GY - h + 13, 8, 2)
      },
    },
  ],
  site: [
    buildingsFar,
    {
      // Tower cranes against the sky.
      factor: 0.25,
      spacing: 280,
      top: () => -250,
      bottom: () => 0,
      item: (c, x, i, f, T) => {
        if (hash(i) < 0.25) return
        const h = 190 + hash(i + 1) * 50
        const cx = x + 90
        c.strokeStyle = T.mid
        c.lineWidth = 2
        c.fillStyle = T.mid
        c.fillRect(cx - 5, f.GY - h, 10, h)
        for (let y = f.GY - h + 8; y < f.GY; y += 14) {
          c.beginPath()
          c.moveTo(cx - 5, y)
          c.lineTo(cx + 5, y + 7)
          c.stroke()
        }
        c.fillRect(cx - 60, f.GY - h - 6, 170, 6)
        c.fillRect(cx - 60, f.GY - h - 4, 22, 14)
        c.fillStyle = '#5a6272'
        c.fillRect(cx - 4, f.GY - h - 18, 8, 12)
        c.strokeStyle = '#3a3f4b'
        c.lineWidth = 1
        const hx = cx + 40 + hash(i + 2) * 60
        c.beginPath()
        c.moveTo(hx, f.GY - h)
        c.lineTo(hx, f.GY - h + 40 + hash(i + 3) * 40)
        c.stroke()
      },
    },
    {
      // Half-built frames: grey columns and floors.
      factor: 0.45,
      spacing: 170,
      top: () => -140,
      bottom: () => 0,
      item: (c, x, i, f) => {
        if (hash(i) < 0.3) return
        const floors = 2 + Math.floor(hash(i + 1) * 4)
        const w = 110
        c.fillStyle = '#a7adb8'
        for (let k = 0; k <= floors; k++) c.fillRect(x + 20, f.GY - k * 28 - 4, w, 4)
        for (let col = 0; col <= 3; col++)
          c.fillRect(x + 20 + col * (w / 3) - 2, f.GY - floors * 28, 5, floors * 28)
      },
    },
    {
      // Blue hoardings with warning stripes.
      factor: 0.7,
      spacing: 96,
      top: () => -40,
      bottom: () => 0,
      item: (c, x, i, f) => {
        c.fillStyle = '#2f6fb3'
        c.fillRect(x, f.GY - 36, 96, 36)
        c.fillStyle = '#ffc61a'
        c.fillRect(x, f.GY - 36, 96, 5)
        c.fillStyle = '#1d1b28'
        for (let k = 0; k < 96; k += 12) c.fillRect(x + k, f.GY - 36, 5, 5)
        c.fillStyle = 'rgba(0,0,0,.18)'
        c.fillRect(x + 94, f.GY - 31, 2, 31)
        if (hash(i) > 0.6) {
          c.fillStyle = '#ffffff'
          c.fillRect(x + 30, f.GY - 26, 36, 14)
          c.fillStyle = '#e5484d'
          c.fillRect(x + 33, f.GY - 21, 30, 4)
        }
      },
    },
  ],
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
  site: [pebbles],
  haunted: [pebbles],
  moon: [pebbles],
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
  if (kind === 'night' || kind === 'haunted' || kind === 'moon') {
    for (let i = 0; i < 110; i++) {
      const x = hash(i) * f.W
      const y = hash(i + 99) * f.GY * 0.85
      c.globalAlpha = 0.35 + 0.65 * hash(i + 41)
      dot(c, x, y, hash(i + 7) > 0.85 ? 1.8 : 1, '#ffffff')
    }
    c.globalAlpha = 1
    if (kind === 'moon') {
      // The Earth hanging in the sky.
      dot(c, f.W * 0.72, f.GY * 0.26, 46, 'rgba(120,180,255,.15)')
      dot(c, f.W * 0.72, f.GY * 0.26, 32, '#3d8be0')
      ell(c, f.W * 0.72 - 9, f.GY * 0.26 - 8, 12, 9, 0.4, '#5fbf4a')
      ell(c, f.W * 0.72 + 12, f.GY * 0.26 + 9, 9, 7, -0.3, '#5fbf4a')
      ell(c, f.W * 0.72 + 4, f.GY * 0.26 - 18, 14, 4, 0.1, 'rgba(255,255,255,.75)')
    } else if (kind === 'haunted') {
      // A big full moon with a glow (and a bat or two across it).
      dot(c, f.W * 0.7, f.GY * 0.28, 80, 'rgba(244,240,208,.12)')
      dot(c, f.W * 0.7, f.GY * 0.28, 48, T.sun)
      dot(c, f.W * 0.7 - 14, f.GY * 0.28 - 10, 8, 'rgba(0,0,0,.07)')
      dot(c, f.W * 0.7 + 16, f.GY * 0.28 + 12, 11, 'rgba(0,0,0,.06)')
    } else {
      dot(c, f.W * 0.76, f.GY * 0.3, 34, T.sun)
      dot(c, f.W * 0.76 + 11, f.GY * 0.3 - 7, 30, T.sky[1])
    }
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
  if (th.kind !== 'night' && th.kind !== 'haunted' && th.kind !== 'moon' && cloudSprite) {
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
