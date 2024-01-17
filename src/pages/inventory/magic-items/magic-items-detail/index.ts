import type { RouteRecordRaw } from 'vue-router';

export const MagicItemsDetailPage: RouteRecordRaw = {
  name: 'magicItemDetail',
  path: ':magicItemName',
  component: () => import('./MagicItemDetail.vue')
};
