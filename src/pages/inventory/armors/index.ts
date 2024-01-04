import { ArmorsDetailPage } from './armors-detail';

import type { RouteRecordRaw } from 'vue-router';

export const ArmorsPage: RouteRecordRaw = {
  name: 'armors',
  path: '/armors',
  component: () => import('./ArmorsView.vue'),
  children: [ArmorsDetailPage]
};
