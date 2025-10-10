// composables/usePiano.ts
let inited = false
let queuedTags: string[] = []

export function usePiano() {
  const setTags = (tags: string[]) => {
    queuedTags = tags
    if (process.client) (window.tp = window.tp || []).push(['setTags', tags])
  }

  const initWithJwtOnce = async (getJwt?: () => Promise<string | ''>) => {
    if (inited || process.server) return
    const tp: any[] = (window.tp = window.tp || [])

    // 1) 常にプロバイダ設定を先に push（ロード順の安定化）
    tp.push(['setUseTinypassAccounts', false])
    tp.push(['setUsePianoIdUserProvider', false])
    tp.push(['setUsePianoIdLiteUserProvider', true])

    // 2) タグ（指定が無ければ既定）
    const tags = queuedTags.length ? queuedTags : ['ボートレース', '非会員']
    tp.push(['setTags', tags])

    // 3) JWT（任意）
    let jwt = ''
    try {
      if (typeof getJwt === 'function') jwt = (await getJwt()) || ''
      else if (typeof (window as any).uidutil_tkn === 'function') {
        jwt = await new Promise<string>(res => {
          try { (window as any).uidutil_tkn((t?: string) => res(t || '')) } catch { res('') }
        })
      }
    } catch {}

    if (jwt) tp.push(['setExternalJWT', jwt])

    // 4) init（存在チェックをしてから実行）
    tp.push(['init', () => {
      try {
        if (tp.experience?.init) tp.experience.init()
        // pianoId は provider 設定済みでも遅れて生えることがある → 安全に
        if (jwt && tp.pianoId?.init) tp.pianoId.init()
      } catch (e) {
        console.warn('[Piano] init error (ignored):', e)
      }
    }])

    inited = true
  }

  return { setTags, initWithJwtOnce }
}