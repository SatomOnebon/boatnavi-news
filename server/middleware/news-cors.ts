// server/middleware/news-cors.ts
import { defineEventHandler, getRequestHeader, getRequestURL, sendNoContent } from 'h3'

const ALLOW_CREDENTIALS = process.env.CORS_ALLOW_CREDENTIALS === 'true'
const ORIGINS = (process.env.NEWS_CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
const ORIGIN_SET = new Set(ORIGINS)

export default defineEventHandler((event) => {
  // ニュースAPI配下だけに絞るなら:
  const { pathname } = getRequestURL(event)
  if (!pathname.startsWith('/news-api/')) return

  const reqOrigin = getRequestHeader(event, 'origin') || ''

  // 許可判定：完全一致のみ
  const allowed = reqOrigin && ORIGIN_SET.has(reqOrigin)
  if (allowed) {
    // レスポンスを Origin に応じて変える
    event.node.res.setHeader('Access-Control-Allow-Origin', reqOrigin)
    if (ALLOW_CREDENTIALS) {
      event.node.res.setHeader('Access-Control-Allow-Credentials', 'true')
    }
    // 代理キャッシュ向けに「Origin でバリアントが変わる」ことを宣言
    // （CloudFrontでも念のため付ける。※後述のポリシー設定も必須）
    event.node.res.setHeader('Vary', 'Origin')
  }

  // プリフライト
  if (event.node.req.method === 'OPTIONS') {
    // 許可しないOriginでも安全のため固定で返してOK（推奨）
    event.node.res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    event.node.res.setHeader('Access-Control-Max-Age', '600') // 10分
    return sendNoContent(event, 204)
  }
})