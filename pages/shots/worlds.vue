<script setup lang="ts">
/**
 * Dev tools (M8): the "All worlds" App Store shot. Each of the eight worlds drawn by the
 * real renderer from a bot run a few seconds in, with the demo dog. Not in the App Store build.
 */
import { loadGameConfig } from '~/game/config'
import { Renderer, type View } from '~/game/render/renderer'
import { Run } from '~/game/run'
import { lookFor } from '~/logic/look'

definePageMeta({ layout: 'bare' })
if (!useRuntimeConfig().public.devTools) await navigateTo('/', { replace: true })

const cfg = loadGameConfig()
const worlds = cfg.worlds.filter((w) => w.enabled)
const player = usePlayerStore()
const tiles = ref<HTMLCanvasElement[]>([])

onMounted(async () => {
  await document.fonts.ready
  const look = lookFor(player.dog, player)
  tiles.value.forEach((cv, i) => {
    const r = cv.getBoundingClientRect()
    const dpr = Math.min(3, window.devicePixelRatio || 1)
    cv.width = Math.round(r.width * dpr)
    cv.height = Math.round(r.height * dpr)
    const W = 300
    const S = cv.width / W
    const H = cv.height / S
    const view: View = { S, W, H, GY: Math.round(H * 0.8), safeTop: 0, insetLeft: 0 }
    const renderer = new Renderer(cv.getContext('2d')!, view, look)
    renderer.hud = false
    const run = new Run(cfg, 40 + i * 7, W, { autoplay: true, invincible: true, startWorld: i })
    for (let k = 0; k < 60 * 3; k++) run.update()
    renderer.reset(run.world.theme)
    renderer.prepareTwist(run.world.twist ?? null)
    renderer.prepareBoss(run.world.chase.boss)
    renderer.draw(run, 1, 1 / 60, 0, null)
  })
})
</script>

<template>
  <div class="montage">
    <div v-for="(w, i) in worlds" :key="w.id" class="tile">
      <canvas :ref="(el) => (tiles[i] = el as HTMLCanvasElement)" />
      <span>{{ i + 1 }} · {{ w.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.montage {
  position: fixed;
  inset: 0;
  background: #2a1530;
  padding: 54px 10px 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(4, 1fr);
  gap: 8px;
}
.tile {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: #cfe8ff;
}
canvas {
  display: block;
  width: 100%;
  height: 100%;
}
span {
  position: absolute;
  left: 8px;
  bottom: 8px;
  background: rgba(42, 21, 48, 0.8);
  color: #fff;
  font-weight: 900;
  font-size: 12px;
  border-radius: 999px;
  padding: 3px 9px;
}
</style>
