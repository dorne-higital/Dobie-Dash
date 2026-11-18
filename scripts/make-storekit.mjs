// Builds ios/App/DobieDash.storekit (Xcode's local StoreKit test file) from
// content/store.json, so product ids and prices can't drift apart. Run: npm run storekit
import { readFileSync, writeFileSync } from 'node:fs'

const store = JSON.parse(readFileSync(new URL('../content/store.json', import.meta.url)))
let n = 1
const ref = () => String(1000000 + n++)
const product = (p) => ({
  displayPrice: p.gbp.replace('£', ''),
  familyShareable: false,
  internalID: ref(),
  localizations: [{ description: p.blurb ?? p.title, displayName: p.title, locale: 'en_GB' }],
  productID: store.idPrefix + p.id,
  referenceName: p.title,
  type: p.type === 'consumable' ? 'Consumable' : 'NonConsumable',
})
const file = {
  identifier: 'D0B1E5A1',
  nonRenewingSubscriptions: [],
  products: store.products.map(product),
  settings: {
    _applicationInternalID: '6836275397',
    _developerTeamID: '3XPH3J87EQ',
    _failTransactionsEnabled: false,
    _locale: 'en_GB',
    _storefront: 'GBR',
    _storeKitErrors: [],
  },
  subscriptionGroups: [],
  version: { major: 4, minor: 0 },
}
writeFileSync(
  new URL('../ios/App/DobieDash.storekit', import.meta.url),
  JSON.stringify(file, null, 2) + '\n',
)
console.log(`Wrote ${file.products.length} products to ios/App/DobieDash.storekit`)
