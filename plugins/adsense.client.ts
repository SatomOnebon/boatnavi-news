export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return
  if (document.getElementById('adsbygoogle-js')) return // 重複防止

  const s = document.createElement('script')
  s.id = 'adsbygoogle-js'
  s.async = true
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3076785709839281'
  s.crossOrigin = 'anonymous'
  document.head.appendChild(s)
})