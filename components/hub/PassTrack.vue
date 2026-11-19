<script setup lang="ts">
/**
 * The Pup Pass (M7): season header with tier progress and the premium button, then the
 * 30 tiers, each with a free and a premium reward to claim once reached.
 */
import { item } from '~/logic/items'
import type { Reward } from '~/logic/missions'
import {
  canClaim,
  claimAll,
  claimTier,
  claimableTiers,
  daysLeft,
  hasPremium,
  PASS,
  seasonPhase,
  tierOf,
  tierProgress,
  type Track,
} from '~/logic/pass'

const emit = defineEmits<{ got: [title: string, reward: Reward] }>()
const player = usePlayerStore()
const now = useNow()
const purchases = usePurchases()
const { analytics } = useServices()

const phase = computed(() => seasonPhase(now.value))
const tier = computed(() => tierOf(player))
const bar = computed(() => tierProgress(player))
const premium = computed(() => hasPremium(player))
const waiting = computed(() => claimableTiers(player))
const startsOn = new Date(`${PASS.start}T00:00:00Z`).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
})

function parts(r: Reward) {
  const out: { icon: string; text: string }[] = []
  if (r.item) out.push({ icon: 'sparkle', text: item(r.item)?.name ?? r.item })
  if (r.biscuits) out.push({ icon: 'biscuit', text: r.biscuits.toLocaleString() })
  if (r.bones) out.push({ icon: 'bone', text: String(r.bones) })
  if (r.bigBark)
    out.push({ icon: 'bark', text: `Big Bark${r.bigBark > 1 ? ` ×${r.bigBark}` : ''}` })
  return out
}

function claim(t: number, track: Track) {
  const r = claimTier(player, t, track)
  if (!r) return
  analytics.track('pass_claim', { tier: t + 1, track, season: PASS.id })
  emit('got', `Tier ${t + 1}${track === 'premium' ? ' premium' : ''}`, r)
}
function claimEverything() {
  const got = claimAll(player)
  if (!got.length) return
  const sum: Reward = {}
  for (const r of got) {
    sum.biscuits = (sum.biscuits ?? 0) + (r.biscuits ?? 0) || undefined
    sum.bones = (sum.bones ?? 0) + (r.bones ?? 0) || undefined
    sum.bigBark = (sum.bigBark ?? 0) + (r.bigBark ?? 0) || undefined
  }
  const items = got.filter((r) => r.item).map((r) => item(r.item!)?.name ?? r.item!)
  emit('got', `${got.length} rewards`, {
    ...sum,
    ...(items.length ? { item: items.join(', ') } : {}),
  })
}
async function buyPremium() {
  await purchases.buy(PASS.product, 'pass')
}
</script>

<template>
  <div class="pass">
    <header class="top">
      <div class="name">
        <UiIcon name="ticket" class="tk" />
        <div>
          <h2>Pup Pass</h2>
          <small>{{ PASS.name }}</small>
        </div>
        <span v-if="premium" class="prem">Premium</span>
      </div>
      <template v-if="phase === 'before'">
        <p class="when">Season 1 starts on {{ startsOn }}.</p>
      </template>
      <template v-else>
        <div class="tierline">
          <b
            >Tier {{ tier }}<small> / {{ PASS.tiers.length }}</small></b
          >
          <small v-if="phase === 'on'">{{ daysLeft(now) }} days left</small>
          <small v-else>Season over</small>
        </div>
        <div class="bar" role="progressbar" :aria-valuenow="bar.into" :aria-valuemax="bar.of">
          <i :style="{ width: `${(bar.into / bar.of) * 100}%` }" />
        </div>
        <small class="how"
          >Earn XP from every run and every mission. {{ bar.into }} / {{ bar.of }} XP to the next
          tier.</small
        >
      </template>
      <div class="acts">
        <UiButton v-if="waiting" @click="claimEverything">Claim all ({{ waiting }})</UiButton>
        <UiButton
          v-if="!premium && phase !== 'after'"
          variant="secondary"
          :disabled="!!purchases.busy.value"
          @click="buyPremium"
          >Get Premium · {{ purchases.price(PASS.product) }}</UiButton
        >
      </div>
      <small v-if="purchases.message.value" class="how">{{ purchases.message.value }}</small>
    </header>

    <div class="cols" aria-hidden="true">
      <span />
      <span>Free</span>
      <span>Premium</span>
    </div>
    <ol class="tiers">
      <li
        v-for="(t, i) in PASS.tiers"
        :key="i"
        :class="{ reached: i < tier, next: i === tier && phase === 'on' }"
      >
        <span class="num">{{ i + 1 }}</span>
        <div
          v-for="track in ['free', 'premium'] as const"
          :key="track"
          class="cell"
          :class="[
            track,
            { got: player.pass[track].includes(i) && player.pass.season === PASS.id },
          ]"
        >
          <span class="what">
            <span v-for="(x, k) in parts(t[track])" :key="k" class="pt"
              ><UiIcon :name="x.icon" />{{ x.text }}</span
            >
          </span>
          <UiButton v-if="canClaim(player, i, track)" class="claim" @click="claim(i, track)"
            >Claim</UiButton
          >
          <UiIcon
            v-else-if="player.pass[track].includes(i) && player.pass.season === PASS.id"
            name="check"
            class="state"
          />
          <UiIcon v-else-if="track === 'premium' && !premium" name="lock" class="state" />
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.pass {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.top {
  background: linear-gradient(160deg, #ffe3f1 0%, var(--surface) 70%);
  border: 2px solid var(--pink);
  border-radius: 22px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 0 #e0338a;
}
.name {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tk {
  width: 40px;
  height: 40px;
}
.name h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1;
  color: var(--plum);
}
.name small,
.how,
.when,
.tierline small {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}
.when {
  margin: 0;
}
.prem {
  margin-left: auto;
  background: var(--gold);
  color: var(--plum);
  font-weight: 900;
  font-size: 12px;
  border-radius: 999px;
  padding: 4px 10px;
}
.tierline {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.tierline b {
  font-family: var(--display);
  font-weight: 400;
  font-size: 22px;
}
.tierline b small {
  font-size: 14px;
}
.bar {
  height: 12px;
  background: #f3e3ee;
  border-radius: 999px;
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--pink), #ff8fc4);
  border-radius: 999px;
}
.acts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cols,
.tiers li {
  display: grid;
  grid-template-columns: 34px 1fr 1fr;
  gap: 6px;
  align-items: stretch;
}
.cols {
  font-size: 12px;
  font-weight: 900;
  color: var(--muted);
  text-align: center;
}
.tiers {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.num {
  display: grid;
  place-items: center;
  font-family: var(--display);
  font-size: 18px;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
}
.reached .num {
  background: var(--pink);
  border-color: var(--pink);
  color: #fff;
}
.next .num {
  border: 2px dashed var(--pink);
  color: var(--pink);
}
.cell {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 7px 8px;
}
.cell.premium {
  background: #fff8e0;
  border-color: #f2d784;
}
.cell.got {
  opacity: 0.55;
}
.what {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
}
.pt {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-wrap: anywhere;
}
.pt :deep(.ui-icon) {
  flex: none;
  width: 16px;
  height: 16px;
}
.claim {
  flex: none;
  padding: 5px 10px;
  font-size: 13px;
}
.state {
  flex: none;
  width: 18px;
  height: 18px;
}
</style>
