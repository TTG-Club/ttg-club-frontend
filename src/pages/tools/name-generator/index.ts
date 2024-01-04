import type { RouteRecordRaw } from 'vue-router';

export const NameGeneratorPage: RouteRecordRaw = {
  name: 'name-generator',
  path: '/tools/name-generator',
  component: () => import('./NameGeneratorView.vue')
};
