import type { RouteRecordRaw } from 'vue-router';

export const IndexPage: RouteRecordRaw = {
  name: 'index',
  path: '/',
  component: () => import('./IndexView.vue'),
};
