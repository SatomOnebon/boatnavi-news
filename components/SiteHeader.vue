<!-- components/SiteHeader.vue -->
<template>
  <header class="site-header">
    <!-- 上段：ロゴ＋右エリア -->
    <div class="site-header__top">
      <div class="container">
        <!-- ロゴ：SPAトップへ -->
        <NuxtLink to="/" external class="brand" aria-label="BOATNAVI報知 ホーム">
          <img src="https://boatnavi.hochi.co.jp/images/large_logo.svg" style="height:2.625rem;" alt="BOATNAVI報知" />
        </NuxtLink>

        <!-- 右エリア：ログイン or ユーザーメニュー -->
        <div class="top-right">
          <!-- 未ログイン -->
          <NuxtLink
            v-if="!isLoggedIn"
            to="/login"
            external
            class="login-btn"
          >ログイン</NuxtLink>

          <!-- ログイン時：PCはホバー/フォーカス、SPはクリックで開閉 -->
          <div
            v-else
            class="user has-dd"
            @keydown.esc="menuOpen=false"
            @mouseleave="menuOpen=false"
          >
            <button
              ref="chipRef"
              class="user-chip"
              type="button"
              @click="toggleMenu"
              :aria-expanded="menuOpen ? 'true' : 'false'"
              aria-haspopup="menu"
            >
              <img class="user-icon" src="https://boatnavi.hochi.co.jp/images/icon_login.svg" alt="" />
              <span class="user-name">
                {{ displayName }}さん
                <span class="caret" aria-hidden="true"></span>
              </span>
            </button>

            <ul class="dropdown" role="menu" :class="{ 'is-open': menuOpen }">
              <li role="none">
                <a role="menuitem" class="dd-link" href="/user">マイページ</a>
              </li>
              <li role="none">
                <NuxtLink
                  :to="`/login?logout=1&return=${encodeURIComponent($route.fullPath)}`"
                  external
                  role="menuitem"
                  class="dd-link"
                >
                  ログアウト
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 下段：グローバルナビ -->
    <nav class="global-nav" aria-label="グローバルナビゲーション">
      <div class="container">
        <ul class="global-nav__list" role="menubar">
          <li role="none">
            <NuxtLink to="/" external class="link" exact-active-class="is-current" role="menuitem">ホーム</NuxtLink>
          </li>

          <li role="none">
            <NuxtLink to="/articles" class="link" active-class="is-current" role="menuitem">ニュース</NuxtLink>
          </li>

          <li role="none">
            <a class="link" :href="`/day_race_list/${todayStr}`" role="menuitem">本日のレース</a>
          </li>

          <li role="none">
            <a class="link" href="/racerranking/all" role="menuitem">賞金ランキング</a>
          </li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRequestHeaders } from '#app'

const menuOpen = ref(false)
const chipRef = ref<HTMLButtonElement | null>(null)

