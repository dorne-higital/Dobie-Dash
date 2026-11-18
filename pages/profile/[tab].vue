<script setup lang="ts">
/** Profile, opened from your avatar: Stats, Trophies (bronze/silver/gold) and Collection. */
import { loadGameConfig } from '~/game/config'
import { ITEMS, STICKERS } from '~/logic/items'
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
const worlds = loadGameConfig().worlds

const stats = computed(() => {
  const s = player.stats
  const mins = Math.round(s.seconds / 60)
  return [
    ['Best score', player.best.toLocaleString()],
    ['Furthest world', worlds[player.player.bestWorld]?.name ?? '—'],
    ['Runs', s.runs.toLocaleString()],
    ['Distance', `${(s.metres / 1000).toFixed(1)} km`],
    ['Biscuits eaten', s.biscuits.toLocaleString()],
    ['Near misses', s.nearMisses.toLocaleString()],
    ['Smashes', s.smashes.toLocaleString()],
    ['Chases escaped', s.escapes.toLocaleString()],
    ['Jumps', s.jumps.toLocaleString()],
    ['Power-ups', s.powerups.toLocaleString()],
    ['Time played', mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`],
  ]
})

const trophies = computed(() =>
  TROPHIES.map((t) => {
    const v = trophyValue(player, t.stat)
    const medal = medalFor(t, v)
    const nextAt = t.tiers[medal]
    return { t, v, medal, nextAt }
  }),
)

const groups = computed(() => [
  { name: 'Outfits', items: ITEMS.filter((i) => ['hat', 'eyes', 'neck', 'back'].includes(i.slot)) },
  { name: 'Trails', items: ITEMS.filter((i) => i.slot === 'trail') },
  { name: 'Collars', items: ITEMS.filter((i) => i.slot === 'collar') },
])
/** World indices are 0-based in the save; show them as "World 2". */
const fmt = (stat: string, v: number) =>
  stat === 'bestWorld' ? `World ${v + 1}` : v.toLocaleString()
</script>

<template>
  <section class="profile">
    <div class="me">
      <div class="pic"><DogView :look="look" mode="idle" /></div>
      <div>
        <h1>{{ player.dog?.name ?? 'Dobie' }}</h1>
        <NuxtLink to="/closet/dog" class="edit">Edit dog</NuxtLink>
      </div>
    </div>
    <UiSegmented base="/profile" :tabs="TABS" :current="tab" />

    <dl v-if="tab === 'stats'" class="stats">
      <div v-for="[k, v] in stats" :key="k">
        <dt>{{ k }}</dt>
        <dd>{{ v }}</dd>
      </div>
    </dl>

    <ul v-else-if="tab === 'trophies'" class="trophies">
      <li v-for="x in trophies" :key="x.t.id" :class="`m${x.medal}`">
        <span class="medal" role="img" :aria-label="MEDALS[x.medal]"
          ><UiIcon :name="`medal-${x.medal}`"
        /></span>
        <div class="tt">
          <b>{{ x.t.name }}</b>
          <small>{{ x.t.text }}: {{ fmt(x.t.stat, x.v) }}</small>
          <small v-if="x.nextAt !== undefined"
            >{{ MEDALS[x.medal + 1] }} at {{ fmt(x.t.stat, x.nextAt) }}</small
          >
          <small v-else>All three medals!</small>
        </div>
        <span class="pips" aria-hidden="true">
          <i v-for="n in 3" :key="n" :class="{ on: n <= x.medal }" />
        </span>
      </li>
    </ul>

    <div v-else class="collection">
      <section v-for="g in groups" :key="g.name">
        <h2>
          {{ g.name }}
          <small
            >{{ g.items.filter((i) => owns(player, i.id)).length }} / {{ g.items.length }}</small
          >
        </h2>
        <ul>
          <li v-for="i in g.items" :key="i.id" :class="{ got: owns(player, i.id) }">
            <UiIcon :name="owns(player, i.id) ? 'check' : 'dot'" /> {{ i.name }}
          </li>
        </ul>
      </section>
      <section>
        <h2>
          Boss stickers
          <small
            >{{ STICKERS.filter((s) => player.owned.includes(s.id)).length }} /
            {{ STICKERS.length }}</small
          >
        </h2>
        <ul>
          <li v-for="s in STICKERS" :key="s.id" :class="{ got: player.owned.includes(s.id) }">
            <UiIcon :name="player.owned.includes(s.id) ? 'star' : 'lock'" /> {{ s.name }}
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.me {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pic {
  width: 110px;
  height: 92px;
  border-radius: 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  flex: none;
}
h1 {
  margin: 0;
  font-size: 30px;
}
.edit {
  color: var(--pink);
  font-weight: 900;
  font-size: 14px;
}
.stats {
  margin: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
}
.stats div {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
}
.stats div:last-child {
  border-bottom: 0;
}
.stats dt {
  color: var(--muted);
}
.stats dd {
  margin: 0;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}
.trophies {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.trophies li {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 10px 14px;
}
.medal {
  font-size: 28px;
}
.m0 .medal {
  opacity: 0.4;
}
.tt {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.tt small {
  color: var(--muted);
  font-size: 12px;
}
.pips {
  display: flex;
  gap: 4px;
}
.pips i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--line);
}
.pips i.on {
  background: var(--gold);
}
.collection h2 {
  margin: 6px 0;
  font-size: 20px;
}
.collection h2 small {
  font-family: var(--body);
  font-size: 13px;
  color: var(--muted);
}
.collection ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.collection li {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 13px;
  color: var(--muted);
}
.collection li.got {
  color: var(--fg);
  border-color: var(--teal);
}
</style>
