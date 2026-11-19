import { describe, expect, it } from 'vitest'
import { dayNumber, runCause } from '~/logic/events'

describe('analytics helpers', () => {
  it('run cause: quitting, then the boss that caught you, then the obstacle', () => {
    expect(runCause({ caughtBy: 'The mail van', hitBy: 'parcel' }, true)).toBe('quit')
    expect(runCause({ caughtBy: 'The mail van', hitBy: 'parcel' })).toBe('boss:The mail van')
    expect(runCause({ caughtBy: null, hitBy: 'cat' })).toBe('obstacle:cat')
    expect(runCause({ caughtBy: null, hitBy: null })).toBe('unknown')
  })

  it('day number counts from the first day played (1 on day one)', () => {
    expect(dayNumber(null, '2026-11-19')).toBe(1)
    expect(dayNumber('2026-11-19', '2026-11-19')).toBe(1)
    expect(dayNumber('2026-11-19', '2026-11-20')).toBe(2)
    expect(dayNumber('2026-10-31', '2026-11-19')).toBe(20)
  })
})
