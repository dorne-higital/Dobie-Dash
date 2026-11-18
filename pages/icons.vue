<script setup lang="ts">
/** Dev helper: every icon in components/ui/icons.ts at two sizes. Open /icons. */
import { ICONS } from '~/components/ui/icons'

definePageMeta({ layout: 'bare' })
const names = Object.keys(ICONS)
</script>

<template>
  <section class="sheet">
    <div v-for="n in names" :key="n" class="cell">
      <UiIcon :name="n" class="big" />
      <UiIcon :name="n" />
      <small>{{ n }}</small>
    </div>
  </section>
</template>

<style scoped>
.sheet {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 16px;
  overflow: auto;
  height: 100%;
  background: var(--bg);
}
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: #fff;
  border-radius: 12px;
  padding: 8px;
  font-size: 18px;
}
.big {
  font-size: 44px;
}
small {
  font-size: 11px;
  color: var(--muted);
}
</style>
