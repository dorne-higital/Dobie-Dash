// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Folders live at the project root (pages/, layouts/, components/ ...), not in app/.
  srcDir: '.',
  dir: { app: 'app' },

  // Static single-page app: `nuxi generate` → .output/public, later wrapped by the iOS container.
  ssr: false,

  devtools: { enabled: false },

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
    },
  },

  eslint: { config: { stylistic: false } },

  vite: {
    server: { allowedHosts: true },
  },

  typescript: { strict: true },
})
