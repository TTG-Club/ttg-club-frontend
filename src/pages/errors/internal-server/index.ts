import type { RouteRecordRaw } from 'vue-router';

export const InternalServerErrorPage: RouteRecordRaw = {
  name: 'internal-server',
  path: '/500',
  component: () => import('./InternalServerView.vue'),
};
