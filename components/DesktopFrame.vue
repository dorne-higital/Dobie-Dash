<script setup lang="ts">
/**
 * On a desktop browser the game sits in a phone-sized frame, centred, instead of filling
 * the screen. Once content/site.json has an App Store link, a panel beside it promotes the
 * iPhone app. Phones and the iOS app never see any of this (CSS media query + native check).
 */
import { Capacitor } from '@capacitor/core'
import site from '~/content/site.json'

const native = Capacitor.isNativePlatform()
const appStoreUrl = site.appStoreUrl as string | null
</script>

<template>
  <div class="desk" :class="{ native }">
    <div class="device"><slot /></div>
    <aside v-if="appStoreUrl && !native" class="promo">
      <h2>{{ site.promo.title }}</h2>
      <p>{{ site.promo.text }}</p>
      <a :href="appStoreUrl" target="_blank" rel="noopener" class="cta">{{ site.promo.cta }}</a>
    </aside>
  </div>
</template>

<style scoped>
.desk,
.device {
  height: 100%;
}
.promo {
  display: none;
}
@media (min-width: 760px) and (hover: hover) and (pointer: fine) {
  .desk:not(.native) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 48px;
    padding: 24px;
    background:
      radial-gradient(circle at 30% 20%, #ffd6ea, transparent 50%),
      radial-gradient(circle at 80% 80%, #d6e8ff, transparent 50%), #2a1530;
  }
  .desk:not(.native) .device {
    position: relative;
    width: 400px;
    height: min(866px, calc(100vh - 48px));
    border-radius: 44px;
    overflow: hidden;
    flex: none;
    /* Makes position:fixed children (tab bar, sheets) stay inside the frame. */
    transform: translateZ(0);
    box-shadow:
      0 0 0 10px #0c0b10,
      0 0 0 12px #3a3644,
      0 40px 80px -30px rgba(0, 0, 0, 0.8);
  }
  .promo {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 320px;
    color: #fff;
  }
  .promo h2 {
    margin: 0;
    font-size: 40px;
    line-height: 1.05;
  }
  .promo p {
    margin: 0;
    opacity: 0.85;
  }
  .cta {
    align-self: flex-start;
    background: #fff;
    color: var(--plum);
    border-radius: 999px;
    padding: 12px 22px;
    font-weight: 900;
    text-decoration: none;
  }
}
</style>
