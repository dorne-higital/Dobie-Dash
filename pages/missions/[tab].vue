<script setup lang="ts">
/**
 * Missions: three daily missions (new each local midnight) with the 7-day login streak
 * and the daily chest; the weekly goal; and the Pup Pass (v1.1).
 */
import {
  claim,
  collectStreak,
  dailyChestReady,
  missionDef,
  MISSIONS,
  openDailyChest,
  refresh,
  streakNextDay,
  streakReady,
  type Reward,
} from '~/logic/missions'

definePageMeta({ layout: 'hub' })

const TABS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'pass', label: 'Pup Pass' },
]
const route = useRoute()
const tab = computed(() => String(route.params.tab ?? 'daily'))
const player = usePlayerStore()
const now = useNow()
watchEffect(() => refresh(player, now.value))

const sheet = ref<{ title: string; reward: Reward } | null>(null)
const streakDays = MISSIONS.streak.rewards
const streakCount = computed(() => player.missions.streak.count)
const canCollect = computed(() => streakReady(player, now.value))
const allClaimed = computed(() => player.missions.daily.every((m) => m.claimed))
const resetIn = computed(() => {
  const d = now.value
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  const ms = midnight.getTime() - d.getTime()
  return `${Math.floor(ms / 3600_000)}h ${Math.floor((ms % 3600_000) / 60_000)}m`
})

function doClaim(id: string) {
  const r = claim(player, id)
  if (r) sheet.value = { title: 'Mission complete!', reward: r }
}
function doStreak() {
  const r = collectStreak(player, new Date())
  if (r) sheet.value = { title: `Day ${r.day} streak`, reward: r.reward }
}
function doChest() {
  const r = openDailyChest(player)
  if (r) sheet.value = { title: 'Daily chest', reward: r }
}
</script>

<template>
  <section class="missions">
    <h1>Missions</h1>
    <UiSegmented base="/missions" :tabs="TABS" :current="tab" />

    <template v-if="tab === 'daily'">
      <div class="streak">
        <div class="sh">
          <b>Login streak</b>
          <UiButton v-if="canCollect" class="collect" @click="doStreak"
            >Collect day {{ streakNextDay(player) }}</UiButton
          >
          <small v-else>Back tomorrow for day {{ streakNextDay(player) }}</small>
        </div>
        <ol class="days">
          <li
            v-for="(r, i) in streakDays"
            :key="i"
            :class="{
              got: i < streakCount,
              next: i === streakCount % streakDays.length && canCollect,
            }"
          >
            <span class="d">Day {{ i + 1 }}</span>
            <span class="r">{{ r.bones ? `🦴${r.bones}` : `🍪${r.biscuits}` }}</span>
          </li>
        </ol>
        <small class="pause">Miss a day and your streak just pauses.</small>
      </div>

      <div class="hd">
        <h2>Today</h2>
        <small>New missions in {{ resetIn }}</small>
      </div>
      <HubMissionCard
        v-for="m in player.missions.daily"
        :key="m.id"
        :def="missionDef(m.id)!"
        :p="m.p"
        :claimed="m.claimed"
        @claim="doClaim(m.id)"
      />
      <button
        type="button"
        class="chest"
        :class="{ ready: dailyChestReady(player) }"
        :disabled="!dailyChestReady(player)"
        @click="doChest"
      >
        <span class="ic" aria-hidden="true">{{
          player.missions.dailyChestClaimed ? '📭' : '🎁'
        }}</span>
        <span>
          <b>Daily chest</b>
          <small v-if="player.missions.dailyChestClaimed">Opened. A new one tomorrow.</small>
          <small v-else-if="allClaimed">Ready! Tap to open.</small>
          <small v-else>Claim all three missions to open it</small>
        </span>
      </button>
    </template>

    <template v-else-if="tab === 'weekly'">
      <div class="hd">
        <h2>This week</h2>
        <small>Resets on Monday</small>
      </div>
      <HubMissionCard
        v-for="m in player.missions.weekly"
        :key="m.id"
        :def="missionDef(m.id)!"
        :p="m.p"
        :claimed="m.claimed"
        @claim="doClaim(m.id)"
      />
    </template>

    <div v-else class="pass">
      <span class="ic" aria-hidden="true">🎟️</span>
      <b>Pup Pass</b>
      <p>A 6-week season with 30 tiers of trails, collars and outfits arrives in a later update.</p>
    </div>

    <HubRewardSheet
      v-if="sheet"
      :title="sheet.title"
      :reward="sheet.reward"
      @close="sheet = null"
    />
  </section>
</template>

<style scoped>
.missions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
h1 {
  margin: 4px 0 0;
  font-size: 34px;
}
.hd {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 6px;
}
.hd h2 {
  margin: 0;
  font-size: 22px;
}
.hd small,
.sh small,
.pause {
  color: var(--muted);
  font-size: 12px;
}
.streak {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sh {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.collect {
  padding: 7px 14px;
  font-size: 15px;
}
.days {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.days li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 0;
  border-radius: 12px;
  background: var(--bg);
  border: 2px solid transparent;
  font-size: 10px;
  font-weight: 900;
  color: var(--muted);
}
.days li .r {
  font-size: 11px;
  color: var(--fg);
}
.days li.got {
  background: var(--teal);
  color: #fff;
}
.days li.got .r {
  color: #fff;
}
.days li.next {
  border-color: var(--pink);
}
.chest {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  font: inherit;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px dashed var(--line);
  background: var(--surface);
  color: var(--fg);
}
.chest.ready {
  background: var(--gold);
  border: 1px solid #e0b100;
  cursor: pointer;
}
.chest .ic {
  font-size: 28px;
}
.chest b,
.chest small {
  display: block;
}
.chest small {
  color: var(--muted);
  font-size: 12px;
}
.pass {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 24px;
}
.pass .ic {
  font-size: 40px;
}
.pass p {
  margin: 0;
  color: var(--muted);
}
</style>
