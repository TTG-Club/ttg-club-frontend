import type { RouteRecordRaw } from 'vue-router';

export const WorkshopMainPage: RouteRecordRaw = {
  name: 'workshop-main',
  path: '',
  component: () => import('./WorkshopMain.vue')
};
