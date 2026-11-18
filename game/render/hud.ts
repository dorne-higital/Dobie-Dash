/** In-canvas HUD: score, best, biscuits, power meter, world pill and power pills. */
import type { GameConfig } from '../config'
import type { Run } from '../run'
import { worldProgress } from '../worlds'
import { BODY_FONT, back, clamp, rr, text, type Ctx } from './draw'
import { drawSprite, type SpriteCache } from './sprites'

export interface HudLayout {
  W: number
  /** Logical units reserved at the top for the status bar / Dynamic Island. */
  safeTop: number
  /** Logical units reserved at the left for the Vue pause button. */
  insetLeft: number
}

export interface Banner {
  a: string
  b: string
  col: string
  t: number
}

const PANEL = 'rgba(20,12,30,.45)'
const OUTLINE = 'rgba(30,15,40,.55)'

export function drawHud(
  c: Ctx,
  run: Run,
  best: number,
  cfg: GameConfig,
  sprites: SpriteCache,
  L: HudLayout,
) {
  const m = 16
  const top = 16 + L.safeTop
  const left = m + L.insetLeft
  text(c, run.score.toLocaleString(), left, top + 16, 32, '#ffffff', {
    align: 'left',
    stroke: OUTLINE,
    sw: 6,
  })
  const shownBest = Math.max(best, run.score)
  text(c, `BEST ${shownBest.toLocaleString()}`, left + 2, top + 44, 13, '#ffffff', {
    align: 'left',
    font: BODY_FONT,
    weight: 900,
    stroke: 'rgba(30,15,40,.45)',
    sw: 3,
  })

  // Biscuits + power meter.
  const blocks = cfg.meter.blocks
  const pw = 150
  const px = L.W - m - pw
  const py = top + 6
  c.fillStyle = PANEL
  rr(c, px - 8, py - 6, pw + 16, 52, 14)
  c.fill()
  drawSprite(c, sprites.hudBone, px + 12, py + 10)
  text(c, `×${run.biscuitsEaten}`, px + 30, py + 11, 18, '#ffffff', { align: 'left' })
  const seg = (pw - 6) / blocks
  for (let i = 0; i < blocks; i++) {
    c.fillStyle = i < run.power.meter ? '#ffd23f' : 'rgba(255,255,255,.22)'
    rr(c, px + i * seg, py + 27, seg - 3, 9, 3)
    c.fill()
  }
  text(c, 'POWER', px + pw, py + 11, 10, 'rgba(255,255,255,.85)', {
    align: 'right',
    font: BODY_FONT,
    weight: 900,
  })

  // World pill, filling toward the next target.
  const label = `WORLD ${run.worldIndex + 1} · ${run.world.name.toUpperCase()}`
  c.font = `900 12px ${BODY_FONT}`
  const lw = c.measureText(label).width + 22
  const lx = L.W / 2 - lw / 2
  const ly = top + 66
  c.fillStyle = PANEL
  rr(c, lx, ly, lw, 22, 11)
  c.fill()
  const f = worldProgress(run.score, run.worldIndex, run.worlds)
  if (f !== null && f > 0) {
    c.save()
    rr(c, lx, ly, lw, 22, 11)
    c.clip()
    c.fillStyle = 'rgba(255,210,63,.45)'
    c.fillRect(lx, ly, lw * f, 22)
    c.restore()
  }
  text(c, label, L.W / 2, ly + 11.5, 12, '#ffffff', { font: BODY_FONT, weight: 900 })

  // Active power pills.
  let ay = py + 56
  const P = cfg.powerups
  const pill = (name: string, col: string, frac: number | null) => {
    c.fillStyle = col
    rr(c, px - 8, ay, pw + 16, 24, 12)
    c.fill()
    if (frac !== null) {
      c.fillStyle = 'rgba(255,255,255,.3)'
      rr(c, px - 8, ay, (pw + 16) * clamp(frac, 0, 1), 24, 12)
      c.fill()
    }
    text(c, name, px + pw / 2, ay + 12.5, 13, '#ffffff')
    ay += 30
  }
  if (run.power.zoomies > 0)
    pill('ZOOMIES!', P.zoomies.color, run.power.zoomies / P.zoomies.duration)
  if (run.power.magnet > 0) pill('MAGNET', P.magnet.color, run.power.magnet / P.magnet.duration)
  if (run.power.shield) pill('BUBBLE SHIELD', P.shield.color, null)
}

export function drawBanner(c: Ctx, b: Banner, W: number, GY: number) {
  const q = b.t
  const sc = back(clamp(q * 4, 0, 1))
  const a = q > 1.6 ? 1 - (q - 1.6) / 0.4 : 1
  c.save()
  c.globalAlpha = clamp(a, 0, 1)
  c.translate(W / 2, GY * 0.42)
  c.scale(sc, sc)
  text(c, b.a, 0, 0, 46, b.col, { stroke: '#2a1530', sw: 9 })
  text(c, b.b, 0, 34, 17, '#ffffff', { font: BODY_FONT, weight: 900, stroke: '#2a1530', sw: 5 })
  c.restore()
}
