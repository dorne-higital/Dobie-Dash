<script setup lang="ts">
/** "You got…" sheet for chests, missions, streak days and unlocks. */
import { item } from '~/logic/items'
import type { Reward } from '~/logic/missions'

defineProps<{ title: string; reward: Reward; note?: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="reward-title">
      <UiIcon name="party" class="burst" />
      <h2 id="reward-title">{{ title }}</h2>
      <ul class="got">
        <li v-if="reward.biscuits">
          <UiIcon name="biscuit" /> {{ reward.biscuits.toLocaleString() }} biscuits
        </li>
        <li v-if="reward.bones"><UiIcon name="bone" /> {{ reward.bones }} Golden Bones</li>
        <li v-if="reward.item">
          <UiIcon name="sparkle" /> {{ item(reward.item)?.name ?? reward.item }}
        </li>
      </ul>
      <p v-if="note" class="note">{{ note }}</p>
      <UiButton big @click="$emit('close')">Nice!</UiButton>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(20, 10, 30, 0.55);
  display: grid;
  place-items: center;
  padding: 16px;
  cursor: default;
}
.sheet {
  width: min(320px, 100%);
  background: var(--cream);
  border-radius: 28px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}
.burst {
  font-size: 44px;
}
h2 {
  margin: 0;
  font-size: 30px;
  color: var(--plum);
}
.got {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 18px;
  font-weight: 900;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.note {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
</style>
