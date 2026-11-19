<script setup lang="ts">
/**
 * Hub hero: Dobie running through Bark Park, drawn entirely from the sprite cache.
 * With `sheet`, it also lays out every baked frame so the cache can be eyeballed.
 */
import { drawTheme } from '~/game/render/backgrounds'
import type { ThemeKind } from '~/game/config'
import { drawSprite, runFrame, SpriteCache, type Sprite } from '~/game/render/sprites'
import type { Look } from '~/logic/look'

const props = withDefaults(
  defineProps<{
    sheet?: boolean
    look?: Look | null
    theme?: ThemeKind
    /** Where the ground goes, in CSS px from the top (so cards below never cover the dog). */
    groundPx?: number | null
  }>(),
  { look: null, theme: 'park', groundPx: null },
)
const hero = ref<HTMLCanvasElement | null>(null)
const sheetCv = ref<HTMLCanvasElement | null>(null)

let raf = 0
let onResize: (() => void) | null = null
let cache: SpriteCache | null = null
let lastScale = 0

function setup(cv: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const r = cv.getBoundingClientRect()
  cv.width = Math.max(1, Math.round(r.width * dpr))
  cv.height = Math.max(1, Math.round(r.height * dpr))
  const S = cv.width / 600
  if (!cache || Math.abs(S - lastScale) > 0.01) {
    cache = new SpriteCache(S, props.look ?? undefined)
    lastScale = S
  }
  const H = cv.height / S
  const GY = props.groundPx ? (props.groundPx * dpr) / S : H * 0.76
  return { S, W: 600, H, GY: Math.round(Math.min(H - 20, Math.max(H * 0.4, GY))) }
}

function drawSheet(cv: HTMLCanvasElement, c: SpriteCache) {
  const all: Sprite[] = [
    ...c.dog.run,
    ...c.dog.jump,
    ...c.dog.dizzy,
    ...Object.values(c.obstacles).flat(),
    c.biscuit,
    c.goldBiscuit,
  ]
  const cols = 8
  const cell = 150
  const rows = Math.ceil(all.length / cols)
  const S = c.scale
  cv.width = cols * cell * S
  cv.height = rows * cell * S
  const ctx = cv.getContext('2d')!
  ctx.scale(S, S)
  ctx.fillStyle = '#f4eef9'
  ctx.fillRect(0, 0, cols * cell, rows * cell)
  all.forEach((s, i) => {
    const x = (i % cols) * cell
    const y = Math.floor(i / cols) * cell
    ctx.strokeStyle = '#e6dcef'
    ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1)
    ctx.drawImage(s.cv, x + (cell - s.w) / 2, y + (cell - s.h) / 2, s.w, s.h)
  })
}

onMounted(async () => {
  await document.fonts?.ready
  const cv = hero.value
  if (!cv) return
  let view = setup(cv)
  const ctx = cv.getContext('2d')!
  if (props.sheet && sheetCv.value && cache) drawSheet(sheetCv.value, cache)

  onResize = () => (view = setup(cv))
  window.addEventListener('resize', onResize)
  watch(
    () => props.groundPx,
    () => (view = setup(cv)),
  )
  watch(
    () => props.look,
    () => {
      cache = null
      view = setup(cv)
    },
    { deep: true },
  )

  let dist = 0
  let runPhase = 0
  let last = performance.now()
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    dist += 150 * dt
    runPhase += dt * 9
    const c = cache!
    ctx.setTransform(view.S, 0, 0, view.S, 0, 0)
    const th = c.theme(props.theme, { W: view.W, H: view.H, GY: view.GY })
    drawTheme(ctx, th, dist, c.cloud)
    ctx.fillStyle = 'rgba(0,0,0,.16)'
    ctx.beginPath()
    ctx.ellipse(view.W / 2 + 8, view.GY + 2, 34, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    drawSprite(ctx, c.dog.run[runFrame(runPhase)]!, view.W / 2, view.GY)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  if (onResize) window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="wrap">
    <canvas ref="hero" class="hero" aria-label="Dobie running through Bark Park" />
    <canvas v-if="sheet" ref="sheetCv" class="sheet" aria-label="Sprite sheet" />
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
}
.hero {
  display: block;
  width: 100%;
  height: 100%;
  background: #bfe8ff;
}
.sheet {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
}
</style>
