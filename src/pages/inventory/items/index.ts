import { ItemsDetailPage } from './items-detail';

import type { RouteRecordRaw } from 'vue-router';

export const ItemsPage: RouteRecordRaw = {
  name: 'items',
  path: '/items',
  component: () => import('./ItemsView.vue'),
  children: [ItemsDetailPage],
};
