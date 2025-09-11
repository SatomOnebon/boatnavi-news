// server/routes/news-api/articles/index.get.ts
type Upstream = {
    result: {
      current_page: number
      per_page: number
      last_page: number
      total: number
      articles: Array<{
        news_item_id: string
        headline?: string
        date_published?: string
        date_modified?: string
        body?: string[]
        image?: {
          headline?: string
          size2?: { url?: string; Width?: number; Height?: number }
          thumb?: { url?: string; Width?: number; Height?: number }
          size1?: { url?: string; Width?: number; Height?: number }
        }
      }>
    }
  }
  
  export default defineEventHandler(async (event) => {
    const cfg = useRuntimeConfig()
    const q = getQuery(event)
    const page = q.page ? Math.max(1, Number(q.page)) : undefined
    const limit = q.limit ? Math.min(50, Math.max(1, Number(q.limit))) : undefined
  
    // 上流 URL（.env で NEWS_LIST_API に設定している想定）
    const url = new URL(String((cfg as any).newsListApi))
    if (page) url.searchParams.set('page', String(page))
    if (limit) url.searchParams.set('limit', String(limit)) // 上流が未対応なら無視されるだけ
  
    const upstream = await $fetch<Upstream>(url.toString())
    const imgBase = (cfg.public as any).newsImageBase || 'https://hochi.news/'
  
    const items = (upstream.result.articles || []).map((a) => {
      // 画像の優先順位（size2 → thumb → size1）
      const pick =
        a.image?.size2?.url ? { u: a.image.size2.url, w: a.image.size2.Width, h: a.image.size2.Height } :
        a.image?.thumb?.url ? { u: a.image.thumb.url, w: a.image.thumb.Width, h: a.image.thumb.Height } :
        a.image?.size1?.url ? { u: a.image.size1.url, w: a.image.size1.Width, h: a.image.size1.Height } :
        undefined
  
      return {
        id: a.news_item_id,
        title: a.headline || '',
        summary: (a.body?.[0] || '').slice(0, 120),
        publishedAt: toIsoJst(a.date_published),
        updatedAt: toIsoJst(a.date_modified || a.date_published),
        image: pick ? {
          src: absolutize(pick.u || '', imgBase),
          width: pick.w, height: pick.h,
          alt: a.image?.headline || a.headline || ''
        } : undefined,
        url: `/articles/${encodeURIComponent(a.news_item_id)}.html`
      }
    })
  
    setHeader(event, 'Cache-Control',
      process.env.NODE_ENV === 'production'
        ? 'public, s-maxage=60, stale-while-revalidate=30'
        : 'no-store'
    )
  
    return {
      page: upstream.result.current_page,
      perPage: upstream.result.per_page,
      totalPages: upstream.result.last_page,
      total: upstream.result.total,
      items
    }
  })
  
  // ---- helpers（このファイル内に自給しておくと依存が減って安全）
  function toIsoJst(v?: string){
    if(!v) return new Date().toISOString()
    const m=v.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/)
    const iso=m?`${m[1]}T${m[2]}+09:00`:v
    const d=new Date(iso)
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  }
  function absolutize(src='',base=''){
    if(!src) return ''
    if(/^https?:\/\//i.test(src)) return src
    if(!base) return src
    return new URL(src.replace(/^\/+/,''), base).toString()
  }