// server/middleware/10_cors.ts
import { defineEventHandler, getMethod, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  // /news-api/ 配下だけ CORS を付与（不要なら条件を外す）
  const reqUrl = event.node.req.url || '/'
  const url = new URL(reqUrl, 'http://localhost')
  if (!url.pathname.startsWith('/news-api/')) return

  // ---- 設定（環境変数）
  // 複数オリジン可: カンマ/空白区切り
  // 例: 'https://boatnavi.hochi.co.jp, https://stg.boatnavi.hochi.co.jp, http://localhost:8080'
  const allowListRaw =
    process.env.NEWS_CORS_ORIGINS ||
    process.env.NUXT_PUBLIC_SPA_ORIGIN || // 後方互換
    '*'

  // Cookie を跨いで使うなら true に（＊その場合は allowListRaw に '*' は使えません）
  const allowCredentials = process.env.CORS_ALLOW_CREDENTIALS === '1'

  const allowList = allowListRaw
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(Boolean)

  const reqOrigin = String(event.node.req.headers.origin || '')
  let allowOrigin = ''

  if (allowList.includes('*') && !allowCredentials) {
    // 資格情報なしならワイルドカード可
    allowOrigin = '*'
  } else if (reqOrigin && allowList.length) {
    // 要求元が許可リストに入っていれば、それをそのまま返す
    // （完全一致運用。ワイルドカード運用にしたい場合はここでマッチ関数を拡張）
    if (allowList.includes(reqOrigin)) {
      allowOrigin = reqOrigin
    }
  }

  // 許可できない場合は何も付けない（ブラウザ側でブロックさせる）
  if (!allowOrigin) return

  // ---- 共通ヘッダ
  const res = event.node.res
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)

  // 複数オリジン対応では Vary: Origin を付けてキャッシュ汚染を防ぐ
  const prevVary = String(res.getHeader('Vary') || '')
  res.setHeader('Vary', prevVary ? prevVary + ', Origin' : 'Origin')

  // 必要なメソッドを列挙
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')

  // プリフライト要求ヘッダをそのまま返す（なければデフォルト）
  const reqAllowHeaders =
    (event.node.req.headers['access-control-request-headers'] as string) ||
    'Content-Type, Authorization, X-Requested-With'
  res.setHeader('Access-Control-Allow-Headers', reqAllowHeaders)

  // 資格情報（Cookie 等）を跨いで使う場合
  if (allowCredentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  // キャッシュ（プリフライトの再利用）
  res.setHeader('Access-Control-Max-Age', '86400')

  // プリフライトはここで終了
  const method = getMethod(event)
  if (method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})