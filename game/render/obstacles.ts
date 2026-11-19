/** Obstacle and biscuit art, ported from the prototype. Each draws with its bottom-left at (x, y). */
import type { ObstacleType } from '../config'
import { TAU, dot, ell, rr, sparkle, tri, type Ctx } from './draw'

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
  } else if (type === 'seagull') {
    const fl = Math.sin(t * 18)
    ell(c, x + 20, y - 10, 15, 8, 0, '#f4f6fa')
    ell(c, x + 22, y - 6, 9, 4, 0, '#dfe4ec')
    c.save()
    c.translate(x + 22, y - 13)
    c.rotate(-0.35 + fl * 0.8)
    ell(c, 5, -6, 14, 4.5, -0.3, '#9aa3b8')
    ell(c, 14, -9, 5, 3, -0.3, '#2e2a33')
    c.restore()
    dot(c, x + 7, y - 15, 7, '#ffffff')
    tri(c, [x + 1, y - 17], [x - 8, y - 14], [x + 1, y - 12], '#ffc61a')
    dot(c, x - 4, y - 14, 1.2, '#e5484d')
    dot(c, x + 5, y - 17, 1.6, '#1d1b28')
    tri(c, [x + 33, y - 12], [x + 42, y - 15], [x + 40, y - 7], '#dfe4ec')
  } else if (type === 'puddle') {
    ell(c, x + 28, y - 3, 28, 6, 0, '#5aa3d9')
    ell(c, x + 28, y - 4, 24, 4, 0, '#7cc1ef')
    ell(c, x + 18, y - 5, 7, 1.4, 0, 'rgba(255,255,255,.7)')
    const r = 3 + ((t * 6) % 6)
    c.strokeStyle = `rgba(255,255,255,${0.6 - r / 15})`
    c.lineWidth = 1.2
    c.beginPath()
    c.ellipse(x + 38, y - 4, r, r * 0.3, 0, 0, TAU)
    c.stroke()
    for (const [dx, h] of [
      [8, 10],
      [48, 12],
    ] as const) {
      c.fillStyle = '#5fae45'
      c.beginPath()
      c.moveTo(x + dx, y)
      c.lineTo(x + dx + 2, y - h)
      c.lineTo(x + dx + 4, y)
      c.fill()
    }
  } else if (type === 'skateboarder') {
    // A kid on a skateboard rolling toward you.
    const spin = t * 20
    rr(c, x + 2, y - 10, 38, 4, 2)
    c.fillStyle = '#8a5cf6'
    c.fill()
    for (const wx of [8, 32]) {
      dot(c, x + wx, y - 3, 3.4, '#2a1530')
      dot(c, x + wx + Math.cos(spin) * 1.4, y - 3 + Math.sin(spin) * 1.4, 1, '#ffd23f')
    }
    c.strokeStyle = '#3a4a8a'
    c.lineWidth = 6
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(x + 12, y - 12)
    c.lineTo(x + 18, y - 26)
    c.lineTo(x + 26, y - 12)
    c.stroke()
    rr(c, x + 11, y - 42, 16, 18, 6)
    c.fillStyle = '#e5484d'
    c.fill()
    c.strokeStyle = '#f0b88a'
    c.lineWidth = 4
    c.beginPath()
    c.moveTo(x + 12, y - 38)
    c.lineTo(x + 4, y - 32 + Math.sin(t * 6) * 2)
    c.moveTo(x + 26, y - 38)
    c.lineTo(x + 34, y - 34 - Math.sin(t * 6) * 2)
    c.stroke()
    dot(c, x + 19, y - 48, 7, '#f0b88a')
    c.fillStyle = '#2fd0c0'
    c.beginPath()
    c.arc(x + 19, y - 49, 7.6, Math.PI, 0)
    c.fill()
    dot(c, x + 16, y - 48, 1.2, '#1d1b28')
  } else if (type === 'manhole') {
    // An open hole in the road: the lid lies beside it.
    ell(c, x + 27, y + 2, 27, 7, 0, '#1d1824')
    ell(c, x + 27, y + 3, 22, 4.5, 0, '#0d0a12')
    c.save()
    c.translate(x + 46, y - 6)
    c.rotate(-0.5)
    ell(c, 0, 0, 13, 4, 0, '#6f7487')
    ell(c, 0, -1, 11, 3, 0, '#8c8a99')
    c.restore()
    c.fillStyle = '#ffc61a'
    c.fillRect(x + 2, y - 16, 3, 16)
    tri(c, [x - 3, y - 18], [x + 10, y - 18], [x + 3.5, y - 26], '#ff7a1a')
  } else if (type === 'clump') {
    clump(c, x, y, t)
  } else if (type === 'crater') {
    crater(c, x, y)
  } else if (type === 'alienCat') {
    alienCat(c, x, y, t)
  } else if (type === 'pumpkin') {
    pumpkin(c, x, y, t)
  } else if (type === 'bat') {
    bat(c, x, y, t)
  } else if (type === 'ghost') {
    ghost(c, x, y, t)
  } else if (type === 'mixer') {
    mixer(c, x, y, t)
  } else if (type === 'girder') {
    girder(c, x, y, t)
  } else if (type === 'snowman') {
    snowman(c, x, y)
  } else if (type === 'snowball') {
    snowball(c, x, y, t)
  } else if (type === 'crab') {
    const k = Math.sin(t * 14)
    c.strokeStyle = '#c93a3f'
    c.lineWidth = 2.5
    c.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      const lx = x + 10 + i * 8
      c.beginPath()
      c.moveTo(lx, y - 7)
      c.lineTo(lx - 4 + k * (i % 2 ? 2 : -2), y)
      c.stroke()
    }
    ell(c, x + 19, y - 11, 15, 9, 0, '#e5484d')
    ell(c, x + 19, y - 13, 10, 4, 0, 'rgba(255,255,255,.25)')
    for (const [cx, dir] of [
      [x + 3, -1],
      [x + 35, 1],
    ] as const) {
      c.save()
      c.translate(cx, y - 16)
      c.rotate(dir * (0.3 + Math.abs(k) * 0.3))
      ell(c, 0, -3, 5, 4, 0, '#e5484d')
      tri(c, [dir * 2, -6], [dir * 7, -10], [dir * 5, -3], '#f6dc96')
      c.restore()
    }
    c.strokeStyle = '#c93a3f'
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(x + 15, y - 18)
    c.lineTo(x + 14, y - 24)
    c.moveTo(x + 23, y - 18)
    c.lineTo(x + 24, y - 24)
    c.stroke()
    dot(c, x + 14, y - 25, 2.6, '#ffffff')
    dot(c, x + 24, y - 25, 2.6, '#ffffff')
    dot(c, x + 14.6, y - 25, 1.3, '#1d1b28')
    dot(c, x + 24.6, y - 25, 1.3, '#1d1b28')
  } else if (type === 'sandcastle') {
    const sand = '#e8c374'
    const dark = '#cfa553'
    c.fillStyle = sand
    c.fillRect(x + 2, y - 22, 46, 22)
    c.fillRect(x + 4, y - 36, 12, 14)
    c.fillRect(x + 34, y - 36, 12, 14)
    c.fillRect(x + 17, y - 30, 16, 8)
    for (const bx of [4, 10, 34, 40]) c.fillRect(x + bx, y - 40, 4, 4)
    c.fillStyle = dark
    rr(c, x + 20, y - 14, 10, 14, 4)
    c.fill()
    for (const [dx, dy] of [
      [8, -10],
      [40, -8],
      [26, -26],
    ] as const)
      dot(c, x + dx, y + dy, 1.3, dark)
    c.strokeStyle = '#8a5a30'
    c.lineWidth = 1.5
    c.beginPath()
    c.moveTo(x + 10, y - 40)
    c.lineTo(x + 10, y - 50)
    c.stroke()
    tri(c, [x + 10.5, y - 50], [x + 19, y - 47], [x + 10.5, y - 44], '#ff4fa0')
  } else if (type === 'owl') {
    const fl = Math.sin(t * 14)
    c.save()
    c.translate(x + 16, y - 16)
    for (const dir of [-1, 1]) {
      c.save()
      c.rotate(dir * (0.5 + fl * 0.6))
      ell(c, dir * 14, 0, 11, 5, 0, '#6b4a3a')
      c.restore()
    }
    c.restore()
    ell(c, x + 16, y - 14, 12, 14, 0, '#8a6248')
    ell(c, x + 16, y - 10, 8, 8, 0, '#d9b98f')
    tri(c, [x + 6, y - 24], [x + 7, y - 33], [x + 12, y - 26], '#8a6248')
    tri(c, [x + 20, y - 26], [x + 25, y - 33], [x + 26, y - 24], '#8a6248')
    dot(c, x + 11, y - 19, 4.6, '#ffd23f')
    dot(c, x + 21, y - 19, 4.6, '#ffd23f')
    dot(c, x + 11, y - 19, 2.2, '#1d1b28')
    dot(c, x + 21, y - 19, 2.2, '#1d1b28')
    tri(c, [x + 14, y - 15], [x + 18, y - 15], [x + 16, y - 11], '#ffb347')
  } else if (type === 'bin') {
    rr(c, x + 3, y - 42, 28, 40, 3)
    c.fillStyle = '#2f8f5a'
    c.fill()
    c.fillStyle = 'rgba(0,0,0,.15)'
    for (const lx of [10, 17, 24]) c.fillRect(x + lx, y - 36, 2, 30)
    rr(c, x + 1, y - 50, 32, 9, 3)
    c.fillStyle = '#257a4c'
    c.fill()
    dot(c, x + 8, y - 3, 3, '#1d1824')
    dot(c, x + 26, y - 3, 3, '#1d1824')
    c.fillStyle = '#e8e2d4'
    c.fillRect(x + 26, y - 54, 8, 6)
  } else if (type === 'parcel') {
    // A cardboard parcel thrown by the mail van.
    rr(c, x + 1, y - 26, 28, 26, 3)
    c.fillStyle = '#c98f52'
    c.fill()
    c.fillStyle = '#b07a42'
    c.fillRect(x + 1, y - 26, 28, 5)
    c.fillStyle = '#e8c27a'
    c.fillRect(x + 12, y - 26, 6, 26)
    c.fillStyle = '#ffffff'
    c.fillRect(x + 20, y - 14, 7, 5)
    c.fillStyle = '#e5484d'
    c.fillRect(x + 3, y - 12, 7, 3)
  } else if (type === 'fox') {
    const r = t * 16
    const leg = (lx: number, a: number) => {
      c.strokeStyle = '#2a1e22'
      c.lineWidth = 3.5
      c.lineCap = 'round'
      c.beginPath()
      c.moveTo(x + lx, y - 12)
      c.lineTo(x + lx + Math.sin(a) * 6, y - 1)
      c.stroke()
    }
    leg(14, r)
    leg(34, r + Math.PI)
    c.strokeStyle = '#e07a2f'
    c.lineWidth = 9
    c.beginPath()
    c.moveTo(x + 40, y - 18)
    c.quadraticCurveTo(x + 52, y - 22 + Math.sin(r) * 3, x + 56, y - 30)
    c.stroke()
    dot(c, x + 56, y - 31, 4.5, '#f7f3ee')
    ell(c, x + 26, y - 17, 16, 8, 0, '#e07a2f')
    ell(c, x + 26, y - 13, 10, 4, 0, '#f7f3ee')
    leg(20, r + Math.PI)
    leg(30, r)
    dot(c, x + 9, y - 22, 8, '#e07a2f')
    tri(c, [x + 4, y - 27], [x + 6, y - 36], [x + 11, y - 29], '#e07a2f')
    tri(c, [x + 10, y - 29], [x + 15, y - 37], [x + 16, y - 27], '#e07a2f')
    tri(c, [x + 2, y - 22], [x - 6, y - 18], [x + 6, y - 16], '#f7f3ee')
    dot(c, x - 6, y - 18.5, 1.6, '#1d1b28')
    dot(c, x + 6, y - 24, 1.5, '#1d1b28')
  }
}

