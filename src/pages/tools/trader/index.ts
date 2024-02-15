import type { RouteRecordRaw } from 'vue-router';

export const TraderPage: RouteRecordRaw = {
  name: 'trader',
  path: '/tools/trader',
  component: () => import('./TraderView.vue'),
};
