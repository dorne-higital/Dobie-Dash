<script setup lang="ts">
const route = useRoute()

const tabs = [
  { key: 'closet', label: 'Closet', to: '/closet/looks', icon: '👕' },
  { key: 'worlds', label: 'Worlds', to: '/worlds', icon: '🗺️' },
  { key: 'run', label: 'Run', to: '/', icon: '🐾' },
  { key: 'league', label: 'League', to: '/league/league', icon: '🏆' },
  { key: 'missions', label: 'Missions', to: '/missions/daily', icon: '✅' },
] as const

function isActive(key: string) {
  const first = route.path.split('/')[1] ?? ''
  return key === 'run' ? first === '' : first === key
}
</script>

<template>
  <nav class="tabbar" aria-label="Main">
    <NuxtLink
      v-for="t in tabs"
      :key="t.key"
      :to="t.to"
      class="tab"
      :class="{ active: isActive(t.key), run: t.key === 'run' }"
      :aria-current="isActive(t.key) ? 'page' : undefined"
    >
      <span class="icon" aria-hidden="true">{{ t.icon }}</span>
      <span class="label">{{ t.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: end;
  height: calc(var(--tabbar-h) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: var(--surface);
  border-top: 1px solid var(--line);
  z-index: 10;
}
.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0 10px;
  color: var(--muted);
  text-decoration: none;
  font-size: 11px;
  font-weight: 900;
}
.tab .icon {
  font-size: 20px;
  line-height: 1;
}
.tab.active {
  color: var(--pink);
}
.tab.run .icon {
  width: 54px;
  height: 54px;
  margin-top: -22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--pink);
  box-shadow: 0 8px 18px -8px rgba(255, 79, 160, 0.9);
  font-size: 24px;
}
</style>
