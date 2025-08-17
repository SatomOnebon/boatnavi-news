import { setResponseStatus } from 'h3'
import { applyCors } from '~/server/utils/cors'

export default defineEventHandler((event) => {
  const cfg = useRuntimeConfig()
  applyCors(event, cfg.newsCorsOrigins, 'GET,OPTIONS')
  setResponseStatus(event, 204)
  return null
})