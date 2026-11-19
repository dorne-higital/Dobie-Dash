import { describe, expect, it } from 'vitest'
import sb from '~/content/supabase.json'
import { cupEnds, cupFriday } from '~/logic/cups'

describe('Weekend Cup window (Friday to Sunday, UTC)', () => {
  it('is on from Friday 00:00 to Monday 00:00, and names its Friday', () => {
    // 20 Nov 2026 is a Friday.
    expect(cupFriday(new Date('2026-11-19T23:59:59Z'))).toBeNull() // Thursday
    expect(cupFriday(new Date('2026-11-20T00:00:00Z'))).toBe('2026-11-20')
    expect(cupFriday(new Date('2026-11-21T12:00:00Z'))).toBe('2026-11-20')
    expect(cupFriday(new Date('2026-11-22T23:59:59Z'))).toBe('2026-11-20')
    expect(cupFriday(new Date('2026-11-23T00:00:00Z'))).toBeNull() // Monday
    expect(cupFriday(new Date('2026-11-25T09:00:00Z'))).toBeNull()
  })
  it('ends on Monday 00:00 UTC', () => {
    expect(new Date(cupEnds('2026-11-20')).toISOString()).toBe('2026-11-23T00:00:00.000Z')
  })
  it('works across a month and a year', () => {
    expect(cupFriday(new Date('2027-01-02T10:00:00Z'))).toBe('2027-01-01')
    expect(cupFriday(new Date('2026-12-01T10:00:00Z'))).toBeNull()
  })
  it('has its rules in content: a few goes, bones for the top 10%', () => {
    expect(sb.cup).toMatchObject({ attempts: 5, bones: 20, topPercent: 10 })
  })
})
