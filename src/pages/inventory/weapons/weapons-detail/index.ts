import type { RouteRecordRaw } from 'vue-router';

export const WeaponsDetailPage: RouteRecordRaw = {
  name: 'weaponDetail',
  path: ':weaponName',
  component: () => import('./WeaponDetail.vue')
};
