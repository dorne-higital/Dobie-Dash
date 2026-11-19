/**
 * Dobie Dash dog art: every breed, coat, ear style, tail and Closet item, drawn in code.
 * Ported from the plan page's DobieArt. Draws a dog with its feet at (0, 0), facing right.
 */
import { TAU, dot, ell, rr, sparkle, type Ctx } from '../render/draw'

const WH = '#f7f3ee'
export const C = {
  body: '#332e3d',
  dark: '#262230',
  tan: '#e8965a',
  nose: '#1d1824',
  tongue: '#ff7f9b',
  tongueD: '#e5607f',
  blush: 'rgba(255,120,150,.5)',
  inner: '#6a4a55',
  collar: '#e5484d',
  tag: '#ffd23f',
}

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export function mix(a: string, b: string, t: number) {
  const A = rgb(a)
  const B = rgb(b)
  return (
    '#' +
    A.map((v, i) =>
      Math.round(v + (B[i]! - v) * t)
        .toString(16)
        .padStart(2, '0'),
    ).join('')
  )
}
const dk = (c: string, t: number) => mix(c, '#1a1420', t)
const lt = (c: string, t: number) => mix(c, '#ffffff', t)

export interface CoatParts {
  base: string
  muzzle?: string
  chest?: string
  paws?: string
  belly?: string
  brow?: string | null
  blaze?: string
  tailTip?: string
  bib?: string
  mask?: string
  legLow?: string
  spots?: string
  earCol?: string
  patch?: string
  nose?: string
  shade?: string
}
export type Coat = CoatParts & { nose: string; shade: string }

/* ---- coat patterns ---- */
const PAT = {
  points: (b: string, m: string): CoatParts => ({
    base: b,
    muzzle: m,
    chest: m,
    paws: m,
    belly: mix(b, m, 0.55),
    brow: m,
  }),
  solid: (b: string): CoatParts => ({
    base: b,
    muzzle: lt(b, 0.16),
    chest: lt(b, 0.08),
    paws: b,
    belly: lt(b, 0.12),
  }),
  tux: (b: string): CoatParts => ({
    base: b,
    muzzle: WH,
    chest: WH,
    paws: WH,
    blaze: WH,
    tailTip: WH,
    belly: WH,
    bib: WH,
  }),
  mask: (b: string): CoatParts => ({
    base: b,
    mask: WH,
    muzzle: WH,
    chest: WH,
    paws: WH,
    legLow: WH,
    belly: WH,
    brow: WH,
    tailTip: WH,
    bib: WH,
  }),
  spots: (b: string, s: string): CoatParts => ({
    base: b,
    spots: s,
    earCol: s,
    muzzle: b,
    paws: b,
    belly: b,
  }),
  patch: (p: string, br?: string): CoatParts => ({
    base: WH,
    patch: p,
    earCol: p,
    muzzle: WH,
    paws: WH,
    brow: br ?? null,
  }),
  faceMask: (b: string, m: string): CoatParts => ({
    base: b,
    muzzle: m,
    chest: lt(b, 0.2),
    paws: b,
    belly: lt(b, 0.15),
    earCol: dk(b, 0.3),
  }),
  saddle: (b: string): CoatParts => ({
    base: b,
    muzzle: WH,
    chest: WH,
    paws: WH,
    blaze: WH,
    belly: WH,
    legLow: WH,
    bib: WH,
  }),
}
const coat = (o: CoatParts): Coat =>
  Object.assign({ nose: '#1d1824' }, o, { shade: o.shade || dk(o.base, 0.22) }) as Coat
const ext = (o: CoatParts, more: Partial<CoatParts>): CoatParts => Object.assign(o, more)

export type EarStyle = 'down' | 'long' | 'up' | 'pointy' | 'fold' | 'bat' | 'mixed'
export type TailStyle = 'up' | 'curl' | 'stub' | 'long' | 'feather' | 'otter'
export type EyeColour = 'brown' | 'amber' | 'blue' | 'green'

interface ShapeIn {
  hr?: number
  brx?: number
  bry?: number
  L?: number
  lw?: number
  snout?: number
  neck?: number
  bounce?: number
  tilt?: number
  earScale?: number
}
interface Breed {
  name: string
  shape: ShapeIn
  ears: EarStyle
  tail: TailStyle
  eye?: EyeColour
  coats: [string, CoatParts][]
}

