// ページ遷移ごとに document.title を Piano に送る
export default defineNuxtPlugin((nuxtApp) => {
    if (process.server) return
  
    const router = useRouter()
    let lastKey = '' // 同一ページでの重複送信を防止
  
    const sendPV = () => {
      try {
        const t = (document?.title || '').trim()
        const path = router.currentRoute.value.fullPath || location.pathname
        const key = `${t}@@${path}`
        if (key === lastKey) return
        lastKey = key
  
        // $pianoSend は plugins/piano.client.ts で提供済み
        // タグとして [title, path] を送る（好みで title のみでも可）
        nuxtApp.$pianoSend?.(t || path, path)
      } catch {}
    }
  
    // 初回 + その後のナビゲーション
    const fire = () => setTimeout(sendPV, 0) // head 更新後に読むため少し遅延
    fire()
    nuxtApp.hook('page:finish', fire)
  })