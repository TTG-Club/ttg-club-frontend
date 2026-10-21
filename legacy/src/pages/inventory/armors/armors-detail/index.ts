import type { RouteRecordRaw } from 'vue-router';

export const ArmorsDetailPage: RouteRecordRaw = {
  name: 'armorDetail',
  path: ':armorName',
  component: () => import('./ArmorDetail.vue'),
};