/** Snowy Peaks: a snowman with a top hat, carrot and scarf (34 × 46). */
function snowman(c: Ctx, x: number, y: number) {
  ell(c, x + 17, y - 1, 15, 3, 0, 'rgba(120,150,190,.35)')
  dot(c, x + 17, y - 13, 13, '#f4f8ff')
  dot(c, x + 17, y - 32, 9.5, '#ffffff')
  ell(c, x + 21, y - 16, 7, 9, 0.3, 'rgba(160,190,225,.45)')
  c.fillStyle = '#e5484d'
  rr(c, x + 7, y - 25, 20, 5, 2.5)
  c.fill()
  rr(c, x + 20, y - 25, 5, 11, 2)
  c.fill()
  dot(c, x + 13, y - 34, 1.4, '#1d1b28')
  dot(c, x + 20, y - 34, 1.4, '#1d1b28')
  tri(c, [x + 17, y - 32], [x + 17, y - 29], [x + 28, y - 31], '#ff8a1a')
  for (const yy of [-16, -10]) dot(c, x + 17, y + yy, 1.5, '#1d1b28')
  c.fillStyle = '#1d1b28'
  c.fillRect(x + 9, y - 42, 16, 2.5)
  c.fillRect(x + 11.5, y - 46, 11, 4.5)
  c.strokeStyle = '#7a4a2a'
  c.lineWidth = 1.8
  c.beginPath()
  c.moveTo(x + 6, y - 20)
  c.lineTo(x - 2, y - 27)
  c.moveTo(x + 28, y - 20)
  c.lineTo(x + 35, y - 25)
  c.stroke()
}

