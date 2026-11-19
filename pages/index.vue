<script setup lang="ts">
/**
 * Home hub: your dog runs through your furthest world behind the title. Tap anywhere
 * above the tab bar to run. The free chest card sits just above the bar.
 */
import { loadGameConfig } from '~/game/config'
import { freeChestReady, openFreeChest, type Reward } from '~/logic/missions'

definePageMeta({ layout: 'hub' })

const route = useRoute()
const router = useRouter()
const player = usePlayerStore()
const look = useLook()
const now = useNow()
const showSheet = computed(() => 'sheet' in route.query)

const worlds = loadGameConfig().worlds
const theme = computed(() => worlds[Math.min(player.player.bestWorld, worlds.length - 1)]!.theme)

const chestReady = computed(() => freeChestReady(player, now.value))
const chestIn = computed(() => {
  const ms = Math.max(0, player.missions.freeChestAt - now.value.getTime())
  const h = Math.floor(ms / 3600_000)
  const m = Math.ceil((ms % 3600_000) / 60_000)
  return h ? `${h}h ${m}m` : `${m}m`
})
const reward = ref<Reward | null>(null)

// The 4-hour chest opens with a rewarded ad.
const { rewarded } = useAds()
const opening = ref(false)
async function openChest() {
  if (opening.value) return
  opening.value = true
  if (await rewarded('freeChest')) reward.value = openFreeChest(player, new Date())
  opening.value = false
}

// From day 2 (never at first launch): offer reminders.
const reminders = useReminders()
const askReminders = ref(reminders.shouldAsk())
function answerReminders(yes: boolean) {
  askReminders.value = false
  void reminders.answer(yes)
}

function run() {
  router.push('/run')
}

// The dog runs just above "Tap anywhere to run", so the cards and any nudge below it
// never cover the dog, whatever the phone's shape.
const home = ref<HTMLElement | null>(null)
const tap = ref<HTMLElement | null>(null)
const groundPx = ref<number | null>(null)
function placeGround() {
  if (!home.value || !tap.value) return
  const top = tap.value.getBoundingClientRect().top - home.value.getBoundingClientRect().top
  groundPx.value = Math.round(top - 6)
}
let ro: ResizeObserver | null = null
onMounted(() => {
  placeGround()
  ro = new ResizeObserver(placeGround)
  if (home.value) ro.observe(home.value)
})
watch(askReminders, () => nextTick(placeGround))
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <section ref="home" class="home" @click="run">
    <HubRunningDobie
      class="bg"
      :sheet="showSheet"
      :look="look"
      :theme="theme"
      :ground-px="groundPx"
    />
    <div class="title">
      <h1 class="logo">Dobie <span>Dash</span></h1>
      <p v-if="player.dog" class="hi">{{ player.dog.name }} is ready</p>
    </div>
    <!-- The whole screen starts a run; this button is the same for VoiceOver and keyboards. -->
    <button ref="tap" type="button" class="tap" @click.stop="run">Tap anywhere to run</button>
    <div v-if="askReminders" class="nudge" @click.stop>
      <p>
        <b><UiIcon name="bell" /> Want a nudge?</b> We'll tell you when new missions land and before
        your week ends.
      </p>
      <div>
        <UiButton variant="ghost" @click="answerReminders(false)">Not now</UiButton>
        <UiButton @click="answerReminders(true)">Yes please</UiButton>
      </div>
    </div>
    <div class="cards" @click.stop>
      <button v-if="chestReady" type="button" class="card ready" @click="openChest">
        <UiIcon name="gift" class="ic" />
        <span
          ><b>Free chest</b><small v-if="opening">Ad playing…</small
          ><small v-else><UiIcon name="play" /> Watch an ad to open</small></span
        >
      </button>
      <div v-else class="card">
        <UiIcon name="gift" class="ic" />
        <span
          ><b>Free chest</b><small>Ready in {{ chestIn }}</small></span
        >
      </div>
      <NuxtLink to="/worlds" class="card">
        <UiIcon name="flag" class="ic" />
        <span
          ><b>Best {{ player.best.toLocaleString() }}</b
          ><small>{{ worlds[player.player.bestWorld]?.name }}</small></span
        >
      </NuxtLink>
    </div>
    <HubRewardSheet v-if="reward" title="Free chest" :reward="reward" @close="reward = null" />
  </section>
</template>

<style scoped>
.nudge {
  position: relative;
  z-index: 2;
  margin: 0 16px 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nudge p {
  margin: 0;
  font-size: 14px;
}
.nudge div {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.home {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
}
.bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.title {
  position: relative;
  margin-top: calc(var(--safe-top) + 84px);
  text-align: center;
}
.logo {
  margin: 0;
  font-size: 58px;
  line-height: 1;
  color: #fff;
  -webkit-text-stroke: 7px var(--plum);
  paint-order: stroke fill;
}
.logo span {
  color: var(--pink);
}
.hi {
  margin: 6px 0 0;
  font-weight: 900;
  color: var(--plum);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  padding: 2px 12px;
  display: inline-block;
}
.tap {
  position: relative;
  margin: auto 0 12px;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-family: var(--display);
  font-size: 24px;
  color: #fff;
  -webkit-text-stroke: 5px var(--plum);
  paint-order: stroke fill;
  animation: pulse 1.4s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .tap {
    animation: none;
  }
}
@keyframes pulse {
  50% {
    transform: scale(1.06);
  }
}
.cards {
  position: relative;
  display: flex;
  gap: 10px;
  width: 100%;
  padding: 0 16px calc(var(--tabbar-h) + var(--safe-bottom) + 14px);
  cursor: default;
}
.card {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--line);
  color: var(--fg);
  text-decoration: none;
  text-align: left;
  font: inherit;
}
.card.ready {
  background: var(--gold);
  border-color: #e0b100;
  cursor: pointer;
}
.card .ic {
  font-size: 24px;
}
.card b {
  display: block;
  font-size: 14px;
}
.card small {
  display: block;
  color: var(--muted);
  font-size: 12px;
}
</style>
