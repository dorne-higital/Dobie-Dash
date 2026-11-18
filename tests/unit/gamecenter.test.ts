import { describe, expect, it } from 'vitest'
import {
  achievementId,
  allAchievementIds,
  LEADERBOARDS,
  medalAchievements,
} from '~/logic/gamecenter'

describe('Game Center ids', () => {
  it('two boards (all-time and weekly), ids under the bundle id', () => {
    expect(LEADERBOARDS).toEqual({
      allTime: 'uk.co.danhorne.dobiedash.best',
      weekly: 'uk.co.danhorne.dobiedash.weekly',
    })
  })

  it('30 achievements: each trophy × bronze, silver, gold, all unique', () => {
    const ids = allAchievementIds()
    expect(ids).toHaveLength(30)
    expect(new Set(ids).size).toBe(30)
    expect(achievementId('marathon', 3)).toBe('uk.co.danhorne.dobiedash.trophy.marathon.gold')
  })

  it('a medal also completes the ones below it', () => {
    expect(medalAchievements({ marathon: 2, snacker: 0 }).map((a) => a.id)).toEqual([
      'uk.co.danhorne.dobiedash.trophy.marathon.bronze',
      'uk.co.danhorne.dobiedash.trophy.marathon.silver',
    ])
    expect(medalAchievements({}).length).toBe(0)
  })
})
