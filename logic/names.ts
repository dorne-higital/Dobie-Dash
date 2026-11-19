/**
 * Dog names on the boards (M6): 1–16 letters, numbers, spaces and a few marks, and no
 * blocked words (content/names.json), also when spelt with numbers or symbols. The app
 * uses this for instant feedback; the profile Edge Function runs the same check.
 * Anything that slips through can be reported ("Report name").
 */
import names from '../content/names.json'

const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '@': 'a',
  $: 's',
  '!': 'i',
}

/** Lower case, numbers and symbols read as letters, everything else dropped. */
export function squash(name: string): string {
  return [...name.toLowerCase()]
    .map((ch) => LEET[ch] ?? ch)
    .filter((ch) => /[a-z]/.test(ch))
    .join('')
}

export type NameProblem = 'empty' | 'long' | 'chars' | 'word'

/** Why a name can't be used, or null if it's fine. */
export function nameProblem(raw: string): NameProblem | null {
  const name = raw.trim()
  if (!name) return 'empty'
  if ([...name].length > names.maxLength) return 'long'
  // Innocent words that contain a blocked one ("Cocker", "Essex") are taken out first.
  let s = squash(name)
  for (const ok of names.allowed) s = s.split(ok).join('')
  // Repeated letters ("fuuuck") count once.
  const single = s.replace(/(.)\1+/g, '$1')
  if (names.blocked.some((w) => s.includes(w) || single.includes(w))) return 'word'
  if (!/^[\p{L}\p{N} .'-]+$/u.test(name)) return 'chars'
  return null
}

export const NAME_PROBLEM_TEXT: Record<NameProblem, string> = {
  empty: 'Give your dog a name.',
  long: `Names can be up to ${names.maxLength} characters.`,
  chars: 'Letters, numbers and spaces only.',
  word: "That name isn't allowed. Try another.",
}
