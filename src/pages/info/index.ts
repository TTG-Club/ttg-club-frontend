import type { RouteRecordRaw } from 'vue-router';

export const InfoPage: RouteRecordRaw = {
  name: 'info-page',
  path: '/info/:path',
  component: () => import('./InfoPageView.vue'),
};
