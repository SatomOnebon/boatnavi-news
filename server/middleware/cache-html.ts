// server/middleware/cache-html.ts
import { defineEventHandler, getRequestURL } from 'h3'

export default defineEventHandler((event) => {
  const { pathname } = getRequestURL(event)
  if (pathname === '/articles' || pathname.startsWith('/articles/')) {
    // HTMLはCDN主導ではなく"オリジン主導"のキャッシュにする
    // s-maxage を短め、SWRで体感を上げる
    event.node.res.setHeader(
      'Cache-Control',
      'public, max-age=0, s-maxage=300, stale-while-revalidate=30, stale-if-error=86400'
    )
  }
})