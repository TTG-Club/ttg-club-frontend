import type { RouteRecordRaw } from 'vue-router';

export const ScreensDetailPage: RouteRecordRaw = {
  name: 'screenDetail',
  path: ':screenName',
  component: () => import('./ScreenDetail.vue'),
};
