<script lang="ts" setup>
import type { MonitorCheck, ServiceStatus } from '#shared/types'

defineProps<{ monitor: MonitorCheck }>()

const emit = defineEmits<{ remove: [id: string] }>()

const label: Record<ServiceStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
}

function timeAgo(checkedAt: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - checkedAt) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.round(seconds / 60)}m ago`
}
</script>

<template>
  <article class="card" :class="`is-${monitor.status}`">
    <header>
      <div class="title">
        <span class="dot" aria-hidden="true" />
        <h3>{{ monitor.name }}</h3>
      </div>
      <button class="remove" aria-label="Remove monitor" @click="emit('remove', monitor.id)">
        ×
      </button>
    </header>

    <p class="status-label">{{ label[monitor.status] }}</p>

    <div class="bars" role="img" :aria-label="`24 hour history: ${monitor.uptimePct}% uptime`">
      <span v-for="(slot, i) in monitor.history" :key="i" class="bar" :class="`is-${slot}`" />
    </div>

    <footer>
      <span class="meta">{{ monitor.uptimePct }}% uptime · 24h</span>
      <span class="meta">
        {{ monitor.status === 'down' ? '—' : `${monitor.latencyMs} ms` }} ·
        {{ timeAgo(monitor.checkedAt) }}
      </span>
    </footer>
  </article>
</template>
