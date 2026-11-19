<script setup lang="ts">
/**
 * Wardrobe › Power-ups (M6): each power-up's level (0–5), what the next level does, and a
 * buy button. Prices and lengths come from content/worlds.json; rules in logic/upgrades.
 */
import worlds from '~/content/worlds.json'
import { loadGameConfig, type PowerKind } from '~/game/config'
import { powerDuration, shieldBubbles, shieldSafeTime, type TimedPower } from '~/game/powerups'
import { nextUpgradeCost } from '~/logic/upgrades'

const cfg = loadGameConfig()
const P = worlds.powerups.upgrades
const player = usePlayerStore()
const { analytics } = useServices()
const toast = ref('')

const POWERS: { kind: PowerKind; name: string; blurb: string }[] = [
  { kind: 'zoomies', name: 'Zoomies', blurb: 'Rainbow speed. Smash through everything.' },
  { kind: 'magnet', name: 'Biscuit Magnet', blurb: 'Biscuits fly to you.' },
  {
    kind: 'shield',
    name: 'Bubble Shield',
    blurb: 'Survive a crash. Top level: two bubbles.',
  },
  {
    kind: 'frisbee',
    name: 'Frisbee Fetch',
    blurb: 'Glide over everything, eating the high biscuits.',
  },
  { kind: 'sniff', name: 'Super Sniff', blurb: 'Golden biscuits turn up three times as often.' },
]

const level = (k: PowerKind) => player.upgrades[k] ?? 0
const cost = (k: PowerKind) => nextUpgradeCost(level(k), P)

/** What the power does at a level, in words: "8 s", or "1 bubble". */
function effect(k: PowerKind, l: number) {
  if (k === 'shield') {
    const n = shieldBubbles(l, cfg)
    const safe = Math.round(shieldSafeTime(l, cfg) * 10) / 10
    return `${n > 1 ? `${n} bubbles` : '1 bubble'}, ${safe} s safe`
  }
  const s = powerDuration(k as TimedPower, l, cfg)
  return `${Number.isInteger(s) ? s : s.toFixed(1)} s`
}

function buy(k: PowerKind) {
  const r = player.buyUpgrade(k)
  if (r.ok) {
    analytics.track('upgrade_buy', { power: k, level: r.level, price: r.cost })
    flash(`${POWERS.find((p) => p.kind === k)!.name} is now level ${r.level}!`)
  } else if (r.reason === 'biscuits') flash('Not enough biscuits yet. Keep running!')
}

let timer: ReturnType<typeof setTimeout> | undefined
function flash(msg: string) {
  toast.value = msg
  clearTimeout(timer)
  timer = setTimeout(() => (toast.value = ''), 2200)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="powers">
    <p class="intro">
      Fill the power meter with biscuits to get a power-up. Upgrade them with biscuits to make them
      last longer.
    </p>
    <ul>
      <li v-for="p in POWERS" :key="p.kind">
        <UiIcon :name="p.kind" class="ic" />
        <div class="txt">
          <b>{{ p.name }}</b>
          <small>{{ p.blurb }}</small>
          <span class="pips" :aria-label="`Level ${level(p.kind)} of ${P.maxLevel}`">
            <i v-for="n in P.maxLevel" :key="n" :class="{ on: n <= level(p.kind) }" />
          </span>
          <small class="eff">
            {{ effect(p.kind, level(p.kind)) }}
            <template v-if="cost(p.kind) !== null">
              → <b>{{ effect(p.kind, level(p.kind) + 1) }}</b></template
            >
          </small>
        </div>
        <UiButton
          v-if="cost(p.kind) !== null"
          class="buy"
          :disabled="player.wallet.biscuits < cost(p.kind)!"
          @click="buy(p.kind)"
        >
          <UiIcon name="biscuit" /> {{ cost(p.kind)!.toLocaleString() }}
        </UiButton>
        <span v-else class="max"><UiIcon name="check" /> Max</span>
      </li>
    </ul>
    <p v-if="toast" class="toast" role="status">{{ toast }}</p>
  </div>
</template>

<style scoped>
.powers {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.intro {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
li {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 10px 12px;
}
.ic {
  font-size: 30px;
}
.txt {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.txt small {
  color: var(--muted);
  font-size: 12px;
}
.txt .eff {
  color: var(--fg);
  font-weight: 800;
}
.pips {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}
.pips i {
  width: 18px;
  height: 7px;
  border-radius: 4px;
  background: var(--line);
}
.pips i.on {
  background: var(--pink);
}
.buy {
  padding: 8px 12px;
  font-size: 15px;
  min-width: 86px;
}
.max {
  color: #18a597;
  font-weight: 900;
}
.toast {
  margin: 0;
  text-align: center;
  font-weight: 900;
}
</style>
