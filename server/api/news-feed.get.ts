import { getQuery, setHeader } from 'h3'


export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const q = getQuery(event)
  const page = toPage(q.page) || 1
  const limit = toLimit(q.limit) || 4



  // 既存の正規化済み一覧APIを内部利用
  const base = getRequestURL(event).origin
  const { items } = await $fetch<{ items: any[] }>('/api/articles', {
    baseURL: base,
    query: { page, limit }
  })

  // SPA向けに必要最小限で返す
  const data = (items || []).map(it => ({
    id: it.id,
    title: it.title,
    url: it.url,
    image: it.image?.src || '',   // 文字列一本に
    publishedAt: it.publishedAt
  }))

  // 軽めのキャッシュ（CloudFront/Nitro両方を意識）
  setHeader(event, 'Cache-Control',
    process.env.NODE_ENV === 'production'
      ? 'public, s-maxage=60, stale-while-revalidate=30'
      : 'no-store'
  )

  return { items: data }
})

function toPage(v:any){ const n=Number(v); return Number.isFinite(n)&&n>0?Math.floor(n):0 }
function toLimit(v:any){ const n=Number(v); return Number.isFinite(n)&&n>0?Math.min(50,Math.floor(n)):0 }