/** Snowy Peaks: a big snowball rolling toward Dobie (30 × 30), with a spray of snow. */
function snowball(c: Ctx, x: number, y: number, t: number) {
  const a = t * 6
  for (let i = 0; i < 3; i++) {
    const k = (t * 1.5 + i / 3) % 1
    dot(c, x + 30 + k * 16, y - 4 - k * 8 + i * 2, 3.2 * (1 - k), 'rgba(255,255,255,.85)')
  }
  dot(c, x + 15, y - 15, 15, '#eef4fd')
  c.save()
  c.translate(x + 15, y - 15)
  c.rotate(-a)
  ell(c, 5, -4, 6, 4, 0.4, '#ffffff')
  ell(c, -6, 5, 4, 3, -0.3, 'rgba(160,190,225,.6)')
  dot(c, 7, 7, 2, 'rgba(160,190,225,.6)')
  dot(c, -7, -6, 1.6, 'rgba(160,190,225,.6)')
  c.restore()
  ell(c, x + 19, y - 9, 9, 5, 0.2, 'rgba(160,190,225,.35)')
}

/** Building Site: a cement mixer with a turning drum (46 × 40). */
function mixer(c: Ctx, x: number, y: number, t: number) {
  ell(c, x + 23, y - 1, 21, 3, 0, 'rgba(0,0,0,.18)')
  c.fillStyle = '#5a6272'
  c.fillRect(x + 6, y - 14, 34, 4)
  dot(c, x + 12, y - 6, 6, '#2a1e22')
  dot(c, x + 12, y - 6, 2.5, '#9aa3b8')
  dot(c, x + 36, y - 6, 6, '#2a1e22')
  dot(c, x + 36, y - 6, 2.5, '#9aa3b8')
  c.save()
  c.translate(x + 24, y - 26)
  c.rotate(-0.35)
  rr(c, -17, -12, 34, 24, 10)
  c.fillStyle = '#ff7a1a'
  c.fill()
  // Stripes turning on the drum.
  c.save()
  c.beginPath()
  rr(c, -17, -12, 34, 24, 10)
  c.clip()
  c.fillStyle = '#d95a00'
  const off = ((t * 30) % 12) - 12
  for (let k = off; k < 40; k += 12) c.fillRect(-17 + k, -12, 5, 24)
  c.restore()
  ell(c, 17, 0, 4, 8, 0, '#3a2f2a')
  c.restore()
  c.fillStyle = 'rgba(255,255,255,.3)'
  rr(c, x + 12, y - 36, 12, 3, 1.5)
  c.fill()
}

