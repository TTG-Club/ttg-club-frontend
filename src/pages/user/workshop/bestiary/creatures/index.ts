import type { RouteRecordRaw } from 'vue-router';

export const WorkshopCreaturesPage: RouteRecordRaw = {
  name: 'workshop-creatures',
  path: '',
  component: () => import('./WorkshopCreatures.vue'),
};
