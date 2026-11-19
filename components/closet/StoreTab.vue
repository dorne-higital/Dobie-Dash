<script setup lang="ts">
/**
 * Store: Remove Ads, the starter pack, the Pup Pass, outfit packs, biscuit and bone packs,
 * the Gold Collar and breeds.
 */
import { item } from '~/logic/items'
import { Capacitor } from '@capacitor/core'
import site from '~/content/site.json'
import { product, type ProductGrants } from '~/logic/store'

const player = usePlayerStore()
const { price, busy, message, loadPrices, buy, restore } = usePurchases()
const native = Capacitor.isNativePlatform()
const dev = import.meta.dev
const got = ref<{ id: string; title: string; grants: ProductGrants } | null>(null)
const id = (g: { id: string }) => g.id
const { analytics } = useServices()
const online = useOnline()
watch(online, (now) => {
  if (now) void loadPrices() // back online: fetch the real prices
})
onMounted(() => {
  void loadPrices()
  // Which screen opened the Store: the page we came from (e.g. "/" from the coin pills).
  const back = useRouter().options.history.state.back
  analytics.track('store_view', { from: typeof back === 'string' ? back : 'direct' })
})

const owned = (id: string) => player.purchases.delivered.includes(id)
const groups = computed(() => [
  {
    title: 'Specials',
    items: ['removeads', 'starter', 'pass.s1', 'collar.gold', 'breeds.all'].filter(
      (id) => !(id === 'starter' && owned('starter')),
    ),
  },
  { title: 'Outfit packs', items: ['pack.party'] },
  { title: 'Biscuits', items: ['biscuits.bag', 'biscuits.barrel'] },
  { title: 'Golden Bones', items: ['bones.pouch', 'bones.box', 'bones.crate'] },
])
const ICON: Record<string, string> = {
  removeads: 'noads',
  starter: 'backpack',
  'collar.gold': 'collar',
  'breeds.all': 'breeds',
  'pass.s1': 'ticket',
  'pack.party': 'party',
  'biscuits.bag': 'bag',
  'biscuits.barrel': 'barrel',
  'bones.pouch': 'pouch',
  'bones.box': 'box',
  'bones.crate': 'crate',
}

async function tap(id: string) {
  const g = await buy(id, 'store')
  if (g) got.value = { id, title: product(id)!.title, grants: g }
}
</script>

<template>
  <div class="store">
    <p v-if="!online" class="note offline" role="status">{{ site.offline.store }}</p>
    <p v-if="!native && !dev" class="note">
      Purchases are made in the iPhone app. Everything you buy there is saved to iCloud.
    </p>
    <HubCurrencyGuide />
    <section v-for="g in groups" :key="g.title">
      <h2>{{ g.title }}</h2>
      <ul>
        <li v-for="id in g.items" :key="id" :class="{ own: owned(id) }">
          <UiIcon :name="ICON[id] ?? 'gift'" class="ic" />
          <span class="txt">
            <b>{{ product(id)!.title }}</b>
            <small v-if="product(id)!.blurb">{{ product(id)!.blurb }}</small>
          </span>
          <span v-if="owned(id)" class="owned"><UiIcon name="check" /> Owned</span>
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
      :reward="{
        biscuits: got.grants.biscuits,
        bones: got.grants.bones,
        item: got.grants.items
          ? got.grants.items.map((i) => item(i)?.name ?? i).join(', ')
          : got.grants.item,
      }"
      :note="
        got.grants.flag === 'removeAds'
          ? 'No more ads between runs.'
          : got.grants.breeds
            ? 'New breeds are ready in My dog.'
            : got.grants.items
              ? 'Find them in the Wardrobe.'
              : id(got) === 'pass.s1'
                ? 'Premium rewards are ready in Missions → Pup Pass.'
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
.note.offline {
  background: #fff1f1;
  border: 1px solid var(--collar);
  border-radius: 14px;
  padding: 10px 12px;
  color: var(--fg);
  font-weight: 800;
}
</style>
