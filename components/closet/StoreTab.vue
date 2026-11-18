<script setup lang="ts">
/** Store: Remove Ads, the starter pack, biscuit and bone packs, the Gold Collar and breeds. */
import { Capacitor } from '@capacitor/core'
import { product, type ProductGrants } from '~/logic/store'

const player = usePlayerStore()
const { price, busy, message, loadPrices, buy, restore } = usePurchases()
const native = Capacitor.isNativePlatform()
const dev = import.meta.dev
const got = ref<{ title: string; grants: ProductGrants } | null>(null)
onMounted(loadPrices)

const owned = (id: string) => player.purchases.delivered.includes(id)
const groups = computed(() => [
  {
    title: 'Specials',
    items: ['removeads', 'starter', 'collar.gold', 'breeds.all'].filter(
      (id) => !(id === 'starter' && owned('starter')),
    ),
  },
  { title: 'Biscuits', items: ['biscuits.bag', 'biscuits.barrel'] },
  { title: 'Golden Bones', items: ['bones.pouch', 'bones.box', 'bones.crate'] },
])
const ICON: Record<string, string> = {
  removeads: '🚫',
  starter: '🎒',
  'collar.gold': '🥇',
  'breeds.all': '🐕',
  'biscuits.bag': '🍪',
  'biscuits.barrel': '🛢️',
  'bones.pouch': '🦴',
  'bones.box': '📦',
  'bones.crate': '🧰',
}

async function tap(id: string) {
  const g = await buy(id, 'store')
  if (g) got.value = { title: product(id)!.title, grants: g }
}
</script>

<template>
  <div class="store">
    <p v-if="!native && !dev" class="note">
      Purchases are made in the iPhone app. Everything you buy there is saved to iCloud.
    </p>
    <section v-for="g in groups" :key="g.title">
      <h2>{{ g.title }}</h2>
      <ul>
        <li v-for="id in g.items" :key="id" :class="{ own: owned(id) }">
          <span class="ic" aria-hidden="true">{{ ICON[id] }}</span>
          <span class="txt">
            <b>{{ product(id)!.title }}</b>
            <small v-if="product(id)!.blurb">{{ product(id)!.blurb }}</small>
          </span>
          <span v-if="owned(id)" class="owned">✓ Owned</span>
          <UiButton v-else class="buy" :disabled="!!busy || (!native && !dev)" @click="tap(id)">{{
            busy === id ? '…' : price(id)
          }}</UiButton>
        </li>
      </ul>
    </section>
    <p v-if="message" class="msg" role="status">{{ message }}</p>
    <UiButton variant="ghost" :disabled="!!busy" @click="restore">Restore purchases</UiButton>
    <p class="small">
      Removing ads stops the ads between runs. Ads you choose, like a continue or doubling your
      biscuits, are still there if you want them.
    </p>
    <HubRewardSheet
      v-if="got"
      :title="`${got.title}!`"
      :reward="{ biscuits: got.grants.biscuits, bones: got.grants.bones, item: got.grants.item }"
      :note="
        got.grants.flag === 'removeAds'
          ? 'No more ads between runs.'
          : got.grants.breeds
            ? 'New breeds are ready in My dog.'
            : undefined
      "
      @close="got = null"
    />
  </div>
</template>

<style scoped>
.store {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
h2 {
  margin: 4px 0 6px;
  font-size: 20px;
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
li.own {
  border-color: var(--teal);
}
.ic {
  font-size: 26px;
}
.txt {
  flex: 1;
  min-width: 0;
}
.txt b,
.txt small {
  display: block;
}
.txt small {
  color: var(--muted);
  font-size: 12px;
}
.buy {
  padding: 8px 14px;
  font-size: 16px;
  min-width: 82px;
}
.owned {
  color: #18a597;
  font-weight: 900;
}
.note,
.msg,
.small {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
.msg {
  color: var(--fg);
  font-weight: 900;
  text-align: center;
}
</style>