/* ---- breeds ---- */
export const BREEDS: Record<string, Breed> = {
  doberman: {
    name: 'Doberman',
    shape: {},
    ears: 'down',
    tail: 'up',
    coats: [
      ['Black & tan', PAT.points('#332e3d', '#e8965a')],
      ['Red & tan', PAT.points('#7a3f2a', '#e3a06a')],
      ['Blue & tan', PAT.points('#6f7487', '#e3a06a')],
      ['Fawn', PAT.points('#a8876e', '#ebc39a')],
    ],
  },
  lab: {
    name: 'Labrador',
    shape: { bry: 15, lw: 8.5 },
    ears: 'down',
    tail: 'otter',
    coats: [
      ['Yellow', PAT.solid('#e9c27a')],
      ['Chocolate', PAT.solid('#6b4430')],
      ['Black', PAT.solid('#2e2a33')],
    ],
  },
  golden: {
    name: 'Golden Retriever',
    shape: { bry: 15 },
    ears: 'down',
    tail: 'feather',
    coats: [
      ['Golden', PAT.solid('#d99a4e')],
      ['Cream', PAT.solid('#ecd2a4')],
      ['Red', PAT.solid('#b8662f')],
    ],
  },
  spaniel: {
    name: 'Cocker Spaniel',
    shape: { L: 14, brx: 23 },
    ears: 'long',
    tail: 'stub',
    coats: [
      ['Golden', PAT.solid('#c98a4b')],
      ['Black', PAT.solid('#2e2a33')],
      ['Blue roan', PAT.spots('#a7adb9', '#2e2a33')],
    ],
  },
  collie: {
    name: 'Border Collie',
    shape: { snout: 1.15 },
    ears: 'fold',
    tail: 'feather',
    coats: [
      ['Black & white', PAT.tux('#2b2731')],
      ['Red & white', PAT.tux('#8a4b2d')],
      ['Merle', ext(PAT.tux('#9aa0ae'), { spots: '#2e2a33' })],
    ],
  },
  husky: {
    name: 'Husky',
    shape: { bry: 14.5 },
    ears: 'pointy',
    tail: 'curl',
    eye: 'blue',
    coats: [
      ['Grey', PAT.mask('#6f7787')],
      ['Black', PAT.mask('#2e2a33')],
      ['Red', PAT.mask('#b06a3a')],
    ],
  },
  corgi: {
    name: 'Corgi',
    shape: { L: 9, lw: 9, brx: 28, bry: 13.5, hr: 17.5, earScale: 1.15 },
    ears: 'pointy',
    tail: 'stub',
    coats: [
      ['Red', PAT.saddle('#e0913f')],
      ['Sable', PAT.saddle('#b07a45')],
      ['Tricolour', ext(PAT.saddle('#2e2a33'), { brow: '#e0913f' })],
    ],
  },
  dachshund: {
    name: 'Dachshund',
    shape: { L: 8, lw: 8, brx: 31, bry: 12, hr: 16, snout: 1.2 },
    ears: 'long',
    tail: 'up',
    coats: [
      ['Red', PAT.solid('#b5652b')],
      ['Black & tan', PAT.points('#2e2a33', '#d9894a')],
      ['Dapple', PAT.spots('#6b4430', '#c9a080')],
    ],
  },
  dalmatian: {
    name: 'Dalmatian',
    shape: { L: 19, lw: 7.5 },
    ears: 'down',
    tail: 'long',
    coats: [
      ['Black spots', PAT.spots(WH, '#2b2731')],
      ['Liver spots', PAT.spots(WH, '#7a4a2a')],
      ['Lemon spots', PAT.spots(WH, '#c99a4a')],
    ],
  },
  frenchie: {
    name: 'French Bulldog',
    shape: { hr: 19.5, snout: 0.62, brx: 21, bry: 14.5, L: 11, lw: 9, neck: -2 },
    ears: 'bat',
    tail: 'stub',
    coats: [
      ['Fawn', PAT.faceMask('#d8b48a', '#4a3b33')],
      ['Brindle', PAT.faceMask('#4a3b33', '#2a2228')],
      ['Cream', PAT.solid('#efe1c8')],
    ],
  },
  greyhound: {
    name: 'Greyhound',
    shape: { L: 23, lw: 6.5, brx: 26, bry: 11, hr: 15, snout: 1.35, neck: 6, bounce: 3 },
    ears: 'fold',
    tail: 'long',
    coats: [
      ['Grey', PAT.solid('#8c8a99')],
      ['Fawn', PAT.solid('#c9a37a')],
      ['Black', ext(PAT.solid('#2e2a33'), { chest: WH, bib: WH })],
    ],
  },
  jack: {
    name: 'Jack Russell',
    shape: { L: 14, brx: 22, bry: 13 },
    ears: 'fold',
    tail: 'up',
    coats: [
      ['Tan patches', PAT.patch('#c98a4b')],
      ['Black patches', PAT.patch('#2e2a33')],
      ['Tricolour', PAT.patch('#2e2a33', '#c98a4b')],
    ],
  },
}

