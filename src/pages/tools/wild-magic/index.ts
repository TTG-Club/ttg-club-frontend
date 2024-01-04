import type { RouteRecordRaw } from 'vue-router';

export const WildMagicPage: RouteRecordRaw = {
  name: 'wild-magic',
  path: '/tools/wildmagic',
  component: () => import('./WildMagicView.vue')
};
