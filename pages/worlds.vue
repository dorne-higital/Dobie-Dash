<script setup lang="ts">
/**
 * Worlds: your next target, then all eight worlds with their targets, obstacles, twists,
 * bosses and rewards. Worlds 5–8 are locked until they ship.
 */
import { loadGameConfig } from '~/game/config'
import { STICKERS } from '~/logic/items'
import { owns, worldRewards } from '~/logic/shop'

definePageMeta({ layout: 'hub' })

const cfg = loadGameConfig()
const player = usePlayerStore()

const best = computed(() => player.player.bestWorld)
const next = computed(() => {
  const w = cfg.worlds[best.value + 1]
  if (w) return { name: w.name, at: w.at }
  const s = cfg.comingSoon[0]
  return s ? { name: s.name, at: s.at } : null
})
const toGo = computed(() => (next.value ? Math.max(0, next.value.at - player.best) : 0))
const progress = computed(() => {
  if (!next.value) return 1
  const from = cfg.worlds[best.value]?.at ?? 0
  return Math.min(1, Math.max(0, (player.best - from) / (next.value.at - from)))
})

function rewards(i: number) {
  const items = worldRewards(i).map((it) => ({ name: it.name, got: owns(player, it.id) }))
  const boss = cfg.worlds[i]?.chase.boss
  const st = STICKERS.find((s) => s.boss === boss)
  if (st) items.push({ name: `${st.name} sticker`, got: player.owned.includes(st.id) })
  return items
}
</script>

<template>
  <section class="worlds">
    <h1>Worlds</h1>

    <div v-if="next" class="next">
      <span class="k">Next target</span>
      <b>{{ next.name }} · {{ next.at.toLocaleString() }}</b>
      <div class="bar"><i :style="{ width: `${progress * 100}%` }" /></div>
      <small
        >Your best is {{ player.best.toLocaleString() }}.
        {{ toGo ? `${toGo.toLocaleString()} to go.` : 'You made it!' }}</small
      >
    </div>

    <ol class="list">
      <li
        v-for="(w, i) in cfg.worlds"
        :key="w.id"
        class="world"
        :class="{ reached: i <= best }"
        :style="{ '--c': w.about.colour }"
      >
        <div class="head">
          <span class="num">{{ i + 1 }}</span>
          <b>{{ w.name }}</b>
          <span class="at">{{ w.at === 0 ? 'Start' : w.at.toLocaleString() }}</span>
        </div>
        <dl>
          <div>
            <dt>Obstacles</dt>
            <dd>{{ w.about.obstacles }}</dd>
          </div>
          <div>
            <dt>Twist</dt>
            <dd>{{ w.about.twist }}</dd>
          </div>
          <div>
            <dt>Boss</dt>
            <dd>{{ w.about.boss }}</dd>
          </div>
          <div>
            <dt>Rewards</dt>
            <dd>
              <span v-for="r in rewards(i)" :key="r.name" class="rw" :class="{ got: r.got }"
                ><UiIcon :name="r.got ? 'check' : 'gift'" /> {{ r.name }}</span
              >
            </dd>
          </div>
        </dl>
      </li>
      <li
        v-for="(w, j) in cfg.comingSoon"
        :key="w.name"
        class="world locked"
        :style="{ '--c': w.colour }"
      >
        <div class="head">
          <span class="num">{{ cfg.worlds.length + j + 1 }}</span>
          <b>{{ w.name }}</b>
          <span class="at"><UiIcon name="lock" /> {{ w.at.toLocaleString() }}</span>
        </div>
        <dl>
          <div>
            <dt>Obstacles</dt>
            <dd>{{ w.obstacles }}</dd>
          </div>
          <div>
            <dt>Twist</dt>
            <dd>{{ w.twist }}</dd>
          </div>
          <div>
            <dt>Boss</dt>
            <dd>{{ w.boss }}</dd>
          </div>
        </dl>
        <p class="soon">Coming in a future update</p>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.worlds {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
h1 {
  margin: 4px 0 0;
  font-size: 34px;
}
.next {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--plum);
  color: #fff;
  border-radius: 20px;
  padding: 14px 16px;
}
.next .k {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.75;
  font-weight: 900;
}
.next b {
  font-family: var(--display);
  font-weight: 400;
  font-size: 22px;
}
.next small {
  opacity: 0.85;
}
.bar {
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--gold);
  border-radius: 999px;
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
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 6px solid var(--c);
  border-radius: 18px;
  padding: 12px 14px;
}
.world.locked {
  opacity: 0.6;
}
.head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--c);
  color: #fff;
  font-weight: 900;
  flex: none;
}
.head b {
  font-family: var(--display);
  font-weight: 400;
  font-size: 20px;
  flex: 1;
}
.at {
  font-weight: 900;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

dl {
  margin: 8px 0 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 13px;
}
dl div {
  display: flex;
  gap: 8px;
}
dt {
  width: 74px;
  flex: none;
  color: var(--muted);
}
dd {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
}
.rw.got {
  color: #18a597;
}
.soon {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--muted);
}
</style>
