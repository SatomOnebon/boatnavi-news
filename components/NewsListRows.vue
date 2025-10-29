<script setup lang="ts">
type Item = {
  id: string
  title: string
  publishedAt: string
  image?: { src?: string; alt?: string }
  url: string
}
defineProps<{ items: Item[] }>()
function jpDateTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const z = (n:number)=>n<10?'0'+n:''+n
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${z(d.getHours())}時${z(d.getMinutes())}分`
}
</script>

<template>
  <ul class="news-rows" role="list">
    <li v-for="it in items" :key="it.id" class="news-row">
      <NuxtLink :to="it.url" class="news-row__link">
        <div class="news-row__thumb">
          <img
            v-if="it.image?.src"
            :src="it.image.src"
            :alt="it.image.alt || it.title"
            loading="lazy"
            decoding="async"
            oncontextmenu="alert('(C) The Hochi Shimbun ');return false;"
            onmousedown="return false;"
            @dragstart.prevent
          />
        </div>
        <div class="news-row__body">
          <h3 class="news-row__title">{{ it.title }}</h3>
          <time class="news-row__date" :datetime="it.publishedAt">{{ jpDateTime(it.publishedAt) }}</time>
        </div>
      </NuxtLink>
    </li>
  </ul>
</template>

<style scoped>
/* 行リスト */
.news-rows { margin:0; padding:0; list-style:none; }
.news-row { border-bottom:1px solid #e5e7eb; }
.news-row:last-child { border-bottom:0; }

.news-row__link {
  display:flex; gap:12px; padding:12px 0;
  color:inherit; text-decoration:none;
  transition: background-color .15s ease;
}
.news-row__link:hover { background:#fafafa; }

/* サムネ（スクエア小さめ） */
.news-row__thumb{
  width:96px; aspect-ratio:1/1; border-radius:4px; overflow:hidden;
  background:#f2f2f2; flex:0 0 auto;
}
.news-row__thumb img{ width:100%; height:100%; object-fit:cover;object-position: center top; }

/* テキスト */
.news-row__body{ min-width:0; display:flex; flex-direction:column; justify-content:center; }
.news-row__title{
  font-size:clamp(13px,1.1vw,16px); line-height:1.4; font-weight:600; margin:0 0 4px;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
.news-row__date{ font-size:13px; color:#9ca3af; }

@media (max-width:639px){
  .news-row__thumb{ width:80px; }
  .news-row__title{ font-size:13px; }
}

/* aspect-ratio フォールバック */
@supports not (aspect-ratio: 1 / 1){
  .news-row__thumb{ position:relative; }
  .news-row__thumb::before{ content:''; display:block; padding-top:100%; }
  .news-row__thumb img{ position:absolute; inset:0; }
}
</style>