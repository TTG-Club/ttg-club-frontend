import type { RouteRecordRaw } from 'vue-router';

export const ForbiddenErrorPage: RouteRecordRaw = {
  name: 'forbidden',
  path: '/403',
  component: () => import('./ForbiddenView.vue'),
};
