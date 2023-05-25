import { fileURLToPath, URL } from 'node:url';
import type { ConfigEnv } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
import viteLegacyPlugin from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd());
  const API_HOST = env.VITE_APP_API_URL || 'http://localhost:8080';

  return defineConfig({
    base: './',
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
      sourcemap: 'inline',
      minify: 'terser',
      manifest: 'spa-manifest.json',
      rollupOptions: {
        input: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
        output: {
          entryFileNames: 'js/app.[hash:8].js',
          chunkFileNames: 'js/[name].[hash:8].js',
          assetFileNames: chunkInfo => {
            if (['index.css', 'main.css'].includes(chunkInfo.name!)) {
              return 'css/app.[hash:8].css';
            }

            return `${ chunkInfo.name?.endsWith('.css') ? 'css' : 'assets' }/[name].[hash:8].[ext]`;
          }
        }
      }
    },
    plugins: [
      viteLegacyPlugin({
        modernPolyfills: true
      }),
      vue(),
      createSvgIconsPlugin({
        iconDirs: [fileURLToPath(new URL('./src/assets/icons/svg', import.meta.url))],
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
        'vue': 'vue/dist/vue.esm-bundler.js'
      }
    },
    css: {
      preprocessorOptions: {
        css: {
          url: false
        },
        scss: {
          additionalData: '@import "@/assets/styles/_variables.scss";',
          sassOptions: {
            outputStyle: 'compressed',
            includePaths: ['./node_modules']
          }
        }
      }
    }
  });
};
