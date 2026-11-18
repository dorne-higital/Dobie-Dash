import { lookFor, type Look } from '~/logic/look'

/** The player's dog and outfit as art, optionally trying one item on. */
export function useLook(tryOn?: Ref<string | null>): ComputedRef<Look> {
  const player = usePlayerStore()
  return computed(() => lookFor(player.dog, player, tryOn?.value ?? null))
}
