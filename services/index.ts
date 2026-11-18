import type { Services } from './types'
import { createWebAds } from './web/ads'
import { createWebAnalytics } from './web/analytics'
import { createWebAudio } from './web/audio'
import { createWebConfig } from './web/config'
import { createWebGameCenter } from './web/gamecenter'
import { createWebHaptics } from './web/haptics'
import { createWebIap } from './web/iap'
import { createWebSave } from './web/save'

export type * from './types'

export function createWebServices(opts: { debug: boolean }): Services {
  return {
    save: createWebSave(),
    haptics: createWebHaptics(),
    audio: createWebAudio(),
    iap: createWebIap(),
    ads: createWebAds(),
    gamecenter: createWebGameCenter(),
    analytics: createWebAnalytics(opts.debug),
    config: createWebConfig(),
  }
}
