<script setup lang="ts">
/**
 * Draws a dog: running (baked frames), standing or sitting (tail wags) or as a head-only
 * avatar. Used on home, the dog maker, the Closet preview, the top bar and league rows.
 */
import { pup } from '~/game/art/dobie'
import { bakeDog, drawSprite, runFrame, type DogSprites } from '~/game/render/sprites'
import type { Look } from '~/logic/look'

const props = withDefaults(defineProps<{ look: Look; mode?: 'run' | 'idle' | 'sit' | 'head' }>(), {
  mode: 'idle',
})

const cv = ref<HTMLCanvasElement | null>(null)
let raf = 0
let frames: DogSprites | null = null
let framesKey = ''
let scale = 1

/** Logical box per mode: width, height, and where the dog's origin (feet) sits. */
function box() {
  if (props.mode === 'head') {
    const d = props.look.dog
    return { w: 64, h: 64, ox: 32 - d.hx, oy: 34 - d.hy }
  }
  return { w: 150, h: 128, ox: 72, oy: 112 }
}

function size() {
  const c = cv.value!
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const r = c.getBoundingClientRect()
  c.width = Math.max(1, Math.round(r.width * dpr))
  c.height = Math.max(1, Math.round(r.height * dpr))
  const b = box()
  scale = Math.min(c.width / b.w, c.height / b.h)
}

function draw(t: number) {
  const c = cv.value?.getContext('2d')
  if (!c) return
  const b = box()
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.clearRect(0, 0, cv.value!.width, cv.value!.height)
  const offX = (cv.value!.width / scale - b.w) / 2
  const offY = (cv.value!.height / scale - b.h) / 2
  c.setTransform(scale, 0, 0, scale, (offX + b.ox) * scale, (offY + b.oy) * scale)
  const { dog, acc } = props.look
  if (props.mode === 'run') {
    const key = JSON.stringify([dog.breed, dog.coatName, dog.ears, dog.tail, dog.eye, acc, scale])
    if (key !== framesKey) {
      frames = bakeDog(scale, dog, acc)
      framesKey = key
    }
    drawSprite(c, frames!.run[runFrame(t * 9)]!, 0, 0)
  } else if (props.mode === 'head') {
    pup(c, dog, 'icon', 0, 0, { acc })
  } else {
    pup(c, dog, props.mode === 'sit' ? 'sit' : 'idle', t, 0, { acc })
  }
}

function start() {
  cancelAnimationFrame(raf)
  if (!cv.value) return
  size()
  if (props.mode === 'head') {
    draw(0)
    return
  }
  const t0 = performance.now()
  const loop = (now: number) => {
    draw((now - t0) / 1000)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
}

let ro: ResizeObserver | null = null
onMounted(() => {
  start()
  ro = new ResizeObserver(() => start())
  if (cv.value) ro.observe(cv.value)
})
watch(
  () => [props.look, props.mode],
  () => start(),
  { deep: true },
)
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
})
</script>

<template>
  <canvas ref="cv" class="dogview" :aria-label="`${look.dog.coatName} ${look.dog.breed}`" />
</template>

<style scoped>
.dogview {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
