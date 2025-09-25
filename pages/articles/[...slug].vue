<!-- pages/articles/[...slug].vue -->
<script setup lang="ts">
definePageMeta({ layout: false }) // ← 自動レイアウトを無効化

const route = useRoute()
const { public: pub } = useRuntimeConfig()

// ★ ここを computed 化（watch の警告対策 & ルート遷移追従）
const slug = computed(() =>
  Array.isArray(route.params.slug)
    ? route.params.slug.join('/')
    : String(route.params.slug || '')
)
const id = computed(() => slug.value.replace(/\.html$/i, ''))

type Article = {
  id: string
  title: string
  summary?: string
  publishedAt: string
  updatedAt?: string
  image?: { src: string; alt?: string }
  bodyHtml?: string
  related?: Array<{ title: string; url: string }>
}

const { data, pending, error } = await useFetch<Article | null>(
  () => `/news-api/articles/${encodeURIComponent(id.value)}`,
  { key: () => `article-${id.value}`, server: true, watch: [id] }
)
const a = computed(() => data.value || null)

// 置き換え推奨：human()
function human(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const dtf = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
  const p = Object.fromEntries(dtf.formatToParts(d).map(x => [x.type, x.value]))
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}`
}

// 先頭15文字で省略（サロゲートペア対応）
const MAX_CRUMB_TITLE = 15
function truncateText(text = '', max = MAX_CRUMB_TITLE) {
  const arr = Array.from(text)
  return arr.length > max ? arr.slice(0, max).join('') + '…' : text
}
const crumbTitle = computed(() => truncateText(a.value?.title || ''))

// JST固定＋記事IDフォールバックで安全に分解
function jstParts(dateInput?: string | null, articleIdForFallback?: string | null) {
  let src = (dateInput || '').trim()

  // publishedAt 等が空なら、記事ID先頭 YYYYMMDD から 00:00:00 を構成
  if (!src && articleIdForFallback) {
    const m = /^(\d{4})(\d{2})(\d{2})/.exec(articleIdForFallback)
    if (m) src = `${m[1]}-${m[2]}-${m[3]}T00:00:00+09:00`
  }
  if (!src) return null

  // 「日付のみ」→ JST 00:00:00 付与
  if (/^\d{4}-\d{2}-\d{2}$/.test(src)) {
    src = `${src}T00:00:00+09:00`
  }
  // 「TZ無し日時」→ +09:00 を付与（スペース/T 両対応）
  else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(src)) {
    src = src.replace(' ', 'T') + '+09:00'
  }

  const d = new Date(src)
  if (isNaN(d.getTime())) return null

  const dtf = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(dtf.formatToParts(d).map(p => [p.type, p.value]))
  const Y = parts.year, M = parts.month, D = parts.day
  const h = parts.hour, m = parts.minute, s = parts.second
  if (!Y || !M || !D || !h || !m || !s) return null

  return {
    year: Number(Y),                         // 例: 2025
    pubmonth: `${Y}${M}`,                   // 例: 202509
    pubday:   `${Y}${M}${D}`,               // 例: 20250916
    isoJst:   `${Y}-${M}-${D}T${h}:${m}:${s}+09:00`, // 例: 2025-09-16T22:25:00+09:00
  }
}

// 相対URLを絶対化
function absUrl(src?: string, base?: string) {
  if (!src) return ''
  try {
    const u = new URL(src)
    return u.toString()
  } catch (_) {
    const b = (base || '').replace(/\/+$/, '')
    const s = src.startsWith('/') ? src : `/${src}`
    return `${b}${s}`
  }
}

// 本文テキスト化（メタ description 用）
function htmlToText(html = '') {
  const noBlocks = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
  const stripped = noBlocks.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

// 本文を cXense コメントで囲う（重複防止付き）
const wrappedBodyHtml = computed(() => {
  const html = a.value?.bodyHtml || ''
  if (/<!--\s*cxenseparse_start\s*-->/.test(html)) return html
  return `<!-- cxenseparse_start -->\n${html}\n<!-- cxenseparse_end -->`
})

const description = computed(() => {
  const txt = htmlToText(a.value?.bodyHtml || '')
  if (txt) return txt.length > 100 ? txt.slice(0, 100) + '…' : txt
  return a.value?.summary || ''
})

// Head
useHead(() => {
  const t = a.value?.title || '記事'
  const d = description.value
  const base = pub.siteUrl.replace(/\/+$/, '')
  const url  = `${base}/articles/${encodeURIComponent(id.value)}.html`

  const rawImg = a.value?.image?.src || '/ogp.png'
  const img    = absUrl(rawImg, base)

  const siteName    = (pub as any).siteName || 'BOATNAVI報知'
  const twitterSite = (pub as any).twitterSite

  const articleId = a.value?.id || id.value

  // JST 正規化（公開日は articleId でフォールバック、更新日はそのまま）
  const pubParts = jstParts(a.value?.publishedAt || null, articleId)
  const modParts = jstParts(a.value?.updatedAt   || null, null)

  const cxCategory = (pub as any).hocCategoryDefault || 'ボートレース'
  const cxTags     = (pub as any).hocTagDefault || 'ボートレース'

  return {
    title: t,
    link: [{ rel: 'canonical', href: url }],
    meta: [
      { key: 'desc', name: 'description', content: d },

      // OG
      { key: 'og:site_name', property: 'og:site_name', content: siteName },
      { key: 'og:title',     property: 'og:title',     content: t },
      { key: 'og:desc',      property: 'og:description', content: d },
      { key: 'og:type',      property: 'og:type',      content: 'article' },
      { key: 'og:url',       property: 'og:url',       content: url },
      { key: 'og:locale',    property: 'og:locale',    content: 'ja_JP' },
      ...(img ? [{ key: 'og:image', property: 'og:image', content: img }] : []),

      // Article times（JSTに統一、null時は出力しない）
      ...(pubParts ? [{ key: 'art:pub', property: 'article:published_time', content: pubParts.isoJst }] : []),
      ...(modParts ? [{ key: 'art:mod', property: 'article:modified_time',  content: modParts.isoJst }] : []),

      // Twitter
      { key: 'tw:card',  name: 'twitter:card',  content: 'summary_large_image' },
      { key: 'tw:title', name: 'twitter:title', content: t },
      { key: 'tw:desc',  name: 'twitter:description', content: d },
      ...(img ? [{ key: 'tw:image', name: 'twitter:image', content: img }] : []),
      ...(twitterSite ? [{ key: 'tw:site', name: 'twitter:site', content: twitterSite }] : []),

      // cXense（絶対URLで image / key 付き）
      { key: 'cx:cat',   name: 'cXenseParse:hoc-category',     content: cxCategory },
      { key: 'cx:tag',   name: 'cXenseParse:hoc-tag',          content: cxTags, 'data-separator': ',' },
      { key: 'cx:class', name: 'cXenseParse:pageclass',        content: 'article' },
      { key: 'cx:type',  name: 'cXenseParse:hoc-articletype',  content: 'free' },
      ...(img ? [{ key: 'cx:image', name: 'cXenseParse:recs:image', content: img }] : []),
      ...(articleId ? [{ key: 'cx:haid', name: 'cXenseParse:hoc-articleid', content: articleId }] : []),
      ...(articleId ? [{ key: 'cx:aid',  name: 'cXenseParse:articleid',     content: articleId }] : []),
      ...(pubParts ? [{ key: 'cx:year',  name: 'cXenseParse:hoc-pubyear',   content: String(pubParts.year) }] : []),
      ...(pubParts ? [{ key: 'cx:month', name: 'cXenseParse:hoc-pubmonth',  content: pubParts.pubmonth }] : []),
      ...(pubParts ? [{ key: 'cx:day',   name: 'cXenseParse:hoc-pubday',    content: pubParts.pubday }] : []),
    ],
  }
})

type Item = {
  id: string
  title: string
  summary?: string
  publishedAt: string
  updatedAt?: string
  image?: { src: string; alt?: string; width?: number; height?: number }
  url: string
}
type ListRes = { items: Item[]; page: number; perPage: number; totalPages: number; total: number }

const LATEST_COUNT = 6
const { data: latestRes } = await useFetch<ListRes>(
  () => `/news-api/articles?limit=${LATEST_COUNT}`,
  { key: 'latest-articles', server: true }
)
const latest = computed(() =>
  (latestRes.value?.items || []).filter(it => it.id !== id.value)
)

// Piano: 記事に応じたタグ（カテゴリ、会員/非会員）を付与して init
const { setTags, initWithJwtOnce } = usePiano()

onMounted(() => {
  const tags = ['ボートレース','非会員']
  setTags(tags)
  initWithJwtOnce()  // uidutil_tkn が無くても落ちずに初期化へ
})
</script>

<template>
  <!-- ルート要素は NuxtLayout（共通ヘッダー/フッター適用） -->
  <NuxtLayout name="site">
    <!-- 本文（default slot） -->
    <template #default>
      <NuxtErrorBoundary>
        <template #error="{ error }">
          <div class="callout alert">
            <h3>レンダリングエラー</h3>
            <pre style="white-space:pre-wrap">{{ error?.message }}</pre>
          </div>
        </template>

        <div v-if="pending" class="callout secondary">読み込み中…</div>

        <div v-else-if="error || !a" class="callout alert">
          記事が見つかりませんでした。
          <NuxtLink class="button hollow tiny" to="/articles" style="margin-left:.5rem">一覧へ戻る</NuxtLink>
        </div>

        <article :key="id" v-else>
          <!-- パンくず（記事タイトルの前） -->
          <nav class="breadcrumb" aria-label="パンくずリスト">
            <ul class="breadcrumb__list" role="list">
              <li class="breadcrumb__item"><NuxtLink to="/" external>ホーム</NuxtLink></li>
              <li class="breadcrumb__item"><NuxtLink to="/articles">ニュース</NuxtLink></li>
              <li class="breadcrumb__item" aria-current="page">{{ crumbTitle }}</li>
            </ul>
          </nav>

          <header class="article-header">
            <h1 class="article-title">{{ a.title }}</h1>
            <div class="article-meta">
              <time class="article-date" :datetime="a.publishedAt">公開：{{ human(a.publishedAt) }}</time>
              <!-- 更新日は出さない -->
            </div>
          </header>

          <!-- メイン画像（必要なら復活）
          <figure v-if="a.image?.src" class="card article-hero">
            <div class="ratio ratio-16x9">
              <img :src="a.image.src" :alt="a.image.alt || a.title" loading="lazy" decoding="async" />
            </div>
            <figcaption v-if="a.image.alt" class="card-section hero-cap">{{ a.image.alt }}</figcaption>
          </figure>
          -->

          <!-- 本文に cXense コメントを挿入 -->
          <div class="article-body" v-html="wrappedBodyHtml"></div>

          <!-- 関連記事（本文下） -->
          <div v-if="a" class="callout related">
            <strong>関連記事</strong>
            <ul class="no-bullet" v-if="a.related?.length">
              <li v-for="(r, i) in a.related" :key="i" class="related__item">
                <a :href="r.url" target="_blank" rel="noopener">{{ r.title }}</a>
              </li>
            </ul>
            <p v-else class="subheader" style="margin:.5rem 0 0;">—</p>
          </div>
        </article>
      </NuxtErrorBoundary>

      <!-- 本文の直後に最新ニュース -->
   
      <section v-if="latest?.length" class="latest-block">
        <header class="section-head" style="margin-bottom:12px">
          <h2 class="section-head__title news-title">最新ニュース</h2>
        </header>
        <ClientOnly>
        <NewsListRows :items="latest" :key="`latest-${id}`" />
      </ClientOnly>
        <p style="text-align:center; margin:30px 0 0;">
 
          <NuxtLink to="/articles" class="button news-list-button">ニュース一覧へ</NuxtLink>
        </p>

      </section>
   
    </template>

    <!-- サイドバー（aside slot） -->
    <template #aside>
      <div class="stack">
      <div class="card">
          <NuxtLink to="/howto" external class="banner-link" ><img src="/images/howto.jpg" alt="boatnaviの使い方" /></NuxtLink>
      </div>
      </div>
      <div id="right_access_ranking"></div>
    </template>
  </NuxtLayout>
</template>

<style scoped>
/* ========== ヘッダー周り ========== */
.article-header{ margin: 1rem 0 1.25rem; }

.article-title{
  font-size: clamp(18px, 20px, 24px);
  line-height: 1.5;
  font-weight: 800;
  margin: .25rem 0 .5rem;
  padding: 20px 0;
  border-top: 1px solid #d0e0ec;
  border-bottom: 1px solid #d0e0ec;
}
@media (max-width: 640px){
  .article-title{ padding:15px 0; }
}

/* 公開日のみ表示 */
.article-meta{
  color:#6b7280;
  font-size: 13.5px;
}
.article-date{ white-space:nowrap; }

/* ========== 本文整形 ========== */
.article-body :deep(img){ max-width:100%; height:auto; display:block; margin:0 auto; }
.article-body :deep(figure){ margin:1rem 0 1.5rem 0; }
.article-body :deep(p){ line-height:1.9; margin:.9rem 0; }
.article-body :deep(h2), .article-body :deep(h3){ margin:1.4rem 0 .6rem; font-weight:700; }
.article-body :deep(a){ color:#1779ba; text-decoration:underline; }
.article-body :deep(.box_image){
  max-width: 640px;
  background: #fafbff;
  margin-left:auto; margin-right:auto;
  display: block;
}
.article-body :deep(.box_image.box_image--vertical){ max-width: 400px; }
.article-body :deep(.box_image__cap){ padding:5px 10px; font-size:13px; }

/* ヒーロー画像（コメントアウト中の figure 用） */
.article-hero{ overflow:hidden; margin-bottom:1rem; border-radius: 12px; }
.hero-cap{ font-size:.9rem; color:#666; }

/* 関連記事 */
.related{ margin:40px auto; border-color:#dfe5fd; }
.related__item{ margin:.5rem 0; }

/* 最新ニュースブロック */
.latest-block{ margin-top: 24px; }

.news-title{
  padding-left:30px;
  padding-top:3px;
  padding-bottom:3px;
  background-image: url(/images/icon_news_white.png);
  background-repeat: no-repeat;
  background-size: contain;
}

.news-list-button{
  display:block;
  max-width:300px;
  margin:0 auto 20px auto;
  border-radius: 20px;
  background-color: #3C0C00;

  transition:background-color 0.5s;

}
.news-list-button:hover,
.news-list-button:focus{
  background-color: rgb(125.5,25.0,0);
}
.news-list-button:active{
  background-color: #3C0C00;
}



/* モバイル微調整 */
@media (max-width: 640px){
  .article-title{ font-size: clamp(18px, 4.8vw, 22px); }
  .article-meta{ font-size: 12.5px; }
}

.site-aside a.banner-link{
    display: block;
    background-color: #FFF;
  }
  .site-aside a.banner-link img{
    display: block;
    opacity: 1;
  }
  .site-aside  a.banner-link:hover img,
  .site-aside a.banner-link:focus img{
    opacity: 0.7;
  }
  .site-aside a.banner-link:active img{
    opacity: 0.9;
  }

  .stack .card{
    border:0;
  }
  .stack .card .banner-link{
    margin:0 auto;
  }
</style>