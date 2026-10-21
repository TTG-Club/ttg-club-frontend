// https://nuxt.com/docs/api/configuration/nuxt-config

import { fileURLToPath, URL } from 'node:url';

import ms from 'ms';

const application = {
  name: 'TTG Club 5e14',
  description:
    'TTG Club — онлайн-справочник по D&D 5e редакции 2014 года: классы, расы, заклинания, бестиарий, снаряжение, магические предметы и инструменты для игроков и мастеров.',
};

export default defineNuxtConfig({
  // Общие настройки проекта
  future: {
    typescriptBundlerResolution: true,
  },

  compatibilityDate: '2025-07-22',

  experimental: {
    // Как часто открытая вкладка сверяет свою сборку с сервером.
    checkOutdatedBuildInterval: ms('10m'),

    // Без карты импорта `#entry`: иначе после выкладки главный чанк меняет
    // содержимое, не меняя имени, и браузер держит старую копию из кэша.
    entryImportMap: false,
  },

  // Модули и зависимости
  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxtjs/seo',
    '@nuxt/scripts',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    'nuxt-security',
    'nuxt-gtag',
  ],

  // Конфигурация приложения
  appId: 'ttg-club-5e14',
  app: {
    head: {
      // Без имени сайта в заголовке: так title совпадает с серверным title
      // старого сайта («<название> (2014)»), который уже проиндексирован.
      titleTemplate: '%s',
      viewport:
        'width=device-width, initial-scale=1.0, maximum-scale=1, viewport-fit=cover',
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon_ttg_v3.svg',
        },
      ],
    },
    rootAttrs: {
      id: 'ttg-club-5e14',
    },
  },

  // Google Analytics (nuxt-gtag). Идентификатор задаётся в рантайме через
  // NUXT_PUBLIC_GTAG_ID; при пустом id скрипт не подключается. initMode
  // 'manual': скрипт с defer подключает плагин analytics.client.ts.
  gtag: {
    enabled: true,
    id: '',
    initMode: 'manual',
  },

  runtimeConfig: {
    public: {
      // Яндекс.Метрика подключается плагином analytics.client.ts. Id задаётся
      // в рантайме через NUXT_PUBLIC_YANDEX_METRIKA_ID; пустой id отключает
      // счётчик (на сборке и на dev).
      yandexMetrika: {
        id: '',
      },
    },
  },

  // Каноничный адрес — домен старого справочника. На dev-стенде его
  // переопределяют NUXT_SITE_URL и NUXT_SITE_ENV, чтобы стенд не индексировался.
  site: {
    url: 'https://5e14.ttg.club',
    name: application.name,
    description: application.description,
    defaultLocale: 'ru',
  },

  seo: {
    automaticDefaults: true,
    automaticOgAndTwitterTags: true,
  },

  // Карту сайта по-прежнему отдаёт бэкенд, Nitro её проксирует.
  sitemap: {
    enabled: false,
  },

  ogImage: {
    enabled: false,
  },

  schemaOrg: {
    enabled: false,
  },

  linkChecker: {
    enabled: false,
  },

  // Те же запреты, что в robots.txt бэкенда.
  robots: {
    disallow: [
      '/profile',
      '/hero',
      '/calc',
      '/stock',
      '/creatures',
      '/search',
      '/login',
      '/registration',
      '/reset',
      '/api',
      '/css',
    ],
    sitemap: ['/sitemap.xml'],
  },

  // Безопасность
  security: {
    headers: {
      contentSecurityPolicy: {
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          "'strict-dynamic'",
          "'nonce-{{nonce}}'",
        ],
        'img-src': ["'self'", 'https:', 'data:', 'blob:'],
        'media-src': ["'self'", 'https:', 'data:', 'blob:'],
      },
      strictTransportSecurity: {
        preload: true,
        maxAge: 31536000,
        includeSubdomains: true,
      },
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        geolocation: [],
        microphone: [],
        camera: [],
        fullscreen: ['self'],
      },
    },
    rateLimiter: false,
  },

  // Стили и UI
  css: ['~/assets/css/tailwind.css', '~/assets/css/content.scss'],

  ui: {
    colorMode: false,
  },

  icon: {
    serverBundle: {
      collections: ['tabler'],
    },
    customCollections: [
      {
        recursive: true,
        prefix: 'ttg',
        dir: fileURLToPath(new URL('./app/assets/icons', import.meta.url)),
      },
    ],
  },

  fonts: {
    defaults: {
      subsets: ['cyrillic-ext', 'cyrillic', 'latin'],
    },
    providers: {
      adobe: false,
      bunny: false,
      fontshare: false,
    },
    priority: ['google', 'fontsource'],
    families: [{ name: 'Open Sans' }, { name: 'Lora' }],
  },

  // TypeScript и линтеры
  typescript: {
    typeCheck: 'build',
    tsConfig: {
      compilerOptions: {
        verbatimModuleSyntax: true,
      },
    },
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  // Nitro
  nitro: {
    minify: true,

    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },

    routeRules: {
      '/api/**': {
        security: {
          enabled: process.env.NODE_ENV !== 'development',
          // Валидатор nuxt-security целиком отклоняет JSON с `<` или `>`,
          // а описания в мастерской — HTML. От XSS защищает экранирование
          // на выводе, а не отказ на входе.
          xssValidator: false,
          requestSizeLimiter: false,
        },
      },
    },
  },

  // Sourcemaps
  sourcemap: {
    server: false,
    client: 'hidden',
  },

  vite: {
    build: {
      minify: 'esbuild',
      cssMinify: 'esbuild',
      reportCompressedSize: false,
    },
  },
});
