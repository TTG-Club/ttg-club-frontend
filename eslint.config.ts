import { configure } from '@svifty7/eslint-config';

import withNuxt from './.nuxt/eslint.config.mjs';

const config = configure({
  formatters: true,
  gitignore: true,
  jsdoc: true,
  jsonc: true,
  jsx: {
    a11y: true,
  },
  markdown: true,
  pnpm: true,
  test: true,
  toml: true,
  typescript: true,
  vue: {
    a11y: true,
  },
  yaml: true,
  prettier: {
    tailwindStylesheet: './app/assets/css/tailwind.css',
  },
  ignores: ['.agents', 'AGENTS.md'],
});

export default withNuxt(
  config.overrideRules({
    'vue/multi-word-component-names': undefined,
  }),
);
