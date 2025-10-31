<script setup lang="ts">
// より堅牢な AdSense クライアント専用コンポーネント
defineOptions({ name: 'Adsense' })

/**
 * ノーフィル時に自動で枠を畳む版 + 遅延ロード + 二重実行防止
 */
const props = defineProps<{
  class?: string
  style?:  string | Record<string, string>

  // AdSense 正式 data-* 属性
  'data-ad-client'?: string
  'data-ad-slot'?: string | number
  'data-ad-format'?: string
  'data-full-width-responsive'?: string | boolean

  // 互換（過去の ad-* / fullWidthResponsive を許容）
  adClient?: string
  adSlot?: string | number
  adFormat?: string
  fullWidthResponsive?: string | boolean

  // ノーフィル時の挙動
  collapseIfNoFill?: boolean
  collapseAfter?: number  // ms（既定 3000）

  // Lazy 関連
  rootMargin?: string     // 既定 '300px 0px'
  threshold?: number      // 既定 0
}>()

const route = useRoute()
const root = ref<HTMLElement | null>(null)
const empty = ref(false)           // ノーフィル発生時 true

// props 正規化
const P = props as any
const adClient = P['data-ad-client'] ?? P.adClient ?? P['ad-client'] ?? 'ca-pub-3076785709839281'
const adSlot   = String(P['data-ad-slot'] ?? P.adSlot ?? P['ad-slot'] ?? '')
const adFormat = P['data-ad-format'] ?? P.adFormat ?? P['ad-format'] ?? 'auto'
const fullResp = String(P['data-full-width-responsive'] ?? P.fullWidthResponsive ?? true)

// 内部フラグ & 監視
let io: IntersectionObserver | null = null
let pushing = false
let mountedForPath = ''

function cleanupObserver () {
  if (io) { io.disconnect(); io = null }
}

function collapse () {
  if (!props.collapseIfNoFill) return
  const el = root.value
  if (!el) return
  el.style.display = 'none'
  empty.value = true
}

function scheduleCollapseCheck (el: HTMLElement) {
  // 既に iframe があれば表示維持
  if (el.querySelector('iframe')) {
    empty.value = false
    el.style.display = 'block'
    return
  }
  const mo = new MutationObserver(() => {
    if (el.querySelector('iframe')) {
      empty.value = false
      el.style.display = 'block'
      mo.disconnect()
    }
  })
  mo.observe(el, { childList: true, subtree: true })

  const timeout = props.collapseAfter ?? 3000
  window.setTimeout(() => {
    mo.disconnect()
    if (!el.querySelector('iframe')) collapse()
  }, timeout)
}

function requestAd () {
  const el = root.value
  if (!el || pushing) return
  pushing = true
  el.style.display = 'block'
  empty.value = false

  // adsbygoogle のロードを最大 2 秒待機
  const tryPush = (retry = 0) => {
    const w = window as any
    if (w.adsbygoogle && Array.isArray(w.adsbygoogle)) {
      try { w.adsbygoogle.push({}) } catch {}
      scheduleCollapseCheck(el)
      pushing = false
    } else if (retry < 20) {
      setTimeout(() => tryPush(retry + 1), 100)
    } else {
      // AdBlock 等 → そのまま畳み判定
      scheduleCollapseCheck(el)
      pushing = false
    }
  }
  tryPush()
}

function requestAdLazily () {
  const el = root.value
  if (!el) return

  cleanupObserver()

  // 既に可視領域付近なら即実行
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight || document.documentElement.clientHeight
  const margin = parseInt((props.rootMargin ?? '300px 0px').split(' ')[0]) || 300
  if (rect.top <= vh + margin) {
    requestAd()
    return
  }

  // IntersectionObserver で遅延ロード
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        cleanupObserver()
        requestAd()
      }
    }, {
      rootMargin: props.rootMargin ?? '300px 0px',
      threshold: props.threshold ?? 0
    })
    io.observe(el)
  } else {
    // 非対応ブラウザはフォールバック
    requestAd()
  }
}

onMounted(() => {
  mountedForPath = route.fullPath
  requestAdLazily()
})

watch(() => route.fullPath, (p) => {
  if (p === mountedForPath) return
  mountedForPath = p
  pushing = false
  cleanupObserver()
  requestAdLazily()
})

onBeforeUnmount(() => {
  cleanupObserver()
})
</script>

<template>
  <div>
    <ins
      ref="root"
      :key="route.fullPath"
      class="adsbygoogle"
      :style="style || 'display:block; text-align:center; min-height:1px; min-width:1px;'"
      :data-ad-client="adClient"
      :data-ad-slot="adSlot"
      :data-ad-format="adFormat"
      :data-full-width-responsive="fullResp"
    />
    <!-- ノーフィル時の置き換え（任意） -->
    <slot name="fallback" v-if="empty" />
  </div>
</template>