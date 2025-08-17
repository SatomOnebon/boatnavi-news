<!-- layouts/site.vue -->
<template>
  <div class="l-site">
    <!-- ヘッダーはフル幅（必要なら #header を差し込む） -->
    <header v-if="$slots.header" class="site-header">
      <slot name="header" />
    </header>

    <!-- main だけ 1280px でラップ -->
    <main class="site-main">
      <div class="site-main__inner">
        <!-- aside がある時だけ 2 カラムになる -->
        <div class="site-main__grid" :class="{ 'has-aside': !!$slots.aside }">
          <section class="site-content">
            <slot />
          </section>

          <aside v-if="$slots.aside" class="site-aside">
            <slot name="aside" />
          </aside>
        </div>
      </div>
    </main>

    <!-- フッターはフル幅（必要なら #footer を差し込む） -->
    <footer v-if="$slots.footer" class="site-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
/* ヘッダー/フッターはフル幅のまま */
.l-site > .site-header,
.l-site > .site-footer {
  width: 100%;
}

/* main 外枠は全幅、内側でセンタリング＆最大幅を制限 */
.site-main { width: 100%; }
.site-main__inner {
  width: 100%;
  padding-left: 16px;
  padding-right: 16px;
}
@media (min-width: 640px) {
  .site-main__inner {
    max-width: 1280px;
    margin-left: auto;
    margin-right: auto;
  }
}

/* ===== 2カラム制御（CSS Grid） =====
   SP: 1カラム
   タブレット/PC: aside がある時だけ 1fr + 300px
*/
.site-main__grid {
  display: grid;
  grid-template-columns: 1fr; /* デフォは1カラム */
  gap: 16px;
}
@media (min-width: 640px) {
  .site-main__grid.has-aside {
    grid-template-columns: minmax(0, 1fr) 300px; /* 本文 + 右カラム300 */
  }
}

/* 右カラムは“内容幅”ちょうど 300px に固定（余白は含めない） */
.site-aside {
  width: 300px;
  box-sizing: content-box;  /* 重要：padding/border を幅に含めない */
  padding: 0;               /* 余白は内部要素でつける想定 */
}
@media (min-width: 1024px) {
  .site-aside { position: sticky; top: 16px; }
}

/* 本文領域はオーバーフロー防止 */
.site-content { min-width: 0; }
</style>