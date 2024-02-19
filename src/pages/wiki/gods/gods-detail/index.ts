import type { RouteRecordRaw } from 'vue-router';

export const GodsDetailPage: RouteRecordRaw = {
  name: 'godDetail',
  path: ':godName',
  component: () => import('./GodDetail.vue'),
};
