export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !removeMonitor(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Monitor not found.' })
  }
  setResponseStatus(event, 204)
  return null
})
