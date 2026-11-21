import { describe, expect, it } from 'vitest'
import { ICONS } from '~/components/ui/icons'
import { ITEMS } from '~/logic/items'
import { TRAIL_ICON } from '~/logic/itemIcons'

describe('item icons', () => {
  it('every trail has an icon that exists', () => {
    for (const it of ITEMS.filter((i) => i.slot === 'trail')) {
      const name = TRAIL_ICON[it.art.trail!]
      expect(name, it.id).toBeDefined()
      expect(ICONS[name!], `${it.id} → ${name}`).toBeDefined()
    }
  })
})
