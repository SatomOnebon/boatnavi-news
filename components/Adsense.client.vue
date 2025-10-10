<script setup lang="ts">
/**
 * ノーフィル時に自動で枠を畳む版
 * - collapseIfNoFill: true のとき、collapseAfter ms 以内に iframe が出来なければ非表示
 * - fallback スロットに任意の代替 UI を出せます
 */
const props = defineProps<{
  class?: string
  style?: string

  // AdSense 正式 data-* 属性
  'data-ad-client'?: string
  'data-ad-slot'?: string | number
  'data-ad-format'?: string
  'data-full-width-responsive'?: string | boolean

  // 互換エイリアス（過去の ad-* / fullWidthResponsive を許容）
  adClient?: string
  adSlot?: string | number
  adFormat?: string
  fullWidthResponsive?: string | boolean

  // ノーフィル時の挙動
  collapseIfNoFill?: boolean
  collapseAfter?: number  // ms
}>()

const route = useRoute()
const root = ref<HTMLInsElement | null>(null)
const empty = ref(false) // ノーフィルだったか

// props 正規化
const P = props as any
const adClient = P['data-ad-client'] ?? P.adClient ?? P['ad-client'] ?? 'ca-pub-3076785709839281'
const adSlot   = String(P['data-ad-slot'] ?? P.adSlot ?? P['ad-slot'] ?? '')
const adFormat = P['data-ad-format'] ?? P.adFormat ?? P['ad-format'] ?? 'auto'
const fullResp = String(P['data-full-width-responsive'] ?? P.fullWidthResponsive ?? true)

const collapse = () => {
  if (!props.collapseIfNoFill) return
  const el = root.value
  if (!el) return

  // 親まで畳みたい場合は el.parentElement を変更
  el.style.display = 'none'
  empty.value = true
}

function scheduleCollapseCheck(el: HTMLElement) {
  // 既に iframe があれば表示維持
  if (el.querySelector('iframe')) {
    empty.value = false
    el.style.display = 'block'
    return
  }

  // iframe を監視し、生成されたら表示維持
  const mo = new MutationObserver(() => {
    if (el.querySelector('iframe')) {
      empty.value = false
      el.style.display = 'block'
      mo.disconnect()
    }
  })
  mo.observe(el, { childList: true, subtree: true })

  // タイムアウトで畳む（ノーフィル想定）
  const timeout = props.collapseAfter ?? 3000
  window.setTimeout(() => {
    mo.disconnect()
    if (!el.querySelector('iframe')) collapse()
  }, timeout)
}

function requestAd() {
  const el = root.value
  if (!el) return
  // 再表示できるよう毎回初期化
  el.style.display = 'block'
  empty.value = false

  const w = window as any
  if (w.adsbygoogle && Array.isArray(w.adsbygoogle)) {
    try { w.adsbygoogle.push({}) } catch {}
  }
  scheduleCollapseCheck(el)
}

onMounted(requestAd)
watch(() => route.fullPath, requestAd)
</script>

<template>
  <div>
    <!-- 広告本体 -->
    <ins
      ref="root"
      :key="route.fullPath"
      class="adsbygoogle"
      :style="style || 'display:block; text-align:center; min-height: 1px; min-width: 1px;'"
      :data-ad-client="adClient"
      :data-ad-slot="adSlot"
      :data-ad-format="adFormat"
      :data-full-width-responsive="fullResp"
    />
    <!-- ノーフィル時に出す任意のフォールバック -->
    <slot name="fallback" v-if="empty" />
  </div>
</template>