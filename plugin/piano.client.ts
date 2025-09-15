export default defineNuxtPlugin(() => {
    let booted = false
    let loading: Promise<void> | null = null
  
    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = document.createElement('script')
        s.src = src
        s.async = true
        s.onload = () => resolve()
        s.onerror = (e) => reject(e)
        document.head.appendChild(s)
      })
  
    const ensureInit = async () => {
      if (booted) return
      if (loading) return loading
  
      const cfg = useRuntimeConfig().public.piano as any
  
      ;(window as any).tp = (window as any).tp || []
      const tp: any[] = (window as any).tp
      ;(window as any).PianoESPConfig = { id: Number(cfg.espSiteId || 40) }
  
      tp.push(['setTags', ['ボートレース']])
      tp.push(['setAid', cfg.aid])
      tp.push(['setCxenseSiteId', cfg.cxenseSiteId])
      tp.push(['setSandbox', !!cfg.sandbox])
      tp.push(['setUseTinypassAccounts', false])
      tp.push(['setUsePianoIdUserProvider', false])
      tp.push(['setUsePianoIdLiteUserProvider', true])
      tp.push(['setEndpoint', cfg.endpoint])
      tp.push(['setPianoIdUrl', cfg.pianoIdUrl])
      tp.push(['setEspEndpoint', cfg.espEndpoint])
  
      loading = loadScript('https://code.piano.io/api/tinypass.min.js')
        .then(() => {
          tp.push(['init', () => { (window as any).tp.experience.init() }])
          booted = true
        })
        .finally(() => { loading = null })
  
      return loading
    }
  
    /** SPA の this.pianoSend と互換の関数 */
    const pianoSend = async (...tags: string[]) => {
      await ensureInit()
      const tp: any[] = (window as any).tp || []
      // 追加タグ（先頭固定タグ + 引数）
      const merged = ['ボートレース', ...tags]
      tp.push(['setTags', merged])
  
      // cxense がいれば送る（SPA と同じ挙動）
      try { (window as any).cxSendEvents?.() } catch {}
  
      tp.push(['init', () => { (window as any).tp.experience.execute() }])
    }
  
    return {
      provide: {
        pianoSend
      }
    }
  })