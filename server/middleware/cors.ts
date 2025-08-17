// server/middleware/cors.ts
import { defineEventHandler, getMethod, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  // /api/ 配下だけCORS付与
  const url = new URL(event.node.req.url || '', 'http://localhost')
  if (!url.pathname.startsWith('/api/')) return

  // 許可オリジン（本番はドメインを入れる）
  const allow = process.env.NUXT_PUBLIC_SPA_ORIGIN || '*'

  event.node.res.setHeader('Access-Control-Allow-Origin', allow)
  // ワイルドカードでなければ Vary: Origin を付ける
  if (allow !== '*') {
    const prev = String(event.node.res.getHeader('Vary') || '')
    event.node.res.setHeader('Vary', prev ? prev + ', Origin' : 'Origin')
  }
  event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  event.node.res.setHeader('Access-Control-Max-Age', '86400')

  // プリフライト（OPTIONS）は204で早期返却
  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})