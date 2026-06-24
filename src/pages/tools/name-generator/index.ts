import type { RouteRecordRaw } from 'vue-router';

export const NameGeneratorPage: RouteRecordRaw = {
  name: 'name-generator',
  path: '/tools/name-generator',
  alias: ['/tools/names'],
  component: () => import('./NameGeneratorView.vue'),
};