export const EARS: [EarStyle, string][] = [
  ['down', 'Floppy'],
  ['long', 'Long'],
  ['up', 'Perky'],
  ['pointy', 'Pointy'],
  ['fold', 'Folded'],
  ['bat', 'Bat'],
]
export const TAILS: [TailStyle, string][] = [
  ['up', 'Waggy'],
  ['curl', 'Curly'],
  ['stub', 'Stubby'],
  ['long', 'Long'],
  ['feather', 'Feathery'],
  ['otter', 'Otter'],
]
export const EYES: [EyeColour, string, string][] = [
  ['brown', 'Brown', '#3b2416'],
  ['amber', 'Amber', '#c8822e'],
  ['blue', 'Blue', '#5fb7f2'],
  ['green', 'Green', '#5aa86a'],
]

export interface Dog {
  hr: number
  brx: number
  bry: number
  L: number
  lw: number
  snout: number
  neck: number
  bounce: number
  tilt: number
  earScale: number
  hipY: number
  by: number
  hipF: number
  hipB: number
  hx: number
  hy: number
  breed: string
  ears: EarStyle
  tail: TailStyle
  eye: EyeColour
  coat: Coat
  coatName: string
  tongue?: boolean | 'big'
}

function shape(o: ShapeIn) {
  const s = Object.assign(
    {
      hr: 17,
      brx: 25,
      bry: 14,
      L: 17,
      lw: 8,
      snout: 1,
      neck: 0,
      bounce: 2.5,
      tilt: 0,
      earScale: 1,
    },
    o,
  )
  const hipY = -3 - s.L
  const by = hipY - 0.55 * s.bry
  return {
    ...s,
    hipY,
    by,
    hipF: s.brx * 0.6,
    hipB: -s.brx * 0.56,
    hx: s.brx + 3,
    hy: by - 22 * (s.hr / 17) - s.neck,
  }
}

export interface DogOptions {
  coat?: number
  ears?: EarStyle
  tail?: TailStyle
  eye?: EyeColour
}

export function makeDog(key: string, o: DogOptions = {}): Dog {
  const b = BREEDS[key] ?? BREEDS.doberman!
  const ci = Math.min(o.coat ?? 0, b.coats.length - 1)
  const [coatName, parts] = b.coats[ci]!
  return {
    ...shape(b.shape),
    breed: key,
    ears: o.ears ?? b.ears,
    tail: o.tail ?? b.tail,
    eye: o.eye ?? b.eye ?? 'brown',
    coat: coat(parts),
    coatName,
  }
}

/** The default dog: Dobie, a black-and-tan Doberman with floppy ears and a red collar. */
export const DOBIE = makeDog('doberman')

export interface Accessories {
  collar?: string
  gold?: boolean
  neck?: 'bowtie' | 'bandana'
  bandana?: boolean
  eyes?: 'specs' | 'shades'
  shades?: boolean
  hat?: 'party' | 'beanie' | 'crown' | 'bobble' | 'hardhat' | 'witch' | 'helmet'
  crown?: boolean
  cape?: boolean
  back?: 'cape'
}

export type Pose = 'run' | 'jump' | 'dizzy' | 'idle' | 'icon' | 'sit'

