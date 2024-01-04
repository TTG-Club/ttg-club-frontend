import { RulesDetailPage } from './rules-detail';

import type { RouteRecordRaw } from 'vue-router';

export const RulesPage: RouteRecordRaw = {
  name: 'rules',
  path: '/rules',
  component: () => import('./RulesView.vue'),
  children: [RulesDetailPage]
};
