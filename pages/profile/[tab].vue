<script setup lang="ts">
/**
 * Profile, opened from your avatar. A player card on top (your dog, its title, best score,
 * furthest world and medals), then Stats (big-number tiles), Trophies (a cabinet of ten
 * trophies on shelves) and Collection (completion rings, boss sticker album and item
 * pictures). Your friend code is always at the bottom.
 */
import { loadGameConfig, type BossKind } from '~/game/config'
import profile from '~/content/profile.json'
import sb from '~/content/supabase.json'
import { ITEMS, STICKERS, type ItemDef } from '~/logic/items'
import { TRAIL_ICON } from '~/logic/itemIcons'
import { lookFor } from '~/logic/look'
import { owns } from '~/logic/shop'
import { medalFor, MEDALS, TROPHIES, trophyValue } from '~/logic/trophies'

definePageMeta({ layout: 'hub' })

const TABS = [
  { key: 'stats', label: 'Stats' },
  { key: 'trophies', label: 'Trophies' },
  { key: 'collection', label: 'Collection' },
]
const route = useRoute()
const tab = computed(() => String(route.params.tab ?? 'stats'))
const player = usePlayerStore()
const look = useLook()
const boards = useBoards()
const online = useOnline()
const worlds = loadGameConfig().worlds

/** "Moon Walker · Top Dog League": from the furthest world, plus your league once known. */
const title = computed(() => {
  const t = profile.titles[player.player.bestWorld] ?? profile.titles[0]
  const tier = boards.me.value ? sb.tiers[boards.me.value.tier] : null
  return tier ? `${t} · ${tier} League` : t
})

const trophies = computed(() =>
  TROPHIES.map((t) => {
    const v = trophyValue(player, t.stat)
    const medal = medalFor(t, v)
    const nextAt = t.tiers[medal]
    return { t, v, medal, nextAt, near: nextAt === undefined ? -1 : v / nextAt }
  }),
)
const medals = computed(() => trophies.value.reduce((n, x) => n + x.medal, 0))
const medalCount = computed(() =>
  [3, 2, 1].map((m) => trophies.value.filter((x) => x.medal >= m).length),
)

const headline = computed(() => [
  { k: 'Best', v: player.best.toLocaleString(), hot: true },
  { k: 'Furthest', v: worlds[player.player.bestWorld]?.name ?? '—' },
  { k: 'Medals', v: `${medals.value}/${TROPHIES.length * 3}` },
])

