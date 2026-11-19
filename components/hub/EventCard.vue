<script setup lang="ts">
/** The seasonal event on now (Winter Walkies): presents found and the rewards to earn. */
import { activeEvent, eventDaysLeft, nextReward, progress } from '~/logic/calendar'
import { item } from '~/logic/items'

const player = usePlayerStore()
const now = useNow()
const ev = computed(() => activeEvent(now.value))
const have = computed(() => (ev.value ? progress(player, ev.value) : 0))
const next = computed(() => (ev.value ? nextReward(player, ev.value) : null))
const last = computed(() => ev.value?.rewards.at(-1)?.at ?? 1)
</script>

<template>
  <section v-if="ev" class="event" aria-label="Seasonal event">
    <div class="top">
      <UiIcon name="gift" class="ic" />
      <div class="t">
        <h2>{{ ev.name }}</h2>
        <small>{{ eventDaysLeft(ev, now) }} days left</small>
      </div>
      <b class="count">{{ have }}<small> presents</small></b>
    </div>
    <p>{{ ev.blurb }}</p>
    <div class="bar"><i :style="{ width: `${Math.min(100, (have / last) * 100)}%` }" /></div>
    <ul class="rewards">
      <li v-for="r in ev.rewards" :key="r.item" :class="{ got: have >= r.at }">
        <UiIcon :name="have >= r.at ? 'check' : 'lock'" />
        <span>{{ item(r.item)?.name }}</span>
        <small>{{ r.at }}</small>
      </li>
    </ul>
    <small v-if="next" class="next"
      >{{ next.at - have }} more for the {{ item(next.item)?.name }}</small
    >
    <small v-else class="next">All rewards earned. Happy holidays!</small>
  </section>
</template>

<style scoped>
.event {
  background: linear-gradient(160deg, #e6f4ff 0%, var(--surface) 70%);
  border: 2px solid #8cc8ff;
  border-radius: 22px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 4px 0 #5aa7ee;
}
.top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ic {
  width: 36px;
  height: 36px;
  flex: none;
}
.t {
  flex: 1;
  min-width: 0;
}
h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1;
}
.t small,
p,
.next {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}
p {
  margin: 0;
}
.count {
  font-family: var(--display);
  font-weight: 400;
  font-size: 24px;
  color: #e5484d;
}
.count small {
  font-family: var(--body);
  font-size: 12px;
  font-weight: 900;
}
.bar {
  height: 10px;
  background: #d8ebfb;
  border-radius: 999px;
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #e5484d, #ff8a8d);
}
.rewards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.rewards li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 6px 2px;
  font-size: 12px;
  font-weight: 900;
  text-align: center;
}
.rewards li.got {
  border-color: var(--teal);
}
.rewards :deep(.ui-icon) {
  width: 16px;
  height: 16px;
}
.rewards small {
  color: var(--muted);
}
</style>
