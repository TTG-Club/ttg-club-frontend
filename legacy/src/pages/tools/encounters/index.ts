import type { RouteRecordRaw } from 'vue-router';

export const EncountersPage: RouteRecordRaw = {
  name: 'encounters',
  path: '/tools/encounters',
  component: () => import('./EncountersView.vue'),
};