/* 今日の yyyymmdd */
const todayStr = computed(() => {
  const d = new Date()
  const p = (n:number) => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}`
})

/* Cookie utils */
function parseCookieString(raw: string | undefined | null){
  const out: Record<string,string> = {}
  if (!raw) return out
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.split('=')
    const key = k?.trim()
    if (!key) continue
    out[key] = rest.join('=').trim()
  }
  return out
}
function readUserFromCookieValue(val: string | undefined){
  if (!val) return null
  try { return JSON.parse(decodeURIComponent(val)) } catch { return null }
}

/* SSR 初期化 */
function readUserSSR(){
  const h = useRequestHeaders(['cookie'])
  const map = parseCookieString(h.cookie || '')
  return readUserFromCookieValue(map['__bn_user_json'])
}

/* Client 同期 */
function readUserClient(){
  const map = parseCookieString(document.cookie || '')
  return readUserFromCookieValue(map['__bn_user_json'])
}

/* ユーザー状態：SSR初期 + Client再同期 */
const user = ref<any>(process.server ? readUserSSR() : null)

let pollTimer: number | null = null
let lastCookie = ''

function resyncFromCookie(){
  try {
    const now = document.cookie
    if (now === lastCookie) return
    lastCookie = now
    const u = readUserClient()
    user.value = u
  } catch { /* noop */ }
}

/* 画面外クリックで閉じる */
const onDocClick = (e: MouseEvent) => {
  const t = e.target as HTMLElement
  if (!t.closest('.user.has-dd')) menuOpen.value = false
}

onMounted(() => {
  // 初回即同期
  if (process.client) resyncFromCookie()

  // 軽いポーリング（2秒おき 30秒間）
  if (process.client) {
    let count = 0
    pollTimer = window.setInterval(() => {
      resyncFromCookie()
      if (++count >= 15 && pollTimer) { clearInterval(pollTimer); pollTimer = null }
    }, 2000) as any

    // タブ復帰で同期
    const onVis = () => { if (document.visibilityState === 'visible') resyncFromCookie() }
    document.addEventListener('visibilitychange', onVis)

    // デバッグヘルパ
    ;(window as any).__bn_user = () => ({ parsed: user.value, cookie: document.cookie })

    // クリーンアップ登録
    onUnmounted(() => {
      document.removeEventListener('visibilitychange', onVis)
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
    })
  }

  document.addEventListener('click', onDocClick, { capture: true })
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick, { capture: true } as any)
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
})

/* 表示判定 */
const isLoggedIn = computed(() =>
  !!user.value && (!!user.value.nickname || !!user.value.name || !!user.value.email)
)
const displayName = computed(() =>
  user.value?.nickname ||
  user.value?.name ||
  (user.value?.email ? String(user.value.email).split('@')[0] : 'ユーザー')
)

/* ドロップダウン（SPクリックトグル） */
function toggleMenu(){
  menuOpen.value = !menuOpen.value
  if (!menuOpen.value) chipRef.value?.blur()
}
</script>

<style scoped>
.container{ max-width:1280px; margin:0 auto; padding:0 16px; }

/* 上段：ロゴ帯 */
.site-header__top{ background:#fff; border-bottom:1px solid #e5e7eb; }
.site-header__top .container{ display:flex; align-items:center; justify-content:space-between; height:64px; }
.brand img{ display:block; height:34px; width:auto; }

/* 右側 */
.top-right{ display:flex; align-items:center; gap:12px; }

/* ログインボタン */
.login-btn{
  display:inline-flex; align-items:center; justify-content:center;
  padding:10px 18px; background:#de5a1a; color:#fff; font-weight:700;
  border-radius:8px; text-decoration:none;
  transition:filter .15s ease, transform .06s ease, box-shadow .15s ease;
}
.login-btn:hover{ filter:brightness(0.96); }
.login-btn:active{ transform:translateY(1px); }
.login-btn:focus-visible{ outline:3px solid #1aa3ff; outline-offset:2px; border-radius:8px; }

/* ユーザーChip（白ベース） */
.user.has-dd{ position:relative; }
.user-chip{
  display:inline-flex; align-items:center; gap:8px;
  min-height:40px; padding:8px 12px;
  background:#fff; color:#111; font-weight:800; border-radius:999px;
  border:1px solid #e5e7eb; cursor:pointer;
}
.user-chip:hover{ background:#f3f4f6; }
.user-chip:focus-visible{ outline:3px solid #1aa3ff; outline-offset:2px; border-radius:999px; }
.user-icon{ width:18px; height:18px; display:block; }

/* ニックネーム＋下向き三角 */
.user-name{ display:inline-flex; align-items:center; line-height:1; }
.user-name .caret{
  display:inline-block;
  width:0; height:0; margin-left:6px;
  border-left:5px solid transparent;
  border-right:5px solid transparent;
  border-top:6px solid currentColor;
}

/* ドロップダウン（白ベース） */
.dropdown{
  position:absolute; right:0; top:calc(100% + 8px);
  min-width:180px; margin:0; padding:4px;
  list-style:none; background:#fff; color:#111;
  border:1px solid #e5e7eb; border-radius:10px;
  box-shadow:0 10px 24px rgba(0,0,0,.12);
  opacity:0; visibility:hidden; transform:translateY(8px);
  transition:opacity .15s ease, transform .15s ease, visibility .15s step-end;
  z-index:1000;
}
/* PCはホバー/フォーカスで開く */
@media (hover:hover) and (pointer:fine){
  .user.has-dd:hover .dropdown,
  .user.has-dd:focus-within .dropdown{
    opacity:1; visibility:visible; transform:translateY(0);
    transition:opacity .15s ease, transform .15s ease, visibility 0s;
  }
}
/* SPは .is-open で開閉 */
.dropdown.is-open{
  opacity:1; visibility:visible; transform:translateY(0);
  transition:opacity .15s ease, transform .15s ease, visibility 0s;
}

.dd-link{
  display:flex; align-items:center; justify-content:flex-start;
  height:44px; padding:0 12px;
  color:inherit; text-decoration:none; font-weight:800;
  border-left:3px solid transparent; border-radius:6px;
}
.dd-link:hover{ background:#f3f4f6; color:inherit; border-left-color:#d1d5db; }
.dd-link:focus-visible{ outline:3px solid #1aa3ff; outline-offset:-3px; }

/* 下段：グローバルナビ */
.global-nav{ background:#0b2f4a; color:#fff; border-bottom:1px solid rgba(255,255,255,.25); }
.global-nav{ --gn-item-w: 160px; }
@media (min-width:1440px){ .global-nav{ --gn-item-w: 176px; } }
@media (min-width:1024px) and (max-width:1279px){ .global-nav{ --gn-item-w: 148px; } }

.global-nav .container{ height:56px; display:flex; align-items:center; }
.global-nav__list{
  list-style:none; margin:0; padding:0; height:100%;
  display:flex; align-items:stretch; gap:8px;
  justify-content:flex-start; flex-wrap:nowrap;
}
.global-nav__list > li{ position:relative; flex:0 0 var(--gn-item-w); }

.link{
  width:100%; height:56px; padding:0 12px;
  display:flex; align-items:center; justify-content:center;
  color:#fff; text-decoration:none; font-weight:800;
  border-bottom:3px solid transparent;
  font-size:15px; line-height:1;
  white-space:nowrap; text-overflow:ellipsis; overflow:hidden;
  transition:background-color .15s ease, border-color .15s ease, color .15s ease, transform .06s ease;
}
.link:hover{ background:#103a5c; }
.link.is-current{ border-bottom-color:#fff; }
.link:focus-visible{ outline:none; box-shadow:0 0 0 3px #ffffffaa inset; border-radius:4px; }
.link:active{ transform:translateY(1px); }

/* モバイル最適化 */
@media (max-width:767px){
  .site-header__top .container{ height:56px; }
  .brand img{ height:28px; }
  .global-nav .container{ height:48px; }
  .global-nav__list{ gap:6px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .global-nav__list::-webkit-scrollbar{ display:none; }
  .global-nav__list > li{ flex:0 0 auto; }
  .link{ height:48px; padding:0 10px; font-size:13px; }
}
</style>