/** Building Site: a steel girder swinging on a crane cable (56 × 14), flies at head height. */
function girder(c: Ctx, x: number, y: number, t: number) {
  const sway = Math.sin(t * 3) * 3
  c.strokeStyle = '#3a3f4b'
  c.lineWidth = 1.5
  c.beginPath()
  c.moveTo(x + 28 + sway, y - 200)
  c.lineTo(x + 28, y - 18)
  c.moveTo(x + 28, y - 18)
  c.lineTo(x + 8, y - 14)
  c.moveTo(x + 28, y - 18)
  c.lineTo(x + 48, y - 14)
  c.stroke()
  dot(c, x + 28, y - 18, 2.5, '#ffc61a')
  c.fillStyle = '#e5484d'
  c.fillRect(x, y - 14, 56, 3)
  c.fillRect(x, y - 3, 56, 3)
  c.fillStyle = '#c93a3f'
  c.fillRect(x, y - 11, 56, 8)
  c.fillStyle = '#e5484d'
  for (let k = 4; k < 56; k += 10) {
    c.beginPath()
    c.moveTo(x + k, y - 11)
    c.lineTo(x + k + 5, y - 3)
    c.lineTo(x + k + 8, y - 3)
    c.lineTo(x + k + 3, y - 11)
    c.fill()
  }
  for (const bx of [3, 53]) dot(c, x + bx, y - 7, 1.4, '#1d1b28')
}

