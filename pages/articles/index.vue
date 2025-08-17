<script setup lang="ts">
definePageMeta({ layout: false })

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
  () => `/api/articles?page=${page.value}`,
  { key: () => `articles-${page.value}`, server: true, watch: [page] }
)

const items = computed(() => data.value?.items || [])
const totalPages = computed(() => data.value?.totalPages || 1)

function linkTo(p: number) {
  return p <= 1 ? '/articles' : `/articles?page=${p}`
}
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
</script>

<template>
  <NuxtLayout name="site">
    <template #default>
      <!-- セクション見出し -->
      <header class="section-head">
        <span class="section-head__icon" aria-hidden="true">
          <!-- シンプルなノートアイコン（SVG） -->
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M6 2h9a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H6V2zm2 4h8v2H8V6zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"/>
            <path d="M4 2h2v20H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
          </svg>
        </span>
        <h1 class="section-head__title">最新ニュース</h1>
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
      <div class="callout">
        <strong>このページについて</strong>
        <p class="subheader" style="margin:.5rem 0 0">ニュースは数分ごとに更新されます。</p>
      </div>
    </template>
  </NuxtLayout>
</template>

<style scoped>
/* ページネーション既存調整 */
.pagination { margin: 20px 0; }
.pagination .disabled { pointer-events:none; opacity:.4 }
.current-page { margin:0 .75rem; color:#6b7280 }
</style>