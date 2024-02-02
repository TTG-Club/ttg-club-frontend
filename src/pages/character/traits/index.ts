import { TraitsDetailPage } from './traits-detail';

import type { RouteRecordRaw } from 'vue-router';

export const TraitsPage: RouteRecordRaw = {
  name: 'traits',
  path: '/traits',
  alias: '/feats',
  component: () => import('./TraitsView.vue'),
  children: [TraitsDetailPage],
};
