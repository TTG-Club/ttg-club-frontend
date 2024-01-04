import type { RouteRecordRaw } from 'vue-router';

export const RacesDetailPage: RouteRecordRaw = {
  name: 'raceDetail',
  path: ':raceName/:subrace?',
  component: () => import('./RaceDetail.vue')
};
