import type { RouteRecordRaw } from 'vue-router';

export const CreatureDetailPage: RouteRecordRaw = {
  name: 'creatureDetail',
  path: ':creatureName',
  component: () => import('./CreatureDetail.vue')
};
