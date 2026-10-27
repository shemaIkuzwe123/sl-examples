/**
 * Current status of every monitor.
 * The dashboard page is cached with an `swr` route rule — see nuxt.config.ts.
 */
export default defineEventHandler(() => {
  return listChecks()
})
