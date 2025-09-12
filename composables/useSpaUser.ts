// Cookie "bn_user" を読み取って { nickname, email など任意 } を返す
export type SpaUser = { nickname?: string; [k: string]: any } | null

export const useSpaUser = () => {
  const { public: pub } = useRuntimeConfig()
  const spaOrigin = pub.spaOrigin || '/'

  // SSR/CSR両方で読める cookie API
  const raw = useCookie<string | null>('bn_user', { sameSite: 'lax', path: '/' })

  const user = computed<SpaUser>(() => {
    if (!raw.value) return null
    try {
      // Cookie には JSON を URL エンコードして入れておく想定
      return JSON.parse(decodeURIComponent(raw.value))
    } catch {
      return null
    }
  })
  const isLoggedIn = computed(() => !!user.value)
  const nickname = computed(() => user.value?.nickname || '')

  // UI だけ即時反映して SPA 側ログインページへ遷移（本当のログアウトは SPA 側で実行）
  const uiLogout = () => {
    const c = useCookie<string | null>('bn_user', { path: '/' })
    c.value = null
    if (process.client) location.href = `${spaOrigin}/login`
  }

  return { user, isLoggedIn, nickname, spaOrigin, uiLogout }
}