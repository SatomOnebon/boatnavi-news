// plugins/gtag.client.ts
export default defineNuxtPlugin((nuxtApp) => {
    const id = useRuntimeConfig().public.gaId
    if (!id) return
  
    // gtag.js を動的読み込み
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    document.head.appendChild(s)
  
    // gtag 初期化
    ;(window as any).dataLayer = (window as any).dataLayer || []
    const gtag = function (...args: any[]) {
      ;(window as any).dataLayer.push(args)
    }
    ;(window as any).gtag = gtag
  
    gtag('js', new Date())
    // SPA なので自動 page_view は切って手動送信
    gtag('config', id, { send_page_view: false })
  
    // ルート遷移ごとに page_view を送る
    const router = nuxtApp.$router
    router.afterEach((to) => {
      // GA4 の推奨：page_view イベントで title/location/path を渡す
      gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: to.fullPath
      })
    })
  
    // 使いやすいように $gtag を注入（VueGtag の代替）
    return {
      provide: {
        gtag: (event: string, params?: Record<string, any>) => {
          gtag('event', event, params || {})
        }
      }
    }
  })
  
  nuxtApp.hook('page:finish', () => {
    (window as any).gtag?.('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: nuxtApp.$router.currentRoute.value.fullPath
    })
  })
  