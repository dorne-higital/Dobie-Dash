<script setup lang="ts">
import type { MissionDef, Reward } from '~/logic/missions'
import { item } from '~/logic/items'

defineProps<{ def: MissionDef; p: number; claimed: boolean }>()
defineEmits<{ claim: [] }>()

/** Reward pieces: an icon (biscuit or bone) and the amount, or an item name. */
function rewardParts(r: Reward) {
  const parts: { icon?: string; text: string }[] = []
  if (r.biscuits) parts.push({ icon: 'biscuit', text: String(r.biscuits) })
  if (r.bones) parts.push({ icon: 'bone', text: String(r.bones) })
  if (r.item) parts.push({ text: item(r.item)?.name ?? r.item })
  return parts
}
</script>

<template>
  <div class="mission" :class="{ done: p >= def.goal, claimed }">
    <div class="txt">
      <b>{{ def.text }}</b>
      <div class="bar"><i :style="{ width: `${Math.min(100, (p / def.goal) * 100)}%` }" /></div>
      <small>{{ Math.min(p, def.goal).toLocaleString() }} / {{ def.goal.toLocaleString() }}</small>
    </div>
    <UiIcon v-if="claimed" name="check" class="tick" />
    <UiButton v-else-if="p >= def.goal" class="claim" @click="$emit('claim')">Claim</UiButton>
    <span v-else class="reward"
      ><span v-for="(x, i) in rewardParts(def.reward)" :key="i"
        >{{ i ? ' + ' : '' }}<UiIcon v-if="x.icon" :name="x.icon" /> {{ x.text }}</span
      ></span
    >
  </div>
</template>

<style scoped>
.mission {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 12px 14px;
}
.mission.done:not(.claimed) {
  border-color: var(--gold);
  box-shadow: 0 0 0 2px var(--gold);
}
.txt {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bar {
  height: 8px;
  border-radius: 999px;
  background: var(--line);
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--pink);
}
.claimed .bar i {
  background: var(--teal);
}
small {
  color: var(--muted);
  font-size: 12px;
}
.reward {
  font-size: 13px;
  font-weight: 900;
  color: var(--muted);
  text-align: right;
  max-width: 40%;
}
.tick {
  font-size: 22px;
  color: #18a597;
}
.claim {
  padding: 8px 16px;
  font-size: 16px;
}
</style>
