import { SpellsDetailPage } from './spells-detail';

import type { RouteRecordRaw } from 'vue-router';

export const SpellsPage: RouteRecordRaw = {
  name: 'spells',
  path: '/spells',
  component: () => import('./SpellsView.vue'),
  children: [SpellsDetailPage]
};
