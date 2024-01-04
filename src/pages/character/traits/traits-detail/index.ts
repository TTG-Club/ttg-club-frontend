import type { RouteRecordRaw } from 'vue-router';

export const TraitsDetailPage: RouteRecordRaw = {
  name: 'traitDetail',
  path: ':traitName',
  component: () => import('./TraitDetail.vue')
};
