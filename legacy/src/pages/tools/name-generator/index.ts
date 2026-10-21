import type { RouteRecordRaw } from 'vue-router';

export const NameGeneratorPage: RouteRecordRaw = {
  name: 'name-generator',
  path: '/tools/names',
  component: () => import('./NameGeneratorView.vue'),
};