/** Haunted Hollow: a carved pumpkin with a glowing face (34 × 30). */
function pumpkin(c: Ctx, x: number, y: number, t: number) {
  const glow = (0.75 + Math.sin(t * 6) * 0.25).toFixed(2)
  const face = `rgba(255,214,90,${glow})`
  for (const [dx, rx] of [
    [8, 10],
    [26, 10],
    [17, 12],
  ] as const)
    ell(c, x + dx, y - 13, rx, 13, 0, dx === 17 ? '#ff8a1a' : '#e5741a')
  c.fillStyle = '#4a7a2e'
  rr(c, x + 15, y - 31, 4, 7, 2)
  c.fill()
  tri(c, [x + 9, y - 17], [x + 12, y - 22], [x + 15, y - 17], face)
  tri(c, [x + 19, y - 17], [x + 22, y - 22], [x + 25, y - 17], face)
  c.fillStyle = face
  c.beginPath()
  c.moveTo(x + 8, y - 11)
  c.lineTo(x + 26, y - 11)
  c.lineTo(x + 23, y - 6)
  c.lineTo(x + 20, y - 9)
  c.lineTo(x + 17, y - 6)
  c.lineTo(x + 14, y - 9)
  c.lineTo(x + 11, y - 6)
  c.closePath()
  c.fill()
}

