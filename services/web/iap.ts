import { PRODUCTS } from '~/logic/store'
import type { IapService } from '../types'

/**
 * Web: no real purchases. The public site says to buy in the iPhone app; the dev server
 * pretends every purchase succeeds so the Store can be built and tested in a browser.
 */
export function createWebIap(dev: boolean): IapService {
  return {
    async products() {
      return PRODUCTS.map((p) => ({ id: p.id, title: p.title, price: p.gbp }))
    },
    async purchase(id) {
      if (!dev) return { ok: false, id, cancelled: false, error: 'Purchases are in the iPhone app' }
      await new Promise((r) => setTimeout(r, 400))
      return { ok: true, id }
    },
    // The web can't ask the App Store, so the launch check is skipped (null).
    async owned() {
      return null
    },
    async restore() {
      return null
    },
  }
}