const stats = computed(() => {
  const s = player.stats
  const mins = Math.round(s.seconds / 60)
  return [
    { icon: 'flag', k: 'Runs', v: s.runs.toLocaleString() },
    { icon: 'worlds', k: 'Distance', v: `${(s.metres / 1000).toFixed(1)} km` },
    { icon: 'biscuit', k: 'Biscuits eaten', v: s.biscuits.toLocaleString() },
    { icon: 'zoomies', k: 'Near misses', v: s.nearMisses.toLocaleString() },
    { icon: 'crate', k: 'Smashes', v: s.smashes.toLocaleString() },
    { icon: 'trophy', k: 'Bosses escaped', v: s.escapes.toLocaleString() },
    { icon: 'paw', k: 'Jumps', v: s.jumps.toLocaleString() },
    { icon: 'sparkle', k: 'Power-ups', v: s.powerups.toLocaleString() },
    {
      icon: 'bell',
      k: 'Time played',
      v: mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`,
    },
  ]
})

/** Trophy cabinet: the one you tap, or else the medal you're closest to. */
const picked = ref<string | null>(null)
const closest = computed(() =>
  trophies.value.reduce((a, b) => (b.near > a.near ? b : a), trophies.value[0]!),
)
const shown = computed(() => trophies.value.find((x) => x.t.id === picked.value) ?? closest.value)
/** World indices are 0-based in the save; show them as "World 2". */
const fmt = (stat: string, v: number) =>
  stat === 'bestWorld' ? `World ${v + 1}` : v.toLocaleString()

const groups = computed(() => [
  {
    name: 'Outfits',
    color: 'var(--pink)',
    items: ITEMS.filter((i) => ['hat', 'eyes', 'neck', 'back'].includes(i.slot)),
  },
  { name: 'Trails', color: 'var(--teal)', items: ITEMS.filter((i) => i.slot === 'trail') },
  { name: 'Collars', color: '#e5484d', items: ITEMS.filter((i) => i.slot === 'collar') },
])
const stickersGot = computed(() => STICKERS.filter((s) => player.owned.includes(s.id)).length)
const rings = computed(() => [
  ...groups.value.map((g) => ({
    name: g.name,
    color: g.color,
    pct: g.items.filter((i) => owns(player, i.id)).length / g.items.length,
  })),
  { name: 'Stickers', color: 'var(--gold)', pct: stickersGot.value / STICKERS.length },
])
const RING = 2 * Math.PI * 15
const itemLook = (it: ItemDef) => lookFor(player.dog, player, it.id)

// Friend code: always at the bottom. Fetched once you're online.
const copied = ref('')
async function copyCode() {
  const c = boards.me.value?.friend_code
  if (!c) return
  try {
    await navigator.clipboard.writeText(c)
    copied.value = 'Copied! Send it to a friend.'
  } catch {
    copied.value = `Your code is ${c}`
  }
}
onMounted(() => {
  if (!boards.me.value && online.value) void boards.syncProfile().catch(() => {})
})
</script>

<template>
  <section class="profile">
    <div class="card">
      <div class="hero"><DogView :look="look" mode="idle" /></div>
      <h1>{{ player.dog?.name ?? 'Dobie' }}</h1>
      <span class="title">{{ title }}</span>
      <NuxtLink to="/closet/dog" class="edit">Edit dog</NuxtLink>
      <div class="head">
        <div v-for="h in headline" :key="h.k" class="tile" :class="{ hot: h.hot }">
          <small>{{ h.k }}</small>
          <b>{{ h.v }}</b>
        </div>
      </div>
    </div>

    <UiSegmented base="/profile" :tabs="TABS" :current="tab" />

    <div v-if="tab === 'stats'" class="tiles">
      <div v-for="s in stats" :key="s.k" class="tile">
        <UiIcon :name="s.icon" class="ic" />
        <b>{{ s.v }}</b>
        <small>{{ s.k }}</small>
      </div>
    </div>

    <div v-else-if="tab === 'trophies'" class="cabinet">
      <div class="total">
        <UiIcon name="medal-3" class="big" />
        <div>
          <b>{{ medals }} / {{ TROPHIES.length * 3 }}</b>
          <small
            >medals · {{ medalCount[0] }} gold, {{ medalCount[1] }} silver,
            {{ medalCount[2] }} bronze</small
          >
        </div>
      </div>
      <div class="shelf">
        <button
          v-for="x in trophies"
          :key="x.t.id"
          type="button"
          class="trophy"
          :class="{ none: !x.medal, on: shown.t.id === x.t.id }"
          :aria-label="`${x.t.name}: ${MEDALS[x.medal]}`"
          @click="picked = x.t.id"
        >
          <UiIcon :name="`medal-${x.medal}`" />
          <span>{{ x.t.name }}</span>
        </button>
      </div>
      <div class="detail">
        <b>{{ shown.t.name }}</b>
        <small>{{ shown.t.text }}: {{ fmt(shown.t.stat, shown.v) }}</small>
        <ol>
          <li v-for="(at, i) in shown.t.tiers" :key="i" :class="{ won: shown.medal > i }">
            <UiIcon :name="`medal-${shown.medal > i ? i + 1 : 0}`" />
            <span>{{ MEDALS[i + 1] }}</span>
            <small>{{ fmt(shown.t.stat, at) }}</small>
          </li>
        </ol>
        <p v-if="shown.nextAt !== undefined" class="next">
          {{ MEDALS[shown.medal + 1] }} at {{ fmt(shown.t.stat, shown.nextAt) }}
        </p>
        <p v-else class="next">All three medals!</p>
      </div>
    </div>

    <div v-else class="collection">
      <div class="rings">
        <div v-for="r in rings" :key="r.name">
          <svg viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="15" class="track" />
            <circle
              cx="20"
              cy="20"
              r="15"
              class="fill"
              :stroke="r.color"
              :stroke-dasharray="`${RING * r.pct} ${RING}`"
            />
            <text x="20" y="24">{{ Math.round(r.pct * 100) }}%</text>
          </svg>
          <span>{{ r.name }}</span>
        </div>
      </div>
      <section>
        <h2>
          Boss stickers <small>{{ stickersGot }} / {{ STICKERS.length }}</small>
        </h2>
        <div class="album">
          <div v-for="s in STICKERS" :key="s.id" class="slot">
            <ProfileSticker :boss="s.boss as BossKind" :got="player.owned.includes(s.id)" />
            <span>{{ player.owned.includes(s.id) ? s.name : '???' }}</span>
          </div>
        </div>
      </section>
      <section v-for="g in groups" :key="g.name">
        <h2>
          {{ g.name }}
          <small
            >{{ g.items.filter((i) => owns(player, i.id)).length }} / {{ g.items.length }}</small
          >
        </h2>
        <div class="items">
          <div v-for="i in g.items" :key="i.id" class="item" :class="{ got: owns(player, i.id) }">
            <span class="pic">
              <UiIcon v-if="i.slot === 'trail'" :name="TRAIL_ICON[i.art.trail!] ?? 'sparkle'" />
              <span
                v-else-if="i.slot === 'collar'"
                class="swatch"
                :style="{
                  background: i.art.gold ? 'linear-gradient(135deg,#ffe27a,#d99a00)' : i.art.collar,
                }"
              />
              <DogView v-else :look="itemLook(i)" mode="head" />
            </span>
            <span class="nm">{{ i.name }}</span>
          </div>
        </div>
      </section>
    </div>

    <div class="code">
      <div>
        <small>Your friend code</small>
        <b>{{ boards.me.value?.friend_code ?? '……' }}</b>
        <small v-if="copied">{{ copied }}</small>
        <small v-else-if="!boards.me.value">Shows up once you're online.</small>
        <small v-else>Friends add it in League → Friends.</small>
      </div>
      <UiButton :disabled="!boards.me.value" @click="copyCode">Copy</UiButton>
    </div>
  </section>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.hero {
  width: 100%;
  height: 150px;
  border-radius: 22px;
  background: linear-gradient(#c8ecff, #eaf8ff 70%, #9fd78a 70%);
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
}
.hero :deep(canvas) {
  width: 170px;
  height: 145px;
}
h1 {
  margin: 2px 0 0;
  font-size: 30px;
  line-height: 1;
}
.title {
  background: var(--plum, #2a1530);
  color: var(--gold);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 4px 12px;
  text-align: center;
}
.edit {
  color: var(--pink);
  font-weight: 900;
  font-size: 13px;
}
.head {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.tile {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 10px 11px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.tile.hot {
  background: #ffe3f1;
  border-color: var(--pink);
}
.tile small {
  font-size: 11px;
  font-weight: 900;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tile b {
  font-family: var(--display);
  font-weight: 400;
  font-size: 21px;
  line-height: 1.05;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}
.head .tile b {
  font-size: 18px;
}
.tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.tiles .ic {
  font-size: 24px;
}
.tiles .tile:first-child {
  background: #ffe3f1;
  border-color: var(--pink);
}

/* Trophy cabinet */
.cabinet {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.total {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #2a1530;
  color: #fff;
  border-radius: 18px;
  padding: 12px 14px;
}
.total .big {
  font-size: 40px;
}
.total b {
  display: block;
  font-family: var(--display);
  font-weight: 400;
  font-size: 28px;
  line-height: 1;
  color: var(--gold);
}
.total small {
  font-size: 12px;
  font-weight: 800;
  opacity: 0.85;
}
.shelf {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px 4px;
  background:
    linear-gradient(
      transparent calc(50% - 6px),
      #6f4519 calc(50% - 6px),
      #6f4519 50%,
      transparent 50%
    ),
    linear-gradient(#b27a35, #8a5a24);
  border-radius: 16px;
  padding: 10px 6px 12px;
  box-shadow: inset 0 -6px 0 #6f4519;
}
.trophy {
  appearance: none;
  border: 2px solid transparent;
  background: none;
  border-radius: 12px;
  padding: 4px 0 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #fff8ee;
  font: inherit;
  cursor: pointer;
}
.trophy :deep(svg) {
  font-size: 34px;
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.3));
}
.trophy span {
  font-size: 9.5px;
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
}
.trophy.none :deep(svg) {
  opacity: 0.35;
  filter: grayscale(1);
}
.trophy.on {
  border-color: var(--gold);
  background: rgba(255, 255, 255, 0.12);
}
.detail {
  background: #fff7d6;
  border: 2px solid var(--gold);
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail > b {
  font-family: var(--display);
  font-weight: 400;
  font-size: 22px;
}
.detail > small {
  color: var(--muted);
  font-weight: 800;
}
.detail ol {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.detail li {
  background: var(--surface);
  border-radius: 12px;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: 900;
  font-size: 12px;
  opacity: 0.55;
}
.detail li.won {
  opacity: 1;
}
.detail li :deep(svg) {
  font-size: 26px;
}
.detail li small {
  color: var(--muted);
  font-size: 11px;
}
.next {
  margin: 4px 0 0;
  font-weight: 900;
  color: var(--pink);
}

/* Collection */
.collection {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rings {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  text-align: center;
  font-size: 12px;
  font-weight: 900;
  color: var(--muted);
}
.rings svg {
  width: 64px;
  height: 64px;
  display: block;
  margin: 0 auto 2px;
}
.rings .track {
  fill: none;
  stroke: var(--line);
  stroke-width: 5;
}
.rings .fill {
  fill: none;
  stroke-width: 5;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 20px 20px;
}
.rings text {
  font-size: 10px;
  font-weight: 900;
  fill: var(--fg);
  text-anchor: middle;
}
.collection h2 {
  margin: 0 0 8px;
  font-size: 20px;
}
.collection h2 small {
  font-family: var(--body);
  font-size: 13px;
  color: var(--muted);
}
.album {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 8px;
}
.slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 10.5px;
  font-weight: 900;
  text-align: center;
  line-height: 1.1;
}
.slot > :first-child {
  width: 100%;
}
.items {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.item {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 6px 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.item:not(.got) {
  opacity: 0.4;
}
.pic {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  font-size: 28px;
}
.pic :deep(canvas) {
  width: 42px;
  height: 42px;
}
.swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #2a1530;
}
.nm {
  font-size: 10px;
  font-weight: 900;
  text-align: center;
  line-height: 1.1;
}

/* Friend code, always last */
.code {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 2px dashed var(--line);
  border-radius: 18px;
  padding: 12px 14px;
}
.code > div {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.code small {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}
.code b {
  font-family: var(--display);
  font-weight: 400;
  font-size: 24px;
  letter-spacing: 0.06em;
}
</style>
