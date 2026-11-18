<script setup lang="ts">
/** One of the game's own icons (components/ui/icons.ts). Decorative: hidden from VoiceOver. */
import { ICONS } from './icons'

defineProps<{ name: string }>()
</script>

<template>
  <!-- v-html is safe here: our own static SVG from icons.ts, never user input -->
  <!-- eslint-disable vue/no-v-html -->
  <svg
    class="ui-icon"
    viewBox="0 0 32 32"
    aria-hidden="true"
    focusable="false"
    stroke="#2a1530"
    stroke-width="2"
    stroke-linejoin="round"
    stroke-linecap="round"
    v-html="ICONS[name] ?? ''"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<style>
.ui-icon {
  display: inline-block;
  width: 1.3em;
  height: 1.3em;
  vertical-align: -0.3em;
  flex: none;
  overflow: visible;
}
</style>
