// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV === 'development' },

  // ★ Nitro は1箇所に集約
  nitro: {
    preset: 'aws-lambda',
    routeRules: {
      // ① ビルド成果物は長期キャッシュ（immutable）
      '/_nuxt/**': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' }
      },

      // ② 記事一覧（ISR + CDN向けヘッダー）
      '/articles': {
        isr: 120, // 2分
        headers: {
          // ブラウザ短命 / CDNは長め / SWR で更新
          'cache-control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=30, stale-if-error=86400'
        }
      },

      // ③ 記事詳細（ISR + CDN向けヘッダー）
      '/articles/**': {
        isr: 300, // 5分
        headers: {
          'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=30, stale-if-error=86400'
        }
      },

      // ④ ニュースAPI（CloudFrontと整合がとれるヘッダー）
      //     - ブラウザは短命、CDNは 60秒
      //     - Originバリエーション: Origin を変化要因に（CORS用）
      //     - 必要なら credentials を許可
      '/news-api/**': {
        headers: {
          // CDN 振る舞い
          'cache-control': 'public, max-age=10, s-maxage=60, stale-while-revalidate=10',

          // CORS（CloudFrontの /news-api/* ビヘイビアで「Origin をフォワード」する前提）
          // 実際の値はサーバー側ミドルウェアで上書きするのが正道だが、
          // 応急として * を返さず、Origin 反映 or 既定オリジンを返す設計にする。
          // ここでは Vary だけ付与（実ヘッダーはサーバーミドルで付ける）
          'vary': 'Origin'
        }
      }
    }
  },

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
        sandbox: process.env.NUXT_PUBLIC_PIANO_SANDBOX === 'true',
        endpoint: process.env.NUXT_PUBLIC_PIANO_ENDPOINT || 'https://buy-ap.piano.io/api/v3',
        pianoIdUrl: process.env.NUXT_PUBLIC_PIANO_ID_URL || 'https://id-ap.piano.io',
        espEndpoint: process.env.NUXT_PUBLIC_PIANO_ESP_ENDPOINT || 'https://api-esp-ap.piano.io'
      }
    }
  },

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://hochi.news', crossorigin: '' },
        { rel: 'preconnect', href: 'https://experience-ap.piano.io', crossorigin: '' },
        { rel: 'preconnect', href: 'https://csm.cxpublic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://id-ap.piano.io', crossorigin: '' },
      ],
      // ★ クリティカルCSSは最低限でOK。肥大化すると逆効果
      style: [
        {
          key: 'critical',
          innerHTML: `
:root{--c-txt:#111;--c-sub:#6b7280;}
html,body{margin:0}
body{color:var(--c-txt);font-family:system-ui,-apple-system,"Segoe UI",Roboto,Inter,"Noto Sans JP",sans-serif;line-height:1.6;background:#fff}
.article-title{font-weight:800;line-height:1.5;padding:20px 0;border-top:1px solid #d0e0ec;border-bottom:1px solid #d0e0ec}
.article-meta{color:var(--c-sub);font-size:13.5px}
          `
        } as any
      ],
      script: [
        // 共通スクリプトは bodyClose でもOK（描画ブロック回避）
        { src: '//csm.cxpublic.com/hochi.js', async: true, /* @ts-ignore */ tagPosition: 'bodyClose' }
      ]
    }
  }
})