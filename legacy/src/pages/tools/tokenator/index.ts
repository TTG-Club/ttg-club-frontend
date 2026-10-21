import type { RouteRecordRaw } from 'vue-router';

export const TokenatorPage: RouteRecordRaw = {
  name: 'tokenator',
  path: '/tools/tokenator',
  component: () => import('./TokenView.vue'),
};
