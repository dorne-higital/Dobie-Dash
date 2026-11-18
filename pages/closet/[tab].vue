<script setup lang="ts">
/**
 * Closet: My dog (the dog maker), Outfits, Trails, Collars and the Store (M4).
 * Tap an item to try it on. Owned items equip at once; anything else shows a buy bar
 * with its price, or how to unlock it.
 */
import { loadGameConfig } from '~/game/config'
import { itemsFor, item, type ItemDef } from '~/logic/items'
import { lookFor } from '~/logic/look'
import type { Slot } from '~/logic/save'
import { offer, owns, wornIn } from '~/logic/shop'

definePageMeta({ layout: 'hub' })

const TABS = [
  { key: 'dog', label: 'My dog' },
  { key: 'outfits', label: 'Outfits' },
  { key: 'trails', label: 'Trails' },
  { key: 'collars', label: 'Collars' },
  { key: 'store', label: 'Store' },
]
const SLOTS: Record<string, Slot[]> = {
  outfits: ['hat', 'eyes', 'neck', 'back'],
  trails: ['trail'],
  collars: ['collar'],
}
const TRAIL_ICON: Record<string, string> = {
  dust: '💨',
  paws: '🐾',
  hearts: '💗',
  confetti: '🎉',
  bubbles: '🫧',
  stars: '⭐',
  rainbow: '🌈',
}

const route = useRoute()
const player = usePlayerStore()
const tab = computed(() => String(route.params.tab ?? 'dog'))
const items = computed(() => itemsFor(SLOTS[tab.value] ?? []))
const worlds = loadGameConfig().worlds

const tryOn = ref<string | null>(null)
watch(tab, () => (tryOn.value = null))
const look = useLook(tryOn)
const selected = computed(() => item(tryOn.value))
const selOffer = computed(() => (selected.value ? offer(player, selected.value) : null))
const toast = ref('')

function isWorn(it: ItemDef) {
  return wornIn(player, it.slot)?.id === it.id
}

function tap(it: ItemDef) {
  if (owns(player, it.id)) {
    // Tapping what you're wearing takes it off (defaults come back for collar and trail).
    if (isWorn(it) && !it.default) player.unequip(it.slot)
    else player.equip(it.id)
    tryOn.value = null
  } else {
    tryOn.value = tryOn.value === it.id ? null : it.id
  }
}

const purchases = usePurchases()
async function buyIap(id: string) {
  if (await purchases.buy(id, 'closet')) {
    if (selected.value) player.equip(selected.value.id)
    flash(`${selected.value?.name ?? 'It'} is yours!`)
    tryOn.value = null
  }
}

function flash(msg: string) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 1800)
}

function buy() {
  if (!selected.value) return
  const r = player.buy(selected.value.id)
  if (r === 'bought') {
    flash(`${selected.value.name} is yours!`)
    tryOn.value = null
  }
}

function itemLook(it: ItemDef) {
  return lookFor(player.dog, player, it.id)
}

function status(it: ItemDef) {
  if (isWorn(it)) return '✓ Wearing'
  const o = offer(player, it)
  if (o.kind === 'owned') return 'Owned'
  if (o.kind === 'biscuits') return `🍪 ${o.price.toLocaleString()}`
  if (o.kind === 'bones') return `🦴 ${o.price}`
  if (o.kind === 'iap') return o.gbp
  return `🔒 ${worlds[o.world]?.name ?? 'Later'}`
}
</script>

<template>
  <section class="closet">
    <h1>Closet</h1>
    <UiSegmented base="/closet" :tabs="TABS" :current="tab" />

    <DogMaker v-if="tab === 'dog'" cta="Save my dog" @saved="flash('Saved!')" />

    <template v-else-if="tab !== 'store'">
      <div class="preview">
        <DogView :look="look" mode="run" />
        <span v-if="selected" class="trying">Trying on {{ selected.name }}</span>
      </div>
      <div class="grid">
        <button
          v-for="it in items"
          :key="it.id"
          type="button"
          class="item"
          :class="{ worn: isWorn(it), trying: tryOn === it.id, locked: !owns(player, it.id) }"
          @click="tap(it)"
        >
          <span class="icon">
            <span v-if="it.slot === 'trail'" class="emoji">{{ TRAIL_ICON[it.art.trail!] }}</span>
            <span
              v-else-if="it.slot === 'collar'"
              class="swatch"
              :style="{
                background: it.art.gold ? 'linear-gradient(135deg,#ffe27a,#d99a00)' : it.art.collar,
              }"
            />
            <DogView v-else :look="itemLook(it)" mode="head" />
          </span>
          <span class="nm">{{ it.name }}</span>
          <span class="st">{{ status(it) }}</span>
        </button>
      </div>

      <div v-if="selected && selOffer && selOffer.kind !== 'owned'" class="buybar">
        <b>{{ selected.name }}</b>
        <template v-if="selOffer.kind === 'biscuits' || selOffer.kind === 'bones'">
          <UiButton :disabled="!selOffer.affordable" @click="buy">
            Buy for {{ selOffer.kind === 'biscuits' ? '🍪' : '🦴' }}
            {{ selOffer.price.toLocaleString() }}
          </UiButton>
          <small v-if="!selOffer.affordable">
            You have
            {{
              selOffer.kind === 'biscuits'
                ? `🍪 ${player.biscuits.toLocaleString()}`
                : `🦴 ${player.bones}`
            }}
          </small>
        </template>
        <template v-else-if="selOffer.kind === 'iap'">
          <UiButton :disabled="!!purchases.busy.value" @click="buyIap(selOffer.product)">
            Buy for {{ purchases.price(selOffer.product) }}
          </UiButton>
          <small v-if="purchases.message.value">{{ purchases.message.value }}</small>
        </template>
        <small v-else>Reach {{ worlds[selOffer.world]?.name }} in a run to unlock it</small>
      </div>
    </template>

    <ClosetStoreTab v-else />

    <p v-if="toast" class="toast" role="status">{{ toast }}</p>
  </section>
</template>

<style scoped>
.closet {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
h1 {
  margin: 4px 0 0;
  font-size: 34px;
}
.preview {
  position: relative;
  height: 150px;
  border-radius: 24px;
  background: linear-gradient(#c8ecff, #eaf8ff 70%, #9fd78a 70%);
  border: 1px solid var(--line);
}
.preview .trying {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--plum);
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  border-radius: 999px;
  padding: 3px 10px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
}
.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border-radius: 16px;
  border: 2px solid var(--line);
  background: var(--surface);
  cursor: pointer;
  font: inherit;
}
.item.worn {
  border-color: var(--teal);
}
.item.trying {
  border-color: var(--pink);
}
.icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
}
.emoji {
  font-size: 32px;
}
.swatch {
  width: 40px;
  height: 14px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.12);
}
.nm {
  font-size: 12.5px;
  font-weight: 900;
  text-align: center;
}
.st {
  font-size: 12px;
  color: var(--muted);
  font-weight: 900;
}
.item.worn .st {
  color: #18a597;
}
.buybar {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: stretch;
  text-align: center;
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 12px;
  box-shadow: 0 -10px 30px -18px rgba(40, 10, 60, 0.6);
}
.buybar small {
  color: var(--muted);
}
.toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 16px);
  transform: translateX(-50%);
  background: var(--plum);
  color: #fff;
  border-radius: 999px;
  padding: 8px 16px;
  font-weight: 900;
  margin: 0;
  z-index: 20;
}
</style>
