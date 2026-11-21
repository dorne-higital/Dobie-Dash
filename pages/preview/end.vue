<script setup lang="ts">
/** Dev tools (M8): the preview video's last shot, the app icon. Not in the App Store build. */
import shots from '~/content/shots.json'

definePageMeta({ layout: 'bare' })
if (!useRuntimeConfig().public.devTools) await navigateTo('/', { replace: true })
const end = shots.preview.end
</script>

<template>
  <div class="end">
    <img src="/icon-512.png" alt="" width="200" height="200" />
    <h1>{{ end.title }}</h1>
    <p>{{ end.sub }}</p>
  </div>
</template>

<style scoped>
.end {
  position: fixed;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  background:
    radial-gradient(circle at 50% 40%, rgba(255, 79, 160, 0.45), transparent 60%), #2a1530;
  color: #fff;
  animation: in 0.6s ease-out both;
}
img {
  border-radius: 44px;
  box-shadow: 0 20px 50px -18px rgba(0, 0, 0, 0.8);
  animation: pop 0.7s cubic-bezier(0.2, 1.6, 0.4, 1) both;
}
h1 {
  margin: 14px 0 0;
  font-size: 44px;
  font-weight: 400;
}
p {
  margin: 0;
  font-weight: 800;
  color: #ffd9ec;
}
@keyframes in {
  from {
    opacity: 0;
  }
}
@keyframes pop {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .end,
  img {
    animation: none;
  }
}
</style>