/* ---- ears (head space, head radius 17) ---- */
function earDown(c: Ctx, x: number, y: number, r: number, col: string) {
  c.save()
  c.translate(x, y)
  c.rotate(r)
  c.fillStyle = col
  c.beginPath()
  c.moveTo(-5, -1)
  c.bezierCurveTo(-10, 7, -9, 19, -2, 23)
  c.bezierCurveTo(4, 26, 8, 19, 6.5, 9)
  c.bezierCurveTo(5.5, 3, 3, -1, 0, -3)
  c.closePath()
  c.fill()
  c.fillStyle = 'rgba(255,255,255,.07)'
  c.beginPath()
  c.ellipse(1, 7, 2.2, 7, 0.1, 0, TAU)
  c.fill()
  c.restore()
}
function earLong(c: Ctx, x: number, y: number, r: number, col: string) {
  c.save()
  c.translate(x, y)
  c.rotate(r)
  c.fillStyle = col
  c.beginPath()
  c.moveTo(-5, -1)
  c.bezierCurveTo(-12, 8, -12, 26, -5, 31)
  c.quadraticCurveTo(-2, 34, 1, 31)
  c.quadraticCurveTo(4, 34, 7, 30)
  c.bezierCurveTo(10, 20, 8, 6, 0, -3)
  c.closePath()
  c.fill()
  c.strokeStyle = 'rgba(255,255,255,.1)'
  c.lineWidth = 1.4
  c.beginPath()
  c.moveTo(-2, 8)
  c.quadraticCurveTo(-5, 18, -2, 26)
  c.moveTo(3, 8)
  c.quadraticCurveTo(2, 18, 4, 26)
  c.stroke()
  c.restore()
}
function earUp(c: Ctx, x: number, y: number, r: number, col: string, s = 1) {
  c.save()
  c.translate(x, y)
  c.rotate(r)
  c.scale(s, s)
  c.fillStyle = col
  c.beginPath()
  c.moveTo(-6.5, 3)
  c.bezierCurveTo(-8.5, -8, -5, -20, 0, -23)
  c.bezierCurveTo(5, -21, 9, -10, 7, 3)
  c.closePath()
  c.fill()
  c.fillStyle = C.inner
  c.beginPath()
  c.moveTo(-2.8, 1)
  c.bezierCurveTo(-4, -7, -2, -14, 0.2, -16.5)
  c.bezierCurveTo(2.6, -14, 4.6, -7, 3.4, 1)
  c.closePath()
  c.fill()
  c.restore()
}
function earPointy(c: Ctx, x: number, y: number, r: number, col: string, s = 1) {
  c.save()
  c.translate(x, y)
  c.rotate(r)
  c.scale(s, s)
  c.fillStyle = col
  c.beginPath()
  c.moveTo(-6, 3)
  c.quadraticCurveTo(-4.5, -10, -0.9, -21.5)
  c.quadraticCurveTo(0.3, -24, 1.6, -21.5)
  c.quadraticCurveTo(6, -9, 7, 3)
  c.closePath()
  c.fill()
  c.fillStyle = C.inner
  c.beginPath()
  c.moveTo(-2.4, 1)
  c.quadraticCurveTo(-1.6, -8, 0.3, -16)
  c.quadraticCurveTo(2.6, -8, 3.4, 1)
  c.closePath()
  c.fill()
  c.restore()
}
function earBat(c: Ctx, x: number, y: number, r: number, col: string) {
  c.save()
  c.translate(x, y)
  c.rotate(r)
  c.fillStyle = col
  c.beginPath()
  c.moveTo(-7, 3)
  c.bezierCurveTo(-13, -8, -9, -24, 0, -25)
  c.bezierCurveTo(9, -24, 12, -8, 7, 3)
  c.closePath()
  c.fill()
  c.fillStyle = C.inner
  c.beginPath()
  c.moveTo(-3.5, 1)
  c.bezierCurveTo(-7, -7, -5, -18, 0, -19)
  c.bezierCurveTo(5, -18, 7, -7, 3.5, 1)
  c.closePath()
  c.fill()
  c.restore()
}
function earFold(c: Ctx, x: number, y: number, r: number, col: string) {
  c.save()
  c.translate(x, y)
  c.rotate(r)
  c.fillStyle = col
  c.beginPath()
  c.moveTo(-6, 3)
  c.lineTo(-2.5, -13)
  c.lineTo(7, 3)
  c.closePath()
  c.fill()
  c.fillStyle = dk(col, 0.18)
  c.beginPath()
  c.moveTo(-3.2, -13.5)
  c.quadraticCurveTo(4, -16, 9.5, -8.5)
  c.lineTo(3, -6)
  c.closePath()
  c.fill()
  c.restore()
}

