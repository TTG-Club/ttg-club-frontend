import { OptionsDetailPage } from './options-detail';

import type { RouteRecordRaw } from 'vue-router';

export const OptionsPage: RouteRecordRaw = {
  name: 'options',
  path: '/options',
  component: () => import('./OptionsView.vue'),
  children: [OptionsDetailPage],
};
