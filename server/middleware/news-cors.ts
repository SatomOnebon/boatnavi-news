// server/middleware/news-cors.ts
import { defineEventHandler, getRequestHeader, getRequestURL, sendNoContent } from 'h3'

const ALLOW_CREDENTIALS = process.env.CORS_ALLOW_CREDENTIALS === 'true'
const ORIGIN_SET = new Set(
  (process.env.NEWS_CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
)

export default defineEventHandler((event) => {
  const { pathname } = getRequestURL(event)
  // /news-api/* 以外は何もしない
  if (!pathname.startsWith('/news-api/')) return

  // 要求 Origin
  const reqOrigin = getRequestHeader(event, 'origin') || ''
  const allowed = reqOrigin && ORIGIN_SET.has(reqOrigin)

  // CORS 応答（許可時のみ）
  if (allowed) {
    event.node.res.setHeader('Access-Control-Allow-Origin', reqOrigin)
    if (ALLOW_CREDENTIALS) {
      event.node.res.setHeader('Access-Control-Allow-Credentials', 'true')
    }
  }
  // CORSはOriginでバリアントが変わる → 常に宣言
  event.node.res.setHeader('Vary', 'Origin')

  // プリフライト
  if (event.node.req.method === 'OPTIONS') {
    event.node.res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    event.node.res.setHeader('Access-Control-Max-Age', '600')
    return sendNoContent(event, 204)
  }
})