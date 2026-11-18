/**
 * In-app purchases through RevenueCat (as in Footballdle). Product ids are the bundle id +
 * the short ids in content/store.json. RevenueCat finishes transactions; this layer only
 * says what was bought, and logic/store.ts decides what that gives.
 */
import type { PurchasesStoreProduct } from '@revenuecat/purchases-capacitor'
import { PRODUCTS, product, storeId } from '~/logic/store'
import type { IapService, PurchaseResult } from '../types'

const TIMEOUT_MS = 15_000

function withTimeout<T>(p: Promise<T>, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`No answer from the App Store (${what})`)),
      TIMEOUT_MS,
    )
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

// Wrapped in an object on purpose (from Footballdle): a Capacitor plugin is a Proxy that
// answers to any method name, including `then`, so returning it straight from an async
// function makes the promise call Purchases.then() natively and never settle.
async function sdk() {
  const { Purchases } = await import('@revenuecat/purchases-capacitor')
  return { Purchases }
}

const NON_CONSUMABLE = new Set(PRODUCTS.filter((p) => p.type === 'non-consumable').map((p) => p.id))

export function createNativeIap(apiKey: string): IapService {
  let configured: Promise<void> | null = null
  const cache = new Map<string, PurchasesStoreProduct>()

  function configure() {
    configured ??= (async () => {
      if (!apiKey) throw new Error('No RevenueCat key in this build')
      const { Purchases } = await sdk()
      await Purchases.configure({ apiKey })
    })().catch((e) => {
      configured = null
      throw e
    })
    return configured
  }

  async function load() {
    await withTimeout(configure(), 'configuring')
    if (cache.size) return
    const { Purchases } = await sdk()
    const { products } = await withTimeout(
      Purchases.getProducts({ productIdentifiers: PRODUCTS.map((p) => storeId(p.id)) }),
      'loading products',
    )
    for (const p of products) cache.set(p.identifier, p)
  }

  const ownedFrom = (ids: string[]) =>
    ids.map((id) => product(id)?.id).filter((id): id is string => !!id && NON_CONSUMABLE.has(id))

  return {
    async products() {
      try {
        await load()
      } catch {
        return []
      }
      return [...cache.values()].map((p) => ({
        id: product(p.identifier)!.id,
        title: p.title,
        price: p.priceString,
      }))
    },

    async purchase(id): Promise<PurchaseResult> {
      try {
        await load()
        const p = cache.get(storeId(id))
        if (!p) return { ok: false, id, cancelled: false, error: "This isn't on sale right now" }
        const { Purchases } = await sdk()
        // A plain copy: a reactive Proxy doesn't survive the trip to native code.
        await Purchases.purchaseStoreProduct({ product: JSON.parse(JSON.stringify(p)) })
        return { ok: true, id }
      } catch (e: unknown) {
        const err = e as { code?: string; userCancelled?: boolean; message?: string }
        const cancelled = err?.code === '1' || !!err?.userCancelled
        // Ask to Buy / bank check: Apple charges later; the next launch check delivers it.
        const pending = err?.code === '20'
        return {
          ok: false,
          id,
          cancelled,
          error: pending
            ? "Waiting for approval. It'll arrive once it's approved."
            : err?.message || 'The purchase didn’t go through',
        }
      }
    },

    async owned() {
      try {
        await withTimeout(configure(), 'configuring')
        const { Purchases } = await sdk()
        const { customerInfo } = await withTimeout(
          Purchases.getCustomerInfo(),
          'checking purchases',
        )
        return ownedFrom(customerInfo.allPurchasedProductIdentifiers)
      } catch {
        return null // offline: don't change anything
      }
    },

    async restore() {
      try {
        await withTimeout(configure(), 'configuring')
        const { Purchases } = await sdk()
        const { customerInfo } = await withTimeout(Purchases.restorePurchases(), 'restoring')
        return ownedFrom(customerInfo.allPurchasedProductIdentifiers)
      } catch {
        return null
      }
    },
  }
}
