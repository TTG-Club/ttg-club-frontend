import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

/** Unit-тесты чистой логики без поднятия Nuxt. */
export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '~content': fileURLToPath(
        new URL('./app/features/content', import.meta.url),
      ),
      '~dice-roller': fileURLToPath(
        new URL('./app/features/dice-roller', import.meta.url),
      ),
      '~infrastructure': fileURLToPath(
        new URL('./app/features/infrastructure', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
