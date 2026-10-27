import type { MonitorCheck, ServiceStatus } from '#shared/types'

export type Monitor = {
  id: string
  name: string
  url: string
  /** 0.90–0.999 — how healthy this service tends to be. */
  reliability: number
  addedAt: number
}

/**
 * In-memory store. Data lives for as long as the server process does —
 * it resets on every restart or redeploy. No database, no env vars.
 */
const monitors: Monitor[] = [
  { id: 'm-api', name: 'Public API', url: 'https://api.example.com', reliability: 0.999, addedAt: Date.now() },
  { id: 'm-dashboard', name: 'Dashboard', url: 'https://app.example.com', reliability: 0.99, addedAt: Date.now() },
  { id: 'm-docs', name: 'Docs', url: 'https://docs.example.com', reliability: 0.995, addedAt: Date.now() },
  { id: 'm-cdn', name: 'CDN', url: 'https://cdn.example.com', reliability: 0.98, addedAt: Date.now() },
  { id: 'm-db', name: 'Database cluster', url: 'https://db.example.com', reliability: 0.93, addedAt: Date.now() },
]

/** Deterministic hash → 0..1, so a status is stable within its time bucket. */
function hash01(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

/** Simulated check for a monitor during a given hourly bucket. */
function statusInBucket(monitor: Monitor, bucket: number): ServiceStatus {
  const roll = hash01(`${monitor.id}:${bucket}`)
  // The current bucket is "live": health can still flip toward degraded.
  const reliability = monitor.reliability
  if (roll > reliability) return roll > (reliability + 1) / 2 ? 'down' : 'degraded'
  return 'operational'
}

function latencyFor(monitor: Monitor, status: ServiceStatus): number {
  const base = 20 + Math.round(hash01(`${monitor.id}:lat:${Date.now()}`) * 140)
  if (status === 'degraded') return base + 400
  if (status === 'down') return 0
  return base
}

const HISTORY_HOURS = 24

function buildCheck(monitor: Monitor, now: number): MonitorCheck {
  const currentBucket = Math.floor(now / 3_600_000)
  const history: ServiceStatus[] = []
  for (let i = HISTORY_HOURS - 1; i >= 0; i--) {
    history.push(statusInBucket(monitor, currentBucket - i))
  }
  const status: ServiceStatus = history[history.length - 1] ?? 'operational'
  const operational = history.filter((s) => s === 'operational').length

  return {
    id: monitor.id,
    name: monitor.name,
    host: new URL(monitor.url).host,
    url: monitor.url,
    status,
    latencyMs: latencyFor(monitor, status),
    history,
    uptimePct: Math.round((operational / HISTORY_HOURS) * 1000) / 10,
    checkedAt: now,
  }
}

export function listChecks(): MonitorCheck[] {
  const now = Date.now()
  return monitors
    .map((monitor) => buildCheck(monitor, now))
    .sort((a, b) => b.uptimePct - a.uptimePct || a.name.localeCompare(b.name))
}

export function addMonitor(name: string, url: string): Monitor | null {
  const trimmed = name.trim()
  if (!trimmed || monitors.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
    return null
  }
  const monitor: Monitor = {
    id: 'm-' + Math.random().toString(36).slice(2, 10),
    name: trimmed,
    url,
    reliability: 0.9 + Math.round(Math.random() * 99) / 1000,
    addedAt: Date.now(),
  }
  monitors.push(monitor)
  return monitor
}

export function removeMonitor(id: string): boolean {
  const index = monitors.findIndex((m) => m.id === id)
  if (index === -1) return false
  monitors.splice(index, 1)
  return true
}
