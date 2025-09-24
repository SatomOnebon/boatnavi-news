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

// SEO
useHead(() => {
  const title = page.value > 1 ? `最新ニュース（ページ${page.value}）` : '最新ニュース'
  const canonical = pub.siteUrl.replace(/\/+$/, '') + linkTo(page.value)
  const links:any[] = [{ rel: 'canonical', href: canonical }]
  if (page.value > 1) links.push({ rel: 'prev', href: pub.siteUrl.replace(/\/+$/, '') + linkTo(page.value - 1) })
  if (page.value < totalPages.value) links.push({ rel: 'next', href: pub.siteUrl.replace(/\/+$/, '') + linkTo(page.value + 1) })

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


// page が変わったらスムーズスクロールで先頭へ（保険）
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
      <nav class="breadcrumb" aria-label="パンくずリスト">
            <ul class="breadcrumb__list" role="list">
              <li class="breadcrumb__item"><NuxtLink to="/" external>ホーム</NuxtLink></li>
              <li class="breadcrumb__item" aria-current="page">ニュース</li>
            </ul>
      </nav>

      <!-- セクション見出し -->
      <h1 class="page-title">ニュース一覧</h1>
      <!-- 一覧の先頭アンカー -->
      <div id="articles-top" tabindex="-1"></div>
      <header class="section-head">
  
        <h2 class="section-head__title"> ページ {{ page }} / {{ totalPages }}</h2>
      </header>

      <div v-if="pending" class="callout secondary">読み込み中…</div>
      <div v-else-if="error" class="callout alert">一覧の取得に失敗しました。</div>

      <!-- 横並びリスト -->
      <NewsListRows :items="items" />

      <!-- ページネーション -->
      <nav class="pagination text-center" role="navigation" aria-label="Pagination">
      <NuxtLink class="button hollow small" :class="{ disabled: page<=1 }" :to="linkTo(page-1)" aria-label="前のページ">« 前へ</NuxtLink>
      <span class="current-page">ページ {{ page }} / {{ totalPages }}</span>
      <NuxtLink class="button hollow small" :class="{ disabled: page>=totalPages }" :to="linkTo(page+1)" aria-label="次のページ">次へ »</NuxtLink>
    </nav>
    </template>

    <template #aside>
      <div class="card">
          <NuxtLink to="/howto" class="banner-link"><img src="/images/howto.jpg" alt="boatnaviの使い方" /></NuxtLink>
      </div>
      <div id="right_access_ranking"></div>
    </template>
  </NuxtLayout>
</template>

<style scoped>
/* ページネーション既存調整 */
h1.page-title{
  font-size: clamp(18px, 20px, 24px); /* 既存指定を保持 */
  line-height: 1.5;
  font-weight: 800;
  margin: .25rem 0 .5rem;
}
.pagination { margin: 20px 0; }
.pagination .disabled { pointer-events:none; opacity:.4 }
.current-page { margin:0 .75rem; color:#6b7280 }
#articles-top { scroll-margin-top: 128px; }

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
</style>