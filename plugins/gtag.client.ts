// plugins/gtag.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  const { public: pub } = useRuntimeConfig()
  const GA_ID = pub.gaId as string | undefined
  if (!GA_ID) {
    console.info('[GA4] gaId not set. Skip GA.')
    return
  }

  // すでに読み込み済みなら何もしない
  if (!document.getElementById('ga4-lib')) {
    // gtag.js を挿入
    const s = document.createElement('script')
    s.id = 'ga4-lib'
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    document.head.appendChild(s)

    // window.gtag を用意
    ;(window as any).dataLayer = (window as any).dataLayer || []
    ;(window as any).gtag = function () {
      ;(window as any).dataLayer.push(arguments)
    }

    ;(window as any).gtag('js', new Date())
    // Nuxt では自動 page_view を切る → 手動で送る
    ;(window as any).gtag('config', GA_ID, { send_page_view: false })
  }

  // 初期ページ
  const sendPV = () => {
    const w = window as any
    w.gtag?.('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title,
      page_location: location.href,
      send_to: GA_ID
    })
  }

  // 初期表示後
  if (document.readyState === 'complete') {
    sendPV()
  } else {
    window.addEventListener('load', () => sendPV(), { once: true })
  }

  // ルート遷移ごと（CSR）
  const router = nuxtApp.$router
  router.afterEach(() => {
    // DOM 更新が終わってから送ると title も正確
    nuxtApp.hook('page:finish', () => sendPV())
  })
})