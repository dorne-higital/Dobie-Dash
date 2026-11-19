<script setup lang="ts">
/**
 * League (M6, on Supabase): World boards (all time and this week, with your own rank),
 * Friends (add by code), your weekly League of 30 (top 5 go up a tier on Monday, bottom 5
 * down) and the Daily Dash. Every score here was checked by replaying the run.
 */
import site from '~/content/site.json'
import sb from '~/content/supabase.json'
import { loadGameConfig } from '~/game/config'
import { lookFromBoard } from '~/logic/look'
import { NAME_PROBLEM_TEXT, type NameProblem } from '~/logic/names'
import type { BoardRow } from '~/composables/useBoards'

definePageMeta({ layout: 'hub' })
const online = useOnline()
const boards = useBoards()
const look = useLook()
const now = useNow()
const router = useRouter()
const { rewarded } = useAds()

const TABS = [
  { key: 'world', label: 'World' },
  { key: 'friends', label: 'Friends' },
  { key: 'league', label: 'League' },
  { key: 'dash', label: 'Daily Dash' },
]
const route = useRoute()
const tab = computed(() => String(route.params.tab ?? 'world'))
const worlds = loadGameConfig().worlds
const when = ref<'all' | 'week'>('all')
const rows = ref<BoardRow[]>([])
const mine = ref<{ rank: number; score: number; total: number } | null>(null)
const loading = ref(false)
const failed = ref(false)
const dailySeed = ref<number | null>(null)
const dailyUsed = ref(0)

async function load() {
  loading.value = true
  failed.value = false
  if (!(await boards.signIn())) {
    failed.value = true
    loading.value = false
    return
  }
  mine.value = null
  if (tab.value === 'world') {
    const [r, m] = await Promise.all([boards.board(when.value), boards.myRank(when.value)])
    rows.value = r
    mine.value = m
  } else if (tab.value === 'friends') rows.value = await boards.friends()
  else if (tab.value === 'league') rows.value = await boards.league()
  else {
    const d = await boards.dailyToday()
    dailySeed.value = d?.seed ?? null
    rows.value = d?.rows ?? []
  }
  loading.value = false
}
watch([tab, when], load, { immediate: true })
onMounted(() => void boards.claimRewards())

/** Is my own row outside the list shown (World board)? Then show it under the list. */
const meShown = computed(() => rows.value.some((r) => r.me))

// League: tier, zones and when it ends (Monday 00:00 UTC).
const tierName = computed(() => sb.tiers[rows.value[0]?.tier ?? boards.me.value?.tier ?? 0])
const moves = sb.leagueMoves
function zone(r: BoardRow) {
  const n = r.size ?? rows.value.length
  const k = Math.min(moves, Math.floor(n / 3))
  if (r.rank <= k && (r.tier ?? 0) < 4) return 'up'
  if (r.rank > n - k && (r.tier ?? 0) > 0) return 'down'
  return ''
}
const endsIn = computed(() => {
  const d = new Date(now.value)
  const day = d.getUTCDay() // 0 Sunday
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + ((8 - day) % 7 || 7))
  const ms = next - d.getTime()
  const h = Math.floor(ms / 3600_000)
  return h >= 24
    ? `${Math.floor(h / 24)}d ${h % 24}h`
    : `${h}h ${Math.floor((ms % 3600_000) / 60_000)}m`
})

// Friends: your code, and adding someone by theirs.
const code = ref('')
const friendMsg = ref('')
async function addFriend() {
  const c = code.value.trim()
  if (!c) return
  const r = await boards.addFriend(c)
  friendMsg.value = r.ok
    ? `${r.friend?.name ?? 'Your friend'} is on your board!`
    : r.reason === 'self'
      ? "That's your own code."
      : 'No dog has that code. Check it and try again.'
  if (r.ok) {
    code.value = ''
    void load()
  }
}
async function copyCode() {
  const c = boards.me.value?.friend_code
  if (!c) return
  try {
    await navigator.clipboard.writeText(c)
    friendMsg.value = 'Copied! Send it to a friend.'
  } catch {
    friendMsg.value = `Your code is ${c}`
  }
}

// Report a name (from any board row that isn't you).
const reporting = ref<BoardRow | null>(null)
async function report() {
  if (!reporting.value) return
  await boards.report(reporting.value.player_id)
  reporting.value = null
  friendMsg.value = 'Thanks. We will take a look.'
}

// Daily Dash: one free go a day, then up to 3 more from ads.
const attemptsLeft = computed(() =>
  Math.max(0, sb.dailyAttempts.free + sb.dailyAttempts.ads - dailyUsed.value),
)
const DAILY_KEY = 'dobiedash:daily-used'
onMounted(() => {
  try {
    const v = JSON.parse(localStorage.getItem(DAILY_KEY) ?? 'null') as {
      day: string
      n: number
    } | null
    dailyUsed.value = v && v.day === new Date().toISOString().slice(0, 10) ? v.n : 0
  } catch {
    dailyUsed.value = 0
  }
})
async function playDaily() {
  if (dailySeed.value === null || attemptsLeft.value <= 0) return
  if (dailyUsed.value >= sb.dailyAttempts.free && !(await rewarded('dailyDash'))) return
  dailyUsed.value++
  try {
    localStorage.setItem(
      DAILY_KEY,
      JSON.stringify({ day: new Date().toISOString().slice(0, 10), n: dailyUsed.value }),
    )
  } catch {
    /* fine: the server still counts attempts */
  }
  await router.push('/run?daily')
}

const nameNote = computed(() =>
  boards.nameRejected.value ? NAME_PROBLEM_TEXT[boards.nameRejected.value as NameProblem] : null,
)
const faceLook = (r: BoardRow) => (r.me ? look.value : lookFromBoard(r.dog))
</script>

