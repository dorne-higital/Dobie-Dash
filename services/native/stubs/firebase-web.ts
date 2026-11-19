/**
 * Stand-in for the `firebase` JS SDK. The @capacitor-firebase plugins import it for their
 * web versions, which this app never uses (the web build has its own fakes in services/web).
 * nuxt.config.ts aliases firebase/analytics and firebase/remote-config here so the real
 * SDK stays out of the bundle. Every function throws if it is ever reached.
 */
const unused = (name: string) => () => {
  throw new Error(`firebase/${name} is not available in the web build`)
}

export const getAnalytics = unused('getAnalytics')
export const logEvent = unused('logEvent')
export const setAnalyticsCollectionEnabled = unused('setAnalyticsCollectionEnabled')
export const setConsent = unused('setConsent')
export const setUserId = unused('setUserId')
export const setUserProperties = unused('setUserProperties')

export const activate = unused('activate')
export const fetchAndActivate = unused('fetchAndActivate')
export const fetchConfig = unused('fetchConfig')
export const getAll = unused('getAll')
export const getRemoteConfig = unused('getRemoteConfig')
export const getValue = unused('getValue')
export const setCustomSignals = unused('setCustomSignals')
