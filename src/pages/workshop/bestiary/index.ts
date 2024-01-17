import { CreatureDetailPage } from './creature-detail';

import type { RouteRecordRaw } from 'vue-router';

export const BestiaryPage: RouteRecordRaw = {
  name: 'bestiary',
  path: '/bestiary',
  component: () => import('./BestiaryView.vue'),
  children: [CreatureDetailPage]
};
