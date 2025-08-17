<template>
    <header class="site-header">
      <!-- 上段：ロゴ + ログイン（既存パスそのまま想定） -->
      <div class="site-header__top">
        <div class="container">
          <NuxtLink to="/" class="brand" aria-label="BOATNAVI報知 ホーム">
            <img src="https://boatnavi.hochi.co.jp/images/large_logo.svg" alt="BOATNAVI報知" />
          </NuxtLink>
  
          <a href="https://boatnavi.hochi.co.jp/login" class="login-btn">ログイン</a>
        </div>
      </div>
  
      <!-- 下段：グローバルナビ（56px固定） -->
      <nav class="global-nav" aria-label="グローバルナビゲーション">
        <div class="container">
          <ul class="global-nav__list" role="menubar">
            <li role="none">
              <NuxtLink to="/" class="link" exact-active-class="is-current" role="menuitem">ホーム</NuxtLink>
            </li>
  
            <li role="none">
              <NuxtLink to="/articles" class="link" active-class="is-current" role="menuitem">ニュース</NuxtLink>
            </li>
  
            <!-- ▼ サブメニューあり。クリックは遷移（指定URL） -->
            <li role="none" class="has-dd">
              <a
                class="link"
                href="https://boatnavi.hochi.co.jp/day_race_list/20250817"
                role="menuitem"
              >
                本日のレース
              </a>
  
              <!-- ホバー/フォーカスで開くドロップダウン -->
              <ul class="dropdown" role="menu">
                <li role="none">
                  <a role="menuitem" class="dd-link" href="https://boatnavi.hochi.co.jp/day_race_list/20250817">
                    本日のレース TOP
                  </a>
                </li>
                <li role="none"><a role="menuitem" class="dd-link" href="#">出走表</a></li>
                <li role="none"><a role="menuitem" class="dd-link" href="#">結果</a></li>
                <li role="none"><a role="menuitem" class="dd-link" href="#">オッズ</a></li>
              </ul>
            </li>
  
            <li role="none">
              <a href="https://boatnavi.hochi.co.jp/racerranking/all" class="link" role="menuitem">賞金ランキング</a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  </template>
  
  <script setup lang="ts">
  /* JS不要（ホバー/フォーカスで開閉） */
  </script>
  
  <style scoped>
  /* ========== レイアウト共通 ========== */
  .container{ max-width:1280px; margin:0 auto; padding:0 16px; }
  
  /* ========== 上段：ロゴ帯（高さ64px） ========== */
  .site-header__top{ background:#fff; border-bottom:1px solid #e5e7eb; }
  .site-header__top .container{ display:flex; align-items:center; justify-content:space-between; height:64px; }
  .brand img{ display:block; height:34px; width:auto; }
  
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
  
  /* ========== 下段：グローバルナビ（メインとサブを統一） ========== */
  .global-nav{ background:#0b2f4a; color:#fff; border-bottom:1px solid rgba(255,255,255,.25); }
  
  /* メインメニューの横幅を統一（デスクトップ） */
  .global-nav{ --gn-item-w: 160px; }
  
  /* 画面幅に応じた微調整 */
  @media (min-width:1440px){ .global-nav{ --gn-item-w: 176px; } }
  @media (min-width:1024px) and (max-width:1279px){ .global-nav{ --gn-item-w: 148px; } }
  
  .global-nav .container{ height:56px; display:flex; align-items:center; }
  
  /* UL/LI リセット + 行並び */
  .global-nav__list{
    list-style:none; margin:0; padding:0; height:100%;
    display:flex; align-items:stretch; gap:8px;
    justify-content:flex-start; flex-wrap:nowrap;
  }
  .global-nav__list > li{
    list-style:none; margin:0; padding:0; position:relative;
    flex:0 0 var(--gn-item-w); /* 幅統一 */
  }
  
  /* メインタブのリンク（デスクトップ） */
  .global-nav .link{
    width:100%;
    height:56px; padding:0 12px;
    display:flex; align-items:center; justify-content:center;
    color:#fff; text-decoration:none; font-weight:800;
    border-bottom:3px solid transparent;
    font-size:15px; line-height:1;   /* 高さ56pxに合わせて控えめに */
    white-space:nowrap; text-overflow:ellipsis; overflow:hidden;
    transition:background-color .15s ease, border-color .15s ease, color .15s ease, transform .06s ease;
  }
  .global-nav .link:hover{ background:#103a5c; }
  .global-nav .link.is-current{ border-bottom-color:#fff; }
  .global-nav .link:focus-visible{ outline:none; box-shadow:0 0 0 3px #ffffffaa inset; border-radius:4px; }
  .global-nav .link:active{ transform:translateY(1px); }
  
  /* 親タブに“下向き三角”を付与（デスクトップのみ見せる） */
  .global-nav__list > li.has-dd > a::after{
    content:""; display:inline-block; margin-left:8px;
    border-left:6px solid transparent; border-right:6px solid transparent; border-top:6px solid currentColor;
  }
  
  /* ========== サブメニュー（ドロップダウン） ========== */
  /* サブメニューのポチ消し */
  .global-nav__list ul, .global-nav__list ul li{ list-style:none; margin:0; padding:0; }
  
  /* ドロップダウン本体：メイン同配色（初期：非表示） */
  .global-nav__list > li > .dropdown{
    position:absolute; left:0; top:100%;
    min-width:220px; margin-top:8px; padding:0;
    background:#0b2f4a; color:#fff;
    border:1px solid rgba(255,255,255,.20); border-radius:10px;
    box-shadow:0 10px 24px rgba(0,0,0,.25);
    opacity:0; visibility:hidden; transform:translateY(8px);
    transition:opacity .15s ease, transform .15s ease, visibility .15s step-end;
    z-index:1000;
  }
  
  /* ホバー or フォーカスで開く（親aクリックは遷移のまま） */
  .global-nav__list > li:hover > .dropdown,
  .global-nav__list > li:focus-within > .dropdown{
    opacity:1; visibility:visible; transform:translateY(0);
    transition:opacity .15s ease, transform .15s ease, visibility 0s;
  }
  
  /* サブメニューの各リンク：メイン風（高さ/色/太字） */
  .global-nav__list > li > .dropdown > li > a,
  .dd-link{
    display:flex; align-items:center; justify-content:flex-start;
    height:56px; padding:0 12px;
    color:#fff; text-decoration:none; font-weight:800;
    border-left:3px solid transparent;
    font-size:15px; line-height:1;
    transition:background-color .15s ease, color .15s ease, border-color .15s ease, transform .06s ease;
  }
  .global-nav__list > li > .dropdown > li > a:hover,
  .dd-link:hover{
    background:#103a5c; color:#fff; border-left-color:#ffffff44;
  }
  .global-nav__list > li > .dropdown > li > a:focus-visible,
  .dd-link:focus-visible{
    outline:3px solid #1aa3ff; outline-offset:-3px; border-radius:6px;
  }
  
  /* ========== モバイル最適化（サブメニューは表示しない / 高さ48px固定 / フォント小さめ） ========== */
  @media (max-width:767px){
    .site-header__top .container{ height:56px; }     /* ロゴ帯を少し低く（任意） */
    .brand img{ height:28px; }
  
    .global-nav .container{ height:48px; }
    .global-nav__list{ gap:6px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
    .global-nav__list::-webkit-scrollbar{ display:none; }
  
    /* SPはメニュー可変幅に戻す */
    .global-nav__list > li{ flex:0 0 auto; }
  
    /* メニューの高さ48px固定 + 文字サイズもう少し小さめ */
    .global-nav .link{ height:48px; padding:0 10px; font-size:13px; }
  
    /* サブメニューはSPでは非表示 */
    .global-nav__list > li > .dropdown{ display:none !important; }
    .dd-link{ height:48px; padding:0 10px; font-size:13px; }
  
    /* モバイルでは三角を表示しない */
    .global-nav__list > li.has-dd > a::after{ content:none; display:none; }
  }
  </style>