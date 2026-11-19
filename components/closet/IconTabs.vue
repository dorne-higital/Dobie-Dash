<script setup lang="ts">
/** The Wardrobe's four big icon tabs (My dog, Outfits, Trails, Collars), as links. */
defineProps<{ current: string }>()
const TABS = [
  { key: 'dog', label: 'My dog', icon: 'dog' },
  { key: 'outfits', label: 'Outfits', icon: 'hat' },
  { key: 'trails', label: 'Trails', icon: 'rainbow' },
  { key: 'collars', label: 'Collars', icon: 'collar' },
]
</script>

<template>
  <nav class="tabs" aria-label="Wardrobe sections">
    <NuxtLink
      v-for="t in TABS"
      :key="t.key"
      :to="`/closet/${t.key}`"
      class="tab"
      :class="{ on: t.key === current }"
      :aria-current="t.key === current ? 'page' : undefined"
      replace
    >
      <UiIcon :name="t.icon" class="ic" />
      <span>{{ t.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 2px 6px;
  border-radius: 18px;
  background: var(--surface);
  border: 2px solid var(--line);
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 900;
  text-decoration: none;
  min-width: 0;
}
.tab .ic {
  width: 30px;
  height: 30px;
}
.tab.on {
  background: #ffe3f1;
  border-color: var(--pink);
  color: var(--pink);
  box-shadow: 0 3px 0 #e0338a;
}
.tab:focus-visible {
  outline: 3px solid var(--gold);
}
</style>
