import { describe, expect, it } from 'vitest'
import { nameProblem } from '~/logic/names'

describe('dog names on the boards', () => {
  it('allows ordinary names', () => {
    for (const n of [
      'Dobie',
      'Sir Barks-a-Lot',
      "Odie's Dad",
      'Rex 2',
      'Zoë',
      'Mr. Biscuit',
      'Cocker',
      'Essex Boy',
      'Shitzu',
    ])
      expect(nameProblem(n), n).toBeNull()
  })
  it('blocks rude words, also hidden with numbers, symbols, spaces or repeats', () => {
    for (const n of ['shit', 'Sh1t Dog', 'b!tch', 'f u c k', 'fuuuuck', 'Dick', 'admin'])
      expect(nameProblem(n), n).toBe('word')
  })
  it('checks length and characters', () => {
    expect(nameProblem('  ')).toBe('empty')
    expect(nameProblem('A very long dog name indeed')).toBe('long')
    expect(nameProblem('<script>')).toBe('chars')
    expect(nameProblem('Dog🐶')).toBe('chars')
  })
})
