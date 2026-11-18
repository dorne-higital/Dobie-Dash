import { deliver, product, reconcile, type ProductGrants } from '~/logic/store'
import type { Product } from '~/services/types'

const prices = ref<Record<string, Product>>({})
const busy = ref<string | null>(null)
const message = ref('')
let loading: Promise<void> | null = null

/**
 * Buying, restoring and live prices. The purchase service says what was bought;
 * logic/store.ts decides what it gives and keeps non-consumables to one payout.
 */
export function usePurchases() {
  const { iap, analytics } = useServices()
  const player = usePlayerStore()

  function loadPrices() {
    loading ??= iap.products().then((list) => {
      prices.value = Object.fromEntries(list.map((p) => [p.id, p]))
      if (!list.length) loading = null // try again next time (offline)
    })
    return loading
  }

  /** The App Store's price, or the fallback from content/store.json. */
  const price = (id: string) => prices.value[id]?.price ?? product(id)?.gbp ?? ''

  async function buy(id: string, from = 'store'): Promise<ProductGrants | null> {
    if (busy.value) return null
    busy.value = id
    message.value = ''
    analytics.track('store_buy_tap', { product: id, from })
    try {
      const r = await iap.purchase(id)
      if (!r.ok) {
        if (!r.cancelled) message.value = r.error ?? 'The purchase didn’t go through'
        return null
      }
      analytics.track('purchase', { product: id, from })
      return deliver(player, id) ?? {}
    } finally {
      busy.value = null
    }
  }

  async function restore() {
    message.value = ''
    busy.value = 'restore'
    try {
      const owned = await iap.restore()
      if (!owned) {
        message.value = 'Restoring works in the iPhone app, with a connection.'
        return null
      }
      const r = reconcile(player, owned)
      message.value = r.restored.length
        ? `Restored: ${r.restored.map((id) => product(id)?.title).join(', ')}`
        : owned.length
          ? 'Everything you bought is already here.'
          : 'No purchases to restore on this Apple ID.'
      return r
    } finally {
      busy.value = null
    }
  }

  /** Launch check: give back what's owned, take back paid things that aren't. */
  async function checkEntitlements() {
    const owned = await iap.owned()
    if (owned) reconcile(player, owned)
  }

  return { prices, price, busy, message, loadPrices, buy, restore, checkEntitlements }
}
