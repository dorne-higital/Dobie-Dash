<script setup lang="ts">
/**
 * Worlds: a sea map with one island per world, joined by a road that fills in as your best
 * score climbs. Worlds you haven't reached are greyed out. Tap an island for its details.
 */
import { loadGameConfig } from '~/game/config'
import { STICKERS } from '~/logic/items'
import { owns, worldRewards } from '~/logic/shop'

definePageMeta({ layout: 'hub' })

const cfg = loadGameConfig()
const player = usePlayerStore()
const look = useLook()
const settings = useSettingsStore()

/** Island scenery per world, in order (shipped worlds then the coming-soon ones). */
const KINDS = ['park', 'city', 'beach', 'night', 'snow', 'site', 'haunted', 'moon']

const all = [
  ...cfg.worlds.map((w) => ({
    name: w.name,
    at: w.at,
    colour: w.about.colour,
    obstacles: w.about.obstacles,
    twist: w.about.twist,
    boss: w.about.boss,
    soon: false,
  })),
  ...cfg.comingSoon.map((w) => ({ ...w, soon: true })),
]

const best = computed(() => player.player.bestWorld)
const next = computed(() => all[best.value + 1] ?? null)
const toGo = computed(() => (next.value ? Math.max(0, next.value.at - player.best) : 0))
/** How far between your best world and the next one (0–1). */
const frac = computed(() => {
  if (!next.value) return 0
  const from = all[best.value]?.at ?? 0
  return Math.min(1, Math.max(0, (player.best - from) / (next.value.at - from)))
})

// Map geometry (SVG units). Islands zig-zag down the page.
const W = 360
const GAP = 175
const TOPPAD = 95
const H = TOPPAD + GAP * (all.length - 1) + 110
const pos = all.map((_, i) => ({ x: i % 2 ? 255 : 105, y: TOPPAD + i * GAP }))
const roadD = pos
  .map((p, i) => {
    if (!i) return `M${p.x} ${p.y}`
    const a = pos[i - 1]!
    return `C${a.x} ${a.y + GAP / 2} ${p.x} ${p.y - GAP / 2} ${p.x} ${p.y}`
  })
  .join(' ')
/** Share of the road travelled. Every leg is the same shape, so legs are equal lengths. */
const travelled = computed(() =>
  Math.min(1, (best.value + frac.value) / Math.max(1, all.length - 1)),
)

// Where your dog stands on the road.
const road = ref<SVGPathElement | null>(null)
const dogAt = ref({ x: pos[0]!.x, y: pos[0]!.y })
function placeDog() {
  const el = road.value
  if (!el) return
  const pt = el.getPointAtLength(el.getTotalLength() * travelled.value)
  dogAt.value = { x: pt.x, y: pt.y }
}
onMounted(placeDog)
watch(travelled, placeDog)

const selected = ref(Math.min(best.value + 1, all.length - 1))
const sel = computed(() => all[selected.value]!)
const card = ref<HTMLElement | null>(null)
function pick(i: number) {
  selected.value = i
  const smooth = !settings.reduceMotion && !matchMedia('(prefers-reduced-motion: reduce)').matches
  void nextTick(() =>
    card.value?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' }),
  )
}
const state = (i: number) => (i <= best.value ? 'reached' : all[i]!.soon ? 'soon' : 'locked')

function rewards(i: number) {
  if (i >= cfg.worlds.length) return []
  const items = worldRewards(i).map((it) => ({ name: it.name, got: owns(player, it.id) }))
  const boss = cfg.worlds[i]?.chase.boss
  const st = STICKERS.find((x) => x.boss === boss)
  if (st) items.push({ name: `${st.name} sticker`, got: player.owned.includes(st.id) })
  return items
}
const pct = (v: number, of: number) => `${(v / of) * 100}%`
</script>