/* ---- head ---- */
export function head(
  c: Ctx,
  v: Dog,
  pose: Pose,
  t: number,
  ph: number,
  run: number,
  acc: Accessories = {},
) {
  const K = v.coat
  const E = v.ears
  const es = v.earScale
  const dz = pose === 'dizzy'
  const air = pose === 'jump'
  const still = pose === 'idle' || pose === 'icon'
  const sw = still ? Math.sin(t * 2 + ph) * 0.05 : Math.sin(run) * 0.12
  const earB = K.earCol || K.shade
  const earF = K.earCol || K.base
  if (E === 'pointy') earPointy(c, 6, -14, 0.32 + sw * 0.6, earB, es)
  else if (E === 'up' || E === 'mixed') earUp(c, 6, -14, 0.3 + sw, earB, es)
  else if (E === 'bat') earBat(c, 8, -12, 0.4 + sw * 0.4, earB)
  else if (E === 'fold') earFold(c, 6, -14, 0.28 + sw * 0.5, earB)
  dot(c, 0, 0, 17, K.base)
  c.save()
  c.beginPath()
  c.arc(0, 0, 17, 0, TAU)
  c.clip()
  if (K.patch) ell(c, -5, -7, 12, 11, 0, K.patch)
  if (K.spots) {
    const sp: [number, number, number][] = [
      [-8, -8, 2.4],
      [2, -13, 1.8],
      [-11, 3, 2],
      [-2, 7, 1.5],
      [8, -12, 1.3],
    ]
    for (const [a, b, r] of sp) dot(c, a, b, r, K.spots)
  }
  if (K.mask) {
    ell(c, 6, 10, 18, 10, -0.2, K.mask)
    ell(c, 5, -4, 7.5, 6.5, 0, K.mask)
  }
  c.restore()
  dot(c, -5, -6, 8, 'rgba(255,255,255,.06)')
  if (K.blaze) ell(c, 8, -7, 2.6, 8.5, -0.75, K.blaze)
  const sn = v.snout
  const mx = 13 + (sn - 1) * 6
  const mrx = 11 * sn
  const nx = mx + mrx - 2
  if (v.tongue !== false || dz) {
    const big = v.tongue === 'big' && !dz
    const w = still || dz ? 0 : Math.sin(t * 20 + ph) * 1.2
    const ty = (big ? 14 : 12) + w
    ell(c, mx + 3, ty, big ? 4.4 : 3.4, big ? 8 : 5.5, 0.15, C.tongue)
    ell(c, mx + 3.5, ty + 1, 0.8, big ? 4 : 3, 0.15, C.tongueD)
  }
  ell(c, mx, 5, mrx, 8.5, 0.1, K.muzzle || K.base)
  ell(c, nx, 1.5, 4.6, 3.6, 0, K.nose)
  dot(c, nx - 1.4, 0.3, 1.2, 'rgba(255,255,255,.7)')
  c.strokeStyle = K.nose
  c.lineWidth = 1.6
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(mx - 1, 9)
  c.quadraticCurveTo(mx + 4, 12.8, nx - 0.5, 8.6)
  c.stroke()
  ell(c, mx - 4.5, 7, 3.8, 2.4, 0, C.blush)
  if (K.brow) dot(c, 3, -11.5, 2.6, K.brow)
  const blink = !dz && pose !== 'icon' && (t + ph) % 3.7 < 0.13
  const iris = (EYES.find((e) => e[0] === v.eye) ?? EYES[0]!)[2]
  const lightCoat = K.base === WH || !!K.mask
  c.strokeStyle = lightCoat ? '#2a1530' : '#fff'
  c.lineWidth = 1.8
  if (dz) {
    c.lineWidth = 1.4
    c.strokeStyle = '#fff'
    c.beginPath()
    for (let a = 0; a < 3 * Math.PI; a += 0.25) {
      const r = a * 0.55
      c.lineTo(5 + Math.cos(a + t * 6) * r, -4 + Math.sin(a + t * 6) * r)
    }
    if (lightCoat) c.strokeStyle = '#2a1530'
    c.stroke()
  } else if (blink) {
    c.beginPath()
    c.arc(5, -2.5, 4, Math.PI * 1.15, Math.PI * 1.85)
    c.stroke()
  } else {
    dot(c, 5, -4, 5.2, '#fff')
    dot(c, 6.6, -3.6, 3.6, iris)
    if (v.eye !== 'brown') dot(c, 6.9, -3.6, 1.9, '#1d1824')
    dot(c, 5.4, -5.3, 1.4, '#fff')
  }
  c.strokeStyle = acc.collar || (acc.gold ? '#ffc61a' : C.collar)
  c.lineWidth = 4.5
  c.beginPath()
  c.arc(0, 0, 17.6, 1.75, 2.6)
  c.stroke()
  dot(c, -7.5, 20.5, 2.8, C.tag)
  if (acc.neck === 'bowtie') {
    c.fillStyle = '#3a86f0'
    c.beginPath()
    c.moveTo(-3, 19)
    c.lineTo(-11, 14)
    c.lineTo(-10, 25)
    c.closePath()
    c.moveTo(-3, 19)
    c.lineTo(5, 15)
    c.lineTo(4, 26)
    c.closePath()
    c.fill()
    dot(c, -3, 19.5, 2.6, '#2563c9')
  }
  if (acc.bandana || acc.neck === 'bandana') {
    c.fillStyle = '#e5484d'
    c.beginPath()
    c.moveTo(-14, 11)
    c.lineTo(4, 18.5)
    c.lineTo(-7, 28)
    c.closePath()
    c.fill()
    dot(c, -7, 16, 1.3, '#fff')
    dot(c, -3, 19, 1.3, '#fff')
    dot(c, -7, 22, 1.3, '#fff')
  }
  if (E === 'pointy') earPointy(c, -3, -13, -0.1 + sw * 0.5, earF, es)
  else if (E === 'up') earUp(c, -3, -13, -0.18 + sw * 0.6, earF, es)
  else if (E === 'bat') earBat(c, -4, -12, -0.2 + sw * 0.4, earF)
  else if (E === 'fold') earFold(c, -3, -13, -0.12 + sw * 0.5, earF)
  else {
    const long = E === 'long'
    const mixed = E === 'mixed'
    let r: number
    if (air) r = long ? 1.0 : 1.25
    else if (dz) r = -0.05
    else if (still) r = 0.12 + Math.sin(t * 2 + ph) * 0.05
    else r = (mixed ? 0.5 : long ? 0.22 : 0.32) + Math.sin(run) * (mixed ? 0.35 : long ? 0.1 : 0.14)
    ;(long ? earLong : earDown)(c, -7, -11, r, K.earCol || K.shade)
  }
  if (acc.eyes === 'specs') {
    c.strokeStyle = '#2a1530'
    c.lineWidth = 1.6
    c.beginPath()
    c.arc(5, -4, 6.4, 0, TAU)
    c.stroke()
    c.beginPath()
    c.moveTo(-1.4, -5)
    c.lineTo(-11, -8)
    c.stroke()
  }
  if (acc.shades || acc.eyes === 'shades') {
    c.fillStyle = '#111'
    rr(c, -1.5, -9, 14, 9, 3.5)
    c.fill()
    c.strokeStyle = '#111'
    c.lineWidth = 1.6
    c.beginPath()
    c.moveTo(-1, -6)
    c.lineTo(-11, -8)
    c.stroke()
    c.fillStyle = 'rgba(255,255,255,.5)'
    c.fillRect(1.5, -7.5, 4, 1.5)
  }
  if (acc.hat === 'party') {
    c.fillStyle = '#8a5cf6'
    c.beginPath()
    c.moveTo(-8, -13)
    c.lineTo(1, -36)
    c.lineTo(9, -14)
    c.closePath()
    c.fill()
    dot(c, 1, -36, 3, '#ffd23f')
    dot(c, -1, -22, 1.8, '#ff4fa0')
    dot(c, 3, -27, 1.6, '#ffd23f')
    dot(c, 4, -18, 1.8, '#2fd0c0')
  }
  if (acc.hat === 'beanie') {
    c.fillStyle = '#2fbf71'
    c.beginPath()
    c.arc(0, -8, 16.5, Math.PI * 1.02, Math.PI * 1.98)
    c.closePath()
    c.fill()
    c.fillStyle = '#24a35e'
    rr(c, -17, -11, 34, 6, 3)
    c.fill()
    dot(c, 0, -25, 4.5, '#fff8ee')
  }
  if (acc.hat === 'bobble') {
    // Snowy Peaks reward: a striped woolly hat with a big pompom.
    c.fillStyle = '#e5484d'
    c.beginPath()
    c.arc(0, -8, 16.5, Math.PI * 1.02, Math.PI * 1.98)
    c.closePath()
    c.fill()
    c.fillStyle = '#fff8ee'
    c.fillRect(-15, -17, 30, 3)
    c.fillRect(-11, -22, 22, 2.5)
    c.fillStyle = '#c93a3f'
    rr(c, -17, -11, 34, 6, 3)
    c.fill()
    dot(c, 0, -26, 6, '#fff8ee')
    dot(c, -2, -28, 2.2, '#ffffff')
  }
  if (acc.hat === 'hardhat') {
    // Building Site reward: a yellow hard hat with a ridge and brim.
    c.fillStyle = '#ffc61a'
    c.beginPath()
    c.arc(0, -10, 15, Math.PI, Math.PI * 2)
    c.closePath()
    c.fill()
    c.fillStyle = '#e8a800'
    rr(c, -19, -12, 38, 5, 2.5)
    c.fill()
    rr(c, -2.5, -25, 5, 14, 2)
    c.fill()
    c.fillStyle = 'rgba(255,255,255,.45)'
    rr(c, -10, -21, 5, 7, 2)
    c.fill()
  }
  if (acc.hat === 'witch') {
    // Haunted Hollow reward: a floppy witch hat with a purple band and buckle.
    c.fillStyle = '#2e2440'
    c.beginPath()
    c.moveTo(-10, -14)
    c.quadraticCurveTo(-2, -30, 8, -42)
    c.quadraticCurveTo(14, -38, 12, -34)
    c.quadraticCurveTo(8, -26, 11, -14)
    c.closePath()
    c.fill()
    ell(c, 0, -13, 20, 4.5, 0, '#2e2440')
    c.fillStyle = '#8a5cf6'
    rr(c, -10, -19, 21, 5, 2)
    c.fill()
    c.strokeStyle = '#ffd23f'
    c.lineWidth = 1.5
    c.strokeRect(-1, -19, 5, 5)
  }
  if (acc.hat === 'helmet') {
    // Moon Walkies reward: a glass space helmet over the whole head, with a little aerial.
    c.strokeStyle = '#2a1530'
    c.lineWidth = 1.5
    c.beginPath()
    c.moveTo(-8, -24)
    c.lineTo(-11, -33)
    c.stroke()
    dot(c, -11, -34, 2.6, '#e5484d')
    c.fillStyle = 'rgba(190,225,255,.22)'
    c.beginPath()
    c.arc(1, -2, 24, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = 'rgba(255,255,255,.85)'
    c.lineWidth = 2.2
    c.stroke()
    c.strokeStyle = 'rgba(255,255,255,.9)'
    c.lineWidth = 2.5
    c.beginPath()
    c.arc(1, -2, 18, Math.PI * 1.15, Math.PI * 1.45)
    c.stroke()
    c.fillStyle = '#c3cad8'
    rr(c, -14, 18, 30, 6, 3)
    c.fill()
  }
  if (acc.crown || acc.hat === 'crown') {
    c.fillStyle = '#ffc61a'
    c.beginPath()
    c.moveTo(-9, -14)
    c.lineTo(-10, -27)
    c.lineTo(-5, -21)
    c.lineTo(0, -30)
    c.lineTo(5, -21)
    c.lineTo(10, -27)
    c.lineTo(9, -14)
    c.closePath()
    c.fill()
    dot(c, 0, -18, 1.8, '#e5484d')
  }
}

/* ---- tail ---- */
function tail(c: Ctx, v: Dog, K: Coat, wag: number) {
  const tx = -v.brx + 4
  const ty = v.by - 3
  const lw = v.lw * 0.75
  const T = v.tail
  c.lineCap = 'round'
  c.strokeStyle = K.base
  if (T === 'stub') {
    ell(c, tx - 2, ty - 2 + wag, 5.5, 4.2, -0.6, K.base)
    return
  }
  let width: number
  let q: number[]
  if (T === 'curl') {
    width = lw * 1.3
    q = [tx - 12, ty - 8, tx - 8 + wag, ty - 24, tx + 3 + wag * 2, ty - 17]
  } else if (T === 'long') {
    width = lw * 0.7
    q = [tx - 14, ty + 6, tx - 17 + wag * 2, ty + 18]
  } else if (T === 'feather') {
    width = lw * 1.4
    q = [tx - 12, ty - 2 + wag * 2, tx - 19 + wag * 3, ty - 9]
  } else if (T === 'otter') {
    width = lw * 1.25
    q = [tx - 11, ty - 2 + wag * 2, tx - 16 + wag * 3, ty - 10]
  } else {
    width = lw
    q = [tx - 9, ty - 5 + wag * 2, tx - 9 + wag * 3, ty - 15]
  }
  c.lineWidth = width
  c.beginPath()
  c.moveTo(tx, ty)
  if (q.length === 6) c.bezierCurveTo(q[0]!, q[1]!, q[2]!, q[3]!, q[4]!, q[5]!)
  else c.quadraticCurveTo(q[0]!, q[1]!, q[2]!, q[3]!)
  c.stroke()
  if (T === 'feather') {
    c.strokeStyle = lt(K.base, 0.12)
    c.lineWidth = width * 0.45
    c.beginPath()
    c.moveTo(tx - 3, ty + 2)
    c.quadraticCurveTo(tx - 12, ty + 3 + wag * 2, tx - 18 + wag * 3, ty - 4)
    c.stroke()
  }
  if (K.tailTip) dot(c, q[q.length - 2]!, q[q.length - 1]!, width * 0.55, K.tailTip)
}

/* ---- whole dog ---- */
const SPOTS: [number, number, number][] = [
  [-0.6, -0.3, 0.2],
  [-0.25, 0.25, 0.15],
  [0.1, -0.45, 0.17],
  [0.45, 0, 0.14],
  [-0.05, -0.05, 0.12],
  [0.3, 0.5, 0.11],
  [-0.78, 0.2, 0.13],
  [0.62, -0.42, 0.11],
  [-0.4, -0.65, 0.12],
]

export interface PupOptions {
  acc?: Accessories
  /** Run-cycle phase in radians; defaults to t*11+ph. */
  run?: number
  /** In-game: the jump pose uses `tilt` rather than hovering. */
  game?: boolean
  tilt?: number
}

export function pup(c: Ctx, v: Dog, pose: Pose, t: number, ph: number, o: PupOptions = {}) {
  const acc = o.acc ?? {}
  const K = v.coat
  const run = o.run ?? t * 11 + ph
  const air = pose === 'jump'
  const dz = pose === 'dizzy'
  const isRun = pose === 'run'
  const sit = pose === 'sit'
  // Sitting: the rear drops onto its haunches and the body tips up about the back hip
  // until the front hip is back at standing height, so the front legs still reach the
  // ground. `th` is that tilt; the head turns back level.
  let th = 0
  c.save()
  if (sit) {
    const drop = v.L * 0.75
    th = Math.asin(Math.min(0.9, drop / (v.hipF - v.hipB)))
    c.translate(v.hipB, v.hipY + drop)
    c.rotate(-th)
    c.translate(-v.hipB, -v.hipY)
  }
  if (isRun) c.translate(0, -Math.abs(Math.sin(run)) * v.bounce)
  if (air) {
    if (o.game) c.rotate(o.tilt ?? 0)
    else {
      c.translate(0, -10 + Math.sin(t * 3 + ph) * 2)
      c.rotate(-0.12)
    }
  }
  if (dz) c.translate(0, v.L * 0.8)
  tail(c, v, K, Math.sin(t * (dz ? 3 : 15) + ph))
  const s = 0.75
  const A = isRun
    ? [
        Math.sin(run) * s,
        Math.sin(run + Math.PI) * s,
        Math.sin(run + 1.6) * s,
        Math.sin(run + 1.6 + Math.PI) * s,
      ]
    : air
      ? [1, 0.75, -1, -0.75]
      : dz
        ? [1.35, 1.2, -1.35, -1.2]
        : sit
          ? // Front legs straight down in the world (−th locally); back legs folded forward.
            [-th + 0.04, -th - 0.06, 1.3 - th, 1.2 - th]
          : [0.08, -0.04, -0.06, 0.04]
  const leg = (hx: number, a: number, near?: boolean) => {
    const fx = hx + Math.sin(a) * v.L
    const fy = v.hipY + Math.cos(a) * v.L
    const shade = (k: string) => (near ? k : dk(k, 0.14))
    c.lineCap = 'round'
    c.lineWidth = v.lw
    c.strokeStyle = near ? K.base : K.shade
    c.beginPath()
    c.moveTo(hx, v.hipY - 3)
    c.lineTo(fx, fy)
    c.stroke()
    if (K.legLow) {
      c.strokeStyle = shade(K.legLow)
      c.beginPath()
      c.moveTo(hx + Math.sin(a) * v.L * 0.5, v.hipY + Math.cos(a) * v.L * 0.5)
      c.lineTo(fx, fy)
      c.stroke()
    }
    ell(c, fx + 1.5, fy + 0.5, v.lw * 0.64, v.lw * 0.44, 0, shade(K.paws || K.base))
  }
  leg(v.hipF - 4, A[1]!)
  leg(v.hipB - 4, A[3]!)
  ell(c, 0, v.by, v.brx, v.bry, 0, K.base)
  c.save()
  c.beginPath()
  c.ellipse(0, v.by, v.brx, v.bry, 0, 0, TAU)
  c.clip()
  if (K.patch) ell(c, -v.brx * 0.35, v.by - v.bry * 0.25, v.brx * 0.42, v.bry * 0.62, 0.1, K.patch)
  if (K.spots)
    for (const [a, b, r] of SPOTS) dot(c, a * v.brx, v.by + b * v.bry, r * v.bry, K.spots)
  if (K.belly) ell(c, 3, v.by + v.bry * 0.7, v.brx * 0.62, v.bry * 0.38, 0, K.belly)
  c.restore()
  ell(c, -4, v.by - v.bry * 0.5, v.brx * 0.5, v.bry * 0.22, 0, 'rgba(255,255,255,.07)')
  if (K.chest) ell(c, v.brx * 0.7, v.by + 2, v.bry * 0.5, v.bry * 0.62, 0, K.chest)
  leg(v.hipF, A[0]!, true)
  leg(v.hipB, A[2]!, true)
  // A sitting dog's thigh: a round haunch over the folded back leg.
  if (sit) ell(c, v.hipB + 3, v.hipY - 3, v.brx * 0.38, v.bry * 0.8, -0.3, K.base)
  if (acc.cape || acc.back === 'cape') {
    const f = Math.sin(t * 8)
    c.fillStyle = '#e5484d'
    c.beginPath()
    c.moveTo(v.hx - 10, v.hy + 6)
    c.quadraticCurveTo(-8, v.by - 20 + f * 3, -v.brx - 12, v.by - 12 + f * 4)
    c.lineTo(-v.brx - 4, v.by + 2)
    c.quadraticCurveTo(-4, v.by - 4, v.hx - 6, v.hy + 16)
    c.fill()
  }
  const ny = (v.hy + v.by) / 2 + 2
  ell(c, v.hx - 6, ny, 9, 11 + Math.max(0, v.neck) * 0.7, 0, K.base)
  if (K.bib) ell(c, v.hx - 1, ny + 4, 5, 8, -0.2, K.bib)
  c.save()
  c.translate(v.hx, v.hy)
  let r = air ? -0.06 : dz ? 0.18 : sit ? th * 0.85 : 0
  if (isRun && v.tilt) r += Math.sin(run * 0.5) * v.tilt
  c.rotate(r)
  const k = v.hr / 17
  c.scale(k, k)
  head(c, v, sit ? 'idle' : pose, t, ph, run, acc)
  c.restore()
  c.restore()
  if (dz)
    for (let i = 0; i < 3; i++) {
      const a = t * 3 + (i * TAU) / 3
      sparkle(
        c,
        v.hx + Math.cos(a) * 15,
        v.hy - v.hr - 6 + v.L * 0.8 + Math.sin(a) * 4,
        4.5,
        '#ffd23f',
        t * 3,
      )
    }
}
