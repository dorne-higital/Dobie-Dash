/**
 * Sprite cache: draws Dobie's frames, obstacles, biscuits and world backgrounds once into
 * offscreen canvases at load. Each game frame is then just drawImage calls.
 */
import { DOBIE, pup, type Accessories, type Dog } from '../art/dobie'
import { OBSTACLE_TYPES, type ObstacleType, type ThemeKind } from '../config'
import { buildTheme, cloud, type Frame as ViewFrame, type ThemeCache } from './backgrounds'
import { bone, drawBiscuit, drawObstacle, OBSTACLE_ANIM } from './obstacles'
import { makeCanvas, type Ctx } from './draw'

/** A pre-rendered image whose origin (ox, oy) is the anchor point in logical units. */
export interface Sprite {
  cv: HTMLCanvasElement
  ox: number
  oy: number
  w: number
  h: number
}

export function drawSprite(c: Ctx, s: Sprite, x: number, y: number) {
  c.drawImage(s.cv, x - s.ox, y - s.oy, s.w, s.h)
}

function bake(
  w: number,
  h: number,
  ox: number,
  oy: number,
  scale: number,
  draw: (c: Ctx) => void,
): Sprite {
  const { cv, c } = makeCanvas(w, h, scale)
  c.translate(ox, oy)
  draw(c)
  return { cv, ox, oy, w, h }
}

// Dog box: generous enough for hats, dizzy stars and the long tail.
const DOG_BOX = { w: 150, h: 140, ox: 75, oy: 112 }

export const RUN_FRAMES = 16
export const DIZZY_FRAMES = 24
export const DIZZY_PERIOD = (Math.PI * 2) / 3
/** Jump tilt values baked (radians), matching clamp(vy/3000, -.18, .2). */
export const JUMP_TILTS = [-0.18, -0.135, -0.09, -0.045, 0, 0.05, 0.1, 0.15, 0.2]

export interface DogSprites {
  run: Sprite[]
  jump: Sprite[]
  dizzy: Sprite[]
}

export function bakeDog(scale: number, dog: Dog = DOBIE, acc: Accessories = {}): DogSprites {
  const box = (draw: (c: Ctx) => void) =>
    bake(DOG_BOX.w, DOG_BOX.h, DOG_BOX.ox, DOG_BOX.oy, scale, draw)
  const TAIL_PERIOD = (Math.PI * 2) / 15
  const run = Array.from({ length: RUN_FRAMES }, (_, k) => {
    const f = k / RUN_FRAMES
    return box((c) =>
      pup(c, dog, 'run', f * TAIL_PERIOD, 0, { game: true, run: f * Math.PI * 2, acc }),
    )
  })
  const jump = JUMP_TILTS.map((tilt) =>
    box((c) => pup(c, dog, 'jump', 0, 0, { game: true, tilt, acc })),
  )
  const dizzy = Array.from({ length: DIZZY_FRAMES }, (_, k) =>
    box((c) => pup(c, dog, 'dizzy', (k / DIZZY_FRAMES) * DIZZY_PERIOD, 0, { game: true, acc })),
  )
  return { run, jump, dizzy }
}

export function runFrame(run: number) {
  const p = ((run % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  return Math.floor((p / (Math.PI * 2)) * RUN_FRAMES) % RUN_FRAMES
}

export function jumpFrame(tilt: number) {
  let best = 0
  for (let i = 1; i < JUMP_TILTS.length; i++)
    if (Math.abs(JUMP_TILTS[i]! - tilt) < Math.abs(JUMP_TILTS[best]! - tilt)) best = i
  return best
}

export class SpriteCache {
  readonly scale: number
  readonly dog: DogSprites
  readonly obstacles: Record<ObstacleType, Sprite[]>
  readonly biscuit: Sprite
  readonly goldBiscuit: Sprite
  readonly hudBone: Sprite
  readonly cloud: Sprite
  private themes = new Map<ThemeKind, ThemeCache>()
  private themeKey = ''

  constructor(scale: number) {
    this.scale = scale
    this.dog = bakeDog(scale)
    const obs = {} as Record<ObstacleType, Sprite[]>
    for (const type of OBSTACLE_TYPES) {
      const anim = OBSTACLE_ANIM[type]
      obs[type] = Array.from({ length: anim.frames }, (_, k) =>
        // Anchor = obstacle's bottom-left; margin covers tails, ears and beaks.
        bake(80, 70, 12, 56, scale, (c) =>
          drawObstacle(c, type, 0, 0, (k / anim.frames) * anim.period),
        ),
      )
    }
    this.obstacles = obs
    this.biscuit = bake(60, 44, 30, 22, scale, (c) => drawBiscuit(c, 0, 0, false))
    this.goldBiscuit = bake(60, 44, 30, 22, scale, (c) => drawBiscuit(c, 0, 0, true))
    this.hudBone = bake(30, 22, 15, 11, scale, (c) => bone(c, 0, 0, 1, '#e3ad62', '#a8702f'))
    // Baked at the largest on-screen size (1.6×) so scaling down stays crisp.
    this.cloud = bake(100, 70, 25, 40, scale * 1.6, (c) =>
      cloud(c, 0, 0, 1, 'rgba(255,255,255,.85)'),
    )
  }

  /** Background caches depend on the viewport; they're built on first use per world. */
  theme(kind: ThemeKind, f: ViewFrame): ThemeCache {
    const key = `${f.W}x${f.H}x${f.GY}`
    if (key !== this.themeKey) {
      this.themes.clear()
      this.themeKey = key
    }
    let th = this.themes.get(kind)
    if (!th) {
      th = buildTheme(kind, f, this.scale)
      this.themes.set(kind, th)
    }
    return th
  }

  /** Free background caches not in `keep` (each one is a few MB on a 3× phone). */
  trimThemes(keep: ThemeKind[]) {
    for (const k of [...this.themes.keys()]) if (!keep.includes(k)) this.themes.delete(k)
  }
}
