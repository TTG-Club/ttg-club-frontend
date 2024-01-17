import { RacesDetailPage } from './races-detail';

import type { RouteRecordRaw } from 'vue-router';

export const RacesPage: RouteRecordRaw = {
  name: 'races',
  path: '/races',
  component: () => import('./RacesView.vue'),
  children: [RacesDetailPage]
};
