// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'
import { resolve } from 'pathe'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Lambda で動かす前提
  nitro: {
    preset: 'aws-lambda'
  },



  css: ['~/assets/scss/news.scss'],

  

  // ISR（必要に応じて調整）
  routeRules: {
    '/articles': { isr: 120 },     // 一覧は2分キャッシュ
    '/articles/**': { isr: 300 }   // 詳細は5分キャッシュ
  },




  // /articles/:id.html を [id].vue と同じページに割り当てる
  // hooks: {
  //   'pages:extend'(pages) {
  //     console.log('[pages:extend] detected routes:', pages.map(p => p.path))
  //   }
  // },

  // 実行時設定（env から注入）

    runtimeConfig: {
      newsListApi: process.env.NEWS_LIST_API,
      newsDetailApi: process.env.NEWS_DETAIL_API,
      public: {
        siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        newsImageBase: process.env.NUXT_PUBLIC_NEWS_IMAGE_BASE || 'https://hochi.news/',
        spaOrigin: process.env.NUXT_PUBLIC_SPA_ORIGIN || '/'
      }
    },


    // ★ これを追加
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          includePaths: [
            'node_modules',
            'node_modules/foundation-sites/scss'
          ],
          silenceDeprecations: ['import', 'global-builtin'] 
        }
      }
    }
  }

 
})