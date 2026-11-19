import type { Services } from './types'
import { createWebAds } from './web/ads'
import { createWebAnalytics } from './web/analytics'
import { createWebAudio } from './web/audio'
import { createWebConfig } from './web/config'
import { createWebCrash } from './web/crash'
import { createWebGameCenter } from './web/gamecenter'
import { createWebHaptics } from './web/haptics'
import { createWebIap } from './web/iap'
import { createWebNotify } from './web/notify'
import { createWebSave } from './web/save'

export type * from './types'

export function createWebServices(opts: { debug: boolean }): Services {
  return {
    save: createWebSave(),
    haptics: createWebHaptics(),
    audio: createWebAudio(),
    iap: createWebIap(opts.debug),
    ads: createWebAds(),
    gamecenter: createWebGameCenter(opts.debug),
    notify: createWebNotify(),
    analytics: createWebAnalytics(opts.debug),
    crash: createWebCrash(),
    config: createWebConfig(),
  }
}
