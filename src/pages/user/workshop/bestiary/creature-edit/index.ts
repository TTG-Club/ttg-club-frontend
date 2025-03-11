import type { RouteRecordRaw } from 'vue-router';

export const WorkshopCreatureEditPage: RouteRecordRaw = {
  name: 'workshop-creature-edit',
  path: 'edit/:id',
  component: () => import('./WorkshopCreatureEdit.vue'),
  meta: {
    isStatic: true,
  },
};
