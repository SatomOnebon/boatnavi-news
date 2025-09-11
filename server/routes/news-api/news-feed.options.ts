import { setResponseStatus } from 'h3'


export default defineEventHandler((event) => {
  const cfg = useRuntimeConfig()
  setResponseStatus(event, 204)
  return null
})