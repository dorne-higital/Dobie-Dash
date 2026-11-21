<script setup lang="ts">
/**
 * The "built by dh" loader covers the app from launch until the first page has rendered
 * (and the save has loaded, which happens before that), for at least `minMs` so the flip
 * plays and at most `maxMs`. In the iOS app it replaces the native splash the moment it's
 * on screen. On the web it shows only with `?loader` (dev), and `/loader?still` shows the
 * first frame that the launch image is made from.
 */
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import L from '~/content/loader.json'

const native = Capacitor.isNativePlatform()
const params = new URLSearchParams(location.search)
const still = location.pathname === '/loader' && params.has('still')
const show = ref(native || params.has('loader') || still)
const leaving = ref(false)

if (show.value && !still) {
  const born = performance.now()
  let done = false
  const finish = () => {
    if (done) return
    done = true
    const wait = Math.max(0, L.minMs - (performance.now() - born))
    setTimeout(() => {
      leaving.value = true
      setTimeout(() => (show.value = false), L.fadeMs)
    }, wait)
  }
  useNuxtApp().hook('page:finish', finish)
  setTimeout(finish, L.maxMs)
  onMounted(() => {
    if (native) void SplashScreen.hide({ fadeOutDuration: 0 }).catch(() => {})
  })
}
</script>

<template>
  <DesktopFrame>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </DesktopFrame>
  <AppLoader v-if="show" :still="still" :leaving="leaving" />
</template>
