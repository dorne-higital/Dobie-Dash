<script setup lang="ts">
/**
 * Wardrobe (route /closet): four icon tabs (My dog, Outfits, Trails, Collars), a Shop
 * button for the Store (M4) and a Power-ups banner (M6). On the item tabs the title,
 * tabs, dog preview and banner stay fixed and only the items scroll, below them.
 * Tap an item to try it on. Owned items equip at once; anything else shows a buy bar
 * with its price, or how to unlock it.
 */
import { loadGameConfig } from '~/game/config'
import { itemsFor, item, type ItemDef } from '~/logic/items'
import { lookFor } from '~/logic/look'
import type { Slot } from '~/logic/save'
import { offer, owns, wornIn } from '~/logic/shop'

definePageMeta({ layout: 'hub' })

const TITLES: Record<string, string> = { store: 'Store', powers: 'Power-ups' }
const SLOTS: Record<string, Slot[]> = {
  outfits: ['hat', 'eyes', 'neck', 'back'],
  trails: ['trail'],
  collars: ['collar'],
}
const TRAIL_ICON: Record<string, string> = {
  dust: 'dust',
  paws: 'paw',
  hearts: 'hearts',
  confetti: 'party',
  bubbles: 'bubbles',
  stars: 'star',
  rainbow: 'rainbow',
}

const route = useRoute()
const player = usePlayerStore()
const tab = computed(() => String(route.params.tab ?? 'dog'))
const items = computed(() => itemsFor(SLOTS[tab.value] ?? []))
/** Outfits, Trails, Collars: the fixed layout with a scrolling item grid. */
const itemTab = computed(() => !!SLOTS[tab.value])
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
    if (tryOn.value) analytics.track('item_try', { item: it.id, price: status(it).text })
  }
}

const purchases = usePurchases()
const { analytics } = useServices()
async function buyIap(id: string) {
  if (await purchases.buy(id, 'closet')) {
    if (selected.value) {
      analytics.track('item_buy', { item: selected.value.id, price: 0, currency: 'gbp' })
      player.equip(selected.value.id)
    }
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
  const o = selOffer.value
  const r = player.buy(selected.value.id)
  if (r === 'bought') {
    if (o && (o.kind === 'biscuits' || o.kind === 'bones'))
      analytics.track('item_buy', { item: selected.value.id, price: o.price, currency: o.kind })
    flash(`${selected.value.name} is yours!`)
    tryOn.value = null
  }
}

function itemLook(it: ItemDef) {
  return lookFor(player.dog, player, it.id)
}

/** The line under each item: an icon (or none) and its text. */
function status(it: ItemDef): { icon?: string; text: string } {
  if (isWorn(it)) return { icon: 'check', text: 'Wearing' }
  const o = offer(player, it)
  if (o.kind === 'owned') return { text: 'Owned' }
  if (o.kind === 'biscuits') return { icon: 'biscuit', text: o.price.toLocaleString() }
  if (o.kind === 'bones') return { icon: 'bone', text: String(o.price) }
  if (o.kind === 'iap') return { text: o.gbp }
  return { icon: 'lock', text: o.label ?? worlds[o.world]?.name ?? 'Later' }
}
</script>

<template>
  <section class="closet" :class="{ fixed: itemTab || tab === 'dog' }">
    <div class="head">
      <h1>{{ TITLES[tab] ?? 'Wardrobe' }}</h1>
      <NuxtLink to="/closet/store" class="shop" :class="{ on: tab === 'store' }" replace>
        <UiIcon name="bag" /> Shop
      </NuxtLink>
    </div>
    <ClosetIconTabs :current="tab" />

    <DogMaker v-if="tab === 'dog'" cta="Save my dog" @saved="flash('Saved!')" />

    <ClosetPowersTab v-else-if="tab === 'powers'" />

    <template v-else-if="tab !== 'store'">
      <div class="preview">
        <DogView :look="look" mode="run" />
        <span v-if="selected" class="trying">Trying on {{ selected.name }}</span>
      </div>
      <NuxtLink to="/closet/powers" class="powers" replace>
        <UiIcon name="zoomies" class="pi" />
        <span><b>Power-ups</b><small>Make them last longer</small></span>
        <em>Level up ›</em>
      </NuxtLink>
      <div class="scroll">
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
              <UiIcon v-if="it.slot === 'trail'" :name="TRAIL_ICON[it.art.trail!]!" class="emoji" />
              <span
                v-else-if="it.slot === 'collar'"
                class="swatch"
                :style="{
                  background: it.art.gold
                    ? 'linear-gradient(135deg,#ffe27a,#d99a00)'
                    : it.art.collar,
                }"
              />
              <DogView v-else :look="itemLook(it)" mode="head" />
            </span>
            <span class="nm">{{ it.name }}</span>
            <span class="st"
              ><UiIcon v-if="status(it).icon" :name="status(it).icon!" />
              {{ status(it).text }}</span
            >
          </button>
        </div>
      </div>

      <div v-if="selected && selOffer && selOffer.kind !== 'owned'" class="buybar">
        <b>{{ selected.name }}</b>
        <template v-if="selOffer.kind === 'biscuits' || selOffer.kind === 'bones'">
          <UiButton :disabled="!selOffer.affordable" @click="buy">
            Buy for <UiIcon :name="selOffer.kind === 'biscuits' ? 'biscuit' : 'bone'" />
            {{ selOffer.price.toLocaleString() }}
          </UiButton>
          <small v-if="!selOffer.affordable">
            You have
            <UiIcon :name="selOffer.kind === 'biscuits' ? 'biscuit' : 'bone'" />
            {{ selOffer.kind === 'biscuits' ? player.biscuits.toLocaleString() : player.bones }}
          </small>
        </template>
        <template v-else-if="selOffer.kind === 'iap'">
          <UiButton :disabled="!!purchases.busy.value" @click="buyIap(selOffer.product)">
            Buy for {{ purchases.price(selOffer.product) }}
          </UiButton>
          <small v-if="purchases.message.value">{{ purchases.message.value }}</small>
        </template>
        <small v-else-if="selOffer.text">{{ selOffer.text }}</small>
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
/* Item tabs: everything above the grid stays put; only the grid scrolls, below it. */
.closet.fixed {
  height: 100%;
}
.closet.fixed > * {
  flex: none;
}
.closet.fixed > .maker {
  flex: 1;
  min-height: 0;
}
.closet.fixed > .scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  margin: 0 -4px;
  padding: 0 4px 8px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}
h1 {
  margin: 0;
  font-size: 34px;
}
.shop {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--pink);
  color: #fff;
  font-weight: 900;
  font-size: 15px;
  text-decoration: none;
  border-radius: 999px;
  padding: 7px 14px 7px 10px;
  box-shadow: 0 3px 0 #e0338a;
}
.shop :deep(.ui-icon) {
  width: 22px;
  height: 22px;
}
.shop.on {
  background: var(--plum);
  box-shadow: 0 3px 0 #000;
}
.powers {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(90deg, #fff7d6, var(--surface));
  border: 2px solid var(--gold);
  border-radius: 16px;
  padding: 7px 12px;
  text-decoration: none;
  color: var(--fg);
}
.powers .pi {
  width: 28px;
  height: 28px;
  flex: none;
}
.powers span {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.powers small {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}
.powers em {
  font-style: normal;
  font-weight: 900;
  font-size: 13px;
  color: var(--pink);
  white-space: nowrap;
}
.preview {
  position: relative;
  box-shadow: 0 10px 20px -16px rgba(42, 21, 48, 0.6);
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
  z-index: 2;
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
