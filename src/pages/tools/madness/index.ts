import type { RouteRecordRaw } from 'vue-router';

export const MadnessPage: RouteRecordRaw = {
  name: 'madness',
  path: '/tools/madness',
  component: () => import('./MadnessView.vue')
};
