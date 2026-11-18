<script setup lang="ts">
/**
 * League (weekly leagues, friends, world boards and the Daily Dash) arrives with the
 * backend in v1.1. For now: your own row, so you can see your dog on the board.
 */
import { makeDog } from '~/game/art/dobie'

definePageMeta({ layout: 'hub' })

const TABS = [
  { key: 'league', label: 'League' },
  { key: 'friends', label: 'Friends' },
  { key: 'world', label: 'World' },
  { key: 'dash', label: 'Daily Dash' },
]
const route = useRoute()
const tab = computed(() => String(route.params.tab ?? 'league'))
const player = usePlayerStore()
const look = useLook()
const rivals = [
  { name: 'Biscuit', breed: 'lab', score: 6120 },
  { name: 'Luna', breed: 'husky', score: 4870 },
  { name: 'Pickle', breed: 'dachshund', score: 2310 },
].map((r) => ({ ...r, look: { dog: makeDog(r.breed), acc: {}, trail: null } }))
const rows = computed(() =>
  [...rivals, { name: player.dog?.name ?? 'You', score: player.best, look: look.value, me: true }]
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 })),
)
</script>

<template>
  <section class="league">
    <h1>League</h1>
    <UiSegmented base="/league" :tabs="TABS" :current="tab" />
    <p class="soon">
      Weekly leagues, friends' ghosts, world boards and the Daily Dash arrive in the next big
      update. Here's how your row will look:
    </p>
    <ol class="board">
      <li v-for="r in rows" :key="r.name" :class="{ me: 'me' in r }">
        <span class="rank">{{ r.rank }}</span>
        <span class="face"><DogView :look="r.look" mode="head" /></span>
        <b>{{ r.name }}</b>
        <span class="score">{{ r.score.toLocaleString() }}</span>
      </li>
    </ol>
    <small class="note">Sample players for now.</small>
  </section>
</template>

<style scoped>
.league {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
h1 {
  margin: 4px 0 0;
  font-size: 34px;
}
.soon,
.note {
  margin: 0;
  color: var(--muted);
}
.board {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
}
.board li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--line);
}
.board li:last-child {
  border-bottom: 0;
}
.board li.me {
  background: #fff1f8;
}
.rank {
  width: 20px;
  font-weight: 900;
  color: var(--muted);
}
.face {
  width: 38px;
  height: 38px;
}
.board b {
  flex: 1;
}
.score {
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}
</style>
