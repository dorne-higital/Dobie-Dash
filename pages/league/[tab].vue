<script setup lang="ts">
/**
 * League: Game Center boards (World and Friends, all-time and this week) with each
 * player's best world beside their name. Weekly leagues and the Daily Dash arrive with
 * the backend in v1.1.
 */
import { loadGameConfig } from '~/game/config'
import type { Board, LeaderboardEntry } from '~/services/types'

definePageMeta({ layout: 'hub' })

const TABS = [
  { key: 'world', label: 'World' },
  { key: 'friends', label: 'Friends' },
  { key: 'league', label: 'League' },
  { key: 'dash', label: 'Daily Dash' },
]
const route = useRoute()
const tab = computed(() => String(route.params.tab ?? 'world'))
const player = usePlayerStore()
const look = useLook()
const gc = useGameCenter()
const worlds = loadGameConfig().worlds
const when = ref<Board>('allTime')
const rows = ref<LeaderboardEntry[]>([])
const loading = ref(false)

async function load() {
  if (tab.value !== 'world' && tab.value !== 'friends') return
  loading.value = true
  await gc.signIn()
  rows.value = await gc.board(when.value, tab.value === 'friends' ? 'friends' : 'global')
  loading.value = false
}
watch([tab, when], load, { immediate: true })
</script>

<template>
  <section class="league">
    <h1>League</h1>
    <UiSegmented base="/league" :tabs="TABS" :current="tab" />

    <template v-if="tab === 'world' || tab === 'friends'">
      <div class="when">
        <button type="button" :class="{ on: when === 'allTime' }" @click="when = 'allTime'">
          All time
        </button>
        <button type="button" :class="{ on: when === 'weekly' }" @click="when = 'weekly'">
          This week
        </button>
      </div>

      <div v-if="!gc.me.value && !loading" class="empty">
        <p>Leaderboards use Game Center. Sign in to see how you rank.</p>
        <UiButton @click="load">Sign in to Game Center</UiButton>
        <small>In the browser, leaderboards are in the iPhone app.</small>
      </div>
      <p v-else-if="loading" class="empty">Loading…</p>
      <p v-else-if="!rows.length" class="empty">
        No scores yet{{ tab === 'friends' ? ' from your friends' : '' }}. Go set one!
      </p>
      <ol v-else class="board">
        <li v-for="r in rows" :key="`${r.rank}-${r.name}`" :class="{ me: r.me }">
          <span class="rank">{{ r.rank }}</span>
          <span class="face"
            ><DogView v-if="r.me" :look="look" mode="head" /><UiIcon v-else name="dog"
          /></span>
          <span class="who">
            <b>{{ r.me ? (player.dog?.name ?? r.name) : r.name }}</b>
            <small>{{ worlds[r.world]?.name ?? 'Bark Park' }}</small>
          </span>
          <span class="score">{{ r.score.toLocaleString() }}</span>
        </li>
      </ol>
      <UiButton v-if="gc.me.value" variant="ghost" @click="gc.show()">Open Game Center</UiButton>
    </template>

    <div v-else class="empty">
      <p>
        {{
          tab === 'league'
            ? 'Weekly leagues of 30 players, with promotion every Monday, arrive in the next big update.'
            : 'The Daily Dash, one course for everyone each day, arrives in the next big update.'
        }}
      </p>
    </div>
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
.when {
  display: flex;
  gap: 6px;
}
.when button {
  flex: 1;
  padding: 7px;
  border-radius: 999px;
  border: 2px solid var(--line);
  background: var(--surface);
  font-weight: 900;
  color: var(--muted);
  cursor: pointer;
}
.when button.on {
  border-color: var(--pink);
  color: var(--pink);
}
.empty {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  text-align: center;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  margin: 0;
}
.empty p {
  margin: 0;
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
  width: 26px;
  font-weight: 900;
  color: var(--muted);
}
.face {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  font-size: 22px;
}
.who {
  flex: 1;
  min-width: 0;
}
.who b,
.who small {
  display: block;
}
.who small {
  color: var(--muted);
  font-size: 12px;
}
.score {
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}
</style>
