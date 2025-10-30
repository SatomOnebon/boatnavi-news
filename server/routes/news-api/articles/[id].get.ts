// server/routes/news-api/articles/[id].get.ts
import { removeBoatracePrefix } from '../../../utils/headline'

type UpDetail = {
  news_item_id: string
  date_published?: string
  date_modified?: string
  headline?: string
  pc_body?: string
  sp_body?: string
  related_links?: { title?: string; url?: string; thumb?: string | null }[]
  images_detail?: Record<string, {
    headline?: string | null
    items?: {
      size2?: { url?: string; Width?: number; Height?: number }
      thumb?: { url?: string; Width?: number; Height?: number }
      size1?: { url?: string; Width?: number; Height?: number }
    }
  }>
}

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const { id } = (event.context.params || {}) as { id: string }

  const base = String(cfg.newsDetailApi || 'https://hochi.news/api/v1/umatoku/articles').replace(/\/+$/, '')
  const url = `${base}/${encodeURIComponent(id)}`

  const up = await $fetch<UpDetail>(url)

  const imgBase = (cfg.public as any).newsImageBase || 'https://hochi.news/'
  const rawBody = up.pc_body || up.sp_body || ''
  const hero = pickHero(up, imgBase) || pickFirstImgFromHtml(rawBody, imgBase)

  setHeader(event, 'Cache-Control',
    process.env.NODE_ENV === 'production'
      ? 'public, s-maxage=300, stale-while-revalidate=60'
      : 'no-store'
  )

  return {
    id: up.news_item_id,
    title: removeBoatracePrefix(up.headline || ''),
    publishedAt: toIsoJst(up.date_published),
    updatedAt: toIsoJst(up.date_modified || up.date_published),
    bodyHtml: rewriteHtml(rawBody, imgBase),
    image: hero || undefined,
    related: (up.related_links || []).map(r => ({
      title: removeBoatracePrefix(r.title || ''),
      url: r.url || '',
      thumb: absolutize(r.thumb || '', imgBase)
    }))
  }
})

// ---- helpers
function toIsoJst(v?: string){
  if(!v) return new Date().toISOString()
  const m = v.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/)
  const iso = m ? `${m[1]}T${m[2]}+09:00` : v
  const d = new Date(iso)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}
function absolutize(src='', base=''){
  if(!src) return ''
  if(/^https?:\/\//i.test(src)) return src
  if(!base) return src
  return new URL(src.replace(/^\/+/,''), base).toString()
}
function pickHero(up:UpDetail, base:string){
  const f = up.images_detail && Object.values(up.images_detail)[0]
  const s = f?.items?.size2 || f?.items?.thumb || f?.items?.size1
  if(!s?.url) return null
  return { src: absolutize(s.url, base), width: s.Width, height: s.Height, alt: f?.headline || up.headline || '' }
}
function pickFirstImgFromHtml(html:string, base:string){
  const m = html?.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m ? { src: absolutize(m[1], base), alt: '' } : null
}

/**
 * 本文HTMLの書き換え
 * - 画像/リンクの相対パスを絶対化
 * - figure 内で「画像を含む a」を <span> に置換（キャプション等の通常リンクは温存）
 * - 全 <img> に oncontextmenu / onmousedown を付与（右クリック・長押し抑止）
 */
function rewriteHtml(html:string, base:string){
  if(!html) return ''
  let out = html

  // 1) <img src> を絶対URL化
  out = out.replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi,
    (_, a, u, z) => a + absolutize(u, base) + z)

  // 2) <a href> を絶対URL化
  out = out.replace(/(<a[^>]+href=["'])([^"']+)(["'])/gi,
    (_, a, u, z) => a + absolutize(u, base) + z)

  // 3) figure ブロック内だけを抽出して、画像を含む a を <span> に置換
  out = out.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, (block) => {
    return block.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (m, attrs, inner) => {
      return /<img\b/i.test(inner) ? `<span${attrs}>${inner}</span>` : m
    })
  })

  // 4) すべての <img> に右クリック/長押し抑止を付与（重複属性は除去してから付与）
  out = out.replace(/<img\b([^>]*?)(\/?)>/gi, (_m, attrs, slash) => {
    const cleaned = String(attrs).replace(/\s(oncontextmenu|onmousedown)\s*=\s*["'][^"']*["']/gi, '')
    return `<img${cleaned} oncontextmenu="alert('(C) The Hochi Shimbun ');return false;" onmousedown="return false;"${slash}>`
  })

  return out
}