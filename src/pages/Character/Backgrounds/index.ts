import { BackgroundDetailPage } from './background-detail';

import type { RouteRecordRaw } from 'vue-router';

export const BackgroundsPage: RouteRecordRaw = {
  name: 'backgrounds',
  path: '/backgrounds',
  component: () => import('./BackgroundsView.vue'),
  children: [BackgroundDetailPage]
};
