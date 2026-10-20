import type { RouteRecordRaw } from 'vue-router';

export const TavernPage: RouteRecordRaw = {
  name: 'tavern',
  path: '/tools/tavern',
  component: () => import('./TavernView.vue'),
};
