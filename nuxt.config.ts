import { fileURLToPath } from 'node:url'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Folders live at the project root (pages/, layouts/, components/ ...), not in app/.
  srcDir: '.',
  dir: { app: 'app' },

  // Static single-page app: `nuxi generate` → .output/public, later wrapped by the iOS container.
  ssr: false,

  devtools: { enabled: false },

  // Read at build time. Real keys and ad units come from Codemagic env vars; the ad
  // defaults are Google's public test units, so no real ids are in the repo.
  runtimeConfig: {
    public: {
      appVersion: process.env.npm_package_version ?? '',
      revenuecatKey: process.env.REVENUECAT_APPLE_KEY ?? '',
      admobRewarded: process.env.ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/1712485313',
      admobInterstitial:
        process.env.ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/4411468910',
    },
  },

  modules: ['@pinia/nuxt', '@nuxt/eslint'],

  css: [
    '@fontsource/lilita-one/400.css',
    '@fontsource/nunito/700.css',
    '@fontsource/nunito/800.css',
    '@fontsource/nunito/900.css',
    '~/assets/css/main.css',
  ],

  // Plain-TS folders (no Vue inside /game) are imported explicitly, not auto-imported.
  imports: { dirs: ['stores'] },

  app: {
    head: {
      title: 'Dobie Dash',
      htmlAttrs: { lang: 'en' },
      meta: [
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
        },
        { name: 'theme-color', content: '#2A1530' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  eslint: { config: { stylistic: false } },

  // The @capacitor-firebase plugins' web versions import the firebase JS SDK, which this
  // app never uses: point those imports at a stand-in (services/native/stubs/firebase-web.ts).
  alias: {
    'firebase/analytics': fileURLToPath(
      new URL('./services/native/stubs/firebase-web.ts', import.meta.url),
    ),
    'firebase/remote-config': fileURLToPath(
      new URL('./services/native/stubs/firebase-web.ts', import.meta.url),
    ),
  },

  vite: {
    server: { allowedHosts: true },
  },

  typescript: {
    strict: true,
    // The Edge Functions are Deno code, checked by Supabase when they deploy.
    tsConfig: { exclude: ['../supabase/functions/**/*'] },
  },
})
