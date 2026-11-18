<script setup lang="ts">
const route = useRoute()
const badges = useBadges()

function badge(key: string): string | null {
  const b = badges.value
  if (key === 'missions' && b.missions) return String(b.missions)
  if (key === 'closet' && b.closet) return ''
  if (key === 'league' && b.league) return ''
  return null
}

const tabs = [
  { key: 'closet', label: 'Closet', to: '/closet/dog', icon: '👕' },
  { key: 'worlds', label: 'Worlds', to: '/worlds', icon: '🗺️' },
  { key: 'run', label: 'Run', to: '/', icon: '🐾' },
  { key: 'league', label: 'League', to: '/league/world', icon: '🏆' },
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
      <span class="icon" aria-hidden="true"
        >{{ t.icon
        }}<span v-if="badge(t.key) !== null" class="badge">{{ badge(t.key) }}</span></span
      >
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
  position: relative;
  font-size: 20px;
  line-height: 1;
}
.badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--collar);
  border: 2px solid var(--surface);
  color: #fff;
  font: 900 10px/1 var(--body);
  display: grid;
  place-items: center;
  box-sizing: content-box;
}
.badge:not(:empty) {
  min-width: 16px;
  height: 16px;
  padding: 0 2px;
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
