<script setup lang="ts">
const player = usePlayerStore()
</script>

<template>
  <header class="topbar">
    <NuxtLink to="/profile/stats" class="pill" aria-label="Profile">
      <span class="avatar" aria-hidden="true">🐶</span>
      <span>Best {{ player.best.toLocaleString() }}</span>
    </NuxtLink>
    <span class="pill" aria-label="Biscuits">🦴 {{ player.biscuits.toLocaleString() }}</span>
    <NuxtLink to="/settings" class="gear" aria-label="Settings">⚙︎</NuxtLink>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: calc(var(--safe-top) + 10px) 16px 8px;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 6px 12px;
  font-weight: 900;
  font-size: 14px;
  color: var(--fg);
  text-decoration: none;
}
.avatar {
  font-size: 16px;
}
.gear {
  margin-left: auto;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--fg);
  text-decoration: none;
  font-size: 18px;
}
</style>
