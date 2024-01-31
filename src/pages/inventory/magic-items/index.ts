import { MagicItemsDetailPage } from './magic-items-detail';

import type { RouteRecordRaw } from 'vue-router';

export const MagicItemsPage: RouteRecordRaw = {
  name: 'magicItems',
  path: '/items/magic',
  component: () => import('@/pages/inventory/magic-items/MagicItemsView.vue'),
  children: [MagicItemsDetailPage],
};
