<template>
    <footer class="site-footer">
      <div class="container">
        <nav class="footer-nav" aria-label="フッターナビゲーション">
          <ul class="footer-nav__list">
            <li><a href="https://www.hochi.co.jp/policy/" target="_blank">サイトポリシー</a></li>
            <li><a href="https://www.hochi.co.jp/privacy/" target="_blank">個人情報について</a></li>
            <li><a href="https://boatnavi.hochi.co.jp/userdata_external_transmission">データ収集と利用について</a></li>
            <li><a href="https://boatnavi.hochi.co.jp/howto">ボートナビの使い方</a></li>
            <li><a href="https://boatnavi.hochi.co.jp/kiyaku">会員規約</a></li>
          </ul>
        </nav>
  
        <p class="copyright">
          見出し、記事、写真の無断転載を禁じます。
          <span>Copyright © 2025 The Hochi Shimbun.</span>
        </p>
      </div>
    </footer>
  </template>
  
  <script setup lang="ts">
  /* ロジック不要 */
  </script>
  
  <style scoped>
  /* 共通ラッパー */
  .container{
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 16px;
  }
  
  /* フッター帯：上下の余白を増量 */
  .site-footer{
    background: #0b2f4a;
    color: #fff;
    border-top: 1px solid rgba(255,255,255,.15);
    padding: 56px 0 84px; 
  }
  
  /* ナビ（横並び＋縦線区切り） */
  .footer-nav__list{
    list-style: none;
    margin: 0 0 18px; 
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }
  .footer-nav__list > li{
    position: relative;
    padding: 0 18px;
    margin: 6px 0;
  }
  .footer-nav__list > li + li::before{
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 1px;
    height: 1.1em;
    transform: translateY(-50%);
    background: rgba(255,255,255,.45);
  }
  
  /* リンク：少し小さめ */
  .footer-nav__list a{
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px; /* ↓小さくした */
    letter-spacing: .02em;
    transition: opacity .15s ease, text-decoration-color .15s ease;
  }
  @media (hover:hover){
    .footer-nav__list a:hover{ opacity: .9; text-decoration: underline; text-underline-offset: 3px; }
  }
  .footer-nav__list a:focus-visible{
    outline: 3px solid #1aa3ff;
    outline-offset: 2px;
    border-radius: 6px;
  }
  
  /* コピーライト */
  .copyright{
    text-align: center;
    color: #d1d5db;
    font-size: 13px;
    margin: 0;
    line-height: 1.7;
  }
  .copyright span{ white-space: nowrap; }
  
  /* モバイル微調整：さらに少し小さく＆上下余白キープ */
  @media (max-width: 640px){
    .site-footer{ padding: 28px 0 36px; }
    .footer-nav__list > li{ padding: 0 12px; }
    .footer-nav__list a{ font-size: 13px; }
    .copyright{ font-size: 12px; }
  }
  </style>