// server/routes/news-api/articles.get.ts
import { getQuery, setHeader, setResponseStatus } from 'h3'
import { removeBoatracePrefix } from '../../utils/headline'

type Size = { url?: string; Width?: number; Height?: number }
type UpArticle = {
  news_item_id: string
  headline?: string
  body?: string[]
  date_published?: string
  date_modified?: string
  image?: {
    size2?: Size
    size1?: Size
    thumb?: Size
    headline?: string
  }
}
type Upstream = {
  result?: {
    current_page?: number
    last_page?: number
    total?: number
    per_page?: number
    articles?: UpArticle[]
  }
}

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const q = getQuery(event)

  const page  = toPage(q.page)    // NaN対策
  const limit = toLimit(q.limit)  // 1..50

  const listApi = (cfg as any).newsListApi || process.env.NEWS_LIST_API
  if (!listApi) {
    setResponseStatus(event, 500)
    return { message: 'newsListApi/NEWS_LIST_API が未設定です' }
  }

  try {
    const url = new URL(String(listApi))
    if (page)  url.searchParams.set('page',  String(page))
    // 上流が limit 非対応なら無視されるだけなので、必要なら有効化
    // if (limit) url.searchParams.set('limit', String(limit))

    const upstream = await $fetch<Upstream>(url.toString(), {
      headers: { accept: 'application/json' }
    })
    const res = upstream?.result ?? { articles: [], current_page: page || 1, per_page: 0, last_page: 1, total: 0 }

    const imgBase = (cfg.public as any).newsImageBase || process.env.NUXT_PUBLIC_NEWS_IMAGE_BASE || 'https://hochi.news/'

    let items = (res.articles || []).map((a) => {
      const pick = pickListImage(a.image, imgBase) // 軽量優先＋絶対URL化
      return {
        id: a.news_item_id,
        title: removeBoatracePrefix(a.headline || ''),
        summary: (a.body?.[0] || '').replace(/\s+/g, ' ').slice(0, 120),
        publishedAt: toIsoJst(a.date_published),
        updatedAt: toIsoJst(a.date_modified || a.date_published),
        image: pick || undefined, // { src, width, height, alt }
        url: `/articles/${encodeURIComponent(a.news_item_id)}.html`
      }
    })

    if (limit) items = items.slice(0, limit)

    setHeader(
      event,
      'Cache-Control',
      process.env.NODE_ENV === 'production'
        ? 'public, s-maxage=60, stale-while-revalidate=30'
        : 'no-store'
    )

    return {
      page: res.current_page || page || 1,
      perPage: res.per_page || items.length,
      totalPages: res.last_page || 1,
      total: res.total || items.length,
      items
    }
  } catch (e) {
    console.error('[news-api] upstream error:', e)
    setResponseStatus(event, 502)
    return { message: 'ニュース上流への到達に失敗しました' }
  }
})

/* ===== helpers ===== */
function toPage(v: any){ const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined }
function toLimit(v: any){ const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(50, Math.floor(n)) : 0 }

function toIsoJst(v?: string){
  if (!v) return new Date().toISOString()
  const m = v.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/)
  const iso = m ? `${m[1]}T${m[2]}+09:00` : v
  const d = new Date(iso)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}
function absolutize(src = '', base = ''){
  if (!src) return ''
  if (/^https?:\/\//i.test(src)) return src
  return new URL(src.replace(/^\/+/, ''), base).toString()
}
// 一覧は軽量優先：size1 → thumb → size2
function pickListImage(img: UpArticle['image'], base: string){
  if (!img) return null
  const s = img.size1?.url ? img.size1 : (img.thumb?.url ? img.thumb : img.size2)
  if (!s?.url) return null
  return { src: absolutize(s.url, base), width: s.Width, height: s.Height, alt: img.headline || '' }
}