/** Haunted Hollow: a bat flapping toward Dobie (34 × 20). */
function bat(c: Ctx, x: number, y: number, t: number) {
  const f = Math.sin(t * 16)
  c.fillStyle = '#2e2440'
  for (const side of [-1, 1]) {
    const cx = x + 17
    c.beginPath()
    c.moveTo(cx, y - 11)
    c.quadraticCurveTo(cx + side * 9, y - 18 - f * 6, cx + side * 17, y - 14 - f * 7)
    c.quadraticCurveTo(cx + side * 13, y - 10, cx + side * 14, y - 6 - f * 2)
    c.quadraticCurveTo(cx + side * 9, y - 8, cx + side * 5, y - 5)
    c.closePath()
    c.fill()
  }
  ell(c, x + 17, y - 10, 6, 7, 0, '#3d3256')
  tri(c, [x + 12, y - 15], [x + 13, y - 21], [x + 16, y - 16], '#3d3256')
  tri(c, [x + 18, y - 16], [x + 21, y - 21], [x + 22, y - 15], '#3d3256')
  dot(c, x + 14.5, y - 11, 1.6, '#ffd23f')
  dot(c, x + 19.5, y - 11, 1.6, '#ffd23f')
}

/** Haunted Hollow: a little sheet ghost bobbing along (32 × 40). */
function ghost(c: Ctx, x: number, y: number, t: number) {
  const b = Math.sin(t * 5) * 2
  ell(c, x + 16, y - 1, 12, 2.5, 0, 'rgba(60,30,90,.25)')
  c.fillStyle = '#f4f0ff'
  c.beginPath()
  c.moveTo(x + 2, y - 4 + b)
  c.lineTo(x + 2, y - 24 + b)
  c.arc(x + 16, y - 24 + b, 14, Math.PI, 0)
  c.lineTo(x + 30, y - 4 + b)
  for (let k = 0; k < 4; k++) {
    const wx = x + 30 - (k + 1) * 7
    c.quadraticCurveTo(wx + 3.5, y - 9 + b + (k % 2 ? 4 : -1), wx, y - 4 + b)
  }
  c.closePath()
  c.fill()
  ell(c, x + 22, y - 18 + b, 6, 12, 0, 'rgba(180,160,230,.35)')
  ell(c, x + 11, y - 26 + b, 2.6, 3.6, 0, '#2e2440')
  ell(c, x + 20, y - 26 + b, 2.6, 3.6, 0, '#2e2440')
  ell(c, x + 15.5, y - 19 + b, 3, 2.4, 0, '#2e2440')
}

/** Moon Walkies: a crater with a raised rim (52 × 12). Low, but jump it. */
function crater(c: Ctx, x: number, y: number) {
  ell(c, x + 26, y - 3, 26, 8, 0, '#8c8fa3')
  ell(c, x + 26, y - 4, 20, 5.5, 0, '#4d4f63')
  ell(c, x + 28, y - 3, 14, 3, 0, '#3a3c4e')
  c.fillStyle = 'rgba(255,255,255,.35)'
  c.beginPath()
  c.ellipse(x + 26, y - 4, 25, 7.5, 0, Math.PI * 1.1, Math.PI * 1.9)
  c.lineTo(x + 26, y - 4)
  c.fill()
  dot(c, x + 6, y - 9, 2, '#a5a8bb')
  dot(c, x + 47, y - 8, 1.6, '#a5a8bb')
}

