import type { Monitor } from '../../utils/monitors'

const NAME_MAX = 60

export default defineEventHandler(async (event): Promise<Monitor | null> => {
  const body = await readBody<Record<string, unknown>>(event)
  const name = String(body?.name ?? '').trim()
  const url = String(body?.url ?? '').trim()

  if (!name || name.length > NAME_MAX) {
    throw createError({ statusCode: 422, statusMessage: `Name is required (max ${NAME_MAX} chars).` })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw createError({ statusCode: 422, statusMessage: 'URL must be a valid absolute URL.' })
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw createError({ statusCode: 422, statusMessage: 'URL must use http or https.' })
  }

  const monitor = addMonitor(name, url)
  if (!monitor) {
    throw createError({ statusCode: 409, statusMessage: `A monitor named “${name}” already exists.` })
  }
  setResponseStatus(event, 201)
  return monitor
})
