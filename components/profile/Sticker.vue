<script setup lang="ts">
/** A boss sticker for the Profile album: the boss drawn by the game's own art, in a round badge. */
import type { BossKind } from '~/game/config'
import { BOSS_BOX, drawBoss } from '~/game/render/bosses'

const props = defineProps<{ boss: BossKind; got: boolean }>()
const cv = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  const c = cv.value!
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const r = c.getBoundingClientRect()
  c.width = Math.round(r.width * dpr)
  c.height = Math.round(r.height * dpr)
  const ctx = c.getContext('2d')!
  const { w, h, ox, oy } = BOSS_BOX
  const s = Math.min(c.width / w, c.height / h) * 0.95
  ctx.setTransform(s, 0, 0, s, (c.width - w * s) / 2 + ox * s, (c.height - h * s) / 2 + oy * s)
  drawBoss(ctx, props.boss, 0)
})
</script>

<template>
  <span class="sticker" :class="{ got }"><canvas ref="cv" aria-hidden="true" /></span>
</template>

<style scoped>
.sticker {
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px dashed var(--line);
  background: var(--surface);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.sticker.got {
  border: 3px solid var(--gold);
  background: #fff7d6;
}
canvas {
  width: 86%;
  height: 86%;
  filter: grayscale(1) brightness(0.3) opacity(0.25);
}
.got canvas {
  filter: none;
}
</style>
