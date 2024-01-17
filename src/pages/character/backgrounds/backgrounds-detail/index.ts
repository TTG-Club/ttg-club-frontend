import type { RouteRecordRaw } from 'vue-router';

export const BackgroundDetailPage: RouteRecordRaw = {
  name: 'backgroundDetail',
  path: ':backgroundName',
  component: () => import('./BackgroundDetail.vue')
};
