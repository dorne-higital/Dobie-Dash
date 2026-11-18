<script setup lang="ts">
import { loadGameConfig } from '~/game/config'

definePageMeta({ layout: 'hub' })
const worlds = loadGameConfig().worlds
</script>

<template>
  <section class="worlds">
    <h1>Worlds</h1>
    <ol class="list">
      <li v-for="(w, i) in worlds" :key="w.id" class="world" :class="{ locked: !w.enabled }">
        <span class="num">{{ i + 1 }}</span>
        <div class="info">
          <b>{{ w.name }}</b>
          <span>{{ w.at === 0 ? 'Start' : `${w.at.toLocaleString()} points` }}</span>
        </div>
        <span v-if="!w.enabled" class="soon">M2</span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
h1 {
  margin: 4px 0 14px;
  font-size: 34px;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.world {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 14px 16px;
}
.world.locked {
  opacity: 0.6;
}
.num {
  font-family: var(--display);
  font-size: 26px;
  color: var(--pink);
  width: 24px;
}
.info {
  display: flex;
  flex-direction: column;
}
.info span {
  color: var(--muted);
  font-size: 13px;
}
.soon {
  margin-left: auto;
  font-size: 11px;
  font-weight: 900;
  background: var(--gold);
  color: var(--plum);
  border-radius: 999px;
  padding: 2px 9px;
}
</style>
