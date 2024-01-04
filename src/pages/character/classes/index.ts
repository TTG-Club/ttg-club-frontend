import { ClassDetailPage } from './classes-detail';

import type { RouteRecordRaw } from 'vue-router';

export const ClassesPage: RouteRecordRaw = {
  name: 'classes',
  path: '/classes',
  component: () => import('./ClassesView.vue'),
  children: [ClassDetailPage]
};
