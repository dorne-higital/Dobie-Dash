/**
 * Share clips (M6): the last 10 seconds of a run, as a video. The run is replayed from
 * its record into an off-screen canvas with the real renderer, and the canvas is recorded
 * with MediaRecorder (MP4 on iPhone). Nothing is recorded during play, so the game never
 * pays for it; making a clip takes about as long as the clip.
 */
import type { GameConfig } from './config'
import { Renderer, type View } from './render/renderer'
import type { TrailKind } from './render/trails'
import type { Accessories, Dog } from './art/dobie'
import { Replayer, type RunRecord } from './replay'

export interface ClipOptions {
  seconds?: number
  /** Video size in pixels (portrait). */
  width?: number
  height?: number
  look?: { dog: Dog; acc: Accessories; trail: TrailKind | null } | null
  /** Shown over the clip. */
  caption?: string
}

/** Can this browser record a canvas? (iPhone: iOS 14.5+.) */
export function canMakeClips(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    'captureStream' in HTMLCanvasElement.prototype
  )
}

function mimeType(): string {
  for (const t of ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'])
    if (MediaRecorder.isTypeSupported(t)) return t
  return ''
}

/** The run's last seconds as a video Blob (or null if this browser can't record). */
export async function makeClip(
  cfg: GameConfig,
  rec: RunRecord,
  o: ClipOptions = {},
): Promise<Blob | null> {
  if (!canMakeClips()) return null
  const hz = cfg.loop.hz
  const seconds = o.seconds ?? 10
  // Pass 1 (fast, nothing drawn): the last moment the dog was running (its final crash).
  let lastRunning = 0
  {
    const p = new Replayer(cfg, rec)
    while (!p.done && p.run.ticks < rec.ticks + 600) {
      if (p.run.state === 'running') lastRunning = p.run.ticks
      p.step()
    }
  }
  const from = Math.max(0, lastRunning - seconds * hz + hz)
  const to = lastRunning + hz // a second of the crash

  // Pass 2: fast-forward to the start, then draw and record in real time.
  const p = new Replayer(cfg, rec)
  while (p.run.ticks < from && !p.done) p.step()

  const width = o.width ?? 720
  const height = o.height ?? 1280
  const cv = document.createElement('canvas')
  cv.width = width
  cv.height = height
  const ctx = cv.getContext('2d')!
  const S = width / cfg.view.logicalWidth
  const H = height / S
  const view: View = {
    S,
    W: cfg.view.logicalWidth,
    H,
    GY: Math.round(H * cfg.view.groundRatio),
    safeTop: H * cfg.view.safeTopRatio,
    insetLeft: 0,
  }
  const r = new Renderer(ctx, view, o.look ?? null)
  const run = p.run
  r.reset(run.world.theme)
  r.prepareBoss(run.world.chase.boss)
  r.prepareTwist(run.world.twist ?? null)

  const type = mimeType()
  const stream = (
    cv as HTMLCanvasElement & { captureStream(fps?: number): MediaStream }
  ).captureStream(30)
  const recorder = new MediaRecorder(
    stream,
    type ? { mimeType: type, videoBitsPerSecond: 4_000_000 } : {},
  )
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const done = new Promise<void>((res) => (recorder.onstop = () => res()))
  recorder.start()

  const step = 1 / hz
  await new Promise<void>((resolve) => {
    let acc = 0
    let last = performance.now()
    const frame = (now: number) => {
      acc += Math.min(0.1, (now - last) / 1000)
      last = now
      while (acc >= step && run.ticks < to) {
        p.step(true)
        for (const fx of run.fx) r.addFx(fx, run)
        for (const e of run.events) {
          if (e.type === 'world') {
            const w = run.worlds[e.data.index]!
            r.showWorld(w.theme, e.data.index, w.name, cfg.worldTransition.fadeSeconds)
            r.prepareBoss(w.chase.boss)
          } else if (e.type === 'fight') {
            const F = cfg.fight
            r.showFight(
              e.data.step,
              run.fight?.name ?? 'The boss',
              e.data.hits,
              e.data.need,
              F.beatBonus,
            )
          }
        }
        acc -= step
      }
      r.draw(run, Math.min(1, acc / step), Math.min(0.1, step), 0, null)
      if (o.caption) {
        ctx.save()
        ctx.setTransform(S, 0, 0, S, 0, 0)
        ctx.font = `400 22px "Lilita One", system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.lineWidth = 5
        ctx.strokeStyle = '#2a1530'
        ctx.fillStyle = '#ffffff'
        ctx.strokeText(o.caption, view.W / 2, H - 40)
        ctx.fillText(o.caption, view.W / 2, H - 40)
        ctx.restore()
      }
      if (run.ticks >= to || p.done) resolve()
      else requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })
  recorder.stop()
  await done
  return new Blob(chunks, { type: type.split(';')[0] || 'video/webm' })
}
