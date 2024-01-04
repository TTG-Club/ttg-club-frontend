import type { RouteRecordRaw } from 'vue-router';

export const UnauthorizedErrorPage: RouteRecordRaw = {
  name: 'unauthorized',
  path: '/401',
  component: () => import('./UnauthorizedView.vue')
};
