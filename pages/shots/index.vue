<script setup lang="ts">
/**
 * Dev tools (M8): App Store screenshots. `/shots?n=1` … `5` composes one image at the
 * 6.9-inch iPhone size (open at 440×956, 3× scale = 1320×2868): a caption, and the real
 * app below it in a rounded screen, loaded in an iframe with its own screenshot mode.
 * `npm run shots` captures all five into store/screenshots. Not in the App Store build.
 */
import shots from '~/content/shots.json'

definePageMeta({ layout: 'bare' })
if (!useRuntimeConfig().public.devTools) await navigateTo('/', { replace: true })

const route = useRoute()
const shot = computed(
  () => shots.captions.find((c) => c.n === Number(route.query.n ?? 1)) ?? shots.captions[0]!,
)
</script>

<template>
  <div class="shot">
    <div class="cap">
      <h1>{{ shot.title }}</h1>
      <p>{{ shot.sub }}</p>
    </div>
    <div class="screen">
      <iframe :src="shot.path" title="Dobie Dash" width="440" height="956" />
    </div>
  </div>
</template>

<style scoped>
.shot {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 10%, rgba(255, 79, 160, 0.55), transparent 55%),
    radial-gradient(circle at 90% 30%, rgba(255, 210, 63, 0.35), transparent 50%),
    linear-gradient(170deg, #3b1d47 0%, #2a1530 70%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cap {
  padding: 46px 24px 0;
  text-align: center;
  color: #fff;
}
h1 {
  margin: 0;
  font-family: var(--display);
  font-weight: 400;
  font-size: 40px;
  line-height: 1.05;
  text-wrap: balance;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.25);
}
p {
  margin: 8px 0 0;
  font-weight: 800;
  font-size: 17px;
  color: #ffd9ec;
}
.screen {
  margin-top: 26px;
  width: 360px;
  height: 782px;
  flex: none;
  border-radius: 46px;
  border: 7px solid #120a17;
  overflow: hidden;
  box-shadow: 0 24px 50px -20px rgba(0, 0, 0, 0.7);
  background: #f6f1fb;
}
iframe {
  border: 0;
  display: block;
  transform: scale(0.8);
  transform-origin: 0 0;
}
</style>
