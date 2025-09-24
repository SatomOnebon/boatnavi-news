<!-- layouts/site.vue -->
<template>
  <div class="l-site">
    <!-- 共通ヘッダー -->
    <SiteHeader />

    <!-- ページ専用のサブヘッダー（任意） -->
    <div v-if="$slots.header" class="site-subheader">
      <slot name="header" />
    </div>

    <!-- main だけ 1280px でラップ -->
    <main class="site-main">
      <div class="site-main__inner">
        <!-- aside がある時だけ 2 カラム -->
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

    <!-- 共通フッター -->
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
// components は自動インポート
</script>

<style scoped>
/* ===== main の上下余白 ===== */
.site-main{ padding: 16px 0 40px; }

/* ===== 1280px ラップ ===== */
.site-main__inner{
  max-width:1280px;
  margin:0 auto;
  padding:0 16px;
}

/* ===== グリッド（aside がある時だけ 2 カラム）===== */
.site-main__grid{
  display:grid;
  gap:40px;
  align-items:start;
}
/* PC：本文 + 右 300px 固定 */
.site-main__grid.has-aside{
  grid-template-columns:minmax(0,1fr) 300px;
}

/* 本文はオーバーフロー防止 */
.site-content{ min-width:0; }

/* 右カラムは“内容幅”ちょうど 300px（padding/borderは含めない） */
.site-aside{
  width:300px;
  box-sizing:content-box;
  padding:0;
}




/* PC 時のみ追従（任意） */
@media (min-width:1024px){
  .site-aside{ position:sticky; top:16px; }
}

/* ===== モバイル：1 カラムで main と同幅 ===== */
@media (max-width:1023px){
  /* 1 カラム化 */
  .site-main__grid,
  .site-main__grid.has-aside{
    grid-template-columns:1fr;
  }
  /* 右カラムはフル幅に */
  .site-aside{
    width:auto;         /* コンテナ幅いっぱい */
    margin-top:24px;    /* 下に回った時の余白 */
  }
}

/* ===== ページ専用サブヘッダー（任意） ===== */
.site-subheader{
  background:#f7fafc;
  border-bottom:1px solid #e5e7eb;
}


</style>