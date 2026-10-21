import type { RouteRecordRaw } from 'vue-router';

export const ItemsDetailPage: RouteRecordRaw = {
  name: 'itemDetail',
  path: ':itemName',
  component: () => import('./ItemDetail.vue'),
};
