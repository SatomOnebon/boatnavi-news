// plugins/piano.client.ts
declare global {
  interface Window {
    tp?: any[];
  }
}

export default defineNuxtPlugin(() => {
  if (process.server) return

  window.tp = window.tp || []

  // ──────────────── Adblock 検知 ────────────────
  ;(function (d, c) {
    d.cookie = '__adblocker=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    const mark = (adblocker: boolean) => {
      const t = new Date()
      t.setTime(t.getTime() + 60 * 5 * 1e3)
      d.cookie = '__adblocker=' + (adblocker ? 'true' : 'false') + '; expires=' + t.toUTCString() + '; path=/'
    }
    const s = d.createElement(c)
    s.async = true
    s.src = 'https://www.npttech.com/advertising.js'
    s.onerror = function () { mark(true) }
    const b = d.getElementsByTagName(c)[0]
    b.parentNode?.insertBefore(s, b)
  })(document, 'script')

  // ──────────────── Piano Experience ローダ ────────────────
  const id = 'piano-xbuilder'
  if (!document.getElementById(id)) {
    const s = document.createElement('script')
    s.id = id
    s.async = true
    s.src = 'https://experience-ap.piano.io/xbuilder/experience/load?aid=oYdNX56vpj'
    document.head.appendChild(s)
  }

  // ──────────────── Cxense Tag ローダ（hochi.js）───────────────
  if (!document.getElementById('cxense-hochi')) {
    const c = document.createElement('script')
    c.id = 'cxense-hochi'
    c.async = true
    c.src = '//csm.cxpublic.com/hochi.js'
    document.head.appendChild(c)
  }
})