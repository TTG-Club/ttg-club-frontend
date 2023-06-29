/// <reference types="vite/client" />
/// <reference types="vite-plugin-svg-icons/client" />
import type { StorybookConfig } from '@storybook/vue3-vite';
import { mergeConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

const config: StorybookConfig = {
  core: {
    disableTelemetry: true
  },
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-addon-root-attribute/register',
    'storybook-css-modules'
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  viteFinal: async (config) => mergeConfig(config, {
    // see - https://github.com/storybookjs/storybook/issues/18920
    define: {
      'process.env': {},
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
    },
    plugins: [
      createSvgIconsPlugin({
        // @ts-ignore
        iconDirs: [fileURLToPath(new URL('../src/assets/icons/svg', import.meta.url))],
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
        // @ts-ignore
        '@/': fileURLToPath(new URL('../src/', import.meta.url)),
        'vue': 'vue/dist/vue.esm-bundler.js'
      }
    }
  }),
  docs: {
    autodocs: 'tag'
  }
};
export default config;
