import type { RouteRecordRaw } from 'vue-router';

export const AbilityCalcPage: RouteRecordRaw = {
  name: 'ability-calc',
  path: '/tools/ability-calc',
  component: () => import('./AbilityCalcView.vue')
};
