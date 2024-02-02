import { WeaponsDetailPage } from './weapons-detail';

import type { RouteRecordRaw } from 'vue-router';

export const WeaponsPage: RouteRecordRaw = {
  name: 'weapons',
  path: '/weapons',
  component: () => import('./WeaponsView.vue'),
  children: [WeaponsDetailPage],
};