<template>
  <section class="worlds">
    <h1>Worlds</h1>

    <div v-if="next" class="next">
      <span class="k">Next target</span>
      <b>{{ next.name }} · {{ next.at.toLocaleString() }}</b>
      <div class="bar"><i :style="{ width: `${frac * 100}%` }" /></div>
      <small
        >Your best is {{ player.best.toLocaleString() }}.
        {{ toGo ? `${toGo.toLocaleString()} to go.` : 'You made it!' }}</small
      >
    </div>

    <div class="map" :style="{ aspectRatio: `${W} / ${H}` }">
      <svg :viewBox="`0 0 ${W} ${H}`" aria-hidden="true">
        <defs>
          <pattern id="waves" width="60" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M6 20q6-5 12 0t12 0"
              fill="none"
              stroke="#ffffff"
              stroke-opacity=".55"
              stroke-width="2"
              stroke-linecap="round"
            />
          </pattern>
        </defs>
        <rect :width="W" :height="H" fill="url(#waves)" />
        <!-- the road: outline, grey road, then the gold part you've run -->
        <path :d="roadD" fill="none" stroke="#2a1530" stroke-width="17" stroke-linecap="round" />
        <path :d="roadD" fill="none" stroke="#d6cde0" stroke-width="11" stroke-linecap="round" />
        <path
          ref="road"
          :d="roadD"
          pathLength="1"
          fill="none"
          stroke="#ffd23f"
          stroke-width="11"
          stroke-linecap="round"
          :stroke-dasharray="`${travelled} 1`"
        />
        <path
          :d="roadD"
          fill="none"
          stroke="#ffffff"
          stroke-opacity=".7"
          stroke-width="2"
          stroke-dasharray="6 9"
        />
        <g
          v-for="(p, i) in pos"
          :key="i"
          :transform="`translate(${p.x} ${p.y - 18})`"
          :class="['isle', state(i), { sel: selected === i }]"
        >
          <WorldsIsland :kind="KINDS[i] ?? 'park'" />
        </g>
      </svg>

      <button
        v-for="(w, i) in all"
        :key="w.name"
        type="button"
        class="hit"
        :class="[state(i), { sel: selected === i }]"
        :style="{ left: pct(pos[i]!.x, W), top: pct(pos[i]!.y, H) }"
        :aria-pressed="selected === i"
        @click="pick(i)"
      >
        <span class="tag">
          <UiIcon v-if="state(i) === 'reached'" name="check" />
          <UiIcon v-else name="lock" />
          {{ w.name }}
        </span>
        <small>{{
          state(i) === 'soon' ? 'Coming soon' : w.at === 0 ? 'Start' : w.at.toLocaleString()
        }}</small>
      </button>

      <div class="me" :style="{ left: pct(dogAt.x, W), top: pct(dogAt.y, H) }">
        <DogView :look="look" mode="head" />
      </div>
    </div>

    <article ref="card" class="card" :style="{ '--c': sel.colour }">
      <div class="head">
        <span class="num">{{ selected + 1 }}</span>
        <b>{{ sel.name }}</b>
        <span class="at">{{
          state(selected) === 'reached'
            ? 'Reached'
            : sel.soon
              ? 'Coming soon'
              : `${sel.at.toLocaleString()} to unlock`
        }}</span>
      </div>
      <dl>
        <div>
          <dt>Obstacles</dt>
          <dd>{{ sel.obstacles }}</dd>
        </div>
        <div>
          <dt>Twist</dt>
          <dd>{{ sel.twist }}</dd>
        </div>
        <div>
          <dt>Boss</dt>
          <dd>{{ sel.boss }}</dd>
        </div>
        <div v-if="rewards(selected).length">
          <dt>Rewards</dt>
          <dd>
            <span v-for="r in rewards(selected)" :key="r.name" class="rw" :class="{ got: r.got }"
              ><UiIcon :name="r.got ? 'check' : 'gift'" /> {{ r.name }}</span
            >
          </dd>
        </div>
      </dl>
      <p v-if="sel.soon" class="soon">Arrives in a future update.</p>
    </article>
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
.map {
  position: relative;
  width: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(#7fd0f5, #4fb3e6);
  border: 2px solid var(--plum);
}
.map > svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.isle {
  transition:
    filter 0.2s,
    opacity 0.2s;
}
.isle.locked,
.isle.soon {
  /* Solid grey (not see-through) so the road doesn't show through the island. */
  filter: grayscale(1) contrast(0.75) brightness(1.05);
}
.isle.sel {
  filter: drop-shadow(0 0 6px #fff);
}
.isle.locked.sel,
.isle.soon.sel {
  filter: grayscale(1) contrast(0.75) brightness(1.05) drop-shadow(0 0 6px #fff);
}
.hit {
  position: absolute;
  transform: translate(-50%, 0);
  width: 150px;
  padding: 26px 0 0;
  margin-top: 4px;
  background: none;
  border: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  font: inherit;
}
.hit::before {
  /* the island itself is tappable too */
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  top: -90px;
  height: 120px;
}
.hit .tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border: 2px solid var(--plum);
  border-radius: 999px;
  padding: 2px 10px 2px 6px;
  font-weight: 900;
  font-size: 13px;
  color: var(--plum);
  white-space: nowrap;
}
.hit.sel .tag {
  background: var(--gold);
}
.hit.locked .tag,
.hit.soon .tag {
  background: #e9e4ef;
  color: #6c5d78;
}
.hit small {
  font-weight: 900;
  font-size: 11.5px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(42, 21, 48, 0.8);
}
.me {
  position: absolute;
  width: 42px;
  height: 42px;
  transform: translate(-50%, -60%);
  border-radius: 50%;
  background: #fff;
  border: 3px solid var(--pink);
  box-shadow: 0 6px 12px -6px rgba(42, 21, 48, 0.8);
  overflow: hidden;
  pointer-events: none;
}
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 6px solid var(--c);
  border-radius: 18px;
  padding: 12px 14px;
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
