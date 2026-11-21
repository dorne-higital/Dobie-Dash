<script setup lang="ts">
/**
 * Dev tools (M8): the App Store preview video. Start screen recording on the phone (with
 * `npm run phone`), open /preview and tap Start: a scripted run with a power-up and near
 * misses, the first boss knocked out, the Wardrobe, then the end card with the app icon.
 * Shot list: store/preview-video.md. Not in the App Store build.
 */
import shots from '~/content/shots.json'

definePageMeta({ layout: 'bare' })
if (!useRuntimeConfig().public.devTools) await navigateTo('/', { replace: true })

function go() {
  void navigateTo(`/run?shot=preview&power=${shots.preview.power}`)
}
</script>

<template>
  <div class="start">
    <p>Start screen recording, then tap Start. Stop recording on the end card.</p>
    <UiButton @click="go">Start</UiButton>
  </div>
</template>

<style scoped>
.start {
  position: fixed;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
  background: #2a1530;
  color: #fff;
  font-weight: 800;
}
</style>
