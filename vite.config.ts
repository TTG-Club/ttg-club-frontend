import { fileURLToPath, URL } from 'node:url';

import viteLegacyPlugin from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, loadEnv } from 'vite';
import checker from 'vite-plugin-checker';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

import type { ConfigEnv, ProxyOptions } from 'vite';

// https://vitejs.dev/config/
export default ({ mode, command }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd());
  const API_HOST = env.VITE_APP_API_URL || 'http://localhost:8080';

  // URL subscriber-service (подписки/коды) для dev-прокси берём только из окружения,
  // чтобы не хранить его в репозитории. Локально задаётся в .env.local
  // (VITE_SUBSCRIBER_SERVICE_URL); в проде запросы идут на относительный /api и
  // маршрутизируются шлюзом. Прокси подключается, только если переменная задана.
  const SUBSCRIBER_HOST = env.VITE_SUBSCRIBER_SERVICE_URL;

  // URL сервиса комментариев — по той же схеме, что и subscriber-service:
  // локально задаётся в .env.local (VITE_COMMENTS_SERVICE_URL), в проде
  // запросы идут на относительный /api/v1 и маршрутизируются шлюзом.
  const COMMENTS_HOST = env.VITE_COMMENTS_SERVICE_URL;

  const proxyConfig: Record<string, ProxyOptions> = {
    '^/proxy': {
      target: API_HOST,
      changeOrigin: true,
      ws: false,
      secure: false,
      rewrite: (path) => path.replace(/^\/proxy/, ''),
      configure: (proxy) => {
        proxy.on('proxyReq', (req) => {
          req.setHeader('origin', API_HOST);
        });
      },
    },
    '^/s3': {
      target: 'https://ttg.club',
      changeOrigin: true,
      secure: false,
    },
  };

  // Dev-прокси к subscriber-service подключаем, только если задан его URL,
  // чтобы не держать адрес сервиса в репозитории.
  if (SUBSCRIBER_HOST) {
    proxyConfig['^/subscriber'] = {
      target: SUBSCRIBER_HOST,
      changeOrigin: true,
      ws: false,
      secure: false,
      rewrite: (path) => path.replace(/^\/subscriber/, ''),
      configure: (proxy) => {
        proxy.on('proxyReq', (req) => {
          req.setHeader('origin', SUBSCRIBER_HOST);
        });
      },
    };
  }

  // Dev-прокси к сервису комментариев подключаем, только если задан его URL,
  // чтобы не держать адрес сервиса в репозитории.
  if (COMMENTS_HOST) {
    proxyConfig['^/comments'] = {
      target: COMMENTS_HOST,
      changeOrigin: true,
      ws: false,
      secure: false,
      rewrite: (path) => path.replace(/^\/comments/, ''),
      configure: (proxy) => {
        proxy.on('proxyReq', (req) => {
          req.setHeader('origin', COMMENTS_HOST);
        });
      },
    };
  }

  return defineConfig({
    base: '/',
    server: {
      proxy: proxyConfig,
    },
    build: {
      outDir: env.VITE_APP_BUILD_PATH || 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          entryFileNames: 'js/app.[hash:8].js',
          chunkFileNames: 'js/[name].[hash:8].js',
          assetFileNames: (chunkInfo) => {
            if (['index.css', 'main.css'].includes(chunkInfo.name!)) {
              return 'css/app.[hash:8].css';
            }

            return `${
              chunkInfo.name?.endsWith('.css') ? 'css' : 'assets'
            }/[name].[hash:8].[ext]`;
          },
        },
      },
    },
    plugins: [
      command === 'serve'
        ? checker({
            vueTsc: false, // TODO: enable after types fix
            eslint: {
              lintCommand:
                'eslint "{**/*,*}.{cjs,js,ts,jsx,tsx,vue}" --cache --cache-strategy content --ignore-path .eslintignore --quiet',
              dev: {
                logLevel: ['error'],
              },
            },
            stylelint: {
              lintCommand:
                'stylelint "{**/*,*}.{css,scss,vue}" --cache --cache-strategy content --ignore-path .eslintignore --quiet',
              dev: {
                logLevel: ['error'],
              },
            },
            terminal: false,
          })
        : null,
      ViteEjsPlugin(() => ({
        env,
        mode,
      })),
      viteLegacyPlugin({
        // eslint-disable-next-line max-len
        targets:
          'last 2 years and not dead and > 0.01% in RU and not chrome < 95 and not and_chr < 95 and not edge < 103 and not firefox < 91 and not opera < 86',
        modernPolyfills: true,
      }),
      vue({
        script: {
          propsDestructure: true,
        },
      }),
      AutoImport({
        dts: './src/shared/types/generated/auto-imports.d.ts',
        imports: [
          'vue',
          'vue-router',
          'pinia',
          '@vueuse/core',
          '@vueuse/math',
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar',
            ],
          },
        ],
        eslintrc: {
          enabled: true,
          filepath: './src/shared/types/generated/.eslintrc-auto-import.json',
        },
      }),
      Components({
        dirs: [],
        dts: './src/shared/types/generated/components.d.ts',
        resolvers: [NaiveUiResolver()],
      }),
      createSvgIconsPlugin({
        iconDirs: [
          fileURLToPath(new URL('./src/assets/icons/svg', import.meta.url)),
        ],
        symbolId: 'ttg-[dir]-[name]',
        svgoOptions: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: { removeViewBox: false },
              },
            },
            {
              name: 'removeAttrs',
              params: {
                attrs: '(width|height|style|color|fill|stroke)',
              },
            },
          ],
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'vue': fileURLToPath(
          new URL(
            './node_modules/vue/dist/vue.esm-bundler.js',
            import.meta.url,
          ),
        ),
      },
    },
    css: {
      preprocessorOptions: {
        css: {
          url: false,
        },
        scss: {
          additionalData: '@use "@/assets/styles/variables/index.scss" as *;',
          sassOptions: {
            outputStyle: 'compressed',
            includePaths: ['./node_modules'],
          },
        },
      },
    },
  });
};
