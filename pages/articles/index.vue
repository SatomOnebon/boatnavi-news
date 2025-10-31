<!-- pages/articles/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: false })

// ページ遷移時に #articles-top へ飛ぶようにハッシュを付ける
const linkTo = (p: number) => ({
  path: '/articles',
  query: { page: p },
  hash: '#articles-top'
})

const route = useRoute()
const { public: pub } = useRuntimeConfig()

// 現在のページ番号を算出
const page = computed(() => {
  const p = Number(route.query.page || 1)
  return Number.isFinite(p) && p > 0 ? Math.floor(p) : 1
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
type ListRes = { page: number; perPage: number; totalPages: number; total: number; items: Item[] }

const { data, pending, error } = await useFetch<ListRes>(
  () => `/news-api/articles?page=${page.value}`,
  { key: () => `articles-${page.value}`, server: true, watch: [page] }
)

const items = computed(() => data.value?.items || [])
const totalPages = computed(() => data.value?.totalPages || 1)

// 日付を日本語でフォーマット
function jpDateTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const dd = d.getDate()
  const hh = d.getHours()
  const mm = d.getMinutes()
  return `${y}年${m}月${dd}日 ${hh}時${mm}分`
}

// SEO 用メタデータ
useHead(() => {
  const title = page.value > 1 ? `最新ニュース（ページ${page.value}）` : '最新ニュース'
  const canonical = new URL(
    `/articles?page=${page.value}#articles-top`,
    pub.siteUrl.replace(/\/+$/, '')
  ).toString()

  const links: any[] = [{ rel: 'canonical', href: canonical }]

  if (page.value > 1) {
    links.push({
      rel: 'prev',
      href: new URL(`/articles?page=${page.value - 1}#articles-top`, pub.siteUrl).toString()
    })
  }
  if (page.value < totalPages.value) {
    links.push({
      rel: 'next',
      href: new URL(`/articles?page=${page.value + 1}#articles-top`, pub.siteUrl).toString()
    })
  }

  return {
    title,
    link: links,
    meta: [
      { name: 'description', content: 'ボートレース関連の最新ニュース一覧。' },
      { property: 'og:title', content: title },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonical }
    ]
  }
})

// ページが変わったらスムーズスクロールで先頭へ
watch(() => route.query.page, () => {
  if (process.client) {
    const el =
      document.getElementById('articles-top') ||
      document.querySelector('.site-main__inner') ||
      document.body
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})
</script>

<template>
  <NuxtLayout name="site">
    <template #default>
      <!-- パンくず -->
      <nav class="breadcrumb" aria-label="パンくずリスト">
        <ul class="breadcrumb__list" role="list">
          <li class="breadcrumb__item"><NuxtLink to="/" external>ホーム</NuxtLink></li>
          <li class="breadcrumb__item" aria-current="page">ニュース</li>
        </ul>
      </nav>

      <!-- セクション見出し -->
      <h1 class="page-title">ニュース</h1>

      <!-- 一覧の先頭アンカー -->
      <div id="articles-top" tabindex="-1"></div>

      <header class="section-head">
        <h2 class="section-head__title">ページ {{ page }} / {{ totalPages }}</h2>
      </header>

      <div v-if="pending" class="callout secondary">読み込み中…</div>
      <div v-else-if="error" class="callout alert">一覧の取得に失敗しました。</div>

      <!-- 横並びリスト -->
      <ClientOnly>
        <!-- 🔽 修正版：id は存在しないので page をキーに -->
        <NewsListRows :items="items" :key="`latest-${page}`" />
      </ClientOnly>

      <!-- ページネーション -->
      <nav class="pagination text-center" role="navigation" aria-label="Pagination">
        <NuxtLink
          class="button hollow small"
          :class="{ disabled: page <= 1 }"
          :to="linkTo(page - 1)"
          aria-label="前のページ"
        >« 前へ</NuxtLink>
        <span class="current-page">ページ {{ page }} / {{ totalPages }}</span>
        <NuxtLink
          class="button hollow small"
          :class="{ disabled: page >= totalPages }"
          :to="linkTo(page + 1)"
          aria-label="次のページ"
        >次へ »</NuxtLink>
      </nav>
    </template>

    <template #aside>
      <div class="stack">
        <div class="card">
          <NuxtLink to="/howto" external class="banner-link">
            <img src="/images/howto.jpg" alt="boatnaviの使い方" />
          </NuxtLink>
        </div>
      </div>
      <div id="right_access_ranking">
        <div id="boat-ranking"></div>
      </div>
    </template>
  </NuxtLayout>
</template>

<style scoped>
h1.page-title {
  font-size: clamp(18px, 20px, 24px);
  line-height: 1.5;
  font-weight: 800;
  margin: 0.25rem 0 0.5rem;
  color: #0b2f4a;
  background-image: url(/images/icon_news_navy.png);
  background-size: contain;
  padding-left: 35px;
  background-repeat: no-repeat;
}
.pagination {
  margin: 20px 0;
}
.pagination .disabled {
  pointer-events: none;
  opacity: 0.4;
}
.current-page {
  margin: 0 0.75rem;
  color: #6b7280;
}
#articles-top {
  scroll-margin-top: 128px;
}

.site-aside a.banner-link {
  display: block;
  background-color: #fff;
}
.site-aside a.banner-link img {
  display: block;
  opacity: 1;
}
.site-aside a.banner-link:hover img,
.site-aside a.banner-link:focus img {
  opacity: 0.7;
}
.site-aside a.banner-link:active img {
  opacity: 0.9;
}
.stack .card {
  border: 0;
}
.stack .card .banner-link {
  margin: 0 auto;
}
</style>