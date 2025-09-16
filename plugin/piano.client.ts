// plugins/piano.client.ts
// クライアント専用：SSRでは実行しない
declare global {
  interface Window {
    tp?: any[];
  }
}

function injectScript(src: string, async = true) {
  const s = document.createElement('script')
  s.type = 'text/javascript'
  s.async = async
  s.src = src
  const b = document.getElementsByTagName('script')[0]
  b.parentNode?.insertBefore(s, b)
  return s
}

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return

  // window.tp は配列として初期化
  window.tp = window.tp || []

  // ── Adblock 検知（Piano推奨スニペット）※原文そのまま移植 ──
  ;(function(d, c) {
    d.cookie = '__adblocker=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    const mark = function(adblocker: boolean) {
      const t = new Date()
      t.setTime(t.getTime() + 60 * 5 * 1e3)
      d.cookie = '__adblocker=' + (adblocker ? 'true' : 'false') + '; expires=' + t.toUTCString() + '; path=/'
    }
    const s = d.createElement(c)
    s.async = true
    s.src = '//www.npttech.com/advertising.js'
    s.onerror = function() { mark(true) }
    const b = d.getElementsByTagName(c)[0]
    b.parentNode?.insertBefore(s, b)
  })(document, 'script')

  // ── Piano Experience ローダ（APリージョン） ──
  injectScript('https://experience-ap.piano.io/xbuilder/experience/load?aid=oYdNX56vpj')

  // ここで即 init はしない（JWT 連携後に init する）
})