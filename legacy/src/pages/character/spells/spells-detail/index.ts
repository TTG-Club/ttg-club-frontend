import type { RouteRecordRaw } from 'vue-router';

export const SpellsDetailPage: RouteRecordRaw = {
  name: 'spellDetail',
  path: ':spellName',
  component: () => import('./SpellDetail.vue'),
};
