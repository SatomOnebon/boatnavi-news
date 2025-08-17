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
  () => `/api/articles/${encodeURIComponent(id)}`,
  { key: () => `article-${id}`, server: true, watch: [id] }
)
const a = computed(() => data.value || null)

function human(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso), z=(n:number)=>n<10?'0'+n:''+n
  return `${d.getFullYear()}/${z(d.getMonth()+1)}/${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`
}

useHead(() => {
  const t = a.value?.title || '記事'
  const url = pub.siteUrl.replace(/\/+$/, '') + `/articles/${encodeURIComponent(id)}.html`
  const og = a.value?.image?.src
  return {
    title: t,
    link: [{ rel: 'canonical', href: url }],
    meta: [
      { name: 'description', content: a.value?.summary || '' },
      { property: 'og:title', content: t },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: url },
      ...(og ? [{ property: 'og:image', content: og }] : [])
    ]
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
const { data: latestRes, error: latestErr } = await useFetch<ListRes>(
  () => `/api/articles?limit=${LATEST_COUNT}`,
  { key: 'latest-articles', server: true }
)
const latest = computed(() =>
  (latestRes.value?.items || []).filter(it => it.id !== id) // 自記事は除外
)
</script>

<template>
  <!-- ★ ルート要素は NuxtLayout。ここに named slots を渡す -->
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
          <header style="margin:1rem 0">
            <h1 class="h2" style="margin:.25rem 0 .5rem; font-weight:800">{{ a.title }}</h1>
            <div class="subheader">
              <time :datetime="a.publishedAt">公開：{{ human(a.publishedAt) }}</time>
              <span v-if="a.updatedAt && a.updatedAt !== a.publishedAt"> / 更新：{{ human(a.updatedAt) }}</span>
            </div>
          </header>

          <figure v-if="a.image?.src" class="card" style="overflow:hidden; margin-bottom:1rem">
            <div class="ratio ratio-16x9">
              <img :src="a.image.src" :alt="a.image.alt || a.title" loading="lazy" decoding="async" />
            </div>
            <figcaption v-if="a.image.alt" class="card-section" style="font-size:.9rem;color:#666">{{ a.image.alt }}</figcaption>
          </figure>

          <div class="article-body" v-html="a.bodyHtml"></div>
        </article>
      </NuxtErrorBoundary>

      <!-- 本文の直後あたりに -->
<section v-if="latest?.length" class="latest-block">
  <header class="section-head" style="margin-bottom:12px">
    <span class="section-head__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M6 2h9a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H6V2zm2 4h8v2H8V6zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"/>
        <path d="M4 2h2v20H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
      </svg>
    </span>
    <h2 class="section-head__title">最新ニュース</h2>
  </header>

  <NewsListRows :items="latest" />
</section>

    </template>

    <!-- サイドバー（aside slot） -->
    <template #aside>
      <div v-if="a" class="callout">
        <strong>関連記事</strong>
        <ul class="no-bullet" v-if="a.related?.length">
          <li v-for="(r, i) in a.related" :key="i" style="margin:.5rem 0">
            <a :href="r.url" target="_blank" rel="noopener">{{ r.title }}</a>
          </li>
        </ul>
        <p v-else class="subheader" style="margin:.5rem 0 0;">—</p>
      </div>
      <NuxtLink to="/articles" class="button expanded hollow" style="margin-top:.5rem">一覧へ</NuxtLink>
    </template>
  </NuxtLayout>
</template>

<style scoped>
.article-body :deep(img){ max-width:100%; height:auto; display:block; margin:0 auto; }
.article-body :deep(figure){ margin:1rem 0; }
.article-body :deep(p){ line-height:1.9; margin:.9rem 0; }
.article-body :deep(h2), .article-body :deep(h3){ margin:1.4rem 0 .6rem; font-weight:700; }
.article-body :deep(a){ color:#1779ba; text-decoration:underline; }
</style>