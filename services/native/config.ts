/** Firebase Remote Config via @capacitor-firebase/remote-config: the `overrides` JSON. */
import type { ConfigService } from '../types'
import { loadGameConfig } from '~/game/config'

/** Values are cached on the phone; fetch new ones at most this often (seconds). */
const FETCH_EVERY = 3600

export function createNativeConfig(): ConfigService {
  return {
    game: () => loadGameConfig(),
    async remoteOverrides() {
      const { FirebaseRemoteConfig: RC } = await import('@capacitor-firebase/remote-config')
      await RC.setMinimumFetchInterval({ minimumFetchIntervalInSeconds: FETCH_EVERY })
      try {
        await RC.fetchAndActivate()
      } catch {
        await RC.activate() // offline: use what was fetched last time, if anything
      }
      const { value } = await RC.getString({ key: 'overrides' })
      return value ? (JSON.parse(value) as unknown) : null
    },
  }
}
