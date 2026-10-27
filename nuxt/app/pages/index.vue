<script lang="ts" setup>
import type { MonitorCheck, ServiceStatus } from '#shared/types'

useHead({ title: 'Status · Nuxt' })

const REFRESH_MS = 30_000

const { data: monitors, refresh } = await useFetch<MonitorCheck[]>('/api/status', {
  default: () => [],
})

const overall = computed<ServiceStatus>(() => {
  if (monitors.value.some((m) => m.status === 'down')) return 'down'
  if (monitors.value.some((m) => m.status === 'degraded')) return 'degraded'
  return 'operational'
})

const overallLabel: Record<ServiceStatus, string> = {
  operational: 'All systems operational',
  degraded: 'Some systems degraded',
  down: 'Outage in progress',
}

const lastUpdated = ref('')
function touchClock() {
  lastUpdated.value = new Date().toLocaleTimeString()
}
watch(monitors, touchClock, { immediate: true })

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => void refresh(), REFRESH_MS)
})
onUnmounted(() => clearInterval(timer))

const adding = ref(false)
const name = ref('')
const url = ref('')
const formError = ref('')

async function submit() {
  adding.value = true
  formError.value = ''
  try {
    await $fetch('/api/monitors', {
      method: 'POST',
      body: { name: name.value, url: url.value },
    })
    name.value = ''
    url.value = ''
    await refresh()
  } catch (error) {
    const err = error as { data?: { message?: string }; statusMessage?: string }
    formError.value = err.data?.message ?? err.statusMessage ?? 'Could not add monitor.'
  } finally {
    adding.value = false
  }
}

async function remove(id: string) {
  await $fetch(`/api/monitors/${id}`, { method: 'DELETE' }).catch(() => {})
  await refresh()
}
</script>

<template>
  <main>
    <header class="top">
      <div>
        <h1>Status</h1>
        <p class="badge" :class="`is-${overall}`">
          <span class="dot" aria-hidden="true" />
          {{ overallLabel[overall] }}
        </p>
      </div>
      <p class="meta">Updated {{ lastUpdated }} · auto-refreshes every 30 s</p>
    </header>

    <form class="add" @submit.prevent="submit">
      <input v-model="name" placeholder="Monitor name" maxlength="60" required />
      <input v-model="url" type="url" placeholder="https://api.example.com" required />
      <button type="submit" :disabled="adding">
        {{ adding ? 'Adding…' : 'Add monitor' }}
      </button>
    </form>
    <p v-if="formError" class="error">{{ formError }}</p>

    <section class="grid">
      <MonitorCard
        v-for="monitor in monitors"
        :key="monitor.id"
        :monitor="monitor"
        @remove="remove"
      />
    </section>
  </main>
</template>
