import { FeatsDetailPage, TraitsDetailPage } from './feats-detail';

import type { RouteRecordRaw } from 'vue-router';

export const FeatsPage: RouteRecordRaw = {
  name: 'feats',
  path: '/feats',
  component: () => import('./FeatsView.vue'),
  children: [FeatsDetailPage],
};

export const TraitsPage: RouteRecordRaw = {
  path: '/traits',
  redirect: {
    path: '/feats',
  },
  children: [TraitsDetailPage],
};
