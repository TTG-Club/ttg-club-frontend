import { GodsDetailPage } from './gods-detail';

import type { RouteRecordRaw } from 'vue-router';

export const GodsPage: RouteRecordRaw = {
  name: 'gods',
  path: '/gods',
  component: () => import('./GodsView.vue'),
  children: [GodsDetailPage],
};
