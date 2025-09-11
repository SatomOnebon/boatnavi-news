<!-- pages/articles/[...slug].vue -->
<script setup lang="ts">
definePageMeta({ layout: false }) // ← 自動レイアウトを無効化

const route = useRoute()
const { public: pub } = useRuntimeConfig()

const raw = Array.isArray(route.params.slug) ? route.params.slug.join('/') : String(route.params.slug || '')
const id = raw.replace(/\.html$/i, '')

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
  () => `/news-api/articles/${encodeURIComponent(id)}`,
  { key: () => `article-${id}`, server: true, watch: [id] }
)
const a = computed(() => data.value || null)

function human(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso), z=(n:number)=>n<10?'0'+n:''+n
  return `${d.getFullYear()}/${z(d.getMonth()+1)}/${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`
}

// 先頭20文字で省略（サロゲートペア対応）
const MAX_CRUMB_TITLE = 15
function truncateText(text = '', max = MAX_CRUMB_TITLE) {
  const arr = Array.from(text)
  return arr.length > max ? arr.slice(0, max).join('') + '…' : text
}
const crumbTitle = computed(() => truncateText(a.value?.title || ''))


function htmlToText(html = '') {
  // script/style を除去 → タグを除去 → 空白整形 → 主要なエンティティをデコード
  const noBlocks = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const stripped = noBlocks.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const description = computed(() => {
  const txt = htmlToText(a.value?.bodyHtml || '');
  if (txt) return txt.length > 100 ? txt.slice(0, 100) + '…' : txt;
  // 本文が空なら summary にフォールバック
  return a.value?.summary || '';
});

useHead(() => {
  const t = a.value?.title || '記事';
  const d = description.value; // ← ここを本文先頭100文字に
  const base = pub.siteUrl.replace(/\/+$/, '');
  const url  = `${base}/articles/${encodeURIComponent(id)}.html`;
  const img  = a.value?.image?.src || `${base}/ogp.png`;

  const published = a.value?.publishedAt ? new Date(a.value.publishedAt).toISOString() : undefined;
  const modified  = a.value?.updatedAt   ? new Date(a.value.updatedAt).toISOString()   : published;

  const siteName    = (pub as any).siteName || 'BOATNAVI報知';
  const twitterSite = (pub as any).twitterSite;

  return {
    title: t,
    link: [{ rel: 'canonical', href: url }],
    meta: [
      { name: 'description', content: d },

      { property: 'og:site_name', content: siteName },
      { property: 'og:title', content: t },
      { property: 'og:description', content: d },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: url },
      { property: 'og:locale', content: 'ja_JP' },
      ...(img ? [{ property: 'og:image', content: img }] : []),

      ...(published ? [{ property: 'article:published_time', content: published }] : []),
      ...(modified  ? [{ property: 'article:modified_time',  content: modified  }] : []),

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: t },
      { name: 'twitter:description', content: d },
      ...(img ? [{ name: 'twitter:image', content: img }] : []),
      ...(twitterSite ? [{ name: 'twitter:site', content: twitterSite }] : [])
    ]
  };
});

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
  (latestRes.value?.items || []).filter(it => it.id !== id)
)


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

        <article v-else>
          <!-- パンくず（記事タイトルの前） -->
          <nav class="breadcrumb" aria-label="パンくずリスト">
            <ul class="breadcrumb__list" role="list">
              <li class="breadcrumb__item"><NuxtLink to="/">ホーム</NuxtLink></li>
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

          <div class="article-body" v-html="a.bodyHtml"></div>

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
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
            <path d="M6 2h9a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H6V2zm2 4h8v2H8V6zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"/>
            <path d="M4 2h2v20H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
          </svg>
          <h2 class="section-head__title">最新ニュース</h2>
        </header>

        <NewsListRows :items="latest" />
        <NuxtLink to="/articles" class="button expanded hollow">一覧へ</NuxtLink>
      </section>
    </template>

    <!-- サイドバー（aside slot） -->
    <template #aside>
      <NuxtLink to="/articles" class="button expanded hollow" style="margin-top:.5rem;">一覧へ</NuxtLink>
    </template>
  </NuxtLayout>
</template>

<style scoped>

/* ========== ヘッダー周り ========== */
.article-header{ margin: 1rem 0 1.25rem; }

.article-title{
  font-size: clamp(18px, 20px, 24px); /* 既存指定を保持 */
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

/* モバイル微調整 */
@media (max-width: 640px){
  .article-title{ font-size: clamp(18px, 4.8vw, 22px); }
  .article-meta{ font-size: 12.5px; }
}
</style>