/** Moon Walkies: a little green alien cat with a fishbowl helmet (34 × 36). */
function alienCat(c: Ctx, x: number, y: number, t: number) {
  const w = Math.sin(t * 5)
  c.strokeStyle = '#4fbf6a'
  c.lineWidth = 4
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(x + 28, y - 10)
  c.quadraticCurveTo(x + 38, y - 16 + w * 3, x + 33, y - 26 + w * 4)
  c.stroke()
  ell(c, x + 18, y - 9, 12, 8, 0, '#5fd47a')
  for (const lx of [10, 16, 22, 27]) {
    c.fillStyle = '#4fbf6a'
    rr(c, x + lx - 2, y - 6, 4, 6, 2)
    c.fill()
  }
  dot(c, x + 12, y - 22, 9, '#5fd47a')
  tri(c, [x + 5, y - 26], [x + 6, y - 34], [x + 11, y - 29], '#5fd47a')
  tri(c, [x + 13, y - 30], [x + 18, y - 34], [x + 19, y - 26], '#5fd47a')
  ell(c, x + 9, y - 22, 2.4, 3.2, 0, '#1d1b28')
  ell(c, x + 15, y - 22, 2.4, 3.2, 0, '#1d1b28')
  dot(c, x + 9.6, y - 23, 0.9, '#ffffff')
  dot(c, x + 15.6, y - 23, 0.9, '#ffffff')
  // Fishbowl helmet and antenna.
  c.fillStyle = 'rgba(190,225,255,.25)'
  c.beginPath()
  c.arc(x + 12, y - 23, 13, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = 'rgba(255,255,255,.8)'
  c.lineWidth = 1.5
  c.stroke()
  c.strokeStyle = '#2a1530'
  c.lineWidth = 1.2
  c.beginPath()
  c.moveTo(x + 12, y - 36)
  c.lineTo(x + 12, y - 41)
  c.stroke()
  dot(c, x + 12, y - 42, 2, '#ffd23f')
}

/** The mower's attack: a tumbling clump of turf and dirt (26 × 20). */
function clump(c: Ctx, x: number, y: number, t: number) {
  const spin = -t * 9
  ell(c, x + 13, y - 1, 11, 2.5, 0, 'rgba(0,0,0,.18)')
  c.save()
  c.translate(x + 13, y - 10)
  c.rotate(spin)
  ell(c, 0, 2, 12, 8, 0, '#8a5a30')
  ell(c, -3, 4, 6, 4, 0.4, '#6b4422')
  c.fillStyle = '#5fae45'
  c.beginPath()
  c.ellipse(0, -2, 12, 6, 0, Math.PI, 0)
  c.fill()
  for (const gx of [-8, -3, 2, 7]) tri(c, [gx - 2, -5], [gx + 1, -12], [gx + 3, -5], '#4f9a3a')
  c.restore()
  for (let i = 0; i < 3; i++) {
    const k = (t * 2 + i / 3) % 1
    dot(c, x + 26 + k * 14, y - 4 - k * 6 + i * 2, 2 * (1 - k), '#5fae45')
  }
}

/** Animation loop length (seconds) per obstacle; 0 means static. */
export const OBSTACLE_ANIM: Record<ObstacleType, { period: number; frames: number }> = {
  hydrant: { period: 0, frames: 1 },
  cone: { period: 0, frames: 1 },
  fence: { period: 0, frames: 1 },
  cat: { period: (Math.PI * 2) / 4, frames: 16 },
  seagull: { period: (Math.PI * 2) / 18, frames: 6 },
  puddle: { period: 1, frames: 8 },
  skateboarder: { period: (Math.PI * 2) / 6, frames: 8 },
  manhole: { period: 0, frames: 1 },
  crab: { period: (Math.PI * 2) / 14, frames: 6 },
  sandcastle: { period: 0, frames: 1 },
  owl: { period: (Math.PI * 2) / 14, frames: 6 },
  bin: { period: 0, frames: 1 },
  fox: { period: (Math.PI * 2) / 16, frames: 8 },
  parcel: { period: 0, frames: 1 },
  snowman: { period: 0, frames: 1 },
  snowball: { period: (Math.PI * 2) / 6, frames: 8 },
  mixer: { period: 0.4, frames: 6 },
  girder: { period: (Math.PI * 2) / 3, frames: 8 },
  pumpkin: { period: (Math.PI * 2) / 6, frames: 6 },
  bat: { period: (Math.PI * 2) / 16, frames: 6 },
  ghost: { period: (Math.PI * 2) / 5, frames: 8 },
  crater: { period: 0, frames: 1 },
  alienCat: { period: (Math.PI * 2) / 5, frames: 6 },
  clump: { period: (Math.PI * 2) / 9, frames: 8 },
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
