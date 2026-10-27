// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  routeRules: {
    // ISR-style caching: serve the cached HTML instantly and revalidate
    // in the background every 30 seconds (Nitro handles this per deployment target).
    '/': { swr: 30 },
  },
})
