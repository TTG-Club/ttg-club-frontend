import type { RouteRecordRaw } from 'vue-router';

export const UnknownErrorPage: RouteRecordRaw = {
  name: 'unknown-error',
  path: '',
  component: () => import('./UnknownView.vue'),
};
