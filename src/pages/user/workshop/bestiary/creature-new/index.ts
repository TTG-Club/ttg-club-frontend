import type { RouteRecordRaw } from 'vue-router';

export const WorkshopCreatureNewPage: RouteRecordRaw = {
  name: 'workshop-creature-new',
  path: 'new',
  component: () => import('./WorkshopCreatureNew.vue')
};
