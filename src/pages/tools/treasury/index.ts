import type { RouteRecordRaw } from 'vue-router';

export const TreasuryPage: RouteRecordRaw = {
  name: 'treasury',
  path: '/tools/treasury',
  component: () => import('./TreasuryView.vue')
};
