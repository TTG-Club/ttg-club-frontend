import { fileURLToPath, URL } from 'node:url';

import viteLegacyPlugin from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

import type { ConfigEnv } from 'vite';

// https://vitejs.dev/config/
export default ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd());
  const API_HOST = env.VITE_APP_API_URL || 'http://localhost:8080';

  return defineConfig({
    base: '/',
    server: {
      proxy: {
        '^/proxy': {
          target: API_HOST,
          changeOrigin: true,
          ws: false,
          secure: false,
          rewrite: path => path.replace(/^\/proxy/, ''),
          configure: proxy => {
            proxy.on('proxyReq', req => {
              req.setHeader('origin', API_HOST);
            });
          }
        }
      }
    },
    build: {
      outDir: env.VITE_APP_BUILD_PATH || 'dist',
      sourcemap: true,
      minify: 'terser',
      rollupOptions: {
        output: {
          entryFileNames: 'js/app.[hash:8].js',
          chunkFileNames: 'js/[name].[hash:8].js',
          assetFileNames: chunkInfo => {
            if (['index.css', 'main.css'].includes(chunkInfo.name!)) {
              return 'css/app.[hash:8].css';
            }

            return `${
              chunkInfo.name?.endsWith('.css') ? 'css' : 'assets'
            }/[name].[hash:8].[ext]`;
          }
        }
      }
    },
    plugins: [
      ViteEjsPlugin(() => ({
        env,
        mode
      })),
      viteLegacyPlugin({
        // eslint-disable-next-line max-len
        targets:
          'last 2 years and not dead and > 0.01% in RU and not chrome < 95 and not and_chr < 95 and not edge < 103 and not firefox < 91 and not opera < 86',
        modernPolyfills: true
      }),
      vue({
        script: {
          propsDestructure: true
        }
      }),
      createSvgIconsPlugin({
        iconDirs: [
          fileURLToPath(new URL('./src/assets/icons/svg', import.meta.url))
        ],
        symbolId: 'ttg-[dir]-[name]',
        svgoOptions: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: { removeViewBox: false }
              }
            },
            {
              name: 'removeAttrs',
              params: {
                attrs: '(width|height|style|color|fill|stroke)'
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'vue': fileURLToPath(
          new URL('./node_modules/vue/dist/vue.esm-bundler.js', import.meta.url)
        )
      }
    },
    css: {
      preprocessorOptions: {
        css: {
          url: false
        },
        scss: {
          additionalData: '@use "@/assets/styles/variables/index.scss" as *;',
          sassOptions: {
            outputStyle: 'compressed',
            includePaths: ['./node_modules']
          }
        }
      }
    }
  });
};
