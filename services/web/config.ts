import type { ConfigService } from '../types'
import { loadGameConfig, type GameConfig } from '~/game/config'

/** Bundled config only. Remote Config overrides can be merged in refresh() later. */
export function createWebConfig(): ConfigService {
  let cfg: GameConfig = loadGameConfig()
  return {
    game: () => cfg,
    async refresh() {
      cfg = loadGameConfig()
    },
  }
}
