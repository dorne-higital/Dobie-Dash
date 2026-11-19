import type { ConfigService } from '../types'
import { loadGameConfig } from '~/game/config'

/** The bundled /content config. Remote Config only runs in the iOS app. */
export function createWebConfig(): ConfigService {
  return {
    game: () => loadGameConfig(),
    async remoteOverrides() {
      return null
    },
  }
}
