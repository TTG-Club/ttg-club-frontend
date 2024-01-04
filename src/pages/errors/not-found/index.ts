import type { RouteRecordRaw } from 'vue-router';

export const NotFoundErrorPage: RouteRecordRaw = {
  name: 'not-found',
  path: '/404',
  component: () => import('./NotFoundView.vue')
};
