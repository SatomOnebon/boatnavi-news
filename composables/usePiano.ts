// composables/usePiano.ts
declare global {
    interface Window {
      tp?: any[];
    }
  }
  
  // uidutil_tkn が無い環境でも落とさない
  type JwtFn = (cb: (jwt?: string) => void) => void
  function getUidUtil(): JwtFn | undefined {
    const anyGlobal = globalThis as any
    const fn = anyGlobal?.uidutil_tkn
    return typeof fn === 'function' ? (fn as JwtFn) : undefined
  }
  
  export function usePiano() {
    const inited = useState<boolean>('piano_inited', () => false)
  
    function ensureTp() {
      if (typeof window === 'undefined') return
      window.tp = window.tp || []
    }
  
    function setTags(tags: string[]) {
      if (typeof window === 'undefined') return
      ensureTp()
      window.tp!.push(['setTags', tags])
    }
  
    // JWT があっても無くても初期化できる安全版
    async function initWithJwtOnce() {
      if (typeof window === 'undefined') return
      if (inited.value) return
      ensureTp()
  
      try {
        const uidutil = getUidUtil()
  
        const jwt: string | undefined = await new Promise((resolve) => {
          if (!uidutil) return resolve(undefined) // ← ここで即フォールバック
          try {
            uidutil((token = '') => resolve(token || undefined))
          } catch (e) {
            console.warn('uidutil_tkn call failed:', e)
            resolve(undefined)
          }
        })
  
        if (jwt) {
          window.tp!.push(['setExternalJWT', jwt])
        }
  
        // Tinypass/PianoID のプロバイダ設定（Lite を使う）
        window.tp!.push(['setUseTinypassAccounts', false])
        window.tp!.push(['setUsePianoIdUserProvider', false])
        window.tp!.push(['setUsePianoIdLiteUserProvider', true])
  
        // Piano 本体側がロードされると init キューが処理される
        window.tp!.push(['init', function () {
          try {
            window.tp!.experience.init()
            window.tp!.pianoId.init()
            inited.value = true
          } catch (e) {
            console.warn('Piano init error:', e)
          }
        }])
      } catch (e) {
        console.warn('initWithJwtOnce failed:', e)
      }
    }
  
    return { setTags, initWithJwtOnce, inited }
  }