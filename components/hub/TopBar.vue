<script setup lang="ts">
const player = usePlayerStore()
const look = useLook()
</script>

<template>
  <header class="topbar">
    <NuxtLink to="/profile/stats" class="avatar" aria-label="Your profile">
      <DogView :look="look" mode="head" />
    </NuxtLink>
    <NuxtLink to="/closet/store" class="pill" aria-label="Biscuits, open the store">
      <UiIcon name="biscuit" class="ic" />{{ player.biscuits.toLocaleString() }}
    </NuxtLink>
    <NuxtLink to="/closet/store" class="pill" aria-label="Golden Bones, open the store">
      <UiIcon name="bone" class="ic" />{{ player.bones.toLocaleString() }}
    </NuxtLink>
    <NuxtLink to="/settings" class="gear" aria-label="Settings"><UiIcon name="gear" /></NuxtLink>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: calc(var(--safe-top) + 10px) 16px 8px;
}
.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--surface);
  border: 2px solid var(--pink);
  overflow: hidden;
  flex: none;
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
  font-variant-numeric: tabular-nums;
}
.ic {
  font-size: 15px;
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
