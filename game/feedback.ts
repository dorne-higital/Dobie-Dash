/**
 * What the engine tells the outside world for sound and haptics. The page wires this to
 * the audio and haptics services; the engine never touches them directly.
 */
export type FeedbackCue =
  | 'jump'
  | 'double'
  | 'land'
  | 'biscuit'
  | 'golden'
  | 'powerOn'
  | 'powerOff'
  | 'smash'
  | 'shieldPop'
  | 'crash'
  | 'nearMiss'
  | 'world'
  | 'bossGrowl'
  | 'escape'
  | 'splash'
  | 'revive'
  | 'button'
  /** Big Bark (M7). */
  | 'bark'

export interface FeedbackPort {
  play(cue: FeedbackCue): void
  /** Music for this world (null stops it), tempo as a multiple of the world's base tempo. */
  music?(world: number | null, tempo: number): void
}
