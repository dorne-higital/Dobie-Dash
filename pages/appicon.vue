<script setup lang="ts">
/**
 * Dev helper: the app icon, drawn with the game's own art. Open /appicon with `npm run icon`
 * running and press Save: it writes the App Store icon and the web icons (scripts/save-icon.mjs).
 */
import { pup } from '~/game/art/dobie'
import { dogArt } from '~/logic/look'

definePageMeta({ layout: 'bare' })
const cv = ref<HTMLCanvasElement | null>(null)
const saved = ref('')
const S = 1024

/** The icon redrawn at `size`; `round` gives the favicon its rounded corners (transparent). */
function at(size: number, round = false) {
  const cv2 = document.createElement('canvas')
  cv2.width = cv2.height = size
  const c = cv2.getContext('2d')!
  if (round) {
    c.beginPath()
    c.roundRect(0, 0, size, size, size * 0.22)
    c.clip()
  }
  c.imageSmoothingQuality = 'high'
  c.drawImage(cv.value!, 0, 0, size, size)
  return cv2.toDataURL('image/png')
}

function draw(c: CanvasRenderingContext2D) {
  // Pink background with a soft sunburst.
  const g = c.createRadialGradient(S / 2, S * 0.45, 40, S / 2, S / 2, S * 0.75)
  g.addColorStop(0, '#ff8cc4')
  g.addColorStop(0.55, '#ff4fa0')
  g.addColorStop(1, '#c92e7d')
  c.fillStyle = g
  c.fillRect(0, 0, S, S)
  c.save()
  c.translate(S / 2, S * 0.52)
  c.fillStyle = 'rgba(255,255,255,.09)'
  for (let i = 0; i < 16; i++) {
    c.rotate((Math.PI * 2) / 16)
    c.beginPath()
    c.moveTo(0, 0)
    c.lineTo(-70, -900)
    c.lineTo(70, -900)
    c.closePath()
    if (i % 2 === 0) c.fill()
  }
  c.restore()
  // Gold sun behind the head, plum outline like every sprite.
  c.beginPath()
  c.arc(S / 2, S * 0.5, 330, 0, Math.PI * 2)
  c.fillStyle = '#ffd23f'
  c.fill()
  c.lineWidth = 22
  c.strokeStyle = '#2a1530'
  c.stroke()
  c.beginPath()
  c.arc(S / 2, S * 0.5, 285, 0, Math.PI * 2)
  c.fillStyle = '#ffe680'
  c.fill()
  // Speed lines streaking off to the left.
  c.lineCap = 'round'
  for (const [y, len] of [
    [380, 170],
    [470, 230],
    [560, 150],
  ] as const) {
    c.strokeStyle = '#2a1530'
    c.lineWidth = 34
    c.beginPath()
    c.moveTo(70, y)
    c.lineTo(70 + len, y)
    c.stroke()
    c.strokeStyle = '#fff'
    c.lineWidth = 18
    c.stroke()
  }
  // Dobie's face peeking out of the sun: the in-game avatar drawing, clipped to the circle.
  const dog = dogArt(null)
  const k = 11
  c.save()
  c.beginPath()
  c.arc(S / 2, S * 0.5, 319, 0, Math.PI * 2)
  c.clip()
  c.translate(S / 2 - dog.hx * k + 10, S * 0.5 - dog.hy * k + 30)
  c.scale(k, k)
  pup(c, dog, 'icon', 0, 0, { acc: {} })
  c.restore()
}

onMounted(() => {
  const c = cv.value!.getContext('2d')!
  draw(c)
})

async function save() {
  const files = {
    ios: cv.value!.toDataURL('image/png'),
    touch: at(180),
    icon512: at(512),
    favicon: at(64, true),
    favicon32: at(32, true),
  }
  try {
    await fetch('http://127.0.0.1:8765/', {
      method: 'POST',
      body: JSON.stringify(files),
      mode: 'no-cors',
    })
    saved.value = 'Sent'
  } catch {
    saved.value = 'Start the saver first: npm run icon'
  }
}
</script>

<template>
  <section class="wrap">
    <canvas ref="cv" :width="S" :height="S" />
    <button type="button" @click="save">Save to iOS project</button>
    <small>{{ saved }}</small>
  </section>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
}
canvas {
  width: 100%;
  max-width: 340px;
  border-radius: 22%;
  box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.5);
}
</style>
