<script setup lang="ts">
/**
 * "Built by dh" loader (M8). Its first frame is identical to the iOS launch image (same
 * colour, mark, size and place; `npm run splash` renders the image from `/loader?still`),
 * so the hand-over from the native splash is invisible. Then the dh monogram flips over to
 * the app icon until the app is ready. Inline SVG and CSS only: nothing to fetch but the
 * icon, which is in the bundle. Everything tunable is in content/loader.json.
 */
import L from '~/content/loader.json'

defineProps<{ still?: boolean; leaving?: boolean }>()

const vars = {
  '--l-bg': L.bg,
  '--l-fg': L.fg,
  '--l-accent': L.accent,
  '--l-mark': `${L.markHeight}cqh`,
  '--l-bottom': `${L.creditBottom}cqh`,
  '--l-credit': `${L.creditSize}cqh`,
  '--l-hold': `${L.holdMs}ms`,
  '--l-flip': `${L.flipMs}ms`,
  '--l-fade': `${L.fadeMs}ms`,
}
const [built, by] = L.credit.split(/ (?=\S+$)/)
</script>

<template>
  <div class="loader" :class="{ still, leaving }" :style="vars" aria-hidden="true">
    <div class="stage">
      <svg class="mono" viewBox="0 0 100 100">
        <rect x="3" y="3" width="94" height="94" rx="24" class="box" />
        <circle cx="30.5" cy="60" r="12" class="ink" />
        <path d="M42.5 27v45.5M57.5 27v45.5M57.5 59q0-12.5 11-12.5t11 12.5v13.5" class="ink" />
      </svg>
      <img v-if="!still" class="icon" src="/icon-512.png" alt="" />
    </div>
    <div class="credit">
      {{ built }} <b>{{ by }}</b>
    </div>
  </div>
</template>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 1000;
  container-type: size;
  background: var(--l-bg);
  display: grid;
  place-items: center;
  transition: opacity var(--l-fade) ease-out;
}
.loader.leaving {
  opacity: 0;
  pointer-events: none;
}
.stage {
  position: relative;
  width: var(--l-mark);
  height: var(--l-mark);
  perspective: 60cqh;
}
.mono,
.icon {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}
.box {
  fill: none;
  stroke: var(--l-fg);
  stroke-width: 4;
}
.ink {
  fill: none;
  stroke: var(--l-fg);
  stroke-width: 8.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.icon {
  border-radius: 22%;
  transform: rotateY(-90deg);
  opacity: 0;
}
.loader:not(.still) .mono {
  animation: out var(--l-flip) ease-in var(--l-hold) forwards;
}
.loader:not(.still) .icon {
  animation: in var(--l-flip) ease-out calc(var(--l-hold) + var(--l-flip) * 0.5) forwards;
}
@keyframes out {
  to {
    transform: rotateY(90deg);
    opacity: 0;
  }
}
@keyframes in {
  to {
    transform: rotateY(0);
    opacity: 1;
  }
}
.credit {
  position: absolute;
  left: 0;
  right: 0;
  bottom: var(--l-bottom);
  text-align: center;
  font:
    700 var(--l-credit) / 1 ui-monospace,
    'SF Mono',
    Menlo,
    monospace;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--l-fg);
  opacity: 0.62;
}
.credit b {
  color: var(--l-accent);
}
/* Reduce Motion: no flip, the icon simply replaces the monogram. */
:global(.reduce-motion) .loader:not(.still) .mono,
:global(.reduce-motion) .loader:not(.still) .icon {
  animation-duration: 1ms;
}
@media (prefers-reduced-motion: reduce) {
  .loader:not(.still) .mono,
  .loader:not(.still) .icon {
    animation-duration: 1ms;
  }
}
</style>
