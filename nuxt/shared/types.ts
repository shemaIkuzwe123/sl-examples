/** Types shared between the Nuxt app and the Nitro server (`#shared`). */

export type ServiceStatus = 'operational' | 'degraded' | 'down'

/** A monitor as rendered on the dashboard: current check + 24h history. */
export type MonitorCheck = {
  id: string
  name: string
  host: string
  url: string
  status: ServiceStatus
  latencyMs: number
  /** One slot per hour over the last 24 hours. */
  history: ServiceStatus[]
  uptimePct: number
  checkedAt: number
}
