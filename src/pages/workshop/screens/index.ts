import { ScreensDetailPage } from './screens-detail';

import type { RouteRecordRaw } from 'vue-router';

export const ScreensPage: RouteRecordRaw = {
  name: 'screens',
  path: '/screens',
  component: () => import('./ScreensView.vue'),
  children: [ScreensDetailPage],
};
