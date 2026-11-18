<script setup lang="ts">
/** Tabs along the top of a hub page, as links (each tab is its own route). */
defineProps<{ base: string; tabs: { key: string; label: string }[]; current: string }>()
</script>

<template>
  <nav class="seg" aria-label="Sections">
    <NuxtLink
      v-for="t in tabs"
      :key="t.key"
      :to="`${base}/${t.key}`"
      class="seg-item"
      :class="{ on: t.key === current }"
      :aria-current="t.key === current ? 'page' : undefined"
      replace
      >{{ t.label }}</NuxtLink
    >
  </nav>
</template>

<style scoped>
.seg {
  display: flex;
  gap: 4px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px;
}
.seg-item {
  flex: 1;
  text-align: center;
  padding: 7px 2px;
  border-radius: 999px;
  color: var(--muted);
  text-decoration: none;
  font-weight: 900;
  font-size: 13px;
  white-space: nowrap;
}
.seg-item.on {
  background: var(--pink);
  color: #fff;
}
</style>
