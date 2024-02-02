import type { RouteRecordRaw } from 'vue-router';

export const TreasuresPage: RouteRecordRaw = {
  name: 'treasures',
  path: '/treasures',
  component: () => import('./TreasuresView.vue'),
};
