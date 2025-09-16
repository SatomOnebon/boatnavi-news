// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'
import { resolve } from 'pathe'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  nitro: { preset: 'aws-lambda' },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          includePaths: ['node_modules','node_modules/foundation-sites/scss'],
          silenceDeprecations: ['import','global-builtin']
        }
      }
    }
  },

  css: ['~/assets/scss/news.scss'],

  routeRules: {
    '/articles':   { isr: 120 },
    '/articles/**':{ isr: 300 },
    // ★ 静的アセットは超長期キャッシュ（CLS抑止のためCSSを瞬時取得）
    '/_nuxt/**':   { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  },

  runtimeConfig: {
    newsListApi: process.env.NEWS_LIST_API,
    newsDetailApi: process.env.NEWS_DETAIL_API,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      newsImageBase: process.env.NUXT_PUBLIC_NEWS_IMAGE_BASE || 'https://hochi.news/',
      spaOrigin: process.env.NUXT_PUBLIC_SPA_ORIGIN || '/',
      gaId: process.env.NUXT_PUBLIC_GA_ID || '',
      piano: {
        espSiteId: Number(process.env.NUXT_PUBLIC_PIANO_ESP_SITE_ID || 40),
        aid: process.env.NUXT_PUBLIC_PIANO_AID || 'oYdNX56vpj',
        cxenseSiteId: process.env.NUXT_PUBLIC_PIANO_CXENSE_SITE_ID || '1144233404304068691',
        sandbox: process.env.NUXT_PUBLIC_PIANO_SANDBOX === 'true' ? true : false,
        endpoint: process.env.NUXT_PUBLIC_PIANO_ENDPOINT || 'https://buy-ap.piano.io/api/v3',
        pianoIdUrl: process.env.NUXT_PUBLIC_PIANO_ID_URL || 'https://id-ap.piano.io',
        espEndpoint: process.env.NUXT_PUBLIC_PIANO_ESP_ENDPOINT || 'https://api-esp-ap.piano.io'
      }
    }
  },

  app: {
    head: {
      // ★ CSS/フォント/外部JSの起点へ事前接続
      link: [
        { rel: 'preconnect', href: 'https://hochi.news', crossorigin: '' },
        { rel: 'preconnect', href: 'https://experience-ap.piano.io', crossorigin: '' },
        { rel: 'preconnect', href: 'https://csm.cxpublic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://id-ap.piano.io', crossorigin: '' },
      ],
      // ★ Above-the-fold のクリティカルだけインライン（骨格/色/見出し周り）
      style: [
        {
          key: 'critical',
          innerHTML: `
:root{--c-txt:#111;--c-sub:#6b7280;}
html,body{margin:0}
body{color:var(--c-txt);font-family:system-ui,-apple-system,"Segoe UI",Roboto,Inter,"Noto Sans JP",sans-serif;line-height:1.6;background:#fff}
.container{max-width:1000px;margin:0 auto;padding:0 12px}
.site-header__top{border-bottom:1px solid #e5e7eb;background:#fff}
.breadcrumb__list{display:flex;gap:.5rem;list-style:none;padding:0;margin:.5rem 0}
.breadcrumb__item:last-child::after{content:""}
.article-title{font-weight:800;line-height:1.5;padding:20px 0;border-top:1px solid #d0e0ec;border-bottom:1px solid #d0e0ec}
.article-meta{color:var(--c-sub);font-size:13.5px}
.ratio{position:relative;width:100%}.ratio-16x9{padding-top:56.25%}.ratio>*{position:absolute;inset:0}
          `,
          tagPriority: 'high' // Nuxt 3.12+ なら評価順を上げる
        } as any
      ],
      script: [
        // ★ 共通スクリプトは bodyClose で読み込み（CSS適用を先に）
        { src: '//csm.cxpublic.com/hochi.js', async: true, /* @ts-ignore */ tagPosition: 'bodyClose' }
      ]
    }
  },
})