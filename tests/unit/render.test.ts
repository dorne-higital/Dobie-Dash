import { describe, expect, it } from 'vitest'
import { bossFrame } from '~/game/render/renderer'
import { BOSS_FRAMES, BOSS_PERIOD } from '~/game/render/bosses'

describe('boss animation frames', () => {
  it('always picks a real frame, even just before the clock reaches 0', () => {
    for (const t of [-0.0451, -BOSS_PERIOD, -3.3, 0, 0.12, BOSS_PERIOD, 99.99]) {
      const k = bossFrame(t)
      expect(Number.isInteger(k) && k >= 0 && k < BOSS_FRAMES).toBe(true)
    }
  })
})
