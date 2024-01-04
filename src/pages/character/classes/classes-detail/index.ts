import type { RouteRecordRaw } from 'vue-router';

export const ClassDetailPage: RouteRecordRaw = {
  name: 'classDetail',
  path: ':className/:classArchetype?',
  component: () => import('./ClassDetail.vue')
};