<template>
  <section class="league">
    <h1>League</h1>
    <UiSegmented base="/league" :tabs="TABS" :current="tab" />

    <p v-if="nameNote" class="note">
      Your dog's name can't go on the boards: {{ nameNote }}
      <NuxtLink to="/closet/dog">Change it in My dog</NuxtLink>
    </p>

    <div v-if="tab === 'world'" class="when">
      <button type="button" :class="{ on: when === 'all' }" @click="when = 'all'">All time</button>
      <button type="button" :class="{ on: when === 'week' }" @click="when = 'week'">
        This week
      </button>
    </div>

    <div v-if="tab === 'league'" class="head">
      <b>{{ tierName }} League</b>
      <small>Top {{ moves }} go up, bottom {{ moves }} go down · ends in {{ endsIn }}</small>
    </div>

    <div v-if="tab === 'friends'" class="friends">
      <div class="code">
        <span>Your friend code</span>
        <b>{{ boards.me.value?.friend_code ?? '……' }}</b>
        <UiButton variant="ghost" @click="copyCode">Copy</UiButton>
      </div>
      <form class="add" @submit.prevent="addFriend">
        <input
          v-model="code"
          maxlength="8"
          autocapitalize="characters"
          placeholder="Friend's code"
          aria-label="Friend's code"
        />
        <UiButton type="submit" :disabled="!code.trim()">Add</UiButton>
      </form>
    </div>

    <div v-if="tab === 'dash'" class="dash">
      <p>
        One course for everyone today. Your best go counts. The top 10% win
        {{ sb.dailyBones }} Golden Bones at midnight (UK time in winter).
      </p>
      <UiButton :disabled="dailySeed === null || attemptsLeft <= 0" @click="playDaily">
        <template v-if="attemptsLeft <= 0">No goes left today</template>
        <template v-else-if="dailyUsed < sb.dailyAttempts.free">Play today's Dash</template>
        <template v-else>Watch an ad for another go ({{ attemptsLeft }} left)</template>
      </UiButton>
    </div>

    <p v-if="friendMsg" class="msg" role="status">{{ friendMsg }}</p>

    <p v-if="!online" class="empty offline" role="status">{{ site.offline.league }}</p>
    <p v-else-if="loading" class="empty">Loading…</p>
    <div v-else-if="failed" class="empty">
      <p>Couldn't reach the leaderboards.</p>
      <UiButton @click="load">Try again</UiButton>
    </div>
    <p v-else-if="!rows.length" class="empty">
      {{
        tab === 'friends'
          ? 'Add a friend with their code to race them.'
          : tab === 'league'
            ? 'Finish a run to join this week’s league.'
            : 'No scores yet. Go set one!'
      }}
    </p>
    <template v-else>
      <ol class="board">
        <li
          v-for="r in rows"
          :key="r.player_id"
          :class="[{ me: r.me }, tab === 'league' ? zone(r) : '']"
        >
          <span class="rank">{{ r.rank }}</span>
          <span class="face"><DogView :look="faceLook(r)" mode="head" /></span>
          <span class="who">
            <b>{{ r.name }}</b>
            <small v-if="r.best_world !== undefined">{{
              worlds[r.best_world]?.name ?? 'Bark Park'
            }}</small>
          </span>
          <span class="score">{{ r.score.toLocaleString() }}</span>
          <button
            v-if="!r.me"
            type="button"
            class="more"
            :aria-label="`Report ${r.name}`"
            @click="reporting = r"
          >
            ⋯
          </button>
        </li>
      </ol>
      <p v-if="tab === 'world' && mine && !meShown" class="mine">
        You're <b>#{{ mine.rank.toLocaleString() }}</b> of {{ mine.total.toLocaleString() }} with
        {{ mine.score.toLocaleString() }}
      </p>
    </template>

    <div
      v-if="reporting"
      class="sheet"
      role="dialog"
      aria-label="Report name"
      @click.self="reporting = null"
    >
      <div class="card">
        <b>Report “{{ reporting.name }}”?</b>
        <p>If enough players report a name, it's hidden until we check it.</p>
        <div class="row">
          <UiButton variant="ghost" @click="reporting = null">Cancel</UiButton>
          <UiButton @click="report">Report name</UiButton>
        </div>
      </div>
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
.note,
.msg {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  text-align: center;
}
.note {
  background: #fff1f1;
  border: 1px solid var(--collar);
  border-radius: 14px;
  padding: 8px 12px;
}
.head,
.dash,
.code {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.head small,
.dash p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
.code {
  flex-direction: row;
  align-items: center;
}
.code span {
  flex: 1;
  color: var(--muted);
  font-weight: 800;
  font-size: 13px;
}
.code b {
  font-family: var(--display);
  font-size: 22px;
  letter-spacing: 0.08em;
}
.friends {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.add {
  display: flex;
  gap: 8px;
}
.add input {
  flex: 1;
  min-width: 0;
  font: inherit;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 8px 12px;
  border-radius: 14px;
  border: 2px solid var(--line);
  background: var(--surface);
  color: var(--fg);
}
.board li.up {
  box-shadow: inset 4px 0 0 #3ee08f;
}
.board li.down {
  box-shadow: inset 4px 0 0 #ff5a5a;
}
.more {
  border: 0;
  background: none;
  color: var(--muted);
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  padding: 0 4px;
}
.mine {
  margin: 0;
  text-align: center;
  font-weight: 800;
}
.sheet {
  position: fixed;
  inset: 0;
  background: rgba(20, 10, 30, 0.45);
  display: grid;
  place-items: center;
  z-index: 20;
  padding: 16px;
}
.sheet .card {
  background: var(--surface);
  border-radius: 20px;
  padding: 16px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sheet p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
.sheet .row {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
